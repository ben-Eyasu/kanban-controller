const { PrismaClient } = require('@prisma/client');

// Use Prisma with direct WebSocket connection to Neon
// Neon supports both HTTP and WebSocket protocols
const url = 'postgresql://neondb_owner:***@ep-wandering-sunset-adnnkv76-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function test() {
  try {
    // Pass the URL via environment variable
    process.env.DATABASE_URL = url;
    
    const prisma = new PrismaClient();
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('SUCCESS:', JSON.stringify(result));
    await prisma.$disconnect();
  } catch(e) {
    console.log('FAIL:', e.message?.substring(0, 300));
  }
}

test();
