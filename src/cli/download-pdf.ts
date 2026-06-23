import { prisma } from "./lib/db.js";
import { createHash } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

async function downloadPdf(pdfUrl: string) {
  const pdfDir = join(process.cwd(), "data", "pdfs");
  await mkdir(pdfDir, { recursive: true });

  let sourcePage = await prisma.sourcePage.findUnique({ where: { url: pdfUrl } });
  if (!sourcePage) {
    sourcePage = await prisma.sourcePage.create({
      data: { url: pdfUrl, pageType: "pdf", status: "pending" },
    });
  }

  const crawlJob = await prisma.crawlJob.create({
    data: { sourcePageId: sourcePage.id, method: "pdf", status: "running", startedAt: new Date() },
  });

  console.log(`[PDF Download] Fetching: ${pdfUrl}`);
  const startMs = Date.now();

  try {
    const res = await fetch(pdfUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RewardOS Crawler/1.0)" },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buffer = Buffer.from(await res.arrayBuffer());
    const hash = createHash("sha256").update(buffer).digest("hex");
    const filename = `${hash.slice(0, 16)}.pdf`;
    const filepath = join(pdfDir, filename);

    await writeFile(filepath, buffer);

    const durationMs = Date.now() - startMs;

    await prisma.sourcePage.update({
      where: { id: sourcePage.id },
      data: { contentHash: hash, lastCrawledAt: new Date(), status: "crawled", rawContent: `file://${filepath}` },
    });

    await prisma.crawlJob.update({
      where: { id: crawlJob.id },
      data: { status: "completed", completedAt: new Date(), durationMs },
    });

    console.log(`[PDF Download] Saved: ${filepath} (${buffer.length} bytes, ${durationMs}ms)`);
    return { sourcePageId: sourcePage.id, filepath, hash };
  } catch (error) {
    const durationMs = Date.now() - startMs;
    await prisma.crawlJob.update({
      where: { id: crawlJob.id },
      data: { status: "failed", completedAt: new Date(), durationMs, error: String(error) },
    });
    await prisma.sourcePage.update({ where: { id: sourcePage.id }, data: { status: "failed" } });
    console.error(`[PDF Download] Failed:`, error);
    throw error;
  }
}

const target = process.argv[2];
if (!target) {
  console.error("Usage: npx tsx src/cli/download-pdf.ts <pdf-url>");
  process.exit(1);
}
downloadPdf(target)
  .catch(() => process.exit(1))
  .finally(() => prisma.$disconnect());
