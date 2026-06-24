import { z } from "zod";

const CARD_NETWORKS = ["Visa", "Mastercard", "Amex", "RuPay", "Diners Club", "Other"] as const;

function coerceNetwork(value: unknown): (typeof CARD_NETWORKS)[number] {
  if (typeof value !== "string") return "Other";
  const normalized = value.trim();
  const match = CARD_NETWORKS.find((n) => n.toLowerCase() === normalized.toLowerCase());
  return match ?? "Other";
}

function coerceNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^\d.]/g, ""));
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

export const CardDetailsSchema = z.object({
  name: z.string().default("Unknown Card"),
  bank: z.string().default("Unknown Bank"),
  network: z.preprocess(coerceNetwork, z.enum(CARD_NETWORKS)),
  cardType: z.enum(["credit", "debit", "prepaid"]).default("credit"),
  tier: z.string().nullable().default(null),
  annualFee: z.preprocess((v) => coerceNumber(v), z.number()),
  joiningFee: z.preprocess((v) => coerceNumber(v), z.number()),
});

export const BenefitItemSchema = z.object({
  category: z.enum([
    "lounge", "travel", "fuel", "dining", "movie", "golf",
    "forex", "insurance", "rewards", "milestone", "welcome", "other",
  ]),
  title: z.string().describe("Short benefit title"),
  description: z.string().describe("Detailed benefit description"),
  terms: z.string().nullable().describe("Terms and conditions if mentioned"),
  valueEstimate: z.preprocess((v) => coerceNumber(v), z.number()).default(0),
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
  type: z.preprocess(
    (v) => {
      if (typeof v !== "string") return "cashback";
      const s = v.toLowerCase().replace(/\s+/g, "_");
      const allowed = ["cashback", "miles", "voucher", "product", "statement_credit"] as const;
      return allowed.find((a) => s.includes(a.replace("_", ""))) ?? "cashback";
    },
    z.enum(["cashback", "miles", "voucher", "product", "statement_credit"]),
  ),
  conversionRate: z.preprocess((v) => coerceNumber(v), z.number()),
  minPoints: z.preprocess((v) => coerceNumber(v), z.number()).default(0),
  description: z.string().nullable().default(null),
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

export const CardListingItemSchema = CardDetailsSchema.extend({
  summary: z.string().nullable().optional(),
  detailUrl: z.string().nullable().optional(),
});

export const CardListingSchema = z.object({
  bank: z.string().nullable().optional(),
  cards: z.array(CardListingItemSchema),
});

export type CardDetails = z.infer<typeof CardDetailsSchema>;
export type BenefitItem = z.infer<typeof BenefitItemSchema>;
export type Benefits = z.infer<typeof BenefitsSchema>;
export type RewardStructure = z.infer<typeof RewardStructureSchema>;
export type RedemptionOptions = z.infer<typeof RedemptionOptionsSchema>;
export type TransferPartners = z.infer<typeof TransferPartnersSchema>;
export type Offers = z.infer<typeof OffersSchema>;
export type CardListing = z.infer<typeof CardListingSchema>;
export type CardListingItem = z.infer<typeof CardListingItemSchema>;
