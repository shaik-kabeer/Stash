import { runExtraction } from "../lib/extraction/run-extraction.js";
import { prisma } from "./lib/db.js";

const target = process.argv[2];
if (!target) {
  console.error("Usage: npx tsx src/cli/extract.ts <source-page-id>");
  process.exit(1);
}

runExtraction(target)
  .then((result) => {
    console.log(`\n[Extract] ${result.url}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Summary: ${result.summary}`);
    console.log(`  Job ID: ${result.extractionJobId}`);
    console.log(`  Tokens: ${result.promptTokens} prompt + ${result.completionTokens} completion`);
    if (result.warnings.length > 0) console.log(`  Warnings: ${result.warnings.join("; ")}`);
    if (result.errors.length > 0) console.log(`  Errors: ${result.errors.join("; ")}`);
  })
  .catch((error) => {
    console.error("Extraction failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
