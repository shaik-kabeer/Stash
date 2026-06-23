import { prisma } from "./lib/db.js";
import { detectChange, shouldExtract } from "../lib/extraction/change-detector.js";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const STALE_HOURS = 24;

async function crawlPage(sourcePage: { id: string; url: string; contentHash: string | null; pageType: string }) {
  const method = FIRECRAWL_API_KEY ? "firecrawl" : "fetch";

  const crawlJob = await prisma.crawlJob.create({
    data: { sourcePageId: sourcePage.id, method, status: "running", startedAt: new Date() },
  });

  const startMs = Date.now();

  try {
    let content: string;

    if (method === "firecrawl") {
      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({ url: sourcePage.url, formats: ["markdown"], onlyMainContent: true }),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) throw new Error(`Firecrawl ${response.status}`);
      const data = await response.json() as { data?: { markdown?: string; content?: string } };
      content = data.data?.markdown || data.data?.content || "";
    } else {
      const res = await fetch(sourcePage.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; RewardOS Crawler/1.0)" },
        signal: AbortSignal.timeout(15000),
      });
      const html = await res.text();
      content = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    const changeResult = detectChange(content, sourcePage.contentHash);
    const durationMs = Date.now() - startMs;

    const changed = changeResult.changed;
    const newHash = changeResult.newHash;
    const needsExtraction = shouldExtract(changeResult, null);

    await prisma.sourcePage.update({
      where: { id: sourcePage.id },
      data: {
        rawContent: content,
        contentHash: newHash,
        lastCrawledAt: new Date(),
        status: "crawled",
      },
    });

    await prisma.crawlJob.update({
      where: { id: crawlJob.id },
      data: { status: "completed", completedAt: new Date(), durationMs },
    });

    return { id: sourcePage.id, url: sourcePage.url, changed, needsExtraction, contentLength: content.length, durationMs };
  } catch (error) {
    const durationMs = Date.now() - startMs;
    await prisma.crawlJob.update({
      where: { id: crawlJob.id },
      data: { status: "failed", completedAt: new Date(), durationMs, error: String(error) },
    });
    await prisma.sourcePage.update({ where: { id: sourcePage.id }, data: { status: "failed" } });
    return { id: sourcePage.id, url: sourcePage.url, error: String(error), durationMs };
  }
}

async function crawlAll() {
  const staleDate = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);

  const pages = await prisma.sourcePage.findMany({
    where: {
      OR: [
        { status: "pending" },
        { status: "failed" },
        { lastCrawledAt: { lt: staleDate } },
        { lastCrawledAt: null },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`[Crawl All] Found ${pages.length} pages to crawl (pending/failed/stale > ${STALE_HOURS}h)`);

  if (pages.length === 0) {
    console.log("Nothing to crawl. All pages are up to date.");
    return;
  }

  const results = [];
  for (const page of pages) {
    console.log(`\n  Crawling: ${page.url}`);
    const result = await crawlPage(page);
    results.push(result);

    if ("error" in result) {
      console.log(`  ✗ Failed: ${result.error}`);
    } else {
      const extractTag = result.needsExtraction ? " [NEEDS EXTRACTION]" : "";
      console.log(`  ✓ ${result.changed ? "CHANGED" : "unchanged"} (${result.contentLength} chars, ${result.durationMs}ms)${extractTag}`);
    }

    // Small delay between requests
    await new Promise((r) => setTimeout(r, 1000));
  }

  const succeeded = results.filter((r) => !("error" in r)).length;
  const failed = results.filter((r) => "error" in r).length;
  const changed = results.filter((r) => "changed" in r && r.changed).length;

  console.log(`\n[Crawl All] Summary: ${succeeded} succeeded (${changed} changed), ${failed} failed, ${pages.length} total`);
}

crawlAll()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
