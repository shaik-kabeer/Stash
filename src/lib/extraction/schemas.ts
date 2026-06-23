import { z } from "zod";

export const CardDetailsSchema = z.object({
  name: z.string().describe("Full card name (e.g. 'HDFC Regalia Gold Credit Card')"),
  bank: z.string().describe("Issuing bank name"),
  network: z.enum(["Visa", "Mastercard", "Amex", "RuPay", "Diners Club", "Other"]),
  cardType: z.enum(["credit", "debit", "prepaid"]).default("credit"),
  tier: z.string().nullable().describe("Card tier: classic, gold, platinum, signature, etc."),
  annualFee: z.number().describe("Annual fee in INR"),
  joiningFee: z.number().describe("Joining/first year fee in INR"),
});

export const BenefitItemSchema = z.object({
  category: z.enum([
    "lounge", "travel", "fuel", "dining", "movie", "golf",
    "forex", "insurance", "rewards", "milestone", "welcome", "other",
  ]),
  title: z.string().describe("Short benefit title"),
  description: z.string().describe("Detailed benefit description"),
  terms: z.string().nullable().describe("Terms and conditions if mentioned"),
  valueEstimate: z.number().default(0).describe("Estimated annual value in INR, 0 if unknown"),
});

export const BenefitsSchema = z.object({
  cardName: z.string(),
  benefits: z.array(BenefitItemSchema),
});

export const RewardStructureSchema = z.object({
  pointName: z.string().describe("Name of the reward currency (e.g. 'Reward Points', 'EDGE Miles', 'CashPoints')"),
  earnRate: z.string().describe("Base earn rate (e.g. '4 RP per ₹150')"),
  earnDescription: z.string().nullable().describe("Detailed earn rate breakdown by category"),
  categories: z.array(z.object({
    category: z.string(),
    rate: z.string(),
    cap: z.string().nullable(),
  })).describe("Earn rates by spending category"),
});

export const RedemptionOptionSchema = z.object({
  name: z.string(),
  type: z.enum(["cashback", "miles", "voucher", "product", "statement_credit"]),
  conversionRate: z.number().describe("Value per point in INR"),
  minPoints: z.number().default(0),
  description: z.string().nullable(),
});

export const RedemptionOptionsSchema = z.object({
  options: z.array(RedemptionOptionSchema),
});

export const TransferPartnerSchema = z.object({
  partnerName: z.string(),
  partnerType: z.enum(["airline", "hotel", "other"]),
  transferRatio: z.string().describe("Ratio like '2:1' meaning 2 points = 1 partner unit"),
  transferFee: z.number().default(0),
  transferTime: z.string().nullable(),
});

export const TransferPartnersSchema = z.object({
  partners: z.array(TransferPartnerSchema),
});

export const OfferItemSchema = z.object({
  title: z.string(),
  merchant: z.string().nullable(),
  discountType: z.string().nullable().describe("percentage, flat_discount, cashback, points_multiplier, bogo, emi"),
  discountValue: z.string().nullable(),
  validTo: z.string().nullable().describe("Expiry date as string if mentioned"),
  terms: z.string().nullable(),
});

export const OffersSchema = z.object({
  offers: z.array(OfferItemSchema),
});

export type CardDetails = z.infer<typeof CardDetailsSchema>;
export type BenefitItem = z.infer<typeof BenefitItemSchema>;
export type Benefits = z.infer<typeof BenefitsSchema>;
export type RewardStructure = z.infer<typeof RewardStructureSchema>;
export type RedemptionOptions = z.infer<typeof RedemptionOptionsSchema>;
export type TransferPartners = z.infer<typeof TransferPartnersSchema>;
export type Offers = z.infer<typeof OffersSchema>;
