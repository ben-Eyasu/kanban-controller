import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient | undefined {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes("user:password")) {
    return undefined;
  }

  try {
    const client = new PrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = client;
    }
    return client;
  } catch (e) {
    console.error("Prisma client creation failed:", e);
    return undefined;
  }
}

// Lazy proxy: only creates PrismaClient when actually accessed at runtime.
// At build time (no DATABASE_URL), accessing .prisma returns undefined
// without throwing during module evaluation.
let _prisma: PrismaClient | undefined = undefined;
let _initialized = false;

function getPrisma(): PrismaClient | undefined {
  if (!_initialized) {
    _initialized = true;
    _prisma = createPrismaClient();
  }
  return _prisma;
}

// Export a proxy so existing `import { prisma }` usages work.
// The PrismaClient is only instantiated on first property access.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    if (!client) {
      throw new Error("Prisma client not initialized — DATABASE_URL not configured");
    }
    return (client as any)[prop];
  },
});
