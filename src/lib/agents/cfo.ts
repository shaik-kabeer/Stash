import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { isMockMode, DEMO_USER_ID } from "@/lib/agents/config";
import { runAggregator } from "@/lib/agents/aggregator";
import { runValuation } from "@/lib/agents/valuation";
import { runOptimization } from "@/lib/agents/optimization";
import { runMonitoring } from "@/lib/agents/monitoring";
import { prisma } from "@/lib/prisma";

export interface CFOContext {
  userId?: string;
  history?: { role: string; content: string }[];
}

async function getUserAccounts(userId: string) {
  return prisma.rewardAccount.findMany({
    where: { userId },
    include: { program: true },
    orderBy: { estimatedValueINR: "desc" },
  });
}

function toAccountShape(
  accounts: Awaited<ReturnType<typeof getUserAccounts>>
) {
  return accounts.map((a) => ({
    provider: a.program.provider,
    balance: a.balance,
    conversionRate: a.program.conversionRate,
    valueINR: a.estimatedValueINR,
    expiryDate: a.expiryDate?.toISOString() ?? null,
    transferPartners: a.program.transferPartners,
  }));
}

const aggregationTool = tool(
  async ({ userId }) => {
    const result = await runAggregator(userId);
    return JSON.stringify(result);
  },
  {
    name: "aggregate_rewards",
    description: "Gather and aggregate all reward balances for a user",
    schema: z.object({ userId: z.string() }),
  }
);

const valuationTool = tool(
  async ({ accountsJson }) => {
    const accounts = JSON.parse(accountsJson);
    const result = await runValuation(accounts);
    return JSON.stringify(result);
  },
  {
    name: "value_rewards",
    description: "Calculate redemption value and efficiency across programs",
    schema: z.object({ accountsJson: z.string() }),
  }
);

const optimizationTool = tool(
  async ({ accountsJson, recommendationsJson }) => {
    const accounts = JSON.parse(accountsJson);
    const recommendations = recommendationsJson
      ? JSON.parse(recommendationsJson)
      : [];
    const result = await runOptimization(accounts, recommendations);
    return JSON.stringify(result);
  },
  {
    name: "optimize_rewards",
    description: "Find transfer opportunities and best redemption paths",
    schema: z.object({
      accountsJson: z.string(),
      recommendationsJson: z.string().optional(),
    }),
  }
);

const monitoringTool = tool(
  async ({ accountsJson }) => {
    const accounts = JSON.parse(accountsJson);
    const result = await runMonitoring(accounts);
    return JSON.stringify(result);
  },
  {
    name: "monitor_portfolio",
    description: "Detect expiring rewards and compute portfolio health score",
    schema: z.object({ accountsJson: z.string() }),
  }
);

function classifyIntent(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("redeem") ||
    lower.includes("what should i") ||
    lower.includes("best use")
  ) {
    return "redeem";
  }
  if (
    lower.includes("expir") ||
    lower.includes("about to expire") ||
    lower.includes("urgent")
  ) {
    return "expiry";
  }
  if (
    lower.includes("maximize") ||
    lower.includes("transfer") ||
    lower.includes("optim")
  ) {
    return "optimize";
  }
  if (
    lower.includes("card") ||
    lower.includes("travel") ||
    lower.includes("dining") ||
    lower.includes("shopping") ||
    lower.includes("fuel")
  ) {
    return "card";
  }
  if (lower.includes("portfolio") || lower.includes("total") || lower.includes("worth")) {
    return "portfolio";
  }
  return "general";
}

async function generateMockResponse(
  message: string,
  userId: string
): Promise<string> {
  const accounts = await getUserAccounts(userId);
  const shaped = toAccountShape(accounts);
  const intent = classifyIntent(message);
  const totalINR = accounts.reduce((s, a) => s + a.estimatedValueINR, 0);

  switch (intent) {
    case "redeem": {
      const valuation = await runValuation(
        shaped.map(({ provider, balance, conversionRate }) => ({
          provider,
          balance,
          conversionRate,
        }))
      );
      const top = valuation.valuations.slice(0, 3);
      return [
        "## Redemption Recommendations",
        "",
        `Your portfolio is worth **₹${totalINR.toLocaleString("en-IN")}** across ${accounts.length} programs.`,
        "",
        "**Highest-value redemptions:**",
        ...top.map(
          (v, i) =>
            `${i + 1}. **${v.provider}** — ${v.balance.toLocaleString()} points → ₹${v.effectiveValueINR.toFixed(0)} (${v.redemptionEfficiency.toFixed(0)}% efficiency)`
        ),
        "",
        "**Action:** Transfer HDFC points to Air India miles for 3.75x value uplift, or redeem Axis EDGE via Flipkart vouchers for maximum cashback.",
      ].join("\n");
    }

    case "expiry": {
      const monitoring = await runMonitoring(shaped);
      if (monitoring.alerts.length === 0) {
        return "No rewards expiring within the next 90 days. Your portfolio is in good shape!";
      }
      return [
        "## Expiring Rewards Alert",
        "",
        `**Portfolio health score:** ${monitoring.portfolioHealthScore}/100`,
        `**Total value at risk:** ₹${monitoring.totalValueAtRisk.toFixed(0)}`,
        "",
        ...monitoring.alerts.map((a) => {
          const icon =
            a.urgency === "critical"
              ? "🔴"
              : a.urgency === "warning"
                ? "🟡"
                : "🟢";
          return `${icon} **${a.provider}** — ${a.balance.toLocaleString()} points (₹${a.valueINR.toFixed(0)}) expiring in **${a.daysRemaining} days**`;
        }),
        "",
        "**Urgent:** ICICI points expire soonest. Redeem for Amazon vouchers or transfer to InterMiles before they lapse.",
      ].join("\n");
    }

    case "optimize": {
      const optimization = await runOptimization(shaped);
      return [
        "## Value Maximization Strategy",
        "",
        optimization.summary,
        "",
        "**Transfer opportunities:**",
        ...optimization.transferOpportunities
          .slice(0, 3)
          .map(
            (t) =>
              `- ${t.fromProvider} → ${t.toProvider}: +₹${t.gainINR.toFixed(0)} (${t.ratio})`
          ),
        "",
        "**Recommended paths:**",
        ...optimization.redemptionPaths
          .slice(0, 4)
          .map((p) => `- [${p.priority.toUpperCase()}] ${p.action}`),
      ].join("\n");
    }

    case "card": {
      const lower = message.toLowerCase();
      const category = lower.includes("dining")
        ? "dining"
        : lower.includes("shopping")
          ? "shopping"
          : lower.includes("fuel")
            ? "fuel"
            : "travel";

      const cards: Record<string, { card: string; rate: string; tip: string }> =
        {
          travel: {
            card: "HDFC Infinia via SmartBuy",
            rate: "10x points on flights & hotels",
            tip: "Always book through HDFC SmartBuy portal for maximum earning.",
          },
          dining: {
            card: "HDFC Diners Club Black",
            rate: "5x points on dining",
            tip: "Use for restaurant spends; pair with Swiggy Dineout offers.",
          },
          shopping: {
            card: "Axis Magnus",
            rate: "5x EDGE Rewards on online shopping",
            tip: "Redeem EDGE points via Flipkart for best value.",
          },
          fuel: {
            card: "SBI Cashback Card",
            rate: "5% cashback on fuel",
            tip: "Use SBI for fuel; Axis for everything else online.",
          },
        };

      const rec = cards[category];
      return [
        `## Best Card for ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        "",
        `**Recommended:** ${rec.card}`,
        `**Earning rate:** ${rec.rate}`,
        "",
        `💡 ${rec.tip}`,
        "",
        category === "travel"
          ? "For your upcoming trips, your 45,000 Air India miles could cover a DEL-BOM business class upgrade."
          : `Your total portfolio value is ₹${totalINR.toLocaleString("en-IN")}.`,
      ].join("\n");
    }

    case "portfolio": {
      const aggregated = await runAggregator(userId);
      return [
        "## Portfolio Overview",
        "",
        `**Total value:** ₹${aggregated.totalINR.toLocaleString("en-IN")}`,
        `**Programs analyzed:** ${aggregated.programsAnalyzed.length}`,
        "",
        "**Breakdown:**",
        ...aggregated.balances
          .sort((a, b) => b.valueINR - a.valueINR)
          .map(
            (b) =>
              `- ${b.provider}: ${b.balance.toLocaleString()} pts → ₹${b.valueINR.toFixed(0)}`
          ),
      ].join("\n");
    }

    default:
      return [
        "## RewardOS Personal CFO",
        "",
        `I manage your rewards portfolio worth **₹${totalINR.toLocaleString("en-IN")}** across ${accounts.length} programs.`,
        "",
        "Ask me about:",
        "- **Redemptions** — \"What should I redeem?\"",
        "- **Expiry alerts** — \"Which reward is about to expire?\"",
        "- **Optimization** — \"How do I maximize value?\"",
        "- **Card advice** — \"Which card for travel?\"",
      ].join("\n");
  }
}

async function* streamText(text: string): AsyncGenerator<string> {
  const words = text.split(/(\s+)/);
  for (const word of words) {
    yield word;
    await new Promise((r) => setTimeout(r, 15));
  }
}

async function* streamOpenAIResponse(
  message: string,
  context: CFOContext
): AsyncGenerator<string> {
  const userId = context.userId ?? DEMO_USER_ID;
  const accounts = await getUserAccounts(userId);
  const shaped = toAccountShape(accounts);

  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0.4,
    streaming: true,
  }).bindTools([aggregationTool, valuationTool, optimizationTool, monitoringTool]);

  const systemPrompt = `You are RewardOS Personal CFO, an expert Indian rewards and credit card advisor.
User portfolio context: ${JSON.stringify(shaped)}
Use the available tools to analyze before answering. Be concise, actionable, and use INR values.`;

  const stream = await model.stream([
    { role: "system", content: systemPrompt },
    ...(context.history ?? []).map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: message },
  ]);

  for await (const chunk of stream) {
    const content = chunk.content;
    if (typeof content === "string" && content) {
      yield content;
    }
  }
}

export async function* streamCFOResponse(
  message: string,
  context: CFOContext = {}
): AsyncGenerator<string> {
  const userId = context.userId ?? DEMO_USER_ID;

  if (isMockMode()) {
    const response = await generateMockResponse(message, userId);
    yield* streamText(response);
    return;
  }

  yield* streamOpenAIResponse(message, { ...context, userId });
}

export { aggregationTool, valuationTool, optimizationTool, monitoringTool };
