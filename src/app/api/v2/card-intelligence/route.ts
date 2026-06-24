import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findCardByBIN, getCardWithFullGraph } from "@/lib/graph/queries";
import { getRedeemLinks } from "@/lib/rewards/redeem-links";

const HIDDEN_BENEFIT_CATEGORIES = ["insurance", "golf", "forex", "milestone", "concierge"] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cardNumber, bin, cardName } = body;

    const inputBIN = (cardNumber?.replace(/\s/g, "").slice(0, 6) ?? bin ?? "").trim();

    let card = null;

    if (inputBIN && inputBIN.length >= 6) {
      const binMatch = await findCardByBIN(inputBIN);
      if (binMatch) {
        card = await getCardWithFullGraph(binMatch.id);
      }

      if (!card) {
        const legacyBin = await prisma.cardBIN.findUnique({ where: { bin: inputBIN } });
        if (legacyBin?.cardProductId) {
          const normalized = await prisma.card.findFirst({
            where: { name: { contains: legacyBin.bank } },
          });
          if (normalized) card = await getCardWithFullGraph(normalized.id);
        }
      }
    }

    if (!card && cardName) {
      const match = await prisma.card.findFirst({
        where: {
          name: { contains: cardName.split(" ").slice(0, 3).join(" ") },
          isActive: true,
        },
      });
      if (match) card = await getCardWithFullGraph(match.id);
    }

    if (!card) {
      return NextResponse.json({
        found: false,
        message: "Card not found. Try a different BIN, card number, or card name.",
      }, { status: 404 });
    }

    const redeemLinks = getRedeemLinks(card.bank?.name ?? "");

    const hiddenBenefits = card.benefits
      .filter((b: { category: string; valueEstimate: number }) =>
        HIDDEN_BENEFIT_CATEGORIES.includes(b.category as typeof HIDDEN_BENEFIT_CATEGORIES[number]) && b.valueEstimate > 0)
      .map((b: { title: string; category: string; valueEstimate: number }) => ({
        title: b.title,
        category: b.category,
        estimatedValue: b.valueEstimate,
      }));

    const estimatedLostValue = hiddenBenefits.reduce(
      (sum: number, b: { estimatedValue: number }) => sum + b.estimatedValue,
      0,
    );

    const bestUses = card.benefits
      .filter((b: { valueEstimate: number }) => b.valueEstimate > 500)
      .sort((a: { valueEstimate: number }, b: { valueEstimate: number }) => b.valueEstimate - a.valueEstimate)
      .slice(0, 5)
      .map((b: { title: string; category: string; valueEstimate: number }) => ({
        use: b.title,
        category: b.category,
        annualValue: b.valueEstimate,
      }));

    return NextResponse.json({
      found: true,
      card: {
        id: card.id,
        name: card.name,
        bank: card.bank?.name,
        bankCode: card.bank?.code,
        network: card.network,
        cardType: card.cardType,
        tier: card.tier,
        annualFee: card.annualFee,
        joiningFee: card.joiningFee,
        estimatedAnnualValue: card.estimatedAnnualValue,
        bestFor: card.bestFor,
        worstFor: card.worstFor,
        color: card.color,
      },
      benefits: card.benefits.map((b: { id: string; category: string; title: string; description: string; valueEstimate: number }) => ({
        id: b.id,
        category: b.category,
        title: b.title,
        description: b.description,
        valueEstimate: b.valueEstimate,
      })),
      rewardPrograms: card.rewardPrograms.map((p: { id: string; name: string; pointName: string; earnRate: string; redemptions: { name: string; type: string; conversionRate: number }[]; transferPartners: { partnerName: string; transferRatio: string }[] }) => ({
        id: p.id,
        name: p.name,
        pointName: p.pointName,
        earnRate: p.earnRate,
        redemptionOptions: p.redemptions.map((r) => ({
          name: r.name,
          type: r.type,
          valuePerPoint: r.conversionRate,
        })),
        transferPartners: p.transferPartners.map((tp) => ({
          partner: tp.partnerName,
          ratio: tp.transferRatio,
        })),
      })),
      offers: card.offers
        .filter((o: { isActive: boolean; validTo: Date | null }) => o.isActive && (!o.validTo || o.validTo > new Date()))
        .map((o: { title: string; merchant: string | null; discountValue: string | null }) => ({
          title: o.title,
          merchant: o.merchant,
          value: o.discountValue,
        })),
      bestUseCases: bestUses,
      hiddenBenefits,
      estimatedLostValue,
      redeemLinks,
    });
  } catch (error) {
    console.error("POST /api/v2/card-intelligence error:", error);
    return NextResponse.json({ error: "Intelligence lookup failed" }, { status: 500 });
  }
}
