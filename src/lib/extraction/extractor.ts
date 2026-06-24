import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { z } from "zod";
import {
  CardDetailsSchema,
  BenefitsSchema,
  RewardStructureSchema,
  RedemptionOptionsSchema,
  TransferPartnersSchema,
  CardListingSchema,
  OffersSchema,
  type CardDetails,
  type Benefits,
  type RewardStructure,
  type RedemptionOptions,
  type TransferPartners,
  type Offers,
  type CardListing,
} from "./schemas";
import { parseModelJson } from "./parse-response";

export type ExtractionProvider = "openai" | "groq";

const MODELS: Record<ExtractionProvider, string> = {
  openai: "gpt-4o-mini",
  groq: "llama-3.3-70b-versatile",
};

const JSON_SHAPE_HINTS: Record<string, string> = {
  card_details: `{"name":"HDFC Regalia Gold Credit Card","bank":"HDFC Bank","network":"Visa","cardType":"credit","tier":"gold","annualFee":2500,"joiningFee":2500}`,
  benefits: `{"cardName":"Card Name","benefits":[{"category":"lounge","title":"Airport lounge","description":"...","terms":null,"valueEstimate":0}]}`,
  reward_structure: `{"pointName":"Reward Points","earnRate":"4 points per Rs 150","earnDescription":null,"categories":[{"category":"dining","rate":"5x","cap":null}]}`,
  redemption_options: `{"options":[{"name":"Cashback","type":"cashback","conversionRate":0.25,"minPoints":0,"description":null}]}`,
  transfer_partners: `{"partners":[{"partnerName":"Air India","partnerType":"airline","transferRatio":"2:1","transferFee":0,"transferTime":"instant"}]}`,
  offers: `{"offers":[{"title":"10% off","merchant":"Amazon","discountType":"percentage","discountValue":"10","validTo":null,"terms":null}]}`,
  card_listing: `{"bank":"HDFC Bank","cards":[{"name":"HDFC Regalia Gold Credit Card","bank":"HDFC Bank","network":"Visa","cardType":"credit","tier":"gold","annualFee":2500,"joiningFee":2500,"summary":"Premium travel card","detailUrl":null}]}`,
};

const CONTENT_LIMITS: Record<ExtractionProvider, number> = {
  openai: 28_000,
  groq: 24_000,
};

interface ExtractionMeta {
  promptTokens: number;
  completionTokens: number;
  model: string;
  provider: ExtractionProvider;
}

export type { ExtractionMeta };

export function resolveExtractionProvider(): ExtractionProvider {
  const pref = process.env.EXTRACTION_PROVIDER?.trim().toLowerCase();
  if (pref === "openai") return "openai";
  if (pref === "groq") return "groq";
  if (process.env.GROQ_API_KEY?.trim()) return "groq";
  return "openai";
}

function getClient(provider: ExtractionProvider): OpenAI {
  if (provider === "groq") {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
    return new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey });
}

function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { status?: number; message?: string };
  return e.status === 429 || (e.message?.includes("quota") ?? false);
}

function formatExtractionError(error: unknown): Error {
  if (isQuotaError(error)) {
    const hasGroq = !!process.env.GROQ_API_KEY?.trim();
    if (hasGroq) {
      return new Error(
        "OpenAI quota exceeded. Set EXTRACTION_PROVIDER=groq in .env (or remove OPENAI_API_KEY) and retry.",
      );
    }
    return new Error(
      "OpenAI quota exceeded. Add billing at platform.openai.com, or set GROQ_API_KEY for free-tier extraction.",
    );
  }

  if (error instanceof Error) return error;
  return new Error(String(error));
}

async function extractWithOpenAI<T>(
  client: OpenAI,
  model: string,
  systemPrompt: string,
  userContent: string,
  schema: z.ZodType,
  schemaName: string,
): Promise<{ data: T; meta: ExtractionMeta }> {
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent.slice(0, CONTENT_LIMITS.openai) },
    ],
    response_format: zodResponseFormat(schema, schemaName),
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No content in OpenAI response");

  return {
    data: parseModelJson(schema, content, schemaName) as T,
    meta: {
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      model,
      provider: "openai",
    },
  };
}

async function extractWithGroq<T>(
  client: OpenAI,
  model: string,
  systemPrompt: string,
  userContent: string,
  schema: z.ZodType,
  schemaName: string,
): Promise<{ data: T; meta: ExtractionMeta }> {
  const shapeHint = JSON_SHAPE_HINTS[schemaName] ?? "{}";
  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `${systemPrompt}

Return a single JSON object with EXACTLY this structure (fill in real values from the page):
${shapeHint}

Rules: use 0 for unknown fees; tier can be null; network must be Visa, Mastercard, Amex, RuPay, Diners Club, or Other.`,
      },
      { role: "user", content: `Page content to extract from:\n\n${userContent.slice(0, CONTENT_LIMITS.groq)}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No content in Groq response");

  return {
    data: parseModelJson(schema, content, schemaName) as T,
    meta: {
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      model,
      provider: "groq",
    },
  };
}

async function extract<T>(
  systemPrompt: string,
  userContent: string,
  schema: z.ZodType,
  schemaName: string,
): Promise<{ data: T; meta: ExtractionMeta }> {
  let provider = resolveExtractionProvider();

  const run = (p: ExtractionProvider) => {
    const client = getClient(p);
    const model = MODELS[p];
    if (p === "openai") {
      return extractWithOpenAI<T>(client, model, systemPrompt, userContent, schema, schemaName);
    }
    return extractWithGroq<T>(client, model, systemPrompt, userContent, schema, schemaName);
  };

  try {
    return await run(provider);
  } catch (error) {
    if (isQuotaError(error) && provider === "openai" && process.env.GROQ_API_KEY?.trim()) {
      return await run("groq");
    }
    throw formatExtractionError(error);
  }
}

export async function extractCardDetails(rawContent: string) {
  return extract<CardDetails>(
    "Extract credit card details from the provided page content. Return structured JSON about the card name, issuing bank, network, type, tier, and fees. If information is not found, use reasonable defaults.",
    rawContent,
    CardDetailsSchema,
    "card_details",
  );
}

export async function extractBenefits(rawContent: string, cardName: string) {
  return extract<Benefits>(
    `Extract all benefits for the credit card "${cardName}" from the page content as JSON. Categorize each benefit (lounge, travel, fuel, dining, movie, golf, forex, insurance, rewards, milestone, welcome, other). Estimate annual value in INR where possible.`,
    rawContent,
    BenefitsSchema,
    "benefits",
  );
}

export async function extractRewardStructure(rawContent: string, cardName: string) {
  return extract<RewardStructure>(
    `Extract the reward/points earning structure for "${cardName}" as JSON. Include the reward currency name, base earn rate, and category-wise rates with any caps.`,
    rawContent,
    RewardStructureSchema,
    "reward_structure",
  );
}

export async function extractRedemptionOptions(rawContent: string, cardName: string) {
  return extract<RedemptionOptions>(
    `Extract all reward redemption options for "${cardName}" as JSON. For each option, include the name, type (cashback/miles/voucher/product), conversion rate (value per point in INR), minimum points required, and description.`,
    rawContent,
    RedemptionOptionsSchema,
    "redemption_options",
  );
}

export async function extractTransferPartners(rawContent: string, cardName: string) {
  return extract<TransferPartners>(
    `Extract all reward point transfer partners for "${cardName}" as JSON. Include partner name, type (airline/hotel), transfer ratio (e.g. "2:1"), any transfer fee, and processing time.`,
    rawContent,
    TransferPartnersSchema,
    "transfer_partners",
  );
}

export async function extractOffers(rawContent: string) {
  return extract<Offers>(
    "Extract all credit card offers from the page content as JSON. Include title, merchant, discount type, discount value, expiry date, and terms for each offer.",
    rawContent,
    OffersSchema,
    "offers",
  );
}

export async function extractCardListing(rawContent: string) {
  return extract<CardListing>(
    "Extract ALL credit cards listed on this page as JSON. Include every distinct card with name, bank, network, fees, and a short summary. Use detailUrl if a dedicated card page link is visible.",
    rawContent,
    CardListingSchema,
    "card_listing",
  );
}
