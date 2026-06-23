import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

async function createAdapter() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    const { PrismaLibSql } = await import("@prisma/adapter-libsql");
    return new PrismaLibSql({ url: tursoUrl, authToken: tursoToken });
  }

  const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
  return new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || "file:./dev.db",
  });
}

let prismaPromise: Promise<PrismaClient> | null = null;

function getPrismaPromise() {
  if (!prismaPromise) {
    prismaPromise = createAdapter().then((adapter) => {
      const client = new PrismaClient({ adapter });
      globalForPrisma.prisma = client;
      return client;
    });
  }
  return prismaPromise;
}

export const prisma = globalForPrisma.prisma || await getPrismaPromise();
