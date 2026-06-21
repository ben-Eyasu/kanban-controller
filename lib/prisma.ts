import { PrismaClient } from "./generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neon, Pool } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes("user:password")) {
    return undefined;
  }

  try {
    // Use the neon serverless driver as a pool for PrismaNeon adapter
    const client = neon(connectionString);
    // Wrap the neon client in a pool-like interface
    const adapter = new PrismaNeon({ query: client, execute: client } as any);
    return new PrismaClient({ adapter });
  } catch (e) {
    console.error("Prisma client creation failed:", e);
    return undefined;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}
