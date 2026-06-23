import type { CardDetails, Benefits, RedemptionOptions, TransferPartners, Offers } from "./schemas.js";

export interface ValidationResult<T> {
  valid: boolean;
  data: T;
  warnings: string[];
  errors: string[];
}

const KNOWN_BANKS = [
  "HDFC Bank", "Axis Bank", "SBI Card", "ICICI Bank", "IDFC FIRST Bank",
  "AU Small Finance Bank", "Kotak Mahindra Bank", "IndusInd Bank",
  "YES Bank", "RBL Bank", "Standard Chartered", "HSBC", "Citibank",
  "American Express", "Federal Bank", "Bank of Baroda", "Canara Bank",
];

export function validateCardDetails(data: CardDetails): ValidationResult<CardDetails> {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!KNOWN_BANKS.some((b) => data.bank.toLowerCase().includes(b.toLowerCase().split(" ")[0]))) {
    warnings.push(`Unknown bank: "${data.bank}". Not in known Indian banks list.`);
  }

  if (data.annualFee < 0) errors.push(`Negative annual fee: ₹${data.annualFee}`);
  if (data.joiningFee < 0) errors.push(`Negative joining fee: ₹${data.joiningFee}`);
  if (data.annualFee > 100000) warnings.push(`Unusually high annual fee: ₹${data.annualFee}`);
  if (!data.name || data.name.length < 3) errors.push("Card name too short or missing");

  return { valid: errors.length === 0, data, warnings, errors };
}

export function validateBenefits(data: Benefits): ValidationResult<Benefits> {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (data.benefits.length === 0) warnings.push("No benefits extracted");

  for (const b of data.benefits) {
    if (b.valueEstimate < 0) {
      errors.push(`Negative value estimate for "${b.title}": ₹${b.valueEstimate}`);
    }
    if (b.valueEstimate > 100000) {
      warnings.push(`Unusually high value for "${b.title}": ₹${b.valueEstimate}`);
    }
  }

  return { valid: errors.length === 0, data, warnings, errors };
}

export function validateRedemptionOptions(data: RedemptionOptions): ValidationResult<RedemptionOptions> {
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const r of data.options) {
    if (r.conversionRate <= 0) errors.push(`Invalid conversion rate for "${r.name}": ${r.conversionRate}`);
    if (r.conversionRate > 10) warnings.push(`Unusually high conversion rate for "${r.name}": ${r.conversionRate}`);
    if (r.minPoints < 0) errors.push(`Negative min points for "${r.name}": ${r.minPoints}`);
  }

  return { valid: errors.length === 0, data, warnings, errors };
}

export function validateTransferPartners(data: TransferPartners): ValidationResult<TransferPartners> {
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const tp of data.partners) {
    const parts = tp.transferRatio.split(":");
    if (parts.length !== 2 || parts.some((p) => isNaN(Number(p)))) {
      errors.push(`Invalid transfer ratio for "${tp.partnerName}": ${tp.transferRatio}`);
    }
    if (tp.transferFee < 0) errors.push(`Negative transfer fee for "${tp.partnerName}": ₹${tp.transferFee}`);
  }

  return { valid: errors.length === 0, data, warnings, errors };
}

export function validateOffers(data: Offers): ValidationResult<Offers> {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (data.offers.length === 0) warnings.push("No offers extracted");

  for (const o of data.offers) {
    if (!o.title || o.title.length < 3) errors.push("Offer title too short");
  }

  return { valid: errors.length === 0, data, warnings, errors };
}
