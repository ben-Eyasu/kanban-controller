import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!prisma) {
      return Response.json({ error: "Prisma client not initialized", env: !!process.env.DATABASE_URL });
    }
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    return Response.json({ status: "ok", result, tables });
  } catch (error: any) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
