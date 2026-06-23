import { runAggregator } from "@/lib/agents/aggregator";
import { runValuation } from "@/lib/agents/valuation";
import { runMonitoring } from "@/lib/agents/monitoring";
import { DEMO_USER_ID } from "@/lib/agents/config";
import { prisma } from "@/lib/prisma";

export interface PortfolioRecommendation {
  type: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface PortfolioAnalysisResult {
  portfolioScore: number;
  totalValueINR: number;
  recommendations: PortfolioRecommendation[];
  programsAnalyzed: number;
  valuationSummary: string;
}

export async function runPortfolioAnalysis(
  userId: string = DEMO_USER_ID
): Promise<PortfolioAnalysisResult> {
  const aggregated = await runAggregator(userId);

  const valuationAccounts = aggregated.balances.map((b) => ({
    provider: b.provider,
    balance: b.balance,
    conversionRate: b.conversionRate,
  }));

  const valuation = await runValuation(valuationAccounts);

  const monitoringAccounts = aggregated.balances.map((b) => ({
    provider: b.provider,
    balance: b.balance,
    conversionRate: b.conversionRate,
    valueINR: b.valueINR,
    expiryDate: b.expiryDate,
  }));

  const monitoring = await runMonitoring(monitoringAccounts);

  const portfolioScore = Math.round(
    monitoring.portfolioHealthScore * 0.4 +
      Math.min(valuation.averageEfficiency, 100) * 0.35 +
      Math.min(aggregated.programsAnalyzed.length * 10, 25)
  );

  const recommendations: PortfolioRecommendation[] = [];

  for (const alert of monitoring.alerts.slice(0, 2)) {
    recommendations.push({
      type: "expiry_warning",
      title: `${alert.provider} expiring in ${alert.daysRemaining} days`,
      description: alert.message,
      priority: alert.urgency === "critical" ? "high" : "medium",
    });
  }

  if (valuation.bestUse) {
    recommendations.push({
      type: "optimization",
      title: `Best redemption: ${valuation.bestUse.provider}`,
      description: valuation.comparisonSummary,
      priority: "medium",
    });
  }

  recommendations.push({
    type: "portfolio_health",
    title: `Portfolio score: ${portfolioScore}/100`,
    description: monitoring.healthSummary,
    priority: portfolioScore < 60 ? "high" : "low",
  });

  const dbRecs = await prisma.recommendation.findMany({
    where: { userId },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  for (const rec of dbRecs) {
    recommendations.push({
      type: rec.type,
      title: rec.title,
      description: rec.description,
      priority: rec.priority as "high" | "medium" | "low",
    });
  }

  return {
    portfolioScore,
    totalValueINR: aggregated.totalINR,
    recommendations,
    programsAnalyzed: aggregated.programsAnalyzed.length,
    valuationSummary: valuation.comparisonSummary,
  };
}
