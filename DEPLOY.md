# Deployment Guide — Kanban Controller

## Prerequisites
- GitHub account (ben-Eyasu)
- Neon database (free tier)
- Vercel account (free tier)
- OpenRouter API key (free tier)

## Step 1: Create GitHub Repo

### Option A: Using GitHub CLI (if installed)
```bash
gh repo create kanban-controller --public --description "Personal idea-to-live website control tower"
```

### Option B: Manual
1. Go to https://github.com/new
2. Name: `kanban-controller`
3. Description: `Personal idea-to-live website control tower with kanban board, project templates, GitHub integration, and AI assistant`
4. Public
5. Do NOT initialize with README (we already have one)
6. Create repo

### Push to GitHub
```bash
cd "C:\Users\abeni\OneDrive\Documents\Gravity\kanban\kanban-controller"
git remote add origin https://github.com/ben-Eyasu/kanban-controller.git
git push -u origin master
```

## Step 2: Create Neon Database

1. Go to https://neon.tech
2. Sign in with GitHub
3. Create a new project
4. Copy the connection string (looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=required`)
5. Save this as DATABASE_URL

## Step 3: Run Database Migration

```bash
# Add DATABASE_URL to .env.local
echo 'DATABASE_URL="your-neon-connection-string"' >> .env.local

# Generate Prisma client and run migration
pnpm prisma generate
pnpm prisma migrate dev --name init
```

## Step 4: Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Application name: `Kanban Controller`
4. Homepage URL: `http://localhost:3000` (update after deploy)
5. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
6. Click "Register application"
7. Copy the Client ID
8. Generate a Client Secret and copy it

## Step 5: Get OpenRouter API Key

1. Go to https://openrouter.ai/keys
2. Create a new key
3. Copy the key

## Step 6: Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Import the `kanban-controller` repo
5. Framework: Next.js (auto-detected)
6. Build command: `pnpm build` (auto-detected)
7. Install command: `pnpm install --no-frozen-lockfile` (auto-detected)
8. Add environment variables:

```
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=required
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-32-char-string
GITHUB_OAUTH_CLIENT_ID=your-github-oauth-client-id
GITHUB_OAUTH_CLIENT_SECRET=your-github-oauth-client-secret
OPENROUTER_API_KEY=your-openrouter-api-key
ENCRYPTION_KEY=generate-with-node-crypto-randomBytes-32
```

9. Click Deploy

## Step 7: Post-Deploy

1. Update NEXTAUTH_URL in Vercel env vars to your Vercel URL
2. Update GitHub OAuth callback URL to `https://your-app.vercel.app/api/auth/callback/github`
3. Redeploy

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | Neon PostgreSQL connection string | `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=required` |
| NEXTAUTH_URL | App URL | `https://kanban-controller.vercel.app` |
| NEXTAUTH_SECRET | Random 32-char string | Generate with `openssl rand -hex 32` |
| GITHUB_OAUTH_CLIENT_ID | GitHub OAuth App ID | `Ov23lixxxxxxxxxxxx` |
| GITHUB_OAUTH_CLIENT_SECRET | GitHub OAuth App Secret | `abc123...` |
| OPENROUTER_API_KEY | OpenRouter API key | `sk-or-v1-...` |
| ENCRYPTION_KEY | 32-byte hex string for AES-256-GCM | Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

## Troubleshooting

### Build fails on Vercel
- Check that `pnpm-lock.yaml` is committed
- Verify all env vars are set
- Check build logs in Vercel dashboard

### Database connection fails
- Ensure DATABASE_URL has `?sslmode=required`
- Check Neon project is not paused (free tier pauses after inactivity)

### Auth not working
- Verify NEXTAUTH_URL matches your Vercel URL exactly
- Check GitHub OAuth callback URL matches
- Ensure NEXTAUTH_SECRET is set
