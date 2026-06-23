import { runOptimization, OptimizationAccount } from "@/lib/agents/optimization";
import { calculateINRValue } from "@/lib/utils/calculations";

export interface RedemptionCatalogItem {
  id: string;
  provider: string;
  name: string;
  pointsRequired: number;
  valueINR: number;
  category: string;
  efficiency: number;
}

export interface BestRedemption {
  catalogItem: RedemptionCatalogItem;
  accountProvider: string;
  availableBalance: number;
  effectiveValueINR: number;
  efficiencyGain: number;
}

export interface RedemptionOptimizationResult {
  bestRedemptions: BestRedemption[];
  potentialGainINR: number;
}

export async function runRedemptionOptimization(
  accounts: OptimizationAccount[],
  redemptionCatalog: RedemptionCatalogItem[]
): Promise<RedemptionOptimizationResult> {
  const optimization = await runOptimization(accounts);

  const bestRedemptions: BestRedemption[] = [];

  for (const item of redemptionCatalog) {
    const account = accounts.find(
      (a) =>
        a.provider === item.provider ||
        a.provider.includes(item.provider) ||
        item.provider.includes(a.provider)
    );
    if (!account || account.balance < item.pointsRequired) continue;

    const baseValue = calculateINRValue(
      item.pointsRequired,
      account.conversionRate
    );
    const efficiencyGain = item.valueINR - baseValue;

    if (efficiencyGain >= 0) {
      bestRedemptions.push({
        catalogItem: item,
        accountProvider: account.provider,
        availableBalance: account.balance,
        effectiveValueINR: item.valueINR,
        efficiencyGain,
      });
    }
  }

  bestRedemptions.sort((a, b) => b.efficiencyGain - a.efficiencyGain);

  const transferGain = optimization.transferOpportunities.reduce(
    (sum, t) => sum + t.gainINR,
    0
  );
  const redemptionGain = bestRedemptions
    .slice(0, 5)
    .reduce((sum, r) => sum + r.efficiencyGain, 0);

  return {
    bestRedemptions: bestRedemptions.slice(0, 5),
    potentialGainINR: transferGain + redemptionGain,
  };
}

export const DEFAULT_REDEMPTION_CATALOG: RedemptionCatalogItem[] = [
  {
    id: "hdfc_amazon",
    provider: "HDFC",
    name: "Amazon Voucher",
    pointsRequired: 1000,
    valueINR: 250,
    category: "shopping",
    efficiency: 125,
  },
  {
    id: "axis_flipkart",
    provider: "Axis",
    name: "Flipkart Voucher",
    pointsRequired: 2000,
    valueINR: 600,
    category: "shopping",
    efficiency: 120,
  },
  {
    id: "airindia_flight",
    provider: "Air India",
    name: "DEL-BOM Economy Award",
    pointsRequired: 8000,
    valueINR: 7500,
    category: "travel",
    efficiency: 125,
  },
  {
    id: "marriott_night",
    provider: "Marriott",
    name: "Category 3 Free Night",
    pointsRequired: 16000,
    valueINR: 12000,
    category: "travel",
    efficiency: 115,
  },
  {
    id: "indigo_flight",
    provider: "IndiGo",
    name: "BluChip Flight Redemption",
    pointsRequired: 1500,
    valueINR: 1800,
    category: "travel",
    efficiency: 120,
  },
  {
    id: "icici_voucher",
    provider: "ICICI",
    name: "Amazon Gift Card",
    pointsRequired: 500,
    valueINR: 140,
    category: "shopping",
    efficiency: 112,
  },
];
