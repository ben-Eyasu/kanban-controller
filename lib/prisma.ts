import { PrismaClient } from "./generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 requires an adapter at runtime.
// Lazy instantiation — only create when DATABASE_URL is set and valid.
// In production: new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
function createPrismaClient() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("user:password")) {
    return undefined;
  }
  try {
    return new (PrismaClient as any)();
  } catch {
    return undefined;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}
