import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

export interface OptimizationAccount {
  provider: string;
  balance: number;
  conversionRate: number;
  valueINR?: number;
  expiryDate?: string | null;
  transferPartners?: string | null;
}

export interface TransferOpportunity {
  fromProvider: string;
  toProvider: string;
  points: number;
  currentValueINR: number;
  projectedValueINR: number;
  gainINR: number;
  ratio: string;
  reason: string;
}

export interface RedemptionPath {
  provider: string;
  action: string;
  valueINR: number;
  priority: "high" | "medium" | "low";
}

export interface OptimizationResult {
  transferOpportunities: TransferOpportunity[];
  expiringAssets: OptimizationAccount[];
  redemptionPaths: RedemptionPath[];
  summary: string;
}

const OptimizationState = Annotation.Root({
  accounts: Annotation<OptimizationAccount[]>,
  recommendations: Annotation<Record<string, unknown>[]>,
  transferOpportunities: Annotation<TransferOpportunity[]>,
  expiringAssets: Annotation<OptimizationAccount[]>,
  redemptionPaths: Annotation<RedemptionPath[]>,
  summary: Annotation<string>,
});

const TRANSFER_RULES: {
  from: string;
  to: string;
  ratio: string;
  toRate: number;
}[] = [
  { from: "HDFC", to: "Air India", ratio: "1:1", toRate: 0.75 },
  { from: "HDFC Bank", to: "Air India", ratio: "1:1", toRate: 0.75 },
  { from: "HDFC", to: "Marriott", ratio: "2:1", toRate: 0.65 },
  { from: "HDFC Bank", to: "Marriott International", ratio: "2:1", toRate: 0.65 },
  { from: "Axis", to: "Marriott", ratio: "2:1", toRate: 0.65 },
  { from: "Axis Bank", to: "Marriott International", ratio: "2:1", toRate: 0.65 },
  { from: "SBI", to: "Air India", ratio: "1:1", toRate: 0.75 },
  { from: "SBI Card", to: "Air India", ratio: "1:1", toRate: 0.75 },
];

function daysUntil(dateStr: string | null | undefined): number {
  if (!dateStr) return Infinity;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function analyzeTransfers(
  state: typeof OptimizationState.State
): Partial<typeof OptimizationState.State> {
  const opportunities: TransferOpportunity[] = [];

  for (const rule of TRANSFER_RULES) {
    const source = state.accounts.find((a) => a.provider === rule.from);
    if (!source || source.balance <= 0) continue;

    const currentValue = source.balance * source.conversionRate;
    const transferPoints =
      rule.ratio === "2:1" ? source.balance / 2 : source.balance;
    const projectedValue = transferPoints * rule.toRate;
    const gain = projectedValue - currentValue;

    if (gain > 0) {
      opportunities.push({
        fromProvider: source.provider,
        toProvider: rule.to,
        points: source.balance,
        currentValueINR: currentValue,
        projectedValueINR: projectedValue,
        gainINR: gain,
        ratio: rule.ratio,
        reason: `Transfer ${source.balance.toLocaleString()} ${source.provider} points to ${rule.to} at ${rule.ratio} for ₹${gain.toFixed(0)} extra value`,
      });
    }
  }

  return {
    transferOpportunities: opportunities.sort((a, b) => b.gainINR - a.gainINR),
  };
}

function findExpiring(
  state: typeof OptimizationState.State
): Partial<typeof OptimizationState.State> {
  const expiring = state.accounts
    .filter((a) => daysUntil(a.expiryDate) <= 90)
    .sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate));

  return { expiringAssets: expiring };
}

function suggestRedemptions(
  state: typeof OptimizationState.State
): Partial<typeof OptimizationState.State> {
  const paths: RedemptionPath[] = [];

  for (const asset of state.expiringAssets) {
    const value = asset.balance * asset.conversionRate;
    paths.push({
      provider: asset.provider,
      action: `Redeem ${asset.balance.toLocaleString()} points before expiry (${daysUntil(asset.expiryDate)} days left)`,
      valueINR: value,
      priority: daysUntil(asset.expiryDate) <= 30 ? "high" : "medium",
    });
  }

  for (const opp of state.transferOpportunities.slice(0, 3)) {
    paths.push({
      provider: opp.fromProvider,
      action: opp.reason,
      valueINR: opp.projectedValueINR,
      priority: opp.gainINR > 500 ? "high" : "medium",
    });
  }

  const axis = state.accounts.find(
    (a) => a.provider === "Axis Bank" || a.provider === "Axis"
  );
  if (axis) {
    paths.push({
      provider: axis.provider,
      action: "Redeem via Flipkart vouchers for 5x effective value on online shopping",
      valueINR: axis.balance * axis.conversionRate * 1.15,
      priority: "medium",
    });
  }

  return { redemptionPaths: paths };
}

function generateSummary(
  state: typeof OptimizationState.State
): Partial<typeof OptimizationState.State> {
  const topTransfer = state.transferOpportunities[0];
  const urgentCount = state.expiringAssets.filter(
    (a) => daysUntil(a.expiryDate) <= 30
  ).length;

  let summary = `Found ${state.transferOpportunities.length} transfer opportunities and ${state.expiringAssets.length} accounts expiring within 90 days.`;
  if (topTransfer) {
    summary += ` Top opportunity: ${topTransfer.reason} (+₹${topTransfer.gainINR.toFixed(0)}).`;
  }
  if (urgentCount > 0) {
    summary += ` ${urgentCount} account(s) need urgent action within 30 days.`;
  }

  return { summary };
}

function buildOptimizationGraph() {
  return new StateGraph(OptimizationState)
    .addNode("analyze_transfers", analyzeTransfers)
    .addNode("find_expiring", findExpiring)
    .addNode("suggest_redemptions", suggestRedemptions)
    .addNode("generate_summary", generateSummary)
    .addEdge(START, "analyze_transfers")
    .addEdge("analyze_transfers", "find_expiring")
    .addEdge("find_expiring", "suggest_redemptions")
    .addEdge("suggest_redemptions", "generate_summary")
    .addEdge("generate_summary", END)
    .compile();
}

export async function runOptimization(
  accounts: OptimizationAccount[],
  recommendations: Record<string, unknown>[] = []
): Promise<OptimizationResult> {
  const graph = buildOptimizationGraph();
  const result = await graph.invoke({
    accounts,
    recommendations,
    transferOpportunities: [],
    expiringAssets: [],
    redemptionPaths: [],
    summary: "",
  });

  return {
    transferOpportunities: result.transferOpportunities,
    expiringAssets: result.expiringAssets,
    redemptionPaths: result.redemptionPaths,
    summary: result.summary,
  };
}
