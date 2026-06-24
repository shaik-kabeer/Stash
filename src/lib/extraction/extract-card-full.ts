import type { ExtractionMeta } from "./extractor";
import {
  extractCardDetails,
  extractBenefits,
  extractRewardStructure,
  extractRedemptionOptions,
  extractTransferPartners,
} from "./extractor";
import { cleanCrawlContent } from "./clean-crawl-content";
import { chunkContent, filterChunksForCard } from "./chunk-content";
import {
  mergeBenefits,
  mergeRewardStructures,
  mergeRedemptionOptions,
  mergeTransferPartners,
  pickBestCardDetails,
} from "./merge-results";
import type {
  Benefits,
  CardDetails,
  RedemptionOptions,
  RewardStructure,
  TransferPartners,
} from "./schemas";
import {
  validateBenefits,
  validateCardDetails,
  validateRedemptionOptions,
  validateTransferPartners,
} from "./validator";

export interface FullCardExtraction {
  card: CardDetails;
  benefits: Benefits;
  rewardStructure: RewardStructure;
  redemptionOptions: RedemptionOptions;
  transferPartners: TransferPartners;
}

export interface FullCardExtractionResult {
  data: FullCardExtraction;
  meta: ExtractionMeta;
  warnings: string[];
  errors: string[];
  chunksProcessed: number;
  cleanedLength: number;
}

function addMeta(total: ExtractionMeta, part: ExtractionMeta): ExtractionMeta {
  return {
    promptTokens: total.promptTokens + part.promptTokens,
    completionTokens: total.completionTokens + part.completionTokens,
    model: part.model || total.model,
    provider: part.provider || total.provider,
  };
}

async function extractAcrossChunks<T>(
  chunks: string[],
  extractFn: (chunk: string) => Promise<{ data: T; meta: ExtractionMeta }>,
  mergeFn: (items: T[]) => T,
  empty: T,
): Promise<{ data: T; meta: ExtractionMeta }> {
  if (chunks.length === 0) {
    return {
      data: empty,
      meta: { promptTokens: 0, completionTokens: 0, model: "none", provider: "groq" },
    };
  }

  const results: T[] = [];
  let meta: ExtractionMeta = { promptTokens: 0, completionTokens: 0, model: "", provider: "groq" };

  for (const chunk of chunks) {
    const { data, meta: partMeta } = await extractFn(chunk);
    results.push(data);
    meta = addMeta(meta, partMeta);
  }

  return { data: mergeFn(results), meta };
}

/** Full single-card extraction with cleaning, chunking, and merge. */
export async function extractFullCard(
  rawContent: string,
  cardNameHint?: string,
): Promise<FullCardExtractionResult> {
  const cleaned = cleanCrawlContent(rawContent);
  const chunks = chunkContent(cleaned);
  const scopedChunks = cardNameHint ? filterChunksForCard(chunks, cardNameHint) : chunks;

  const warnings: string[] = [];
  const errors: string[] = [];
  let meta: ExtractionMeta = { promptTokens: 0, completionTokens: 0, model: "", provider: "groq" };

  const cardResults: CardDetails[] = [];
  for (const chunk of scopedChunks.slice(0, 3)) {
    const prefix = cardNameHint
      ? `Focus only on the credit card "${cardNameHint}". Ignore other cards on the page.\n\n`
      : "";
    const { data, meta: partMeta } = await extractCardDetails(prefix + chunk);
    cardResults.push(data);
    meta = addMeta(meta, partMeta);
  }

  const card = pickBestCardDetails(cardResults);
  if (cardNameHint && card.name === "Unknown Card") card.name = cardNameHint;
  const cardValidation = validateCardDetails(card);
  warnings.push(...cardValidation.warnings);
  errors.push(...cardValidation.errors);

  const cardName = card.name;

  const { data: benefits, meta: benefitsMeta } = await extractAcrossChunks(
    scopedChunks,
    (chunk) => extractBenefits(chunk, cardName),
    mergeBenefits,
    { cardName, benefits: [] },
  );
  meta = addMeta(meta, benefitsMeta);
  const benefitsValidation = validateBenefits(benefits);
  warnings.push(...benefitsValidation.warnings);
  errors.push(...benefitsValidation.errors);

  const { data: rewardStructure, meta: rewardMeta } = await extractAcrossChunks(
    scopedChunks,
    (chunk) => extractRewardStructure(chunk, cardName),
    mergeRewardStructures,
    { pointName: "Reward Points", earnRate: "Unknown", earnDescription: null, categories: [] },
  );
  meta = addMeta(meta, rewardMeta);

  const { data: redemptionOptions, meta: redemptionMeta } = await extractAcrossChunks(
    scopedChunks,
    (chunk) => extractRedemptionOptions(chunk, cardName),
    mergeRedemptionOptions,
    { options: [] },
  );
  meta = addMeta(meta, redemptionMeta);
  const redemptionValidation = validateRedemptionOptions(redemptionOptions);
  warnings.push(...redemptionValidation.warnings);
  errors.push(...redemptionValidation.errors);

  const { data: transferPartners, meta: transferMeta } = await extractAcrossChunks(
    scopedChunks,
    (chunk) => extractTransferPartners(chunk, cardName),
    mergeTransferPartners,
    { partners: [] },
  );
  meta = addMeta(meta, transferMeta);
  const transferValidation = validateTransferPartners(transferPartners);
  warnings.push(...transferValidation.warnings);
  errors.push(...transferValidation.errors);

  return {
    data: { card, benefits, rewardStructure, redemptionOptions, transferPartners },
    meta,
    warnings,
    errors,
    chunksProcessed: scopedChunks.length,
    cleanedLength: cleaned.length,
  };
}
