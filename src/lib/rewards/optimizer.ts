import { getRewardProgramFull } from "@/lib/graph/queries";
import { prisma } from "@/lib/prisma";
import { getRedeemLinks, type RedeemLink } from "./redeem-links";

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
  bestOverall: RankedRedemption | null;
  worstOverall: RankedRedemption | null;
  recommendation: string;
  redeemLinks: RedeemLink[];
  // Compat fields for rewards page UI
  program: { id: string; name: string; pointName: string; card: string; bank: string };
  recommendations: CompatRecommendation[];
  bestOption: CompatRecommendation | null;
}

interface CompatRecommendation {
  name: string;
  type: string;
  pointsNeeded: number;
  estimatedValue: number;
  efficiencyRating: string;
  estimatedCPP: number;
  description: string | null;
  isBest?: boolean;
  isWorst?: boolean;
  portalUrl?: string;
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
  isBest?: boolean;
  isWorst?: boolean;
  portalUrl?: string;
  transferDetails?: {
    partnerName: string;
    ratio: string;
    fee: number;
    time: string | null;
    partnerUnits: number;
  };
}

const FALLBACK_PARTNER_VALUES: Record<string, number> = {
  "Air India": 1.5,
  "Vistara": 1.8,
  "Singapore Airlines": 2.0,
  "InterMiles": 0.6,
  "British Airways": 1.5,
  "Marriott Bonvoy": 0.7,
  "ITC Hotels": 0.5,
  "Hilton Honors": 0.5,
  "Accor": 0.4,
};

const DEFAULT_AIRLINE_VALUE = 1.2;
const DEFAULT_HOTEL_VALUE = 0.5;

function getFallbackPartnerValue(partnerName: string, partnerType: string): number {
  for (const [key, value] of Object.entries(FALLBACK_PARTNER_VALUES)) {
    if (partnerName.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return partnerType === "airline" ? DEFAULT_AIRLINE_VALUE : DEFAULT_HOTEL_VALUE;
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

  const valuations = await prisma.programValuation.findMany({
    where: { programId },
  });
  const valMap = new Map<string, number>();
  for (const v of valuations) {
    valMap.set(v.redemptionType.toLowerCase(), v.valuePerPoint);
  }

  const bankName = program.card.bank?.name ?? "Unknown";
  const redeemLinks = getRedeemLinks(bankName);
  const defaultPortalUrl = redeemLinks.find((l) => l.type === "portal")?.url;

  const options: RankedRedemption[] = [];

  for (const r of program.redemptions) {
    if (r.minPoints > 0 && balance < r.minPoints) continue;

    const valuedRate = valMap.get(r.type.toLowerCase());
    const rate = valuedRate ?? r.conversionRate;
    const valueINR = balance * rate;

    options.push({
      name: r.name,
      type: r.type,
      category: "direct",
      pointsRequired: r.minPoints,
      estimatedValueINR: Math.round(valueINR * 100) / 100,
      valuePerPoint: rate,
      efficiencyRating: rateEfficiency(valuedRate ?? (r.estimatedCPP || r.conversionRate)),
      description: r.description ?? `Redeem ${program.pointName} for ${r.name}`,
      portalUrl: defaultPortalUrl,
    });
  }

  for (const tp of program.transferPartners) {
    const [fromRaw, toRaw] = tp.transferRatio.split(":");
    const from = Number(fromRaw) || 1;
    const to = Number(toRaw) || 1;
    const netBalance = balance - (tp.transferFee > 0 ? Math.ceil(tp.transferFee) : 0);

    if (netBalance <= 0) continue;

    const transferredUnits = (netBalance / from) * to;

    const transferValuation = valMap.get(`transfer_${tp.partnerName.toLowerCase()}`);
    const partnerPointValue = transferValuation ?? getFallbackPartnerValue(tp.partnerName, tp.partnerType);
    const estimatedValueINR = transferredUnits * partnerPointValue;
    const valuePerPoint = estimatedValueINR / balance;

    const transferPortal = redeemLinks.find((l) => l.type === "transfer")?.url;

    options.push({
      name: `Transfer to ${tp.partnerName}`,
      type: tp.partnerType,
      category: "transfer",
      pointsRequired: 0,
      estimatedValueINR: Math.round(estimatedValueINR * 100) / 100,
      valuePerPoint: Math.round(valuePerPoint * 10000) / 10000,
      efficiencyRating: rateEfficiency(valuePerPoint),
      description: `Transfer ${balance} ${program.pointName} → ${Math.round(transferredUnits)} ${tp.partnerName} units (≈₹${Math.round(estimatedValueINR)})`,
      portalUrl: transferPortal ?? defaultPortalUrl,
      transferDetails: {
        partnerName: tp.partnerName,
        ratio: tp.transferRatio,
        fee: tp.transferFee,
        time: tp.transferTime,
        partnerUnits: Math.round(transferredUnits),
      },
    });
  }

  options.sort((a, b) => b.valuePerPoint - a.valuePerPoint);

  if (options.length > 0) {
    options[0].isBest = true;
    if (options.length > 1) options[options.length - 1].isWorst = true;
  }

  const bestDirect = options.find((o) => o.category === "direct") ?? null;
  const bestTransfer = options.find((o) => o.category === "transfer") ?? null;
  const bestOverall = options[0] ?? null;
  const worstOverall = options.length > 1 ? options[options.length - 1] : null;

  const parts: string[] = [];
  if (bestOverall) {
    parts.push(`Best: ${bestOverall.name} (₹${bestOverall.estimatedValueINR})`);
  }
  if (worstOverall && worstOverall !== bestOverall) {
    const diff = bestOverall!.estimatedValueINR - worstOverall.estimatedValueINR;
    parts.push(`Worst: ${worstOverall.name} (₹${worstOverall.estimatedValueINR}) — you'd lose ₹${Math.round(diff)}`);
  }
  if (options.length === 0) {
    parts.push("No eligible redemption options for this balance.");
  }

  const recommendations: CompatRecommendation[] = options.map((o) => ({
    name: o.name,
    type: o.category === "transfer" ? `${o.type}_transfer` : o.type,
    pointsNeeded: o.pointsRequired,
    estimatedValue: o.estimatedValueINR,
    efficiencyRating: o.efficiencyRating,
    estimatedCPP: o.valuePerPoint,
    description: o.description,
    isBest: o.isBest,
    isWorst: o.isWorst,
    portalUrl: o.portalUrl,
  }));

  return {
    programId: program.id,
    programName: program.name,
    pointName: program.pointName,
    cardName: program.card.name,
    bankName,
    balance,
    options,
    bestDirect,
    bestTransfer,
    bestOverall,
    worstOverall,
    recommendation: parts.join(". "),
    redeemLinks,
    program: {
      id: program.id,
      name: program.name,
      pointName: program.pointName,
      card: program.card.name,
      bank: bankName,
    },
    recommendations,
    bestOption: recommendations[0] ?? null,
  };
}
