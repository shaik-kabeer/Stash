import type {
  Benefits,
  CardDetails,
  Offers,
  RedemptionOptions,
  RewardStructure,
  TransferPartners,
} from "./schemas";

function normKey(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function pickBestCardDetails(candidates: CardDetails[]): CardDetails {
  const ranked = [...candidates].sort((a, b) => {
    const score = (c: CardDetails) =>
      (c.name !== "Unknown Card" ? 10 : 0) +
      (c.bank !== "Unknown Bank" ? 5 : 0) +
      (c.annualFee > 0 ? 1 : 0) +
      c.name.length;
    return score(b) - score(a);
  });
  return ranked[0] ?? candidates[0];
}

export function mergeBenefits(items: Benefits[]): Benefits {
  const cardName = items.find((i) => i.cardName)?.cardName ?? "Unknown Card";
  const seen = new Set<string>();
  const benefits = [];

  for (const item of items) {
    for (const b of item.benefits) {
      const key = normKey(b.title);
      if (seen.has(key)) continue;
      seen.add(key);
      benefits.push(b);
    }
  }

  return { cardName, benefits };
}

export function mergeRewardStructures(items: RewardStructure[]): RewardStructure {
  if (items.length === 0) {
    return {
      pointName: "Reward Points",
      earnRate: "Unknown",
      earnDescription: null,
      categories: [],
    };
  }

  const ranked = [...items].sort(
    (a, b) => b.categories.length - a.categories.length || b.earnRate.length - a.earnRate.length,
  );
  const best = ranked[0];
  const seen = new Set<string>();
  const categories = [];

  for (const item of items) {
    for (const c of item.categories) {
      const key = normKey(`${c.category}:${c.rate}`);
      if (seen.has(key)) continue;
      seen.add(key);
      categories.push(c);
    }
  }

  return { ...best, categories };
}

export function mergeRedemptionOptions(items: RedemptionOptions[]): RedemptionOptions {
  const seen = new Set<string>();
  const options = [];

  for (const item of items) {
    for (const o of item.options) {
      const key = normKey(o.name);
      if (seen.has(key)) continue;
      seen.add(key);
      options.push(o);
    }
  }

  return { options };
}

export function mergeTransferPartners(items: TransferPartners[]): TransferPartners {
  const seen = new Set<string>();
  const partners = [];

  for (const item of items) {
    for (const p of item.partners) {
      const key = normKey(p.partnerName);
      if (seen.has(key)) continue;
      seen.add(key);
      partners.push(p);
    }
  }

  return { partners };
}

export function mergeOffers(items: Offers[]): Offers {
  const seen = new Set<string>();
  const offers = [];

  for (const item of items) {
    for (const o of item.offers) {
      const key = normKey(o.title);
      if (seen.has(key)) continue;
      seen.add(key);
      offers.push(o);
    }
  }

  return { offers };
}
