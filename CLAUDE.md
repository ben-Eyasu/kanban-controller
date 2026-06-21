# Project conventions

- Stack: Next.js App Router, TypeScript, Tailwind, Prisma/Postgres, Auth.js, OpenRouter API.
- Package manager: pnpm only.
- One phase from /docs/PLAN.md per branch/PR. Do not start a later phase tasks early.
- Never silently auto-move a project stage or save AI-generated content - always require an explicit user confirm.
- All secrets/tokens must be encrypted at rest via lib/crypto.ts (AES-256-GCM), never stored in plaintext.
- Webhook handler must verify the GitHub HMAC signature before processing anything, and must be idempotent on the delivery ID.
- Webhook handler must return 200 immediately after signature verification - process events asynchronously via a queue.
- All GitHub API calls must use rate-limit handling with exponential backoff.
- AI endpoints must enforce per-user rate limits to prevent runaway token usage.
- After implementing a phase, run through that phase acceptance criteria in PLAN.md and report results before moving on.

## Next.js 16 notes
- `eslint` config in next.config.ts is no longer supported. Use `next lint` CLI or ESLint config file directly.
- Prisma 7 requires an adapter at runtime: `new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })`. Install `@prisma/adapter-pg` and `pg`.
- Prisma 7 generated client has no barrel index.ts — we maintain a manual one at lib/generated/prisma/index.ts.
