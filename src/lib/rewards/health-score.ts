import { prisma } from "@/lib/prisma";

export interface HealthScoreResult {
  overallScore: number;
  grade: "excellent" | "good" | "fair" | "poor" | "critical";
  expiringPoints: number;
  unusedBenefits: number;
  inactiveCards: number;
  potentialLoss: number;
  factors: HealthFactor[];
  suggestions: string[];
}

export interface HealthFactor {
  name: string;
  impact: number;
  status: "good" | "warning" | "critical";
  detail: string;
}

const LIKELY_UNUSED_CATEGORIES = new Set(["insurance", "golf", "forex", "milestone", "concierge"]);
const LIKELY_USED_CATEGORIES = new Set(["lounge", "rewards", "cashback", "fuel"]);

const SCORE_TTL_MS = 10 * 60 * 1000;

export async function computeHealthScore(userId: string): Promise<HealthScoreResult> {
  const recent = await prisma.rewardHealthScore.findFirst({
    where: { userId },
    orderBy: { computedAt: "desc" },
  });
  if (recent && Date.now() - recent.computedAt.getTime() < SCORE_TTL_MS) {
    return {
      overallScore: recent.overallScore,
      grade: gradeFromScore(recent.overallScore),
      expiringPoints: recent.expiringPoints,
      unusedBenefits: recent.unusedBenefits,
      inactiveCards: recent.inactiveCards,
      potentialLoss: recent.potentialLoss,
      factors: recent.factors ? JSON.parse(recent.factors) : [],
      suggestions: [],
    };
  }

  const [userRewards, userCards, benefits] = await Promise.all([
    prisma.userReward.findMany({
      where: { userId },
      include: {
        program: {
          include: {
            card: { include: { bank: true, benefits: true } },
            redemptions: true,
          },
        },
      },
    }),
    prisma.userCard.findMany({
      where: { userId, isActive: true },
      include: { normalizedCard: { include: { benefits: true } } },
    }),
    prisma.benefit.findMany({
      where: {
        card: { userCards2: { some: { userId } } },
        isActive: true,
      },
    }),
  ]);

  const factors: HealthFactor[] = [];
  let score = 100;
  let expiringPoints = 0;
  let potentialLoss = 0;
  const suggestions: string[] = [];

  // Factor 1: Point expiry risk
  for (const ur of userRewards) {
    if (ur.program.expiryMonths && ur.program.expiryMonths > 0) {
      const monthsSinceSync = (Date.now() - ur.lastSynced.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsSinceSync > ur.program.expiryMonths * 0.7) {
        const bestRate = ur.program.redemptions[0]?.conversionRate ?? 0.25;
        const atRisk = ur.balance * bestRate;
        expiringPoints += ur.balance;
        potentialLoss += atRisk;
        const impact = Math.min(25, Math.round(atRisk / 100));
        score -= impact;
        factors.push({
          name: "Expiring Points",
          impact: -impact,
          status: "critical",
          detail: `${Math.round(ur.balance)} ${ur.program.pointName} may expire soon (₹${Math.round(atRisk)} at risk)`,
        });
        suggestions.push(`Redeem your ${ur.program.pointName} before they expire — worth ≈₹${Math.round(atRisk)}`);
      }
    }
  }

  // Factor 2: Low-balance programs
  const lowBalancePrograms = userRewards.filter((ur) => {
    const minRequired = ur.program.redemptions.reduce(
      (min, r) => (r.minPoints > 0 && r.minPoints < min ? r.minPoints : min),
      Infinity,
    );
    return ur.balance > 0 && ur.balance < minRequired && minRequired < Infinity;
  });
  if (lowBalancePrograms.length > 0) {
    const impact = lowBalancePrograms.length * 5;
    score -= impact;
    factors.push({
      name: "Low Balances",
      impact: -impact,
      status: "warning",
      detail: `${lowBalancePrograms.length} program(s) below minimum redemption threshold`,
    });
    suggestions.push("Spend more on cards with low-balance programs to reach redemption minimums");
  }

  // Factor 3: Unused high-value benefits (likelihood-based)
  const unusedBenefitsList = benefits.filter((b) =>
    LIKELY_UNUSED_CATEGORIES.has(b.category) && b.valueEstimate > 500,
  );
  const unusedBenefitValue = unusedBenefitsList.reduce((s, b) => s + b.valueEstimate, 0);
  if (unusedBenefitsList.length > 0) {
    const impact = Math.min(15, Math.round(unusedBenefitValue / 1000));
    score -= impact;
    potentialLoss += unusedBenefitValue;
    factors.push({
      name: "Unused Benefits",
      impact: -impact,
      status: "warning",
      detail: `${unusedBenefitsList.length} likely-unused benefits worth ≈₹${Math.round(unusedBenefitValue)}/yr (insurance, golf, forex, etc.)`,
    });
    suggestions.push("Check your card benefits — you may have unused insurance, golf, or forex benefits");
  }

  // Factor 4: Inactive cards (based on reward sync, not onboard date)
  const staleCards = userCards.filter((uc) => {
    const hasReward = userRewards.some((ur) =>
      ur.program.card.id === uc.cardId &&
      (Date.now() - ur.lastSynced.getTime()) < 90 * 24 * 60 * 60 * 1000,
    );
    return !hasReward && uc.cardId;
  });
  const inactiveCards = staleCards.length;
  if (inactiveCards > 0 && userCards.length > 1) {
    const impact = Math.min(10, inactiveCards * 3);
    score -= impact;
    factors.push({
      name: "Inactive Cards",
      impact: -impact,
      status: "warning",
      detail: `${inactiveCards} card(s) with no recent reward activity — you may be missing rewards`,
    });
    suggestions.push("Update reward balances for all your cards to track rewards accurately");
  }

  // Factor 5: Missed opportunities — cards not used for best category
  const cardBenefitTotals = new Map<string, number>();
  for (const b of benefits) {
    if (LIKELY_USED_CATEGORIES.has(b.category)) continue;
    const current = cardBenefitTotals.get(b.cardId) ?? 0;
    cardBenefitTotals.set(b.cardId, current + b.valueEstimate);
  }
  const highValueMissed = Array.from(cardBenefitTotals.entries())
    .filter(([, val]) => val > 3000)
    .length;
  if (highValueMissed > 0) {
    const impact = Math.min(10, highValueMissed * 4);
    score -= impact;
    factors.push({
      name: "Missed Opportunities",
      impact: -impact,
      status: "warning",
      detail: `${highValueMissed} card(s) have high-value benefits you may be underutilizing`,
    });
    suggestions.push("Review your card benefits to discover hidden value you might be leaving on the table");
  }

  // Factor 6: Portfolio diversification bonus
  const uniqueBanks = new Set(userRewards.map((ur) => ur.program.card.bank?.name).filter(Boolean));
  if (uniqueBanks.size >= 3) {
    const bonus = 5;
    score += bonus;
    factors.push({
      name: "Diversification",
      impact: bonus,
      status: "good",
      detail: `Well-diversified across ${uniqueBanks.size} banks`,
    });
  }

  // Factor 7: Poor redemption choices (cashback-only strategy)
  const hasTransferOptions = userRewards.some((ur) =>
    ur.program.redemptions.some((r) => r.type === "travel" || r.type === "flights"),
  );
  const allCashback = userRewards.length > 0 && userRewards.every((ur) =>
    ur.program.redemptions.length > 0 &&
    ur.program.redemptions.every((r) => r.type === "cashback" || r.type === "statement_credit"),
  );
  if (allCashback && !hasTransferOptions) {
    score -= 5;
    factors.push({
      name: "Redemption Strategy",
      impact: -5,
      status: "warning",
      detail: "Only cashback redemptions available — travel/transfer may give 2-3x better value",
    });
    suggestions.push("Explore travel and transfer partner redemptions for potentially 2-3x better value");
  }

  score = Math.max(0, Math.min(100, score));

  if (factors.length === 0) {
    factors.push({
      name: "Portfolio Status",
      impact: 0,
      status: "good",
      detail: "Add cards and reward balances to get personalized health insights",
    });
    suggestions.push("Start by adding your credit cards and reward point balances");
  }

  const result: HealthScoreResult = {
    overallScore: score,
    grade: gradeFromScore(score),
    expiringPoints,
    unusedBenefits: unusedBenefitsList.length,
    inactiveCards,
    potentialLoss: Math.round(potentialLoss),
    factors,
    suggestions,
  };

  await prisma.rewardHealthScore.create({
    data: {
      userId,
      overallScore: score,
      expiringPoints,
      unusedBenefits: unusedBenefitsList.length,
      inactiveCards,
      potentialLoss: Math.round(potentialLoss),
      factors: JSON.stringify(factors),
    },
  });

  return result;
}

function gradeFromScore(score: number): HealthScoreResult["grade"] {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  if (score >= 20) return "poor";
  return "critical";
}
