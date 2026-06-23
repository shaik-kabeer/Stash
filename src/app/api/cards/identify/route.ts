import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findCardByBIN } from "@/lib/graph/queries";

interface BINLookupResponse {
  bin?: string;
  scheme?: string;
  type?: string;
  card_tier?: string;
  luhn?: boolean;
  issuer?: string;
  country_a2?: string;
  country_name?: string;
  country_continent?: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { cardNumber } = await req.json();
    if (!cardNumber || typeof cardNumber !== "string") {
      return NextResponse.json({ error: "Card number is required" }, { status: 400 });
    }

    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 6) {
      return NextResponse.json({ error: "At least 6 digits required" }, { status: 400 });
    }

    const bin6 = digits.slice(0, 6);
    const bin8 = digits.length >= 8 ? digits.slice(0, 8) : null;

    // 1. Try normalized graph (CardBIN2 → Card with full graph)
    let normalizedCard = await findCardByBIN(bin6);
    if (!normalizedCard && bin8) {
      normalizedCard = await findCardByBIN(bin8);
    }

    // 2. Fallback to legacy CardBIN
    let localMatch: Awaited<ReturnType<typeof prisma.cardBIN.findUnique>> & { cardProduct?: unknown } | null = null;
    if (!normalizedCard) {
      localMatch = await prisma.cardBIN.findUnique({
        where: { bin: bin6 },
        include: { cardProduct: true },
      });
      if (!localMatch && bin8) {
        localMatch = await prisma.cardBIN.findUnique({
          where: { bin: bin8 },
          include: { cardProduct: true },
        });
      }
    }

    // 3. External BIN API for enrichment
    let externalData: {
      bank?: string;
      network?: string;
      type?: string;
      tier?: string;
      country?: string;
      countryName?: string;
    } | null = null;

    try {
      const res = await fetch(`https://binlist.wellcart.pk/api/lookup/${bin6}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = (await res.json()) as BINLookupResponse;
        if (data.bin || data.scheme) {
          externalData = {
            bank: data.issuer ?? undefined,
            network: data.scheme ?? undefined,
            type: data.type ?? undefined,
            tier: data.card_tier ?? undefined,
            country: data.country_a2 ?? undefined,
            countryName: data.country_name ?? undefined,
          };
        }
      }
    } catch {
      // Non-critical
    }

    if (normalizedCard) {
      return NextResponse.json({
        identified: true,
        source: "normalized_graph",
        bin: bin6,
        bank: normalizedCard.bank.name,
        network: normalizedCard.network,
        type: normalizedCard.cardType,
        tier: normalizedCard.tier,
        country: externalData?.country ?? null,
        card: {
          id: normalizedCard.id,
          name: normalizedCard.name,
          bank: normalizedCard.bank.name,
          network: normalizedCard.network,
          annualFee: normalizedCard.annualFee,
          estimatedAnnualValue: normalizedCard.estimatedAnnualValue,
          color: normalizedCard.color,
          bestFor: normalizedCard.bestFor,
          benefitsCount: normalizedCard.benefits.length,
          programsCount: normalizedCard.rewardPrograms.length,
          offersCount: normalizedCard.offers.length,
        },
        externalData,
      });
    }

    if (localMatch) {
      const lm = localMatch as { bank: string; network: string; type: string; tier: string | null; country: string | null; cardProduct: { id: string; name: string; bank: string; network: string; color: string | null; annualFee: number; estimatedAnnualValue: number; bestFor: string | null } | null };
      return NextResponse.json({
        identified: true,
        source: externalData ? "local+external" : "local_legacy",
        bin: bin6,
        bank: lm.bank,
        network: lm.network,
        type: lm.type,
        tier: lm.tier,
        country: lm.country,
        card: lm.cardProduct
          ? {
              id: lm.cardProduct.id,
              name: lm.cardProduct.name,
              bank: lm.cardProduct.bank,
              network: lm.cardProduct.network,
              color: lm.cardProduct.color,
              annualFee: lm.cardProduct.annualFee,
              estimatedAnnualValue: lm.cardProduct.estimatedAnnualValue,
              bestFor: lm.cardProduct.bestFor,
            }
          : null,
        externalData,
      });
    }

    if (externalData) {
      return NextResponse.json({
        identified: true,
        source: "external",
        bin: bin6,
        bank: externalData.bank,
        network: externalData.network,
        type: externalData.type,
        tier: externalData.tier,
        country: externalData.country,
        countryName: externalData.countryName,
        card: null,
        externalData,
      });
    }

    return NextResponse.json({
      identified: false,
      bin: bin6,
      message: "Could not identify this card. Try the first 6-8 digits of a known Indian credit card.",
    });
  } catch (error) {
    console.error("Card identify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
