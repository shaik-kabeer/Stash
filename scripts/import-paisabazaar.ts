/**
 * MVP Data Importer — Crawls Paisabazaar credit card listings
 * and extracts structured card data into data/cards.json.
 *
 * Usage: npx tsx scripts/import-paisabazaar.ts
 */

import * as fs from "fs";
import * as path from "path";

// ── Types ──────────────────────────────────────────────────────

interface ExtractedCard {
  bankName: string;
  cardName: string;
  imageUrl: string | null;
  category: string;
  joiningFee: number;
  annualFee: number;
  rewardSummary: string;
  keyBenefits: string[];
  eligibility: string | null;
  applyUrl: string;
  sourceUrl: string;
  extractedAt: string;
  confidence: number;
  network: string;
}

interface ReviewItem {
  url: string;
  reason: string;
  rawText: string;
}

// ── Bank-specific listing URLs on Paisabazaar ──────────────────

const LISTING_URLS = [
  "https://www.paisabazaar.com/credit-card/",
  "https://www.paisabazaar.com/credit-card/best-credit-cards/",
  "https://www.paisabazaar.com/credit-card/travel-credit-cards/",
  "https://www.paisabazaar.com/credit-card/cashback-credit-cards/",
  "https://www.paisabazaar.com/credit-card/fuel-credit-cards/",
  "https://www.paisabazaar.com/credit-card/lifetime-free-credit-cards/",
  "https://www.paisabazaar.com/credit-card/rewards-credit-cards/",
];

const BANK_ALIASES: Record<string, string> = {
  "HDFC": "HDFC Bank",
  "HDFC Bank": "HDFC Bank",
  "Axis": "Axis Bank",
  "Axis Bank": "Axis Bank",
  "SBI": "SBI Card",
  "SBI Card": "SBI Card",
  "ICICI": "ICICI Bank",
  "ICICI Bank": "ICICI Bank",
  "Kotak": "Kotak Mahindra Bank",
  "Kotak Mahindra": "Kotak Mahindra Bank",
  "IDFC": "IDFC FIRST Bank",
  "IDFC FIRST": "IDFC FIRST Bank",
  "IDFC FIRST Bank": "IDFC FIRST Bank",
  "RBL": "RBL Bank",
  "RBL Bank": "RBL Bank",
  "IndusInd": "IndusInd Bank",
  "IndusInd Bank": "IndusInd Bank",
  "AU": "AU Small Finance Bank",
  "AU Small Finance Bank": "AU Small Finance Bank",
  "YES": "YES Bank",
  "YES Bank": "YES Bank",
  "American Express": "American Express",
  "Amex": "American Express",
  "Standard Chartered": "Standard Chartered",
  "HSBC": "HSBC",
  "Citibank": "Citibank",
  "Federal": "Federal Bank",
  "Federal Bank": "Federal Bank",
  "BOB": "Bank of Baroda",
  "Bank of Baroda": "Bank of Baroda",
  "Tata": "HDFC Bank",
  "Flipkart": "Axis Bank",
  "Amazon": "ICICI Bank",
};

// ── Fetch with retry ───────────────────────────────────────────

async function fetchPage(url: string, retries = 2): Promise<string | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) {
        console.warn(`  [${res.status}] ${url}`);
        return null;
      }
      return await res.text();
    } catch (err) {
      if (attempt < retries) {
        console.warn(`  Retry ${attempt + 1}/${retries} for ${url}`);
        await sleep(2000 * (attempt + 1));
      } else {
        console.error(`  Failed: ${url} — ${(err as Error).message}`);
        return null;
      }
    }
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── HTML → plain text (rough, no deps) ─────────────────────────

function htmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|h[1-6]|li|tr|td|th)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/₹/g, "₹")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

// ── Extract card image URLs from HTML ──────────────────────────

function extractImageUrls(html: string): Map<string, string> {
  const map = new Map<string, string>();
  const imgPattern = /<img[^>]+(?:data-src|src)\s*=\s*["']([^"']+)["'][^>]*alt\s*=\s*["']([^"']*credit[^"']*)["']/gi;
  let match;
  while ((match = imgPattern.exec(html)) !== null) {
    const url = match[1];
    const alt = match[2].trim();
    if (alt && url && !url.includes("data:image")) {
      map.set(alt.toLowerCase(), url);
    }
  }
  const imgPattern2 = /<img[^>]+alt\s*=\s*["']([^"']*credit[^"']*)["'][^>]*(?:data-src|src)\s*=\s*["']([^"']+)["']/gi;
  while ((match = imgPattern2.exec(html)) !== null) {
    const alt = match[1].trim();
    const url = match[2];
    if (alt && url && !url.includes("data:image")) {
      map.set(alt.toLowerCase(), url);
    }
  }
  return map;
}

// ── Extract apply URLs from HTML ───────────────────────────────

function extractApplyUrls(html: string): Map<string, string> {
  const map = new Map<string, string>();
  const linkPattern = /<a[^>]+href\s*=\s*["']([^"']*paisabazaar[^"']*credit-card[^"']*)["'][^>]*>[\s\S]*?<\/a>/gi;
  let match;
  while ((match = linkPattern.exec(html)) !== null) {
    const url = match[1];
    const text = htmlToText(match[0]).toLowerCase();
    if (text.includes("check eligibility") || text.includes("apply") || text.includes("product details")) {
      const cardSlug = url.match(/credit-card\/([a-z0-9-]+)/i)?.[1];
      if (cardSlug) map.set(cardSlug, url);
    }
  }
  return map;
}

// ── Parse fee string like "₹10000" or "₹0" ────────────────────

function parseFee(text: string): number {
  const match = text.match(/₹?\s*([\d,]+)/);
  if (!match) return 0;
  return parseInt(match[1].replace(/,/g, ""), 10) || 0;
}

// ── Identify bank from card name ───────────────────────────────

function identifyBank(cardName: string): string {
  const name = cardName.toLowerCase();
  if (name.includes("hdfc") || name.includes("tata neu")) return "HDFC Bank";
  if (name.includes("axis") || name.includes("flipkart axis")) return "Axis Bank";
  if (name.includes("sbi")) return "SBI Card";
  if (name.includes("icici") || name.includes("amazon pay icici")) return "ICICI Bank";
  if (name.includes("kotak")) return "Kotak Mahindra Bank";
  if (name.includes("idfc") || name.includes("first")) return "IDFC FIRST Bank";
  if (name.includes("rbl")) return "RBL Bank";
  if (name.includes("indusind")) return "IndusInd Bank";
  if (name.includes("au small") || name.includes("au bank")) return "AU Small Finance Bank";
  if (name.includes("yes bank") || name.includes("yes ")) return "YES Bank";
  if (name.includes("american express") || name.includes("amex")) return "American Express";
  if (name.includes("standard chartered") || name.includes("easemytrip")) return "Standard Chartered";
  if (name.includes("hsbc")) return "HSBC";
  if (name.includes("citibank") || name.includes("citi")) return "Citibank";
  if (name.includes("federal") || name.includes("scapia")) return "Federal Bank";
  if (name.includes("bob") || name.includes("bank of baroda")) return "Bank of Baroda";
  if (name.includes("indianoil") && name.includes("rbl")) return "RBL Bank";
  if (name.includes("bpcl") && name.includes("sbi")) return "SBI Card";
  if (name.includes("hpcl") && name.includes("icici")) return "ICICI Bank";
  if (name.includes("hpcl") && name.includes("idfc")) return "IDFC FIRST Bank";
  if (name.includes("air india") && name.includes("sbi")) return "SBI Card";
  return "Unknown";
}

// ── Identify network from card name ────────────────────────────

function identifyNetwork(cardName: string): string {
  const name = cardName.toLowerCase();
  if (name.includes("american express") || name.includes("amex")) return "Amex";
  if (name.includes("diners")) return "Diners Club";
  if (name.includes("rupay")) return "RuPay";
  if (name.includes("mastercard")) return "Mastercard";
  if (name.includes("visa")) return "Visa";
  return "Visa";
}

// ── Classify card category from name and benefits ──────────────

function classifyCategory(cardName: string, benefits: string[]): string {
  const text = (cardName + " " + benefits.join(" ")).toLowerCase();
  if (text.includes("travel") || text.includes("miles") || text.includes("atlas") || text.includes("horizon")) return "travel";
  if (text.includes("cashback") || text.includes("cash back") || text.includes("ace")) return "cashback";
  if (text.includes("fuel") || text.includes("petrol") || text.includes("indianoil") || text.includes("bpcl") || text.includes("hpcl")) return "fuel";
  if (text.includes("dining") || text.includes("eazydiner") || text.includes("swiggy") || text.includes("zomato")) return "dining";
  if (text.includes("amazon") || text.includes("flipkart") || text.includes("shopping") || text.includes("myntra")) return "shopping";
  if (text.includes("lounge") || text.includes("premium") || text.includes("platinum") || text.includes("reserve") || text.includes("black")) return "premium";
  if (text.includes("reward") || text.includes("point")) return "rewards";
  return "general";
}

// ── Parse the listing page text into card blocks ───────────────

function parseListingText(text: string, sourceUrl: string, imageMap: Map<string, string>): ExtractedCard[] {
  const cards: ExtractedCard[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Look for a card name pattern: a line that mentions "Credit Card" and is followed by fee info
    const lower = line.toLowerCase();
    const isCardName = /credit\s*card/i.test(line) &&
      !lower.startsWith("apply") &&
      !lower.startsWith("compare") &&
      !lower.startsWith("check") &&
      !lower.startsWith("how") &&
      !lower.startsWith("what") &&
      !lower.startsWith("which") &&
      !lower.startsWith("when") &&
      !lower.includes("faqs") &&
      !lower.includes("types of") &&
      !lower.includes("features") &&
      !lower.includes("best credit cards in india") &&
      !lower.includes("fees & charges") &&
      !lower.includes("fees and charges") &&
      !lower.includes("launches") &&
      !lower.includes("launched") &&
      !lower.includes("allows") &&
      !lower.includes("devaluation") &&
      !lower.includes("effective") &&
      !lower.includes(" vs.") &&
      !lower.includes(" vs ") &&
      !lower.includes("can now be") &&
      !lower.includes("news") &&
      !lower.includes("offers") &&
      !/^\d+\.\s/.test(line) &&
      !/\d{4}$/.test(line.trim()) &&
      !/\d{1,2}(?:st|nd|rd|th)\s/.test(line) &&
      !lower.endsWith("credit cards") &&
      line.length < 100 &&
      line.length > 15;

    if (!isCardName) {
      i++;
      continue;
    }

    // Look ahead for fee lines within next 10 lines
    let joiningFee = 0;
    let annualFee = 0;
    let rating: string | null = null;
    const highlights: string[] = [];
    const benefits: string[] = [];
    let j = i + 1;
    const blockEnd = Math.min(j + 20, lines.length);

    while (j < blockEnd) {
      const l = lines[j];

      if (/^\d(\.\d)?\/5$/.test(l)) {
        rating = l;
        j++;
        continue;
      }

      if (/joining\s*fee/i.test(l)) {
        joiningFee = parseFee(l);
        j++;
        continue;
      }

      if (/annual.*fee|renewal.*fee/i.test(l)) {
        annualFee = parseFee(l);
        j++;
        continue;
      }

      if (l === "Check Eligibility" || l === "Product Details") {
        j++;
        continue;
      }

      if (l.startsWith("Compare") || l.startsWith("Note:") || l.startsWith("From the above")) {
        break;
      }

      // Next card? Break
      if (/credit\s*card/i.test(l) && l.length < 120 && l.length > 10 && j > i + 3) {
        break;
      }

      // Benefit bullet (starts with -)
      if (l.startsWith("-") || l.startsWith("•") || l.startsWith("–")) {
        benefits.push(l.replace(/^[-•–]\s*/, ""));
        j++;
        continue;
      }

      // Highlight lines (short, descriptive, not a header)
      if (l.length > 15 && l.length < 200 && !l.includes("Credit Card") && highlights.length < 2) {
        highlights.push(l);
      }
      j++;
    }

    const cardName = line.replace(/\s+/g, " ").trim();
    const bankName = identifyBank(cardName);

    if (bankName === "Unknown") {
      i = j;
      continue;
    }

    // Skip generic bank-level entries (e.g. "HDFC Credit Card", "YES Bank Credit Card")
    const nameNorm = cardName.replace(/\s+/g, " ").toLowerCase();
    const bankNorm = bankName.toLowerCase();
    if (nameNorm === `${bankNorm.replace(" bank", "")} credit card` ||
        nameNorm === `${bankNorm} credit card` ||
        nameNorm === `${bankNorm.replace(" card", "")} credit card` ||
        /^[a-z\s]+ bank credit card$/i.test(cardName)) {
      i = j;
      continue;
    }

    const allBenefitText = [...highlights, ...benefits];
    const rewardSummary = highlights.length > 0 ? highlights.join(" | ") : (benefits[0] ?? "");
    const category = classifyCategory(cardName, allBenefitText);
    const network = identifyNetwork(cardName);

    const imageKey = cardName.toLowerCase();
    let imageUrl: string | null = null;
    for (const [key, url] of imageMap.entries()) {
      if (key.includes(imageKey.slice(0, 20).toLowerCase()) || imageKey.includes(key.slice(0, 20))) {
        imageUrl = url;
        break;
      }
    }

    const hasFees = joiningFee > 0 || annualFee > 0;
    const hasContent = benefits.length > 0 || highlights.length > 0;
    const confidence = hasFees && hasContent ? 0.85 : hasContent || hasFees ? 0.7 : 0.4;

    cards.push({
      bankName,
      cardName,
      imageUrl,
      category,
      joiningFee,
      annualFee,
      rewardSummary,
      keyBenefits: [...highlights, ...benefits],
      eligibility: null,
      applyUrl: `https://www.paisabazaar.com/credit-card/${cardName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}/`,
      sourceUrl,
      extractedAt: new Date().toISOString(),
      confidence,
      network,
    });

    i = j;
  }

  return cards;
}

// ── Deduplicate by card name ───────────────────────────────────

function deduplicateCards(cards: ExtractedCard[]): ExtractedCard[] {
  const map = new Map<string, ExtractedCard>();
  for (const card of cards) {
    const key = card.cardName.toLowerCase().replace(/\s+/g, " ").trim();
    const existing = map.get(key);
    if (!existing || card.confidence > existing.confidence || card.keyBenefits.length > existing.keyBenefits.length) {
      map.set(key, card);
    }
  }
  return Array.from(map.values());
}

// ── Main ───────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  Paisabazaar MVP Card Importer");
  console.log("═══════════════════════════════════════════════════\n");

  const allCards: ExtractedCard[] = [];
  const reviewQueue: ReviewItem[] = [];

  for (const url of LISTING_URLS) {
    console.log(`Fetching: ${url}`);
    const html = await fetchPage(url);

    if (!html) {
      reviewQueue.push({ url, reason: "Fetch failed", rawText: "" });
      continue;
    }

    const imageMap = extractImageUrls(html);
    const text = htmlToText(html);
    const cards = parseListingText(text, url, imageMap);

    console.log(`  → Extracted ${cards.length} cards`);

    if (cards.length === 0) {
      reviewQueue.push({ url, reason: "No cards parsed from page", rawText: text.slice(0, 500) });
    }

    allCards.push(...cards);

    await sleep(1500);
  }

  console.log(`\nTotal raw: ${allCards.length} cards`);
  const deduplicated = deduplicateCards(allCards);
  console.log(`After dedup: ${deduplicated.length} cards`);

  // Sort by bank, then name
  deduplicated.sort((a, b) => a.bankName.localeCompare(b.bankName) || a.cardName.localeCompare(b.cardName));

  // Print summary
  const byBank = new Map<string, number>();
  for (const c of deduplicated) {
    byBank.set(c.bankName, (byBank.get(c.bankName) ?? 0) + 1);
  }
  console.log("\nCards by bank:");
  for (const [bank, count] of Array.from(byBank.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${bank}: ${count}`);
  }

  // Write output
  const outDir = path.resolve(__dirname, "..", "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "cards.json");
  fs.writeFileSync(outPath, JSON.stringify(deduplicated, null, 2), "utf-8");
  console.log(`\n✓ Wrote ${deduplicated.length} cards to ${outPath}`);

  if (reviewQueue.length > 0) {
    const reviewPath = path.join(outDir, "review-queue.json");
    fs.writeFileSync(reviewPath, JSON.stringify(reviewQueue, null, 2), "utf-8");
    console.log(`⚠ ${reviewQueue.length} items in review queue → ${reviewPath}`);
  }

  // Print low-confidence cards
  const lowConf = deduplicated.filter((c) => c.confidence < 0.6);
  if (lowConf.length > 0) {
    console.log(`\n⚠ ${lowConf.length} low-confidence cards:`);
    for (const c of lowConf) {
      console.log(`  - ${c.cardName} (${c.bankName}) — confidence: ${c.confidence}`);
    }
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
