import "dotenv/config";
import { createClient } from "@libsql/client";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env");
  process.exit(1);
}

const client = createClient({ url, authToken });

const migrationsDir = join(import.meta.dirname!, "migrations");
const folders = readdirSync(migrationsDir).sort();

console.log(`Pushing ${folders.length} migrations to Turso...`);

for (const folder of folders) {
  const sqlPath = join(migrationsDir, folder, "migration.sql");
  try {
    const sql = readFileSync(sqlPath, "utf-8");
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      try {
        await client.execute(stmt);
      } catch (e: unknown) {
        const msg = String(e);
        if (msg.includes("already exists")) continue;
        console.warn(`  Warning in ${folder}: ${msg.slice(0, 120)}`);
      }
    }
    console.log(`  ✓ ${folder}`);
  } catch {
    console.log(`  - Skipped ${folder} (no migration.sql)`);
  }
}

console.log("Schema push complete!");
client.close();
