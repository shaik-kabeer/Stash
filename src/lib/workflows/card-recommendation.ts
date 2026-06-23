export type SpendingCategory =
  | "travel"
  | "dining"
  | "shopping"
  | "fuel"
  | "groceries"
  | "entertainment"
  | "general";

export interface CardEarningProfile {
  cardName: string;
  provider: string;
  category: SpendingCategory;
  earningRate: string;
  multiplier: number;
  annualFee: number;
  bestFor: string;
}

export interface CardRecommendationResult {
  recommendedCard: CardEarningProfile;
  reasoningSteps: string[];
  alternativeCards: CardEarningProfile[];
}

const CARD_CATALOG: CardEarningProfile[] = [
  {
    cardName: "HDFC Infinia",
    provider: "HDFC Bank",
    category: "travel",
    earningRate: "10x via SmartBuy on flights & hotels",
    multiplier: 10,
    annualFee: 12500,
    bestFor: "Flight and hotel bookings through SmartBuy portal",
  },
  {
    cardName: "Axis Magnus",
    provider: "Axis Bank",
    category: "travel",
    earningRate: "5x EDGE Rewards on travel",
    multiplier: 5,
    annualFee: 10000,
    bestFor: "Direct airline and OTA bookings",
  },
  {
    cardName: "HDFC Diners Club Black",
    provider: "HDFC Bank",
    category: "dining",
    earningRate: "5x on dining & entertainment",
    multiplier: 5,
    annualFee: 10000,
    bestFor: "Premium restaurant dining",
  },
  {
    cardName: "Axis Atlas",
    provider: "Axis Bank",
    category: "dining",
    earningRate: "4x on dining",
    multiplier: 4,
    annualFee: 5000,
    bestFor: "Everyday dining with lounge access",
  },
  {
    cardName: "Axis Magnus",
    provider: "Axis Bank",
    category: "shopping",
    earningRate: "5x EDGE Rewards on online shopping",
    multiplier: 5,
    annualFee: 10000,
    bestFor: "Flipkart, Amazon, and online retail",
  },
  {
    cardName: "SBI Cashback",
    provider: "SBI Card",
    category: "shopping",
    earningRate: "5% cashback on online spends",
    multiplier: 5,
    annualFee: 999,
    bestFor: "Simple cashback on all online purchases",
  },
  {
    cardName: "SBI BPCL Octane",
    provider: "SBI Card",
    category: "fuel",
    earningRate: "6.25% value back on fuel",
    multiplier: 6.25,
    annualFee: 1499,
    bestFor: "BPCL fuel stations",
  },
  {
    cardName: "HDFC Regalia",
    provider: "HDFC Bank",
    category: "fuel",
    earningRate: "4x on fuel (capped monthly)",
    multiplier: 4,
    annualFee: 2500,
    bestFor: "Any fuel station with reward points",
  },
  {
    cardName: "HDFC Millennia",
    provider: "HDFC Bank",
    category: "groceries",
    earningRate: "5% cashback on partner merchants",
    multiplier: 5,
    annualFee: 1000,
    bestFor: "BigBasket, Swiggy, and partner grocery stores",
  },
  {
    cardName: "ICICI Amazon Pay",
    provider: "ICICI Bank",
    category: "shopping",
    earningRate: "5% on Amazon, 2% elsewhere",
    multiplier: 5,
    annualFee: 0,
    bestFor: "Amazon-exclusive shopping",
  },
];

export async function runCardRecommendation(
  spendingCategory: SpendingCategory
): Promise<CardRecommendationResult> {
  const categoryCards = CARD_CATALOG.filter(
    (c) => c.category === spendingCategory
  ).sort((a, b) => b.multiplier - a.multiplier);

  const recommendedCard = categoryCards[0] ?? CARD_CATALOG[0];
  const alternativeCards = categoryCards.slice(1, 3);

  const reasoningSteps: string[] = [
    `Analyzed ${categoryCards.length} cards optimized for ${spendingCategory} spending.`,
    `${recommendedCard.cardName} offers the highest earning rate at ${recommendedCard.earningRate}.`,
    `Annual fee of ₹${recommendedCard.annualFee.toLocaleString("en-IN")} is justified by ${recommendedCard.multiplier}x multiplier on ${spendingCategory} spends.`,
  ];

  if (spendingCategory === "travel") {
    reasoningSteps.push(
      "HDFC SmartBuy portal stacks 10x points on flights — always book travel through SmartBuy rather than direct airline sites.",
      "Your existing Air India miles (45,000) pair well with HDFC→Air India 1:1 transfers for award flights."
    );
  } else if (spendingCategory === "shopping") {
    reasoningSteps.push(
      "Redeem Axis EDGE points via Flipkart for 5x effective value on voucher redemptions.",
    );
  } else if (spendingCategory === "dining") {
    reasoningSteps.push(
      "Stack card rewards with Swiggy Dineout or EazyDiner offers for additional 15-20% savings.",
    );
  }

  reasoningSteps.push(
    `Best use case: ${recommendedCard.bestFor}`
  );

  return {
    recommendedCard,
    reasoningSteps,
    alternativeCards,
  };
}
