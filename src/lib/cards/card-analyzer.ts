import { getCardWithFullGraph, getAllCards, type CardWithFullGraph } from "@/lib/graph/queries";

export interface CardAnalysis {
  card: CardWithFullGraph;
  feeToValueRatio: number;
  valueVerdict: "excellent" | "good" | "fair" | "poor";
  categoryStrengths: CategoryStrength[];
  peerComparison: PeerCard[];
  summary: string;
}

interface CategoryStrength {
  category: string;
  totalValue: number;
  benefitCount: number;
  rating: "strong" | "moderate" | "weak";
}

interface PeerCard {
  id: string;
  name: string;
  bank: string;
  annualFee: number;
  estimatedAnnualValue: number;
  feeToValueRatio: number;
  comparedTo: "better" | "similar" | "worse";
}

export async function analyzeCard(cardId: string): Promise<CardAnalysis | null> {
  const card = await getCardWithFullGraph(cardId);
  if (!card) return null;

  const totalBenefitValue = card.benefits.reduce((sum, b) => sum + b.valueEstimate, 0);
  const effectiveFee = card.annualFee || 1;
  const feeToValueRatio = Math.round((totalBenefitValue / effectiveFee) * 100) / 100;

  let valueVerdict: CardAnalysis["valueVerdict"];
  if (feeToValueRatio >= 5) valueVerdict = "excellent";
  else if (feeToValueRatio >= 3) valueVerdict = "good";
  else if (feeToValueRatio >= 1.5) valueVerdict = "fair";
  else valueVerdict = "poor";

  const categoryMap = new Map<string, { total: number; count: number }>();
  for (const b of card.benefits) {
    const existing = categoryMap.get(b.category) ?? { total: 0, count: 0 };
    existing.total += b.valueEstimate;
    existing.count += 1;
    categoryMap.set(b.category, existing);
  }

  const categoryStrengths: CategoryStrength[] = Array.from(categoryMap.entries())
    .map(([category, { total, count }]) => ({
      category,
      totalValue: total,
      benefitCount: count,
      rating: (total >= 3000 ? "strong" : total >= 1000 ? "moderate" : "weak") as CategoryStrength["rating"],
    }))
    .sort((a, b) => b.totalValue - a.totalValue);

  const allCards = await getAllCards({
    cardType: card.cardType,
    maxAnnualFee: card.annualFee * 2,
  });

  const peerComparison: PeerCard[] = allCards
    .filter((c) => c.id !== card.id)
    .slice(0, 5)
    .map((peer) => {
      const peerFTV = peer.estimatedAnnualValue / (peer.annualFee || 1);
      let comparedTo: PeerCard["comparedTo"];
      if (peerFTV > feeToValueRatio * 1.15) comparedTo = "worse";
      else if (peerFTV < feeToValueRatio * 0.85) comparedTo = "better";
      else comparedTo = "similar";

      return {
        id: peer.id,
        name: peer.name,
        bank: peer.bank.name,
        annualFee: peer.annualFee,
        estimatedAnnualValue: peer.estimatedAnnualValue,
        feeToValueRatio: Math.round(peerFTV * 100) / 100,
        comparedTo,
      };
    });

  const topCategories = categoryStrengths.filter((c) => c.rating === "strong").map((c) => c.category);
  const programInfo = card.rewardPrograms[0];

  const summaryParts: string[] = [
    `${card.name} by ${card.bank.name} (${card.network}, ₹${card.annualFee}/year).`,
    `Estimated annual value: ₹${card.estimatedAnnualValue} (${feeToValueRatio}x fee-to-value).`,
  ];

  if (topCategories.length > 0) {
    summaryParts.push(`Strongest categories: ${topCategories.join(", ")}.`);
  }

  if (programInfo) {
    summaryParts.push(`Earn rate: ${programInfo.earnRate}. ${programInfo.redemptions.length} redemption options, ${programInfo.transferPartners.length} transfer partners.`);
  }

  if (card.bestFor) summaryParts.push(`Best for: ${card.bestFor}`);

  return {
    card,
    feeToValueRatio,
    valueVerdict,
    categoryStrengths,
    peerComparison,
    summary: summaryParts.join(" "),
  };
}
