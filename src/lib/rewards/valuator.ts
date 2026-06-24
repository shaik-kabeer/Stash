import { getUserRewards, getPortfolioCards } from "@/lib/graph/queries";
import { prisma } from "@/lib/prisma";

export interface PortfolioValuation {
  userId: string;
  totalCards: number;
  totalRewardPrograms: number;
  totalPointsBalance: number;
  totalEstimatedValueINR: number;
  rewardNetWorth: number;
  cards: CardValuation[];
  rewards: RewardValuation[];
  byCategory: CategoryBreakdown[];
  insights: string[];
}

interface CardValuation {
  cardName: string;
  bankName: string;
  annualFee: number;
  estimatedAnnualValue: number;
  netValue: number;
}

export interface RewardValuation {
  programId: string;
  programName: string;
  pointName: string;
  balance: number;
  bestRedemptionRate: number;
  estimatedValueINR: number;
  bestRedemptionName: string;
  category: string;
}

interface CategoryBreakdown {
  category: string;
  totalValueINR: number;
  programCount: number;
}

function categorizeRedemptionType(type: string, programName: string): string {
  const t = type.toLowerCase();
  const n = programName.toLowerCase();
  if (t.includes("flight") || t.includes("airline") || t.includes("travel") || n.includes("miles") || n.includes("flying")) return "Travel";
  if (t.includes("hotel") || n.includes("marriott") || n.includes("hilton") || n.includes("itc")) return "Hotels";
  if (t.includes("cashback") || t.includes("cash") || t.includes("statement")) return "Cashback";
  if (t.includes("voucher") || t.includes("amazon") || t.includes("gift")) return "Vouchers";
  if (t.includes("transfer") || t.includes("partner")) return "Transfer Partners";
  return "Rewards";
}

export async function valuatePortfolio(userId: string): Promise<PortfolioValuation> {
  const [cards, rewards] = await Promise.all([
    getPortfolioCards(userId),
    getUserRewards(userId),
  ]);

  const cardValuations: CardValuation[] = cards
    .filter((uc) => uc.normalizedCard)
    .map((uc) => {
      const c = uc.normalizedCard!;
      return {
        cardName: c.name,
        bankName: c.bank.name,
        annualFee: c.annualFee,
        estimatedAnnualValue: c.estimatedAnnualValue,
        netValue: c.estimatedAnnualValue - c.annualFee,
      };
    });

  const programValuations = await prisma.programValuation.findMany({
    where: { programId: { in: rewards.map((r) => r.programId) } },
  });

  const pvMap = new Map<string, { valuePerPoint: number; type: string }>();
  for (const pv of programValuations) {
    const existing = pvMap.get(pv.programId);
    if (!existing || pv.valuePerPoint > existing.valuePerPoint) {
      pvMap.set(pv.programId, { valuePerPoint: pv.valuePerPoint, type: pv.redemptionType });
    }
  }

  const rewardValuations: RewardValuation[] = rewards.map((ur) => {
    const pvEntry = pvMap.get(ur.programId);
    const bestRedemption = ur.program.redemptions[0];
    const rate = pvEntry?.valuePerPoint ?? bestRedemption?.conversionRate ?? 0;
    const bestName = pvEntry ? `${pvEntry.type} (valued)` : bestRedemption?.name ?? "None";
    const category = categorizeRedemptionType(
      bestRedemption?.type ?? pvEntry?.type ?? "",
      ur.program.name,
    );

    return {
      programId: ur.programId,
      programName: ur.program.name,
      pointName: ur.program.pointName,
      balance: ur.balance,
      bestRedemptionRate: rate,
      estimatedValueINR: Math.round(ur.balance * rate * 100) / 100,
      bestRedemptionName: bestName,
      category,
    };
  });

  const totalPointsBalance = rewardValuations.reduce((s, r) => s + r.balance, 0);
  const totalEstimatedValueINR = rewardValuations.reduce((s, r) => s + r.estimatedValueINR, 0);
  const totalCardNetValue = cardValuations.reduce((s, c) => s + c.netValue, 0);
  const rewardNetWorth = Math.round(totalCardNetValue + totalEstimatedValueINR);

  const catMap = new Map<string, { total: number; count: number }>();
  for (const r of rewardValuations) {
    const e = catMap.get(r.category) ?? { total: 0, count: 0 };
    e.total += r.estimatedValueINR;
    e.count += 1;
    catMap.set(r.category, e);
  }
  const byCategory: CategoryBreakdown[] = Array.from(catMap.entries())
    .map(([category, { total, count }]) => ({
      category,
      totalValueINR: Math.round(total),
      programCount: count,
    }))
    .sort((a, b) => b.totalValueINR - a.totalValueINR);

  const insights: string[] = [];

  const negativeCards = cardValuations.filter((c) => c.netValue < 0);
  if (negativeCards.length > 0) {
    insights.push(`${negativeCards.length} card(s) cost more than their estimated value: ${negativeCards.map((c) => c.cardName).join(", ")}. Consider downgrading.`);
  }

  const totalFees = cardValuations.reduce((s, c) => s + c.annualFee, 0);
  const totalValue = cardValuations.reduce((s, c) => s + c.estimatedAnnualValue, 0);
  if (totalFees > 0) {
    insights.push(`Total annual fees: ₹${totalFees}. Total estimated value: ₹${totalValue}. Net: ₹${totalValue - totalFees}.`);
  }

  if (totalEstimatedValueINR > 0) {
    insights.push(`Unredeemed rewards worth ₹${Math.round(totalEstimatedValueINR)} across ${rewards.length} program(s).`);
  }

  const lowValueRewards = rewardValuations.filter((r) => r.balance > 0 && r.bestRedemptionRate < 0.25);
  if (lowValueRewards.length > 0) {
    insights.push(`Low-value programs (< ₹0.25/point): ${lowValueRewards.map((r) => r.programName).join(", ")}. Consider transferring to partners.`);
  }

  return {
    userId,
    totalCards: cardValuations.length,
    totalRewardPrograms: rewards.length,
    totalPointsBalance,
    totalEstimatedValueINR,
    rewardNetWorth,
    cards: cardValuations,
    rewards: rewardValuations,
    byCategory,
    insights,
  };
}
