export interface MonitoringAccount {
  provider: string;
  balance: number;
  conversionRate: number;
  valueINR?: number;
  expiryDate?: string | null;
  status?: string;
}

export interface ExpiryAlert {
  provider: string;
  balance: number;
  valueINR: number;
  expiryDate: string;
  daysRemaining: number;
  urgency: "critical" | "warning" | "notice";
  message: string;
}

export interface MonitoringResult {
  alerts: ExpiryAlert[];
  portfolioHealthScore: number;
  expiringWithin30: number;
  expiringWithin60: number;
  expiringWithin90: number;
  totalValueAtRisk: number;
  healthSummary: string;
}

function daysUntil(dateStr: string | null | undefined): number {
  if (!dateStr) return Infinity;
  return Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

function getUrgency(
  days: number
): "critical" | "warning" | "notice" | null {
  if (days <= 30) return "critical";
  if (days <= 60) return "warning";
  if (days <= 90) return "notice";
  return null;
}

function computeHealthScore(
  accounts: MonitoringAccount[],
  alerts: ExpiryAlert[]
): number {
  if (accounts.length === 0) return 0;

  let score = 100;
  const totalValue = accounts.reduce(
    (sum, a) => sum + (a.valueINR ?? a.balance * a.conversionRate),
    0
  );

  for (const alert of alerts) {
    const weight = alert.valueINR / (totalValue || 1);
    if (alert.urgency === "critical") score -= 15 * weight * 10;
    else if (alert.urgency === "warning") score -= 8 * weight * 10;
    else score -= 3 * weight * 10;
  }

  const inactive = accounts.filter((a) => a.status === "inactive").length;
  score -= inactive * 5;

  const providerCount = new Set(accounts.map((a) => a.provider)).size;
  if (providerCount >= 4) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function runMonitoring(
  accounts: MonitoringAccount[]
): Promise<MonitoringResult> {
  const alerts: ExpiryAlert[] = [];

  for (const account of accounts) {
    const days = daysUntil(account.expiryDate);
    const urgency = getUrgency(days);
    if (!urgency || !account.expiryDate) continue;

    const valueINR =
      account.valueINR ?? account.balance * account.conversionRate;

    alerts.push({
      provider: account.provider,
      balance: account.balance,
      valueINR,
      expiryDate: account.expiryDate,
      daysRemaining: days,
      urgency,
      message: `${account.provider}: ${account.balance.toLocaleString()} points (₹${valueINR.toFixed(0)}) expiring in ${days} days`,
    });
  }

  alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);

  const expiringWithin30 = alerts.filter((a) => a.daysRemaining <= 30).length;
  const expiringWithin60 = alerts.filter((a) => a.daysRemaining <= 60).length;
  const expiringWithin90 = alerts.length;
  const totalValueAtRisk = alerts.reduce((sum, a) => sum + a.valueINR, 0);
  const portfolioHealthScore = computeHealthScore(accounts, alerts);

  let healthSummary: string;
  if (portfolioHealthScore >= 80) {
    healthSummary = "Portfolio health is strong. Minor expiry actions recommended.";
  } else if (portfolioHealthScore >= 60) {
    healthSummary =
      "Portfolio health is moderate. Address expiring rewards within 60 days.";
  } else {
    healthSummary =
      "Portfolio health needs attention. Urgent redemptions required to prevent value loss.";
  }

  return {
    alerts,
    portfolioHealthScore,
    expiringWithin30,
    expiringWithin60,
    expiringWithin90,
    totalValueAtRisk,
    healthSummary,
  };
}
