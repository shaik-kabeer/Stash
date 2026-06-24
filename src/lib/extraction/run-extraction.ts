import { prisma } from "@/lib/prisma";
import { extractOffers, extractCardListing } from "./extractor";
import { validateOffers } from "./validator";
import { validateCrawlContent } from "./content-quality";
import { cleanCrawlContent } from "./clean-crawl-content";
import { chunkContent } from "./chunk-content";
import { formatZodError } from "./parse-response";
import { extractFullCard } from "./extract-card-full";
import { mergeOffers } from "./merge-results";
import type { ExtractedCardPayload } from "./upsert-extracted-card";

const MAX_LISTING_CARDS = 8;

export interface ExtractionRunResult {
  extractionJobId: string;
  status: string;
  sourcePageId: string;
  url: string;
  pageType: string;
  promptTokens: number;
  completionTokens: number;
  warnings: string[];
  errors: string[];
  summary: string;
}

export async function runExtraction(sourcePageId: string): Promise<ExtractionRunResult> {
  const sourcePage = await prisma.sourcePage.findUnique({
    where: { id: sourcePageId },
    include: { bank: true, card: true },
  });

  if (!sourcePage) throw new Error("Source page not found");
  if (!sourcePage.rawContent?.trim()) throw new Error("No crawled content. Run Crawl first.");

  const cleaned = cleanCrawlContent(sourcePage.rawContent);
  const contentCheck = validateCrawlContent(cleaned);
  if (!contentCheck.ok) throw new Error(contentCheck.reason);

  if (!process.env.OPENAI_API_KEY?.trim() && !process.env.GROQ_API_KEY?.trim()) {
    throw new Error("Set OPENAI_API_KEY or GROQ_API_KEY for extraction");
  }

  const latestCrawl = await prisma.crawlJob.findFirst({
    where: { sourcePageId, status: "completed" },
    orderBy: { completedAt: "desc" },
  });

  const extractionJob = await prisma.extractionJob.create({
    data: {
      sourcePageId,
      crawlJobId: latestCrawl?.id,
      status: "running",
      startedAt: new Date(),
    },
  });

  let extractionModel = "unknown";
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  const allResults: Record<string, unknown> = { pageType: sourcePage.pageType };
  const allWarnings: string[] = [];
  const allErrors: string[] = [];
  const summaryParts: string[] = [];

  try {
    if (sourcePage.pageType === "card_page") {
      const result = await extractFullCard(cleaned);
      extractionModel = `${result.meta.provider}/${result.meta.model}`;
      totalPromptTokens += result.meta.promptTokens;
      totalCompletionTokens += result.meta.completionTokens;
      allWarnings.push(...result.warnings);
      allErrors.push(...result.errors);

      const payload: ExtractedCardPayload = {
        card: result.data.card,
        benefits: result.data.benefits,
        rewardStructure: result.data.rewardStructure,
        redemptionOptions: result.data.redemptionOptions,
        transferPartners: result.data.transferPartners,
      };

      Object.assign(allResults, payload);
      summaryParts.push(
        `Card: ${result.data.card.name}`,
        `${result.data.benefits.benefits.length} benefits`,
        `${result.data.redemptionOptions.options.length} redemptions`,
        `${result.data.transferPartners.partners.length} partners`,
        `${result.chunksProcessed} chunks`,
      );
    } else if (sourcePage.pageType === "listing_page") {
      const listingChunks = chunkContent(cleaned).slice(0, 2);
      const listingParts = [];
      let listingMeta = { promptTokens: 0, completionTokens: 0, model: "", provider: "groq" as const };

      for (const chunk of listingChunks) {
        const { data, meta } = await extractCardListing(chunk);
        listingParts.push(data);
        listingMeta.promptTokens += meta.promptTokens;
        listingMeta.completionTokens += meta.completionTokens;
        listingMeta.model = meta.model;
      }

      const seen = new Set<string>();
      const listedCards = [];
      for (const part of listingParts) {
        for (const c of part.cards) {
          const key = c.name.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          listedCards.push(c);
        }
      }

      extractionModel = `${listingMeta.provider}/${listingMeta.model}`;
      totalPromptTokens += listingMeta.promptTokens;
      totalCompletionTokens += listingMeta.completionTokens;

      const cardPayloads: ExtractedCardPayload[] = [];
      for (const listed of listedCards.slice(0, MAX_LISTING_CARDS)) {
        const result = await extractFullCard(cleaned, listed.name);
        totalPromptTokens += result.meta.promptTokens;
        totalCompletionTokens += result.meta.completionTokens;
        allWarnings.push(...result.warnings);
        allErrors.push(...result.errors);

        cardPayloads.push({
          card: { ...result.data.card, ...listed, name: listed.name },
          benefits: result.data.benefits,
          rewardStructure: result.data.rewardStructure,
          redemptionOptions: result.data.redemptionOptions,
          transferPartners: result.data.transferPartners,
        });
        summaryParts.push(
          `${listed.name}: ${result.data.benefits.benefits.length} benefits`,
        );
      }

      allResults.cards = cardPayloads;
      summaryParts.unshift(`${cardPayloads.length} cards from listing`);
    } else if (sourcePage.pageType === "offers") {
      const chunks = chunkContent(cleaned);
      const offerParts = [];
      let offersMeta = { promptTokens: 0, completionTokens: 0, model: "", provider: "groq" as const };

      for (const chunk of chunks) {
        const { data, meta } = await extractOffers(chunk);
        offerParts.push(data);
        offersMeta.promptTokens += meta.promptTokens;
        offersMeta.completionTokens += meta.completionTokens;
        offersMeta.model = meta.model;
      }

      const offersData = mergeOffers(offerParts);
      extractionModel = `${offersMeta.provider}/${offersMeta.model}`;
      totalPromptTokens += offersMeta.promptTokens;
      totalCompletionTokens += offersMeta.completionTokens;

      const offersValidation = validateOffers(offersData);
      allWarnings.push(...offersValidation.warnings);
      allErrors.push(...offersValidation.errors);
      allResults.offers = offersData;
      summaryParts.push(`${offersData.offers.length} offers (${chunks.length} chunks)`);
    } else {
      throw new Error(`Unsupported page type: ${sourcePage.pageType}`);
    }

    const status = allErrors.length > 0 ? "failed" : "completed";

    await prisma.extractionJob.update({
      where: { id: extractionJob.id },
      data: {
        status,
        model: extractionModel,
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        extractedData: JSON.stringify(allResults),
        validationErrors:
          allErrors.length > 0 || allWarnings.length > 0
            ? JSON.stringify({ errors: allErrors, warnings: allWarnings })
            : null,
        completedAt: new Date(),
      },
    });

    await prisma.sourcePage.update({
      where: { id: sourcePageId },
      data: { extractedAt: new Date() },
    });

    return {
      extractionJobId: extractionJob.id,
      status,
      sourcePageId,
      url: sourcePage.url,
      pageType: sourcePage.pageType,
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
      warnings: allWarnings,
      errors: allErrors,
      summary: summaryParts.join(" · ") || "Extraction complete",
    };
  } catch (error) {
    const message = formatZodError(error);
    await prisma.extractionJob.update({
      where: { id: extractionJob.id },
      data: {
        status: "failed",
        validationErrors: JSON.stringify({ error: message }),
        completedAt: new Date(),
      },
    });
    throw new Error(message);
  }
}
