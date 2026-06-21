# Project conventions

- Stack: Next.js App Router, TypeScript, Tailwind, Prisma/Postgres, Auth.js, Anthropic SDK.
- Package manager: pnpm only.
- One phase from /docs/PLAN.md per branch/PR. Do not start a later phase tasks early.
- Never silently auto-move a project stage or save AI-generated content - always require an explicit user confirm.
- All secrets/tokens must be encrypted at rest via lib/crypto.ts (AES-256-GCM), never stored in plaintext.
- Webhook handler must verify the GitHub HMAC signature before processing anything, and must be idempotent on the delivery ID.
- Webhook handler must return 200 immediately after signature verification - process events asynchronously via a queue.
- All GitHub API calls must use rate-limit handling with exponential backoff.
- AI endpoints must enforce per-user rate limits to prevent runaway token usage.
- After implementing a phase, run through that phase acceptance criteria in PLAN.md and report results before moving on.
