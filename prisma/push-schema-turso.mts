import "dotenv/config";
import { createClient } from "@libsql/client";
import { execSync } from "child_process";

const url = process.env.TURSO_DATABASE_URL!;
const authToken = process.env.TURSO_AUTH_TOKEN!;
const client = createClient({ url, authToken });

// Drop all tables with retry (FK ordering)
console.log("Dropping existing tables...");
for (let i = 0; i < 10; i++) {
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream_%'"
  );
  if (tables.rows.length === 0) break;
  for (const row of tables.rows) {
    try { await client.execute(`DROP TABLE IF EXISTS "${row.name}"`); } catch {}
  }
}

// Generate the full SQL from Prisma schema
console.log("Generating schema SQL...");
const sql = execSync(
  "npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script",
  { encoding: "utf-8", cwd: process.cwd() }
);

// Extract CREATE TABLE and CREATE INDEX statements
const statements = sql
  .split(";")
  .map(s => s.replace(/--[^\n]*/g, "").trim())
  .filter(s => s.length > 0);

// Separate tables without FK deps, with FK deps, and indexes
const noFk: string[] = [];
const withFk: string[] = [];
const indexes: string[] = [];

for (const stmt of statements) {
  if (stmt.toUpperCase().startsWith("CREATE INDEX") || stmt.toUpperCase().startsWith("CREATE UNIQUE INDEX")) {
    indexes.push(stmt);
  } else if (stmt.includes("FOREIGN KEY")) {
    withFk.push(stmt);
  } else {
    noFk.push(stmt);
  }
}

// Execute: tables without FK first, then tables with FK, then indexes
const ordered = [...noFk, ...withFk, ...indexes];
console.log(`Executing ${ordered.length} statements...`);

let success = 0;
let errors = 0;
for (const stmt of ordered) {
  try {
    await client.execute(stmt);
    success++;
  } catch (e: unknown) {
    const msg = String(e);
    console.warn(`  ERR: ${msg.slice(0, 200)}`);
    errors++;
  }
}

// Verify
const finalTables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
);
console.log(`\n${success} succeeded, ${errors} failed`);
console.log(`${finalTables.rows.length} tables created:`);
for (const row of finalTables.rows) {
  console.log(`  - ${row.name}`);
}

client.close();
