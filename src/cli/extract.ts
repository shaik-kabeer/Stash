import { prisma } from "./lib/db.js";
import {
  extractCardDetails,
  extractBenefits,
  extractRewardStructure,
  extractOffers,
} from "../lib/extraction/extractor.js";
import {
  validateCardDetails,
  validateBenefits,
  validateOffers,
} from "../lib/extraction/validator.js";

async function extractFromSource(sourcePageId: string) {
  const sourcePage = await prisma.sourcePage.findUnique({
    where: { id: sourcePageId },
    include: { bank: true, card: true },
  });

  if (!sourcePage) {
    console.error(`Source page not found: ${sourcePageId}`);
    process.exit(1);
  }

  if (!sourcePage.rawContent) {
    console.error(`Source page has no content. Run crawl first: ${sourcePageId}`);
    process.exit(1);
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

  console.log(`\n[Extract] Processing: ${sourcePage.url}`);
  console.log(`  Page type: ${sourcePage.pageType}`);
  console.log(`  Content length: ${sourcePage.rawContent.length} chars`);

  const content = sourcePage.rawContent;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  const allResults: Record<string, unknown> = {};
  const allWarnings: string[] = [];
  const allErrors: string[] = [];

  try {
    if (sourcePage.pageType === "card_page") {
      // Extract card details
      console.log("  Extracting card details...");
      const { data: cardData, meta: cardMeta } = await extractCardDetails(content);
      const cardValidation = validateCardDetails(cardData);
      totalPromptTokens += cardMeta.promptTokens;
      totalCompletionTokens += cardMeta.completionTokens;
      allResults.card = cardData;
      allWarnings.push(...cardValidation.warnings);
      allErrors.push(...cardValidation.errors);
      console.log(`    Card: ${cardData.name} (${cardData.bank}, ${cardData.network})`);

      // Extract benefits
      console.log("  Extracting benefits...");
      const { data: benefitsData, meta: benefitsMeta } = await extractBenefits(content, cardData.name);
      const benefitsValidation = validateBenefits(benefitsData);
      totalPromptTokens += benefitsMeta.promptTokens;
      totalCompletionTokens += benefitsMeta.completionTokens;
      allResults.benefits = benefitsData;
      allWarnings.push(...benefitsValidation.warnings);
      allErrors.push(...benefitsValidation.errors);
      console.log(`    Benefits: ${benefitsData.benefits.length} extracted`);

      // Extract reward structure
      console.log("  Extracting reward structure...");
      const { data: rewardData, meta: rewardMeta } = await extractRewardStructure(content, cardData.name);
      totalPromptTokens += rewardMeta.promptTokens;
      totalCompletionTokens += rewardMeta.completionTokens;
      allResults.rewardStructure = rewardData;
      console.log(`    Rewards: ${rewardData.pointName} @ ${rewardData.earnRate}`);

    } else if (sourcePage.pageType === "offers") {
      console.log("  Extracting offers...");
      const { data: offersData, meta: offersMeta } = await extractOffers(content);
      const offersValidation = validateOffers(offersData);
      totalPromptTokens += offersMeta.promptTokens;
      totalCompletionTokens += offersMeta.completionTokens;
      allResults.offers = offersData;
      allWarnings.push(...offersValidation.warnings);
      allErrors.push(...offersValidation.errors);
      console.log(`    Offers: ${offersData.offers.length} extracted`);
    }

    const hasErrors = allErrors.length > 0;
    const status = hasErrors ? "failed" : allWarnings.length > 0 ? "completed" : "completed";

    await prisma.extractionJob.update({
      where: { id: extractionJob.id },
      data: {
        status,
        model: "gpt-4o",
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        extractedData: JSON.stringify(allResults),
        validationErrors: allErrors.length > 0 || allWarnings.length > 0
          ? JSON.stringify({ errors: allErrors, warnings: allWarnings })
          : null,
        completedAt: new Date(),
      },
    });

    await prisma.sourcePage.update({
      where: { id: sourcePageId },
      data: { extractedAt: new Date() },
    });

    console.log(`\n  Tokens used: ${totalPromptTokens} prompt + ${totalCompletionTokens} completion`);
    if (allWarnings.length > 0) console.log(`  Warnings: ${allWarnings.join("; ")}`);
    if (allErrors.length > 0) console.log(`  Errors: ${allErrors.join("; ")}`);
    console.log(`  Status: ${status}`);

    return allResults;
  } catch (error) {
    await prisma.extractionJob.update({
      where: { id: extractionJob.id },
      data: {
        status: "failed",
        validationErrors: JSON.stringify({ error: String(error) }),
        completedAt: new Date(),
      },
    });
    console.error(`  Extraction failed:`, error);
    throw error;
  }
}

const target = process.argv[2];
if (!target) {
  console.error("Usage: npx tsx src/cli/extract.ts <source-page-id>");
  process.exit(1);
}
extractFromSource(target)
  .catch(() => process.exit(1))
  .finally(() => prisma.$disconnect());
