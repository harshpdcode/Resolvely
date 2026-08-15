/**
 * Server-only Prisma singleton.
 * Import via: import { prisma } from "@/integrations/db/client.server"
 * Never import this in client-side code.
 */
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error(
      "[Prisma] DATABASE_URL is not set. Add it to your .env file.\n" +
        "Example: mysql://user:password@localhost:3306/resolvely"
    );
  }
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });
}

// Prevent multiple Prisma instances in dev (hot-reload)
export const prisma = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
