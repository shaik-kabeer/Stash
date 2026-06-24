import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPortfolioCards } from "@/lib/graph/queries";
import { getAllCards } from "@/lib/graph/queries";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userCards = await getPortfolioCards(userId);
    const allCards = await getAllCards();

    const portfolio = userCards.map((uc) => {
      if (uc.normalizedCard) {
        const c = uc.normalizedCard;
        return {
          userCardId: uc.id,
          cardId: c.id,
          name: c.name,
          bank: c.bank.name,
          bankCode: c.bank.code,
          network: c.network,
          tier: c.tier,
          annualFee: c.annualFee,
          estimatedAnnualValue: c.estimatedAnnualValue,
          color: c.color,
          benefitCount: c.benefits.length,
          offerCount: c.offers.length,
          confidence: uc.confidence,
        };
      }
      return {
        userCardId: uc.id,
        cardId: null,
        name: uc.productName ?? uc.nickname ?? `${uc.bank ?? "Unknown"} Card`,
        bank: uc.bank ?? "Unknown",
        bankCode: uc.bank?.substring(0, 4).toUpperCase() ?? "",
        network: uc.network ?? "Unknown",
        tier: "Standard",
        annualFee: 0,
        estimatedAnnualValue: 0,
        color: null,
        benefitCount: 0,
        offerCount: 0,
        confidence: uc.confidence,
      };
    });

    const totalValue = portfolio.reduce((s, c) => s + c.estimatedAnnualValue, 0);
    const totalFees = portfolio.reduce((s, c) => s + c.annualFee, 0);

    return NextResponse.json({
      cards: portfolio,
      totalCards: portfolio.length,
      totalEstimatedValue: totalValue,
      totalAnnualFees: totalFees,
      netValue: totalValue - totalFees,
      catalogSize: allCards.length,
    });
  } catch (error) {
    console.error("GET /api/v2/portfolio error:", error);
    return NextResponse.json({ error: "Failed to load portfolio" }, { status: 500 });
  }
}
