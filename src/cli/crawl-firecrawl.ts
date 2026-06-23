import { prisma } from "./lib/db.js";
import { createHash } from "crypto";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

async function crawlWithFirecrawl(urlOrId: string) {
  if (!FIRECRAWL_API_KEY) {
    console.error("FIRECRAWL_API_KEY not set in environment");
    process.exit(1);
  }

  let sourcePageId: string | null = null;
  let url: string;

  const existing = await prisma.sourcePage.findFirst({
    where: { OR: [{ id: urlOrId }, { url: urlOrId }] },
  });

  if (existing) {
    sourcePageId = existing.id;
    url = existing.url;
  } else {
    url = urlOrId;
    const created = await prisma.sourcePage.create({
      data: { url, status: "pending" },
    });
    sourcePageId = created.id;
  }

  const crawlJob = await prisma.crawlJob.create({
    data: { sourcePageId, method: "firecrawl", status: "running", startedAt: new Date() },
  });

  console.log(`[Firecrawl] Scraping: ${url}`);
  const startMs = Date.now();

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Firecrawl API error ${response.status}: ${errBody}`);
    }

    const data = await response.json() as { success: boolean; data?: { markdown?: string; content?: string } };

    if (!data.success || !data.data) {
      throw new Error("Firecrawl returned unsuccessful response");
    }

    const content = data.data.markdown || data.data.content || "";
    const hash = createHash("sha256").update(content).digest("hex");
    const durationMs = Date.now() - startMs;

    await prisma.sourcePage.update({
      where: { id: sourcePageId },
      data: { rawContent: content, contentHash: hash, lastCrawledAt: new Date(), status: "crawled" },
    });

    await prisma.crawlJob.update({
      where: { id: crawlJob.id },
      data: { status: "completed", completedAt: new Date(), durationMs },
    });

    console.log(`[Firecrawl] Done in ${durationMs}ms. Content: ${content.length} chars. Hash: ${hash.slice(0, 16)}...`);
    return { sourcePageId, content, hash };
  } catch (error) {
    const durationMs = Date.now() - startMs;
    await prisma.crawlJob.update({
      where: { id: crawlJob.id },
      data: { status: "failed", completedAt: new Date(), durationMs, error: String(error) },
    });
    await prisma.sourcePage.update({ where: { id: sourcePageId }, data: { status: "failed" } });
    console.error(`[Firecrawl] Failed:`, error);
    throw error;
  }
}

const target = process.argv[2];
if (!target) {
  console.error("Usage: npx tsx src/cli/crawl-firecrawl.ts <url-or-source-page-id>");
  process.exit(1);
}
crawlWithFirecrawl(target)
  .catch(() => process.exit(1))
  .finally(() => prisma.$disconnect());
