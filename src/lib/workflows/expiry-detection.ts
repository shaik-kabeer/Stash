import { runMonitoring, MonitoringAccount } from "@/lib/agents/monitoring";

export interface ExpiringReward {
  provider: string;
  balance: number;
  valueINR: number;
  expiryDate: string;
  daysRemaining: number;
  urgency: "critical" | "warning" | "notice";
}

export interface ExpiryDetectionResult {
  expiringRewards: ExpiringReward[];
  totalAtRisk: number;
  urgencyLevel: "critical" | "warning" | "notice" | "none";
}

export async function runExpiryDetection(
  accounts: MonitoringAccount[]
): Promise<ExpiryDetectionResult> {
  const monitoring = await runMonitoring(accounts);

  const expiringRewards: ExpiringReward[] = monitoring.alerts.map((a) => ({
    provider: a.provider,
    balance: a.balance,
    valueINR: a.valueINR,
    expiryDate: a.expiryDate,
    daysRemaining: a.daysRemaining,
    urgency: a.urgency,
  }));

  let urgencyLevel: ExpiryDetectionResult["urgencyLevel"] = "none";
  if (monitoring.expiringWithin30 > 0) urgencyLevel = "critical";
  else if (monitoring.expiringWithin60 > 0) urgencyLevel = "warning";
  else if (monitoring.expiringWithin90 > 0) urgencyLevel = "notice";

  return {
    expiringRewards,
    totalAtRisk: monitoring.totalValueAtRisk,
    urgencyLevel,
  };
}
