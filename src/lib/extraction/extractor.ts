import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  CardDetailsSchema,
  BenefitsSchema,
  RewardStructureSchema,
  RedemptionOptionsSchema,
  TransferPartnersSchema,
  OffersSchema,
  type CardDetails,
  type Benefits,
  type RewardStructure,
  type RedemptionOptions,
  type TransferPartners,
  type Offers,
} from "./schemas.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = "gpt-4o-mini";

interface ExtractionMeta {
  promptTokens: number;
  completionTokens: number;
  model: string;
}

async function extract<T>(
  systemPrompt: string,
  userContent: string,
  schema: Parameters<typeof zodResponseFormat>[0],
  schemaName: string,
): Promise<{ data: T; meta: ExtractionMeta }> {
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent.slice(0, 15000) },
    ],
    response_format: zodResponseFormat(schema, schemaName),
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No content in OpenAI response");

  return {
    data: JSON.parse(content) as T,
    meta: {
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      model: MODEL,
    },
  };
}

export async function extractCardDetails(rawContent: string) {
  return extract<CardDetails>(
    "Extract credit card details from the provided page content. Return structured data about the card name, issuing bank, network, type, tier, and fees. If information is not found, use reasonable defaults.",
    rawContent,
    CardDetailsSchema,
    "card_details",
  );
}

export async function extractBenefits(rawContent: string, cardName: string) {
  return extract<Benefits>(
    `Extract all benefits for the credit card "${cardName}" from the page content. Categorize each benefit (lounge, travel, fuel, dining, movie, golf, forex, insurance, rewards, milestone, welcome, other). Estimate annual value in INR where possible.`,
    rawContent,
    BenefitsSchema,
    "benefits",
  );
}

export async function extractRewardStructure(rawContent: string, cardName: string) {
  return extract<RewardStructure>(
    `Extract the reward/points earning structure for "${cardName}". Include the reward currency name, base earn rate, and category-wise rates with any caps.`,
    rawContent,
    RewardStructureSchema,
    "reward_structure",
  );
}

export async function extractRedemptionOptions(rawContent: string, cardName: string) {
  return extract<RedemptionOptions>(
    `Extract all reward redemption options for "${cardName}". For each option, include the name, type (cashback/miles/voucher/product), conversion rate (value per point in INR), minimum points required, and description.`,
    rawContent,
    RedemptionOptionsSchema,
    "redemption_options",
  );
}

export async function extractTransferPartners(rawContent: string, cardName: string) {
  return extract<TransferPartners>(
    `Extract all reward point transfer partners for "${cardName}". Include partner name, type (airline/hotel), transfer ratio (e.g. "2:1"), any transfer fee, and processing time.`,
    rawContent,
    TransferPartnersSchema,
    "transfer_partners",
  );
}

export async function extractOffers(rawContent: string) {
  return extract<Offers>(
    "Extract all credit card offers from the page content. Include title, merchant, discount type, discount value, expiry date, and terms for each offer.",
    rawContent,
    OffersSchema,
    "offers",
  );
}
