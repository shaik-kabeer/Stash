import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config();

const url = process.env.TURSO_DATABASE_URL!;
const authToken = process.env.TURSO_AUTH_TOKEN!;

if (!url || !authToken) {
  console.error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set");
  process.exit(1);
}

const client = createClient({ url, authToken });

const TABLES = [
  `CREATE TABLE IF NOT EXISTS "ProgramValuation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "redemptionType" TEXT NOT NULL,
    "valuePerPoint" REAL NOT NULL,
    "confidenceScore" REAL NOT NULL DEFAULT 0.5,
    "sourceUrl" TEXT,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgramValuation_programId_fkey" FOREIGN KEY ("programId") REFERENCES "NormalizedProgram" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "RewardHealthScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "expiringPoints" REAL NOT NULL DEFAULT 0,
    "unusedBenefits" INTEGER NOT NULL DEFAULT 0,
    "inactiveCards" INTEGER NOT NULL DEFAULT 0,
    "potentialLoss" REAL NOT NULL DEFAULT 0,
    "factors" TEXT,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RewardHealthScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "GoalPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "destination" TEXT,
    "targetValue" REAL NOT NULL,
    "targetCurrency" TEXT NOT NULL DEFAULT 'INR',
    "currentProgress" REAL NOT NULL DEFAULT 0,
    "recommendedCards" TEXT,
    "earningStrategy" TEXT,
    "projectedDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GoalPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "MerchantCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "description" TEXT
  )`,
];

const INDEXES = [
  `CREATE UNIQUE INDEX IF NOT EXISTS "MerchantCategory_code_key" ON "MerchantCategory"("code")`,
];

async function main() {
  console.log("Pushing missing tables to Turso...\n");

  for (const sql of TABLES) {
    const tableName = sql.match(/"(\w+)"/)?.[1] ?? "unknown";
    try {
      await client.execute(sql);
      console.log(`  [OK] ${tableName}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  [SKIP] ${tableName}: ${msg}`);
    }
  }

  for (const sql of INDEXES) {
    try {
      await client.execute(sql);
      console.log(`  [OK] index created`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  [SKIP] index: ${msg}`);
    }
  }

  // Verify all tables exist
  const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log("\nAll tables in Turso:");
  for (const row of result.rows) {
    console.log(`  - ${row.name}`);
  }

  console.log("\nDone!");
}

main().catch(console.error);
