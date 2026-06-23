import { getRewardProgramFull } from "@/lib/graph/queries";

export interface OptimizationResult {
  programId: string;
  programName: string;
  pointName: string;
  cardName: string;
  bankName: string;
  balance: number;
  options: RankedRedemption[];
  bestDirect: RankedRedemption | null;
  bestTransfer: RankedRedemption | null;
  recommendation: string;
}

export interface RankedRedemption {
  name: string;
  type: string;
  category: "direct" | "transfer";
  pointsRequired: number;
  estimatedValueINR: number;
  valuePerPoint: number;
  efficiencyRating: "excellent" | "good" | "fair" | "poor";
  description: string;
  transferDetails?: {
    partnerName: string;
    ratio: string;
    fee: number;
    time: string | null;
  };
}

function rateEfficiency(vpp: number): RankedRedemption["efficiencyRating"] {
  if (vpp >= 0.75) return "excellent";
  if (vpp >= 0.50) return "good";
  if (vpp >= 0.25) return "fair";
  return "poor";
}

export async function optimizeRedemption(
  programId: string,
  balance: number,
): Promise<OptimizationResult | null> {
  const program = await getRewardProgramFull(programId);
  if (!program) return null;

  const options: RankedRedemption[] = [];

  for (const r of program.redemptions) {
    if (r.minPoints > 0 && balance < r.minPoints) continue;
    const valueINR = balance * r.conversionRate;
    options.push({
      name: r.name,
      type: r.type,
      category: "direct",
      pointsRequired: r.minPoints,
      estimatedValueINR: Math.round(valueINR * 100) / 100,
      valuePerPoint: r.conversionRate,
      efficiencyRating: rateEfficiency(r.estimatedCPP || r.conversionRate),
      description: r.description ?? `Redeem ${program.pointName} for ${r.name}`,
    });
  }

  for (const tp of program.transferPartners) {
    const [fromRaw, toRaw] = tp.transferRatio.split(":");
    const from = Number(fromRaw) || 1;
    const to = Number(toRaw) || 1;
    const transferredUnits = (balance / from) * to;
    const netBalance = balance - (tp.transferFee > 0 ? Math.ceil(tp.transferFee) : 0);

    if (netBalance <= 0) continue;

    options.push({
      name: `Transfer to ${tp.partnerName}`,
      type: tp.partnerType,
      category: "transfer",
      pointsRequired: 0,
      estimatedValueINR: transferredUnits,
      valuePerPoint: transferredUnits / balance,
      efficiencyRating: "good",
      description: `Transfer ${balance} ${program.pointName} → ${Math.round(transferredUnits)} ${tp.partnerName} units`,
      transferDetails: {
        partnerName: tp.partnerName,
        ratio: tp.transferRatio,
        fee: tp.transferFee,
        time: tp.transferTime,
      },
    });
  }

  options.sort((a, b) => b.valuePerPoint - a.valuePerPoint);

  const bestDirect = options.find((o) => o.category === "direct") ?? null;
  const bestTransfer = options.find((o) => o.category === "transfer") ?? null;

  const parts: string[] = [];
  if (bestDirect) {
    parts.push(`Best direct redemption: ${bestDirect.name} (₹${bestDirect.estimatedValueINR}, ${bestDirect.efficiencyRating})`);
  }
  if (bestTransfer) {
    parts.push(`Best transfer: ${bestTransfer.name} (~${Math.round(bestTransfer.estimatedValueINR)} units)`);
  }
  if (options.length === 0) {
    parts.push("No eligible redemption options for this balance.");
  }

  return {
    programId: program.id,
    programName: program.name,
    pointName: program.pointName,
    cardName: program.card.name,
    bankName: program.card.bank?.name ?? "Unknown",
    balance,
    options,
    bestDirect,
    bestTransfer,
    recommendation: parts.join(". "),
  };
}
