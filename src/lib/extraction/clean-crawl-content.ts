const NOISE_LINE_PATTERNS = [
  /^cookie/i,
  /^privacy policy/i,
  /^terms (and|&)/i,
  /^©/,
  /^all rights reserved/i,
  /^follow us/i,
  /^subscribe/i,
  /^sign up/i,
  /^log ?in/i,
  /^download (the )?app/i,
  /^skip to (main )?content/i,
  /^open menu/i,
  /^close menu/i,
  /^home$/i,
  /^contact us$/i,
  /^customer (care|support)$/i,
  /^toll[- ]free/i,
  /^slide \d+ of \d+/i,
  /^right arrow/i,
  /^left arrow/i,
  /^!\[[^\]]*\]/,
  /^\[go to/i,
];

const NOISE_PHRASES = [
  "accept all cookies",
  "manage preferences",
  "javascript is disabled",
  "enable javascript",
  "download our mobile app",
  "follow us on",
  "facebook twitter linkedin",
  "investor relations",
  "careers",
  "media center",
  "branch locator",
  "atm locator",
];

const CARD_KEYWORDS = [
  "credit card",
  "reward",
  "benefit",
  "lounge",
  "annual fee",
  "joining fee",
  "cashback",
  "miles",
  "points",
  "redemption",
  "forex",
  "fuel",
  "dining",
  "travel",
  "emi",
  "welcome",
  "milestone",
  "visa",
  "mastercard",
  "rupay",
  "amex",
];

function scoreLine(line: string): number {
  const lower = line.toLowerCase();
  let score = 0;
  for (const kw of CARD_KEYWORDS) {
    if (lower.includes(kw)) score += 2;
  }
  if (/\d+\s*%/.test(lower)) score += 1;
  if (/₹|rs\.?\s*\d/i.test(lower)) score += 1;
  if (line.length > 200) score -= 1;
  if (line.length < 8) score -= 2;
  return score;
}

function isNoiseLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 3) return true;
  if (NOISE_LINE_PATTERNS.some((p) => p.test(trimmed))) return true;
  const lower = trimmed.toLowerCase();
  if (NOISE_PHRASES.some((p) => lower.includes(p))) return true;
  if (/^(home|about|faq|help|sitemap)(\s|$)/i.test(trimmed) && trimmed.length < 40) return true;
  return false;
}

/** Strip nav/footer noise and prioritize card-relevant paragraphs. */
export function cleanCrawlContent(raw: string): string {
  const normalized = raw
    .replace(/\r\n/g, "\n")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const sentences = normalized.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

  const filtered: string[] = [];
  let prev = "";
  for (const line of sentences) {
    if (isNoiseLine(line)) continue;
    if (line === prev) continue;
    prev = line;
    filtered.push(line);
  }

  const scored = filtered
    .map((line) => ({ line, score: scoreLine(line) }))
    .sort((a, b) => b.score - a.score);

  const highRelevance = scored.filter((s) => s.score >= 2).map((s) => s.line);
  const remainder = filtered.filter((line) => !highRelevance.includes(line));

  const merged = [...highRelevance, ...remainder];
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const line of merged) {
    const key = line.toLowerCase().slice(0, 120);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(line);
  }

  return unique.join("\n\n");
}
