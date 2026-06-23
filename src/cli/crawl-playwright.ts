import { prisma } from "./lib/db.js";
import { createHash } from "crypto";

async function crawlWithPlaywright(urlOrId: string) {
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
    data: { sourcePageId, method: "playwright", status: "running", startedAt: new Date() },
  });

  console.log(`[Playwright] Crawling: ${url}`);
  const startMs = Date.now();

  try {
    let chromium: { launch: (opts: { headless: boolean }) => Promise<{ newPage: () => Promise<{ goto: (url: string, opts: object) => Promise<void>; waitForTimeout: (ms: number) => Promise<void>; evaluate: (fn: () => string) => Promise<string> }>; close: () => Promise<void> }> };
    try {
      // @ts-expect-error -- playwright is optional, installed separately
      const pw = await import("playwright");
      chromium = pw.chromium;
    } catch {
      console.error("Playwright not installed. Install with: npx playwright install chromium");
      console.log("Falling back to fetch-based crawl...");
      return crawlWithFetch(url, sourcePageId, crawlJob.id, startMs);
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    await page.waitForTimeout(2000);

    const content = await page.evaluate(() => {
      const selectors = ["nav", "footer", "header", ".cookie-banner", "#cookie-consent", ".popup", ".modal"];
      selectors.forEach((s) => document.querySelectorAll(s).forEach((el) => el.remove()));
      return document.body.innerText;
    });

    await browser.close();

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

    console.log(`[Playwright] Done in ${durationMs}ms. Content: ${content.length} chars. Hash: ${hash.slice(0, 16)}...`);
    return { sourcePageId, content, hash };
  } catch (error) {
    const durationMs = Date.now() - startMs;
    await prisma.crawlJob.update({
      where: { id: crawlJob.id },
      data: { status: "failed", completedAt: new Date(), durationMs, error: String(error) },
    });
    await prisma.sourcePage.update({ where: { id: sourcePageId }, data: { status: "failed" } });
    console.error(`[Playwright] Failed:`, error);
    throw error;
  }
}

async function crawlWithFetch(url: string, sourcePageId: string, crawlJobId: string, startMs: number) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; RewardOS Crawler/1.0)" },
    signal: AbortSignal.timeout(15000),
  });

  const html = await res.text();
  const content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const hash = createHash("sha256").update(content).digest("hex");
  const durationMs = Date.now() - startMs;

  await prisma.sourcePage.update({
    where: { id: sourcePageId },
    data: { rawContent: content, contentHash: hash, lastCrawledAt: new Date(), status: "crawled" },
  });

  await prisma.crawlJob.update({
    where: { id: crawlJobId },
    data: { status: "completed", completedAt: new Date(), durationMs },
  });

  console.log(`[Fetch Fallback] Done in ${durationMs}ms. Content: ${content.length} chars.`);
  return { sourcePageId, content, hash };
}

const target = process.argv[2];
if (!target) {
  console.error("Usage: npx tsx src/cli/crawl-playwright.ts <url-or-source-page-id>");
  process.exit(1);
}
crawlWithPlaywright(target)
  .catch(() => process.exit(1))
  .finally(() => prisma.$disconnect());
