import { getUserRewards, getPortfolioCards } from "@/lib/graph/queries";

export interface PortfolioValuation {
  userId: string;
  totalCards: number;
  totalRewardPrograms: number;
  totalPointsBalance: number;
  totalEstimatedValueINR: number;
  cards: CardValuation[];
  rewards: RewardValuation[];
  insights: string[];
}

interface CardValuation {
  cardName: string;
  bankName: string;
  annualFee: number;
  estimatedAnnualValue: number;
  netValue: number;
}

interface RewardValuation {
  programName: string;
  pointName: string;
  balance: number;
  bestRedemptionRate: number;
  estimatedValueINR: number;
  bestRedemptionName: string;
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

  const rewardValuations: RewardValuation[] = rewards.map((ur) => {
    const bestRedemption = ur.program.redemptions[0];
    const rate = bestRedemption?.conversionRate ?? 0;
    return {
      programName: ur.program.name,
      pointName: ur.program.pointName,
      balance: ur.balance,
      bestRedemptionRate: rate,
      estimatedValueINR: Math.round(ur.balance * rate * 100) / 100,
      bestRedemptionName: bestRedemption?.name ?? "None",
    };
  });

  const totalPointsBalance = rewardValuations.reduce((s, r) => s + r.balance, 0);
  const totalEstimatedValueINR = rewardValuations.reduce((s, r) => s + r.estimatedValueINR, 0);

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
    cards: cardValuations,
    rewards: rewardValuations,
    insights,
  };
}
