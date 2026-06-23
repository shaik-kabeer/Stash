export const DEMO_USER_ID = "user_demo_001";

export function isMockMode(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return !key || key === "sk-your-openai-key-here";
}

export const PROVIDER_CONVERSION_RATES: Record<string, number> = {
  HDFC: 0.2,
  "HDFC Bank": 0.2,
  Axis: 0.25,
  "Axis Bank": 0.25,
  SBI: 0.25,
  "SBI Card": 0.25,
  ICICI: 0.25,
  "ICICI Bank": 0.25,
  "Air India": 0.75,
  IndiGo: 1.0,
  "IndiGo Airlines": 1.0,
  Marriott: 0.65,
  "Marriott International": 0.65,
};

export function getConversionRate(provider: string): number {
  return PROVIDER_CONVERSION_RATES[provider] ?? 0.2;
}
