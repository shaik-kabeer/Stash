import { prisma } from "./lib/db.js";
import { createHash } from "crypto";

function cleanHtml(html: string): string {
  let cleaned = html;
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  cleaned = cleaned.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "");
  cleaned = cleaned.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");
  cleaned = cleaned.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");

  // Convert structural tags to newlines for readability
  cleaned = cleaned.replace(/<\/?(h[1-6]|p|div|br|li|tr|td|th)[^>]*>/gi, "\n");
  cleaned = cleaned.replace(/<[^>]+>/g, " ");

  // Normalize whitespace
  cleaned = cleaned.replace(/[ \t]+/g, " ");
  cleaned = cleaned.replace(/\n\s*\n/g, "\n\n");
  cleaned = cleaned.trim();

  return cleaned;
}

async function parseHtmlContent(sourcePageId: string) {
  const sourcePage = await prisma.sourcePage.findUnique({ where: { id: sourcePageId } });

  if (!sourcePage) {
    console.error(`Source page not found: ${sourcePageId}`);
    process.exit(1);
  }

  if (!sourcePage.rawContent) {
    console.error(`Source page has no raw content: ${sourcePageId}`);
    process.exit(1);
  }

  console.log(`[HTML Parse] Processing source: ${sourcePage.url}`);
  const startMs = Date.now();

  const cleanedText = cleanHtml(sourcePage.rawContent);
  const hash = createHash("sha256").update(cleanedText).digest("hex");
  const durationMs = Date.now() - startMs;

  await prisma.sourcePage.update({
    where: { id: sourcePageId },
    data: { rawContent: cleanedText, contentHash: hash },
  });

  console.log(`[HTML Parse] Done in ${durationMs}ms. Cleaned: ${cleanedText.length} chars (from ${sourcePage.rawContent.length}).`);
  return { cleanedText, hash };
}

const target = process.argv[2];
if (!target) {
  console.error("Usage: npx tsx src/cli/parse-html.ts <source-page-id>");
  process.exit(1);
}
parseHtmlContent(target)
  .catch(() => process.exit(1))
  .finally(() => prisma.$disconnect());
