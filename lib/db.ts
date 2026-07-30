import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Prisma 7's client requires an explicit driver adapter — no more implicit
 * "read DATABASE_URL and pick an engine" behavior. We pick the adapter from the
 * connection string's scheme so local dev (SQLite, file:...) and a deployed
 * environment (Postgres, postgres://... / postgresql://...) both work without
 * touching this file — only DATABASE_URL changes.
 */
function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";

  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
    return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3") as typeof import("@prisma/adapter-better-sqlite3");
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
