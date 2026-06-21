import { PrismaClient } from "./generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 requires an adapter at runtime. For scaffold, pass empty config.
// In production, use: new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
export const prisma = globalForPrisma.prisma ?? new (PrismaClient as any)();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
