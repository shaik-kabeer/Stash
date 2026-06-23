import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { allProviders } from "@/lib/mock/providers";
import { calculateINRValue } from "@/lib/utils/calculations";
import { getConversionRate } from "@/lib/agents/config";
import { prisma } from "@/lib/prisma";

export interface BalanceEntry {
  provider: string;
  balance: number;
  conversionRate: number;
  valueINR: number;
  expiryDate: string | null;
  tier: string;
  pointsName: string;
  source: "mock" | "database";
}

export interface AggregatorResult {
  balances: BalanceEntry[];
  totalINR: number;
  programsAnalyzed: string[];
}

const AggregatorState = Annotation.Root({
  userId: Annotation<string>,
  balances: Annotation<BalanceEntry[]>,
  totalINR: Annotation<number>,
  programsAnalyzed: Annotation<string[]>,
});

async function gatherAll(
  state: typeof AggregatorState.State
): Promise<Partial<typeof AggregatorState.State>> {
  const mockBalances: BalanceEntry[] = [];

  for (const fetchFn of Object.values(allProviders)) {
    const data = fetchFn();
    const conversionRate = getConversionRate(data.provider);
    mockBalances.push({
      provider: data.provider,
      balance: data.balance,
      conversionRate,
      valueINR: calculateINRValue(data.balance, conversionRate),
      expiryDate: data.expiryDate,
      tier: data.tier,
      pointsName: data.pointsName,
      source: "mock",
    });
  }

  const accounts = await prisma.rewardAccount.findMany({
    where: { userId: state.userId },
    include: { program: true },
  });

  const dbBalances: BalanceEntry[] = accounts.map((account) => ({
    provider: account.program.provider,
    balance: account.balance,
    conversionRate: account.program.conversionRate,
    valueINR: account.estimatedValueINR,
    expiryDate: account.expiryDate?.toISOString() ?? null,
    tier: account.tier ?? "Standard",
    pointsName: account.program.name,
    source: "database" as const,
  }));

  const byProvider = new Map<string, BalanceEntry>();
  for (const entry of [...mockBalances, ...dbBalances]) {
    const existing = byProvider.get(entry.provider);
    if (!existing || entry.source === "database") {
      byProvider.set(entry.provider, entry);
    }
  }

  const balances = Array.from(byProvider.values()).map((entry) => ({
    ...entry,
    valueINR: calculateINRValue(entry.balance, entry.conversionRate),
  }));

  return {
    balances,
    programsAnalyzed: balances.map((b) => b.provider),
  };
}

function calculateTotal(
  state: typeof AggregatorState.State
): Partial<typeof AggregatorState.State> {
  const totalINR = state.balances.reduce((sum, b) => sum + b.valueINR, 0);
  return { totalINR };
}

function buildAggregatorGraph() {
  return new StateGraph(AggregatorState)
    .addNode("gather_all", gatherAll)
    .addNode("calculate_total", calculateTotal)
    .addEdge(START, "gather_all")
    .addEdge("gather_all", "calculate_total")
    .addEdge("calculate_total", END)
    .compile();
}

export async function runAggregator(userId: string): Promise<AggregatorResult> {
  const graph = buildAggregatorGraph();
  const result = await graph.invoke({
    userId,
    balances: [],
    totalINR: 0,
    programsAnalyzed: [],
  });

  return {
    balances: result.balances,
    totalINR: result.totalINR,
    programsAnalyzed: result.programsAnalyzed,
  };
}
