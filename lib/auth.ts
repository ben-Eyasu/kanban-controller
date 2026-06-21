import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

// Auth.js v4 requires a database adapter for handlers to work.
// For scaffold, we create a minimal config. The Prisma adapter will be
// added in Phase 1 when the database is connected.
// For now, export placeholder handlers that return 501.

export async function GET() {
  return new Response("Auth not configured — connect database first", {
    status: 501,
  });
}

export async function POST() {
  return new Response("Auth not configured — connect database first", {
    status: 501,
  });
}

// Export auth helper for server components (also placeholder)
export async function auth() {
  return null;
}

export async function signIn() {
  throw new Error("Auth not configured — connect database first");
}

export async function signOut() {
  throw new Error("Auth not configured — connect database first");
}
