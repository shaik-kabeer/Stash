import { prisma } from "./lib/db.js";
import { readFile } from "fs/promises";
import { createHash } from "crypto";

async function parsePdf(sourcePageIdOrPath: string) {
  let pdfParse: (buffer: Buffer) => Promise<{ text: string; numpages: number }>;
  try {
    const mod = await import("pdf-parse");
    pdfParse = mod.default;
  } catch {
    console.error("pdf-parse not installed. Run: npm install pdf-parse");
    process.exit(1);
  }

  let sourcePage = await prisma.sourcePage.findUnique({ where: { id: sourcePageIdOrPath } });
  let filepath: string;

  if (sourcePage && sourcePage.rawContent?.startsWith("file://")) {
    filepath = sourcePage.rawContent.replace("file://", "");
  } else {
    filepath = sourcePageIdOrPath;
    sourcePage = await prisma.sourcePage.findFirst({
      where: { rawContent: { contains: sourcePageIdOrPath } },
    });
  }

  console.log(`[PDF Parse] Parsing: ${filepath}`);
  const startMs = Date.now();

  try {
    const buffer = await readFile(filepath);
    const data = await pdfParse(buffer);
    const text = data.text.replace(/\s+/g, " ").trim();
    const hash = createHash("sha256").update(text).digest("hex");
    const durationMs = Date.now() - startMs;

    if (sourcePage) {
      await prisma.sourcePage.update({
        where: { id: sourcePage.id },
        data: { rawContent: text, contentHash: hash, extractedAt: new Date(), status: "crawled" },
      });
    }

    console.log(`[PDF Parse] Done in ${durationMs}ms. Pages: ${data.numpages}. Text: ${text.length} chars.`);
    return { text, pages: data.numpages, hash };
  } catch (error) {
    console.error(`[PDF Parse] Failed:`, error);
    throw error;
  }
}

const target = process.argv[2];
if (!target) {
  console.error("Usage: npx tsx src/cli/parse-pdf.ts <source-page-id-or-filepath>");
  process.exit(1);
}
parsePdf(target)
  .catch(() => process.exit(1))
  .finally(() => prisma.$disconnect());
