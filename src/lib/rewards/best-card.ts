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
