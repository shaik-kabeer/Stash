export function validateCrawlContent(content: string): { ok: true } | { ok: false; reason: string } {
  const trimmed = content.trim();

  if (trimmed.length < 800) {
    return {
      ok: false,
      reason: `Crawled content is only ${trimmed.length} characters — likely a 404, redirect, or JavaScript-only page. Try a different URL or use Firecrawl/Playwright crawl.`,
    };
  }

  const lower = trimmed.toLowerCase();
  const looks404 =
    /\b404\b/.test(lower) &&
    /no longer exists|not found|page you are looking for|error\.png/i.test(trimmed);

  if (looks404) {
    return {
      ok: false,
      reason:
        "Crawled page is a 404 error. The bank URL may have moved (e.g. aubank.in → au.bank.in). Update the source URL and crawl again.",
    };
  }

  return { ok: true };
}
