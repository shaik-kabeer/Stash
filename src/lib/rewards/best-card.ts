import { prisma } from "@/lib/prisma";

export interface BestCardResult {
  category: string;
  cards: RankedCard[];
}

export interface RankedCard {
  cardId: string;
  cardName: string;
  bankName: string;
  network: string;
  annualFee: number;
  estimatedAnnualValue: number;
  relevantBenefits: { title: string; description: string; valueEstimate: number }[];
  score: number;
  color: string;
}

const CATEGORY_MAP: Record<string, string[]> = {
  travel: ["travel", "lounge", "airport", "flight", "hotel", "miles"],
  dining: ["dining", "food", "restaurant", "zomato", "swiggy"],
  shopping: ["shopping", "online", "amazon", "flipkart", "ecommerce"],
  fuel: ["fuel", "petrol", "diesel", "gas"],
  groceries: ["grocery", "groceries", "supermarket", "bigbasket"],
  entertainment: ["entertainment", "movies", "netflix", "ott", "streaming"],
  rewards: ["rewards", "cashback", "points", "earning"],
  premium: ["premium", "concierge", "golf", "membership"],
  international: ["international", "forex", "foreign", "global"],
};

function categoryMatches(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export async function getBestCardsForCategory(category: string): Promise<BestCardResult> {
  const keywords = CATEGORY_MAP[category.toLowerCase()] ?? [category.toLowerCase()];

  const cards = await prisma.card.findMany({
    where: { isActive: true },
    include: {
      bank: true,
      benefits: { where: { isActive: true } },
    },
    orderBy: { estimatedAnnualValue: "desc" },
  });

  const ranked: RankedCard[] = [];

  for (const card of cards) {
    const relevantBenefits = card.benefits.filter(
      (b) =>
        categoryMatches(b.category, keywords) ||
        categoryMatches(b.title, keywords) ||
        categoryMatches(b.description ?? "", keywords)
    );

    if (relevantBenefits.length === 0) continue;

    const benefitScore = relevantBenefits.reduce((s, b) => s + (b.valueEstimate ?? 0), 0);
    const score = benefitScore + card.estimatedAnnualValue * 0.1;

    ranked.push({
      cardId: card.id,
      cardName: card.name,
      bankName: card.bank.name,
      network: card.network ?? "Unknown",
      annualFee: card.annualFee,
      estimatedAnnualValue: card.estimatedAnnualValue,
      relevantBenefits: relevantBenefits.map((b) => ({
        title: b.title,
        description: b.description ?? "",
        valueEstimate: b.valueEstimate ?? 0,
      })),
      score,
      color: card.color ?? "#6366f1",
    });
  }

  ranked.sort((a, b) => b.score - a.score);

  return { category, cards: ranked.slice(0, 5) };
}

export async function getAllBestCards(): Promise<BestCardResult[]> {
  const categories = Object.keys(CATEGORY_MAP);
  const results = await Promise.all(categories.map((c) => getBestCardsForCategory(c)));
  return results.filter((r) => r.cards.length > 0);
}

function parseEarnRate(earnRate: string): number | null {
  const percentMatch = earnRate.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch) return parseFloat(percentMatch[1]);

  const multMatch = earnRate.match(/(\d+(?:\.\d+)?)\s*x\b/i);
  if (multMatch) return parseFloat(multMatch[1]);

  const rangeMatch = earnRate.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) return Math.max(parseFloat(rangeMatch[1]), parseFloat(rangeMatch[2]));

  const perMatch = earnRate.match(/(\d+(?:\.\d+)?)\s*(?:RP|EDGE|points|Vkaash|Miles|CashPoints)?\s*(?:per|\/)/i);
  if (perMatch) return parseFloat(perMatch[1]);

  const firstNum = earnRate.match(/(\d+(?:\.\d+)?)/);
  if (firstNum) return parseFloat(firstNum[1]);

  return null;
}

function formatExpectedReward(
  category: string,
  earnRate: number | null,
  earnRateStr: string | null,
  topBenefit: { title: string; description: string } | undefined,
): string {
  if (topBenefit) {
    const combined = `${topBenefit.title} ${topBenefit.description}`.toLowerCase();
    const multMatch = combined.match(/(\d+(?:\.\d+)?)\s*x\b/);
    const pctMatch = combined.match(/(\d+(?:\.\d+)?)\s*%/);
    if (multMatch) return `${multMatch[1]}x points on ${category}`;
    if (pctMatch) return `${pctMatch[1]}% cashback on ${category}`;
  }
  if (earnRate !== null && earnRateStr) {
    if (earnRateStr.includes("%")) return `${earnRate}% on ${category}`;
    return `${earnRateStr} on ${category}`;
  }
  return `Rewards on ${category}`;
}

export async function getBestCardForUser(
  userId: string,
  category: string,
): Promise<{
  bestCard: {
    id: string;
    name: string;
    bank: string;
    network: string;
    annualFee: number;
    estimatedAnnualValue: number;
  } | null;
  expectedReward: string;
  reason: string;
  allOptions: Array<{ id: string; name: string; bank: string; score: number }>;
}> {
  const keywords = CATEGORY_MAP[category.toLowerCase()] ?? [category.toLowerCase()];

  const userCards = await prisma.userCard.findMany({
    where: { userId, isActive: true, cardId: { not: null } },
    include: {
      normalizedCard: {
        include: {
          bank: true,
          benefits: { where: { isActive: true } },
          rewardPrograms: { where: { isActive: true } },
        },
      },
    },
  });

  type ScoredOption = {
    id: string;
    name: string;
    bank: string;
    network: string;
    annualFee: number;
    estimatedAnnualValue: number;
    score: number;
    earnRate: number | null;
    earnRateStr: string | null;
    relevantBenefits: { title: string; description: string; valueEstimate: number }[];
  };

  const scored: ScoredOption[] = [];

  for (const uc of userCards) {
    const card = uc.normalizedCard;
    if (!card) continue;

    const relevantBenefits = card.benefits.filter(
      (b) =>
        categoryMatches(b.category, keywords) ||
        categoryMatches(b.title, keywords) ||
        categoryMatches(b.description ?? "", keywords),
    );

    let bestEarnRate: number | null = null;
    let bestEarnRateStr: string | null = null;

    for (const prog of card.rewardPrograms) {
      const categoryRelevant =
        categoryMatches(prog.earnRate, keywords) ||
        categoryMatches(prog.earnDescription ?? "", keywords);
      const rate = parseEarnRate(prog.earnRate);
      if (categoryRelevant && rate !== null && (bestEarnRate === null || rate > bestEarnRate)) {
        bestEarnRate = rate;
        bestEarnRateStr = prog.earnRate;
      }
    }

    if (bestEarnRate === null && card.rewardPrograms.length > 0) {
      bestEarnRate = parseEarnRate(card.rewardPrograms[0].earnRate);
      bestEarnRateStr = card.rewardPrograms[0].earnRate;
    }

    if (relevantBenefits.length === 0 && bestEarnRate === null) continue;

    const benefitScore = relevantBenefits.reduce((s, b) => s + (b.valueEstimate ?? 0), 0);
    const earnBonus = (bestEarnRate ?? 0) * 50;
    const score = benefitScore + earnBonus + card.estimatedAnnualValue * 0.1;

    scored.push({
      id: card.id,
      name: card.name,
      bank: card.bank.name,
      network: card.network ?? "Unknown",
      annualFee: card.annualFee,
      estimatedAnnualValue: card.estimatedAnnualValue,
      score,
      earnRate: bestEarnRate,
      earnRateStr: bestEarnRateStr,
      relevantBenefits: relevantBenefits.map((b) => ({
        title: b.title,
        description: b.description ?? "",
        valueEstimate: b.valueEstimate ?? 0,
      })),
    });
  }

  scored.sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      bestCard: null,
      expectedReward: "No matching rewards",
      reason: `None of your cards have benefits or earn rates matching "${category}".`,
      allOptions: [],
    };
  }

  const best = scored[0];
  const topBenefit = [...best.relevantBenefits].sort((a, b) => b.valueEstimate - a.valueEstimate)[0];
  const expectedReward = formatExpectedReward(category, best.earnRate, best.earnRateStr, topBenefit);

  const benefitSummary =
    best.relevantBenefits.length > 0
      ? `${best.relevantBenefits.length} matching benefit${best.relevantBenefits.length > 1 ? "s" : ""}`
      : null;
  const earnSummary = best.earnRateStr ? `earn rate of "${best.earnRateStr}"` : null;
  const reasonParts = [`${best.name} (${best.bank}) scores highest for ${category}`];
  if (benefitSummary) reasonParts.push(`with ${benefitSummary}`);
  if (earnSummary) reasonParts.push(`and ${earnSummary}`);
  if (scored.length > 1) {
    reasonParts.push(`— beating ${scored.length - 1} other card${scored.length > 2 ? "s" : ""} in your wallet`);
  }

  return {
    bestCard: {
      id: best.id,
      name: best.name,
      bank: best.bank,
      network: best.network,
      annualFee: best.annualFee,
      estimatedAnnualValue: best.estimatedAnnualValue,
    },
    expectedReward,
    reason: reasonParts.join(" ") + ".",
    allOptions: scored.map((o) => ({ id: o.id, name: o.name, bank: o.bank, score: o.score })),
  };
}
