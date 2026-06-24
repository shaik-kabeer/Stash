import type { z } from "zod";
import { ZodError } from "zod";

const SCHEMA_WRAPPER_KEYS: Record<string, string[]> = {
  card_details: ["card_details", "cardDetails", "card", "data", "result"],
  benefits: ["benefits", "data", "result"],
  reward_structure: ["reward_structure", "rewardStructure", "rewards", "data", "result"],
  redemption_options: ["redemption_options", "redemptionOptions", "options", "data", "result"],
  transfer_partners: ["transfer_partners", "transferPartners", "partners", "data", "result"],
  offers: ["offers", "data", "result"],
  card_listing: ["card_listing", "cardListing", "cards", "data", "result"],
};

export function unwrapJsonPayload(raw: unknown, schemaName: string): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;

  const obj = raw as Record<string, unknown>;
  const keys = SCHEMA_WRAPPER_KEYS[schemaName] ?? [schemaName, "data", "result"];

  for (const key of keys) {
    const nested = obj[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested;
    }
  }

  return raw;
}

export function parseModelJson<T>(schema: z.ZodType<T>, raw: string, schemaName: string): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Model returned invalid JSON. First 300 chars: ${raw.slice(0, 300)}`);
  }

  parsed = unwrapJsonPayload(parsed, schemaName);
  const result = schema.safeParse(parsed);

  if (result.success) return result.data;

  throw new ZodError(result.error.issues);
}

export function formatZodError(error: unknown): string {
  if (error instanceof ZodError) {
    const summary = error.issues
      .slice(0, 6)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    return `AI response did not match expected shape (${summary}). The crawled page may have too little card content — check Crawl output and try a valid card page URL.`;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
