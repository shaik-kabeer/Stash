/**
 * MVP Card Seeder — Reads data/cards.json and upserts into Prisma.
 *
 * - Deduplicates by card name + bank
 * - Skips cards already in the database (unless --force flag)
 * - Creates Bank records as needed
 * - Creates Card, Benefit, and NormalizedProgram records
 * - Computes estimatedAnnualValue from benefits
 * - Stores source URL and extraction timestamp
 *
 * Usage:
 *   npx tsx scripts/seed-cards.ts           # skip existing
 *   npx tsx scripts/seed-cards.ts --force   # update existing
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "../src/generated/prisma/client.js";

function createPrisma(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (tursoUrl && tursoToken) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSql } = require("@prisma/adapter-libsql");
    const adapter = new PrismaLibSql({ url: tursoUrl, authToken: tursoToken });
    console.log("  DB: Turso (remote)");
    return new PrismaClient({ adapter });
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || "file:./dev.db",
  });
  console.log("  DB: Local SQLite");
  return new PrismaClient({ adapter });
}

const prisma = createPrisma();

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

interface SeedStats {
  banksCreated: number;
  cardsCreated: number;
  cardsSkipped: number;
  cardsUpdated: number;
  benefitsCreated: number;
  benefitsSkipped: number;
  programsCreated: number;
  errors: string[];
}

// ── Bank code derivation ───────────────────────────────────────

function deriveBankCode(bankName: string): string {
  const map: Record<string, string> = {
    "HDFC Bank": "HDFC",
    "Axis Bank": "AXIS",
    "SBI Card": "SBI",
    "ICICI Bank": "ICICI",
    "Kotak Mahindra Bank": "KOTAK",
    "IDFC FIRST Bank": "IDFC",
    "RBL Bank": "RBL",
    "IndusInd Bank": "INDUSIND",
    "AU Small Finance Bank": "AU",
    "YES Bank": "YES",
    "American Express": "AMEX",
    "Standard Chartered": "SC",
    "HSBC": "HSBC",
    "Citibank": "CITI",
    "Federal Bank": "FEDERAL",
    "Bank of Baroda": "BOB",
  };
  return map[bankName] ?? bankName.replace(/\s+/g, "").toUpperCase().slice(0, 10);
}

// ── Classify benefit category from text ────────────────────────

function classifyBenefitCategory(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("lounge") || t.includes("airport")) return "lounge";
  if (t.includes("travel") || t.includes("flight") || t.includes("hotel") || t.includes("mile")) return "travel";
  if (t.includes("cashback") || t.includes("cash back")) return "cashback";
  if (t.includes("fuel") || t.includes("surcharge")) return "fuel";
  if (t.includes("dining") || t.includes("restaurant") || t.includes("swiggy") || t.includes("zomato") || t.includes("eazydiner")) return "dining";
  if (t.includes("reward") || t.includes("point") || t.includes("neucoins")) return "rewards";
  if (t.includes("movie") || t.includes("bookmyshow") || t.includes("entertainment")) return "entertainment";
  if (t.includes("golf")) return "golf";
  if (t.includes("insurance") || t.includes("cover")) return "insurance";
  if (t.includes("forex") || t.includes("markup") || t.includes("international")) return "forex";
  if (t.includes("welcome") || t.includes("joining") || t.includes("voucher")) return "welcome";
  if (t.includes("milestone") || t.includes("spending") || t.includes("annual spend")) return "milestone";
  if (t.includes("membership") || t.includes("amazon") || t.includes("flipkart") || t.includes("myntra")) return "shopping";
  return "general";
}

// ── Estimate benefit value from text ───────────────────────────

function estimateBenefitValue(text: string, category: string): number {
  const t = text.toLowerCase();

  const rsMatch = t.match(/(?:rs\.?|₹)\s*([\d,]+)/);
  if (rsMatch) {
    const value = parseInt(rsMatch[1].replace(/,/g, ""), 10);
    if (value > 0 && value < 200000) return value;
  }

  if (category === "lounge") {
    const visitMatch = t.match(/(\d+)\s*(?:complimentary|free)?\s*(?:lounge|domestic|international)/i);
    if (visitMatch) return parseInt(visitMatch[1], 10) * 800;
    if (t.includes("unlimited")) return 15000;
    return 3000;
  }

  if (category === "golf") {
    const roundMatch = t.match(/(\d+)\s*(?:complimentary|free)?\s*golf/i);
    if (roundMatch) return parseInt(roundMatch[1], 10) * 1500;
    return 3000;
  }

  if (category === "fuel" && t.includes("waiver")) return 1200;
  if (category === "insurance") return 2000;
  if (category === "forex" && t.includes("markup")) return 1500;

  return 0;
}

// ── Extract reward program from summary ────────────────────────

function extractRewardProgram(card: ExtractedCard): {
  name: string;
  pointName: string;
  earnRate: string;
} | null {
  const text = (card.rewardSummary + " " + card.keyBenefits.join(" ")).toLowerCase();

  if (text.includes("edge")) return { name: `${card.cardName} EDGE`, pointName: "EDGE Reward Points", earnRate: extractEarnRate(text, "EDGE") };
  if (text.includes("neucoins")) return { name: `${card.cardName} NeuCoins`, pointName: "NeuCoins", earnRate: extractEarnRate(text, "NeuCoins") };
  if (text.includes("reward point")) return { name: `${card.cardName} Rewards`, pointName: "Reward Points", earnRate: extractEarnRate(text, "points") };
  if (text.includes("cashback")) return { name: `${card.cardName} Cashback`, pointName: "Cashback", earnRate: extractEarnRate(text, "cashback") };
  if (text.includes("miles") || text.includes("mile")) return { name: `${card.cardName} Miles`, pointName: "Miles", earnRate: extractEarnRate(text, "miles") };
  if (text.includes("fuel point")) return { name: `${card.cardName} Fuel Points`, pointName: "Fuel Points", earnRate: extractEarnRate(text, "fuel points") };

  return null;
}

function extractEarnRate(text: string, type: string): string {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*%\s*(?:cashback|value\s*back)/i,
    /(\d+(?:\.\d+)?)\s*x?\s*(?:reward|edge|fuel|bonus)?\s*point/i,
    /(\d+(?:\.\d+)?)\s*(?:reward|edge|fuel)?\s*point(?:s)?\s*(?:per|for\s*every)\s*(?:rs\.?|₹)\s*(\d+)/i,
    /up\s*to\s*(\d+(?:\.\d+)?)\s*%/i,
  ];
  for (const p of patterns) {
    const match = text.match(p);
    if (match) {
      if (match[2]) return `${match[1]} ${type} per ₹${match[2]}`;
      if (text.includes("%")) return `${match[1]}% ${type}`;
      return `${match[1]}x ${type}`;
    }
  }
  return `Standard ${type} earning`;
}

// ── Cross-contamination check ─────────────────────────────────

const KNOWN_BANK_NAMES = [
  "HDFC", "ICICI", "SBI", "Axis", "Kotak", "IndusInd", "RBL", "IDFC",
  "Federal", "YES", "HSBC", "Standard Chartered", "Citibank", "American Express",
  "AU Small Finance", "Bank of Baroda", "Canara", "PNB", "Union", "BPCL",
  "IOC", "IndianOil", "Bajaj", "Tata", "Flipkart", "Amazon",
];

function isCrossContaminated(benefitText: string, cardBankName: string): boolean {
  const text = benefitText.toLowerCase();
  const cardBank = cardBankName.toLowerCase();
  for (const bank of KNOWN_BANK_NAMES) {
    const bankLower = bank.toLowerCase();
    if (cardBank.includes(bankLower)) continue;
    if (text.includes(`${bankLower} card`) || text.includes(`${bankLower} bank`)) {
      return true;
    }
    const cardPattern = new RegExp(`\\b${bankLower}\\b.*\\bcard\\b`, "i");
    if (cardPattern.test(benefitText) && !cardBank.includes(bankLower)) {
      return true;
    }
  }
  return false;
}

// ── Main seed function ─────────────────────────────────────────

async function main() {
  const force = process.argv.includes("--force");
  const cardsPath = path.resolve(__dirname, "..", "data", "cards.json");

  if (!fs.existsSync(cardsPath)) {
    console.error(`Error: ${cardsPath} not found. Run the importer first:\n  npx tsx scripts/import-paisabazaar.ts`);
    process.exit(1);
  }

  const raw = fs.readFileSync(cardsPath, "utf-8");
  const cards: ExtractedCard[] = JSON.parse(raw);

  console.log("═══════════════════════════════════════════════════");
  console.log("  Paisabazaar Card Seeder");
  console.log(`  Mode: ${force ? "FORCE UPDATE" : "SKIP EXISTING"}`);
  console.log(`  Cards to process: ${cards.length}`);
  console.log("═══════════════════════════════════════════════════\n");

  const stats: SeedStats = {
    banksCreated: 0,
    cardsCreated: 0,
    cardsSkipped: 0,
    cardsUpdated: 0,
    benefitsCreated: 0,
    benefitsSkipped: 0,
    programsCreated: 0,
    errors: [],
  };

  const bankCache = new Map<string, string>();

  for (const card of cards) {
    try {
      // 1. Find or create Bank
      let bankId = bankCache.get(card.bankName);
      if (!bankId) {
        const code = deriveBankCode(card.bankName);
        let bank = await prisma.bank.findFirst({
          where: { OR: [{ code }, { name: card.bankName }] },
        });
        if (!bank) {
          bank = await prisma.bank.create({
            data: { name: card.bankName, code },
          });
          stats.banksCreated++;
          console.log(`  + Bank: ${card.bankName} (${code})`);
        }
        bankId = bank.id;
        bankCache.set(card.bankName, bankId);
      }

      // 2. Check if card exists
      const existing = await prisma.card.findFirst({
        where: { name: card.cardName, bankId },
      });

      if (existing && !force) {
        stats.cardsSkipped++;
        continue;
      }

      // 3. Compute estimated annual value from benefits (filter cross-contaminated)
      const allBenefitEntries = card.keyBenefits.map((text) => {
        const category = classifyBenefitCategory(text);
        return {
          category,
          title: text.slice(0, 100),
          description: text,
          valueEstimate: estimateBenefitValue(text, category),
          contaminated: isCrossContaminated(text, card.bankName),
        };
      });
      const skipped = allBenefitEntries.filter((b) => b.contaminated);
      if (skipped.length > 0) {
        stats.benefitsSkipped += skipped.length;
        console.log(`  ⚠ Skipped ${skipped.length} cross-contaminated benefit(s) for ${card.cardName}`);
      }
      const benefitEntries = allBenefitEntries.filter((b) => !b.contaminated).map(({ contaminated: _, ...rest }) => rest);
      const estimatedAnnualValue = benefitEntries.reduce((s, b) => s + b.valueEstimate, 0);

      if (existing) {
        // Update existing card
        await prisma.card.update({
          where: { id: existing.id },
          data: {
            network: card.network,
            annualFee: card.annualFee,
            joiningFee: card.joiningFee,
            imageUrl: card.imageUrl ?? existing.imageUrl,
            bestFor: card.category,
            estimatedAnnualValue: estimatedAnnualValue > 0 ? estimatedAnnualValue : existing.estimatedAnnualValue,
          },
        });

        // Replace benefits
        await prisma.benefit.deleteMany({ where: { cardId: existing.id } });
        for (const b of benefitEntries) {
          await prisma.benefit.create({
            data: { cardId: existing.id, ...b },
          });
        }

        stats.cardsUpdated++;
        stats.benefitsCreated += benefitEntries.length;
        console.log(`  ↻ Updated: ${card.cardName}`);
      } else {
        // Create new card
        const newCard = await prisma.card.create({
          data: {
            bankId,
            name: card.cardName,
            network: card.network,
            cardType: "credit",
            annualFee: card.annualFee,
            joiningFee: card.joiningFee,
            imageUrl: card.imageUrl,
            bestFor: card.category,
            estimatedAnnualValue,
            color: "#6366f1",
          },
        });

        // Create benefits
        for (const b of benefitEntries) {
          await prisma.benefit.create({
            data: { cardId: newCard.id, ...b },
          });
        }

        // Create reward program if detectable
        const programInfo = extractRewardProgram(card);
        if (programInfo) {
          await prisma.normalizedProgram.create({
            data: {
              cardId: newCard.id,
              name: programInfo.name,
              pointName: programInfo.pointName,
              earnRate: programInfo.earnRate,
            },
          });
          stats.programsCreated++;
        }

        stats.cardsCreated++;
        stats.benefitsCreated += benefitEntries.length;
        console.log(`  + Card: ${card.cardName} (${card.bankName}) — ₹${estimatedAnnualValue} est. value`);
      }
    } catch (err) {
      const msg = `Failed: ${card.cardName} — ${(err as Error).message}`;
      stats.errors.push(msg);
      console.error(`  ✗ ${msg}`);
    }
  }

  // Print summary
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  Seed Summary");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Banks created:    ${stats.banksCreated}`);
  console.log(`  Cards created:    ${stats.cardsCreated}`);
  console.log(`  Cards updated:    ${stats.cardsUpdated}`);
  console.log(`  Cards skipped:    ${stats.cardsSkipped}`);
  console.log(`  Benefits created: ${stats.benefitsCreated}`);
  console.log(`  Benefits skipped: ${stats.benefitsSkipped} (cross-contaminated)`);
  console.log(`  Programs created: ${stats.programsCreated}`);
  if (stats.errors.length > 0) {
    console.log(`  Errors:           ${stats.errors.length}`);
    for (const e of stats.errors) console.log(`    - ${e}`);
  }
  console.log("═══════════════════════════════════════════════════");

  // Verify final counts
  const totalBanks = await prisma.bank.count();
  const totalCards = await prisma.card.count();
  const totalBenefits = await prisma.benefit.count();
  console.log(`\nDatabase totals: ${totalBanks} banks, ${totalCards} cards, ${totalBenefits} benefits`);
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
