import { ChatOpenAI } from "@langchain/openai";
import { isMockMode } from "@/lib/agents/config";
import { calculateINRValue } from "@/lib/utils/calculations";

export interface ValuationAccount {
  provider: string;
  balance: number;
  conversionRate: number;
}

export interface ProgramValuation {
  provider: string;
  balance: number;
  conversionRate: number;
  baseValueINR: number;
  effectiveValueINR: number;
  redemptionEfficiency: number;
  rank: number;
}

export interface ValuationResult {
  valuations: ProgramValuation[];
  bestUse: ProgramValuation;
  worstUse: ProgramValuation;
  averageEfficiency: number;
  comparisonSummary: string;
  aiInsight?: string;
}

const REDEMPTION_MULTIPLIERS: Record<string, number> = {
  "HDFC Bank": 1.0,
  HDFC: 1.0,
  "Axis Bank": 1.15,
  Axis: 1.15,
  "SBI Card": 1.0,
  SBI: 1.0,
  "ICICI Bank": 0.95,
  ICICI: 0.95,
  "Air India": 1.35,
  IndiGo: 1.2,
  "IndiGo Airlines": 1.2,
  "Marriott International": 1.25,
  Marriott: 1.25,
};

function computeMockValuations(
  accounts: ValuationAccount[]
): ValuationResult {
  const valuations: ProgramValuation[] = accounts
    .map((account) => {
      const multiplier = REDEMPTION_MULTIPLIERS[account.provider] ?? 1.0;
      const baseValueINR = calculateINRValue(
        account.balance,
        account.conversionRate
      );
      const effectiveValueINR = baseValueINR * multiplier;
      const redemptionEfficiency = multiplier * 100;

      return {
        provider: account.provider,
        balance: account.balance,
        conversionRate: account.conversionRate,
        baseValueINR,
        effectiveValueINR,
        redemptionEfficiency,
        rank: 0,
      };
    })
    .sort((a, b) => b.redemptionEfficiency - a.redemptionEfficiency)
    .map((v, i) => ({ ...v, rank: i + 1 }));

  const bestUse = valuations[0];
  const worstUse = valuations[valuations.length - 1];
  const averageEfficiency =
    valuations.reduce((sum, v) => sum + v.redemptionEfficiency, 0) /
    (valuations.length || 1);

  const comparisonSummary = `Best redemption value: ${bestUse.provider} at ${bestUse.redemptionEfficiency.toFixed(0)}% efficiency (₹${bestUse.effectiveValueINR.toFixed(0)}). Worst: ${worstUse.provider} at ${worstUse.redemptionEfficiency.toFixed(0)}% (₹${worstUse.effectiveValueINR.toFixed(0)}).`;

  return {
    valuations,
    bestUse,
    worstUse,
    averageEfficiency,
    comparisonSummary,
    aiInsight:
      "Transfer HDFC points to Air India miles for 3.75x value uplift. Use Axis EDGE on Flipkart for 5x earning multiplier.",
  };
}

async function computeOpenAIValuations(
  accounts: ValuationAccount[]
): Promise<ValuationResult> {
  const mockBase = computeMockValuations(accounts);

  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0.3,
  });

  const prompt = `Analyze these reward accounts and compare redemption efficiency:
${JSON.stringify(accounts, null, 2)}

Provide a brief insight (2-3 sentences) on best vs worst redemption strategies for an Indian rewards portfolio.`;

  const response = await model.invoke(prompt);
  const aiInsight =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  return { ...mockBase, aiInsight };
}

export async function runValuation(
  accounts: ValuationAccount[]
): Promise<ValuationResult> {
  if (isMockMode()) {
    return computeMockValuations(accounts);
  }
  return computeOpenAIValuations(accounts);
}
