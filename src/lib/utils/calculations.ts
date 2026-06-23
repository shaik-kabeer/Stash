export function calculateINRValue(
  points: number,
  conversionRate: number
): number {
  return points * conversionRate;
}

export function calculatePortfolioTotal(
  accounts: { balance: number; conversionRate: number }[]
): number {
  return accounts.reduce(
    (sum, acc) => sum + calculateINRValue(acc.balance, acc.conversionRate),
    0
  );
}

export function calculateGrowthPercent(
  current: number,
  previous: number
): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function calculateRedemptionEfficiency(
  redeemValueINR: number,
  pointsUsed: number,
  conversionRate: number
): number {
  const baseValue = pointsUsed * conversionRate;
  if (baseValue === 0) return 0;
  return (redeemValueINR / baseValue) * 100;
}

export function calculateAssetAllocation(
  accounts: { provider: string; valueINR: number }[]
): { provider: string; value: number; percent: number }[] {
  const total = accounts.reduce((sum, a) => sum + a.valueINR, 0);
  return accounts
    .map((a) => ({
      provider: a.provider,
      value: a.valueINR,
      percent: total > 0 ? (a.valueINR / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}
