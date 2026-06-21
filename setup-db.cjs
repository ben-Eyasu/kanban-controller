const { neon } = require('@neondatabase/serverless');

const url = 'postgresql://neondb_owner:npg_Fl7yKre4McDf@ep-wandering-sunset-adnnkv76-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=required' + '&channel_binding=required';

async function connectWithRetry(maxRetries = 5, delayMs = 3000) {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      console.log(`Connection attempt ${i}/${maxRetries}...`);
      const sql = neon(url);
      const result = await sql`SELECT 1 as test`;
      console.log('Connected!', result);
      return sql;
    } catch (error) {
      console.log(`Attempt ${i} failed: ${error.message}`);
      if (i < maxRetries) {
        console.log(`Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw new Error('Failed to connect after all retries');
}

async function createTables() {
  const sql = await connectWithRetry();

  const tables = [
    { name: 'pgcrypto', sql: () => sql`CREATE EXTENSION IF NOT EXISTS pgcrypto` },
    { name: 'User', sql: () => sql`CREATE TABLE IF NOT EXISTS "User" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), "githubId" TEXT UNIQUE, email TEXT, name TEXT, "avatarUrl" TEXT, "createdAt" TIMESTAMP DEFAULT NOW())` },
    { name: 'Workspace', sql: () => sql`CREATE TABLE IF NOT EXISTS "Workspace" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, "createdAt" TIMESTAMP DEFAULT NOW())` },
    { name: 'WorkspaceMember', sql: () => sql`CREATE TABLE IF NOT EXISTS "WorkspaceMember" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), "userId" TEXT NOT NULL, "workspaceId" TEXT NOT NULL, role TEXT DEFAULT 'owner', "createdAt" TIMESTAMP DEFAULT NOW(), UNIQUE("userId", "workspaceId"))` },
    { name: 'Integration', sql: () => sql`CREATE TABLE IF NOT EXISTS "Integration" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), "workspaceId" TEXT NOT NULL, type TEXT NOT NULL, "installationId" TEXT, "encryptedToken" TEXT, "createdAt" TIMESTAMP DEFAULT NOW())` },
    { name: 'Template', sql: () => sql`CREATE TABLE IF NOT EXISTS "Template" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), "workspaceId" TEXT NOT NULL, name TEXT NOT NULL, description TEXT, "templateRepoFullName" TEXT NOT NULL, "defaultChecklist" JSONB, "defaultStack" TEXT, "createdAt" TIMESTAMP DEFAULT NOW())` },
    { name: 'Stage', sql: () => sql`CREATE TABLE IF NOT EXISTS "Stage" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), "workspaceId" TEXT NOT NULL, name TEXT NOT NULL, "order" INTEGER NOT NULL)` },
    { name: 'Project', sql: () => sql`CREATE TABLE IF NOT EXISTS "Project" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), "workspaceId" TEXT NOT NULL, "templateId" TEXT, "stageId" TEXT NOT NULL, name TEXT NOT NULL, brand TEXT, brief TEXT, "githubRepoFullName" TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "startedAt" TIMESTAMP)` },
    { name: 'Task', sql: () => sql`CREATE TABLE IF NOT EXISTS "Task" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), "projectId" TEXT NOT NULL, title TEXT NOT NULL, done BOOLEAN DEFAULT false, source TEXT DEFAULT 'manual', "githubIssueNumber" INTEGER, "createdAt" TIMESTAMP DEFAULT NOW())` },
    { name: 'ActivityEvent', sql: () => sql`CREATE TABLE IF NOT EXISTS "ActivityEvent" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), "projectId" TEXT NOT NULL, source TEXT DEFAULT 'github', type TEXT NOT NULL, "deliveryId" TEXT UNIQUE NOT NULL, payload JSONB NOT NULL, "createdAt" TIMESTAMP DEFAULT NOW())` },
    { name: 'Deployment', sql: () => sql`CREATE TABLE IF NOT EXISTS "Deployment" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), "projectId" TEXT NOT NULL, environment TEXT NOT NULL, url TEXT NOT NULL, status TEXT NOT NULL, provider TEXT, "createdAt" TIMESTAMP DEFAULT NOW())` },
    { name: 'AiMessage', sql: () => sql`CREATE TABLE IF NOT EXISTS "AiMessage" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), "projectId" TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, "createdAt" TIMESTAMP DEFAULT NOW())` },
    { name: 'PortfolioEntry', sql: () => sql`CREATE TABLE IF NOT EXISTS "PortfolioEntry" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), "projectId" TEXT UNIQUE NOT NULL, "publicSlug" TEXT UNIQUE NOT NULL, "isPublic" BOOLEAN DEFAULT false, summary TEXT, "coverImageUrl" TEXT, "createdAt" TIMESTAMP DEFAULT NOW())` },
    { name: 'Account', sql: () => sql`CREATE TABLE IF NOT EXISTS "Account" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), "userId" TEXT NOT NULL, type TEXT NOT NULL, provider TEXT NOT NULL, "providerAccountId" TEXT NOT NULL, "refresh_token" TEXT, "access_token" TEXT, "expires_at" INTEGER, "token_type" TEXT, scope TEXT, "id_token" TEXT, "session_state" TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), UNIQUE(provider, "providerAccountId"))` },
    { name: 'Session', sql: () => sql`CREATE TABLE IF NOT EXISTS "Session" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), "sessionToken" TEXT UNIQUE NOT NULL, "userId" TEXT NOT NULL, expires TIMESTAMP NOT NULL, "createdAt" TIMESTAMP DEFAULT NOW())` },
    { name: 'VerificationToken', sql: () => sql`CREATE TABLE IF NOT EXISTS "VerificationToken" (identifier TEXT NOT NULL, token TEXT UNIQUE NOT NULL, expires TIMESTAMP NOT NULL, "createdAt" TIMESTAMP DEFAULT NOW(), UNIQUE(identifier, token))` },
  ];

  for (const table of tables) {
    try {
      await table.sql();
      console.log(`✓ ${table.name}`);
    } catch (error) {
      console.error(`✗ ${table.name}: ${error.message}`);
    }
  }

  // Seed default workspace
  try {
    await sql`INSERT INTO "Workspace" (id, name) VALUES ('default', 'Default Workspace') ON CONFLICT DO NOTHING`;
    console.log('✓ Default workspace seeded');
  } catch (error) {
    console.error(`✗ Workspace seed: ${error.message}`);
  }

  // Seed stages
  const stages = [
    { name: 'Backlog', order: 0 },
    { name: 'Planning', order: 1 },
    { name: 'Repo created', order: 2 },
    { name: 'In development', order: 3 },
    { name: 'In review', order: 4 },
    { name: 'Staging deployed', order: 5 },
    { name: 'Production deployed', order: 6 },
    { name: 'Live', order: 7 },
  ];

  for (const stage of stages) {
    try {
      await sql`INSERT INTO "Stage" (id, "workspaceId", name, "order") VALUES (gen_random_uuid(), 'default', ${stage.name}, ${stage.order}) ON CONFLICT DO NOTHING`;
      console.log(`✓ Stage: ${stage.name}`);
    } catch (error) {
      console.error(`✗ Stage ${stage.name}: ${error.message}`);
    }
  }

  console.log('\nDone!');
  process.exit(0);
}

createTables().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
