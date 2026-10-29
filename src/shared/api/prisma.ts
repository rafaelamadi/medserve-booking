import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 * Uses Supabase Postgres via DATABASE_URL only — no other Supabase features (PRD §11).
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaDirect?: PrismaClient };

export const prisma =
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

/**
 * Direct (non-pooled) client for booking-critical serialisable transactions.
 * Interactive transactions + advisory guarantees do not hold over the
 * transaction-mode pooler, so capacity re-checks run here (PRD §7).
 */
export const prismaDirect =
  globalForPrisma.prismaDirect ??
  new PrismaClient({
    datasources: process.env.DIRECT_URL ? { db: { url: process.env.DIRECT_URL } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaDirect = prismaDirect;
}
