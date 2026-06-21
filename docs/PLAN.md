# AI Agent Execution Plan — Kanban Project Controller

This is written to be handed directly to a coding agent (e.g. Claude Code), phase by phase. Each phase is self-contained: objective, tasks, exact technical decisions, and acceptance criteria the agent (or you) can check off before moving on. Do not start phase N+1 until phase N's acceptance criteria all pass.

**Assumption locked in:** personal/single-workspace use first. The data model still has a `Workspace` table so multi-tenant team support is a later addition, not a rewrite.

---

## 0. How to run this with an AI agent

1. Create the repo, drop this file in at `/docs/PLAN.md`.
2. Create a `CLAUDE.md` at the repo root (template at the end of this doc) so the agent retains project conventions across sessions.
3. Workflow: **one phase = one branch = one PR.** The agent implements the phase, runs the acceptance checks itself where possible (tests, manual checklist), then stops and reports rather than auto-continuing into the next phase.
4. Kickoff prompt template (copy-paste per phase):
   > "Read /docs/PLAN.md and /CLAUDE.md. Implement Phase N exactly as scoped — don't start tasks from later phases. When done, run through the Phase N acceptance criteria yourself and report the results before I review."

---

## 1. Locked technical decisions

No ambiguity here — the agent shouldn't re-decide these mid-build.

| Layer | Choice |
|---|---|
| Framework | Next.js, App Router, TypeScript, latest stable |
| Styling | Tailwind CSS |
| Package manager | pnpm |
| Database | PostgreSQL (Neon or Supabase) |
| ORM | Prisma |
| Auth | Auth.js (NextAuth), GitHub OAuth provider |
| Drag-and-drop | `@hello-pangea/dnd` |
| Charts (Phase 9) | Recharts |
| AI | Anthropic API via `@anthropic-ai/sdk` |
| Hosting | Vercel |
| Background processing | Webhook handler returns 200 immediately; process events asynchronously via a simple in-memory queue (or Upstash + BullMQ if Phase 5 testing shows volume issues). Never do heavy work inline in the webhook handler. |

---

## 2. Environment variables (provision all of these before Phase 1)

```
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_APP_WEBHOOK_SECRET=
GITHUB_APP_CLIENT_ID=
GITHUB_APP_CLIENT_SECRET=
ANTHROPIC_API_KEY=
ENCRYPTION_KEY=          # 32-byte key for AES-256-GCM, used to encrypt any stored tokens
```

Note: the GitHub **OAuth App** credentials (login) and GitHub **App** credentials (automation) are deliberately separate — don't conflate them, even though both live in the same GitHub org settings UI.

---

## 3. Target repository structure

```
/app
  /(auth)/sign-in
  /(app)/dashboard
  /(app)/board
  /(app)/templates
  /(app)/projects/new
  /(app)/projects/[id]
  /(app)/settings/integrations
  /(app)/settings/account
  /(app)/portfolio          # internal management view
  /(app)/metrics
  /p/[slug]                 # public portfolio page, no auth
  /api/webhooks/github
  /api/ai/refine-brief
  /api/ai/generate-checklist
  /api/ai/summarize-activity
  /api/github/install
  /api/github/callback       # GitHub App OAuth redirect — exchange code for user access token
  /api/github/start-project
/lib
  /prisma.ts
  /github.ts               # app auth, token generation, generate-repo helper
  /crypto.ts                # AES-256-GCM encrypt/decrypt helpers
  /ai.ts                    # Anthropic client wrapper + prompts
/prisma/schema.prisma
/docs/PLAN.md
/CLAUDE.md
```

---

## 4. Database schema (Prisma) — full target shape

Build this incrementally per phase (see migration notes below), but this is the end-state so the agent isn't guessing at relations later.

```prisma
model User {
  id        String   @id @default(cuid())
  githubId  String   @unique
  email     String?
  name      String?
  avatarUrl String?
  workspaces WorkspaceMember[]
  createdAt DateTime @default(now())
}

model Workspace {
  id        String   @id @default(cuid())
  name      String
  members   WorkspaceMember[]
  templates Template[]
  projects  Project[]
  stages    Stage[]
  integrations Integration[]
  createdAt DateTime @default(now())
}

model WorkspaceMember {
  id          String    @id @default(cuid())
  userId      String
  workspaceId String
  role        String    @default("owner") // Phase 1: only "owner" used
  user        User      @relation(fields: [userId], references: [id])
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  @@unique([userId, workspaceId])
}

model Integration {
  id             String   @id @default(cuid())
  workspaceId    String
  type           String   // "github_app"
  installationId String?
  encryptedToken String?  // only for non-GitHub-App provider tokens, if ever added
  workspace      Workspace @relation(fields: [workspaceId], references: [id])
  createdAt      DateTime @default(now())
}

model Template {
  id                  String   @id @default(cuid())
  workspaceId         String
  name                String
  description         String?
  templateRepoFullName String  // "owner/repo", must be marked as a GitHub template repo
  defaultChecklist    Json?    // string[]
  defaultStack        String?
  workspace           Workspace @relation(fields: [workspaceId], references: [id])
  projects            Project[]
  createdAt           DateTime @default(now())
}

model Stage {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  order       Int
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  projects    Project[]
}

model Project {
  id                 String   @id @default(cuid())
  workspaceId        String
  templateId         String?
  stageId            String
  name               String
  brand              String?
  brief              String?           // Phase 8: AI-refined brief text
  githubRepoFullName String?
  workspace          Workspace @relation(fields: [workspaceId], references: [id])
  template           Template? @relation(fields: [templateId], references: [id])
  stage              Stage     @relation(fields: [stageId], references: [id])
  tasks              Task[]
  activity           ActivityEvent[]
  deployments        Deployment[]
  aiMessages         AiMessage[]
  portfolioEntry     PortfolioEntry?
  createdAt          DateTime @default(now())
  startedAt          DateTime?         // set when "Start project" is clicked
}

model Task {
  id              String   @id @default(cuid())
  projectId       String
  title           String
  done            Boolean  @default(false)
  source          String   @default("manual") // "manual" | "github_issue"
  githubIssueNumber Int?
  project         Project  @relation(fields: [projectId], references: [id])
  createdAt       DateTime @default(now())
}

model ActivityEvent {
  id          String   @id @default(cuid())
  projectId   String
  source      String   @default("github")
  type        String   // "push" | "pull_request" | "issues" | "deployment_status"
  deliveryId  String   @unique   // GitHub's X-GitHub-Delivery header, for idempotency
  payload     Json
  project     Project  @relation(fields: [projectId], references: [id])
  createdAt   DateTime @default(now())
}

model Deployment {
  id          String   @id @default(cuid())
  projectId   String
  environment String   // "preview" | "staging" | "production"
  url         String
  status      String   // "success" | "failure" | "pending"
  provider    String?  // inferred from payload, e.g. "vercel"
  project     Project  @relation(fields: [projectId], references: [id])
  createdAt   DateTime @default(now())
}

model AiMessage {
  id        String   @id @default(cuid())
  projectId String
  role      String   // "user" | "assistant"
  content   String
  project   Project  @relation(fields: [projectId], references: [id])
  createdAt DateTime @default(now())
}

model PortfolioEntry {
  id          String   @id @default(cuid())
  projectId   String   @unique
  publicSlug  String   @unique
  isPublic    Boolean  @default(false)
  summary     String?
  coverImageUrl String?
  project     Project  @relation(fields: [projectId], references: [id])
}
```

---

## 4.5 Phase-to-model migration map

Build the Prisma schema incrementally. Each phase adds only the models it needs — don't create the full schema at once or you'll have FK constraints pointing at tables that don't exist yet.

| Phase | Models added | Notes |
|-------|-------------|-------|
| 0 | (empty initial migration) | Just verify Prisma connects |
| 1 | User, Workspace, WorkspaceMember | No FK issues — self-contained |
| 2 | Template | FK → Workspace (exists from Phase 1) |
| 3 | Stage, Project, Task | FK → Workspace, Template, Project respectively |
| 4 | Integration | FK → Workspace |
| 5 | ActivityEvent | FK → Project |
| 6 | (no new models) | Uses ActivityEvent + Stage |
| 7 | Deployment | FK → Project |
| 8 | AiMessage | FK → Project |
| 9 | PortfolioEntry | FK → Project (unique) |

Run `pnpm prisma migrate dev` after each phase's model changes. Never skip a migration.

---

## 5. Phases

### Phase 0 — Scaffold and infrastructure
**Tasks**
- [ ] `pnpm create next-app` with TypeScript + Tailwind + App Router
- [ ] Connect Prisma to the Postgres instance, run an empty initial migration
- [ ] Add `.env.example` listing every variable from Section 2 (no real values)
- [ ] Generate `ENCRYPTION_KEY`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` — add to `.env.local` (never commit)
- [ ] Push to GitHub, connect the repo to Vercel, confirm a default page deploys
- [ ] Add `CLAUDE.md` (template below)

**Acceptance criteria**
- `pnpm dev` runs locally with no errors
- `pnpm prisma migrate dev` succeeds against the real database
- The default page is reachable at a live Vercel URL

---

### Phase 1 — Auth and workspace shell
**Tasks**
- [ ] Auth.js with GitHub OAuth provider (login-only scope, e.g. `read:user user:email`)
- [ ] On first login: create `User`, then a `Workspace` + `WorkspaceMember` row if none exists for that user
- [ ] Auth middleware protecting everything under `/app/(app)/*`
- [ ] App shell: sidebar nav (Dashboard, Board, Templates, Settings), top bar with user avatar + sign out
- [ ] Empty-state dashboard page

**Acceptance criteria**
- Logging in with a real GitHub account creates exactly one `User`/`Workspace` pair, and logging in again doesn't duplicate it
- Visiting `/board` while signed out redirects to sign-in
- Sign out clears the session

---

### Phase 2 — Templates
**Tasks**
- [ ] Template CRUD: list, create, edit, delete, scoped to the user's workspace
- [ ] Form fields: name, description, `templateRepoFullName` (validate `owner/repo` shape with a regex — don't verify it's an actual GitHub template yet, that's Phase 4), `defaultChecklist` (repeatable text input), `defaultStack`
- [ ] Seed two example templates on first workspace creation (e.g. "Next.js marketing site", "Static portfolio")

**Acceptance criteria**
- Can create, edit, and delete a template through the UI; data persists after refresh
- Submitting a malformed repo string (e.g. missing the slash) shows a validation error instead of saving

---

### Phase 3 — Projects and the kanban board (no GitHub yet)
**Tasks**
- [ ] Seed default `Stage` rows per workspace: Backlog, Planning, Repo created, In development, In review, Staging deployed, Production deployed, Live
- [ ] New Project wizard: step 1 (name, brand, description) → step 2 (pick a template or skip) → step 3 (review, create). Leave a clearly marked but inert placeholder for the AI brief step — built in Phase 8, not now
- [ ] Kanban board page: columns = stages in order, cards = projects, drag-and-drop updates `Project.stageId`
- [ ] Project detail page with tabs: Overview (editable name/brand/brief text), Checklist (add/check/delete `Task` rows), Settings (rename, delete project)

**Acceptance criteria**
- Creating a project lands it in "Backlog"
- Dragging a card to another column persists after a page refresh
- Checklist items can be added, checked, and removed from the detail page

---

### Phase 4 — GitHub App install and repo-from-template
**Known gotcha — spike this first, before writing the rest of the phase:** the `POST /repos/{template_owner}/{template_repo}/generate` endpoint is documented as available to GitHub App installation (server-to-server) tokens, but real-world reports show it failing with a "Resource not accessible by integration" error when called that way against a personal account. The reliable path is a **GitHub App user access token** (the user-to-server flow, obtained via the App's own OAuth-style user authorization step) for this specific call. Test both against your own account before writing the production code path, and build for whichever actually works — don't assume the docs' endpoint list guarantees it works with an installation token.

**Tasks**
- [ ] Register the GitHub App (manifest skeleton below) with repository permissions: Contents (read/write), Administration (read/write), Issues (read), Pull requests (read), Deployments (read); webhook events: `push`, `pull_request`, `issues`, `deployment_status`
- [ ] Build `/settings/integrations`: "Connect GitHub" → App installation flow → store `installationId` on an `Integration` row
- [ ] Implement the user-authorization step needed for repo generation (per the gotcha above) alongside the installation flow
- [ ] Build `/api/github/callback` handler for the GitHub App OAuth redirect — exchange the code for a user access token, store it encrypted
- [ ] "Start project" action on the project detail page: calls the generate-from-template endpoint with the correct token type, creates the repo under the connected account, stores `githubRepoFullName` and `startedAt` on the `Project`, moves it to "Repo created"
- [ ] Show the repo URL and a `git clone` command on the detail page
- [ ] Implement rate-limit handling with exponential backoff for all GitHub API calls (don't defer this — it will bite on the first burst of webhook activity)

**Acceptance criteria**
- Clicking "Start" on a project linked to a real GitHub template repo creates an actual new repository under the connected account
- The repo link appears on the project and the stage updates automatically
- Clicking "Start" twice on the same project doesn't create a second repo (guard against double-submission)

---

### Phase 5 — Webhook ingestion and activity feed
**Tasks**
- [ ] `/api/webhooks/github` route: verify the `X-Hub-Signature-256` header against `GITHUB_APP_WEBHOOK_SECRET` using HMAC-SHA256, reject anything that doesn't match
- [ ] Handler returns 200 immediately after signature verification — push the payload onto an in-memory queue (or Upstash + BullMQ) for async processing. Never do DB writes or API calls inline.
- [ ] Async queue worker: handle `push`, `pull_request`, `issues` payloads → write `ActivityEvent` rows, deduped on the `X-GitHub-Delivery` header (unique constraint already in the schema, so a duplicate insert should fail safely, not throw a 500)
- [ ] Activity feed UI on the project detail page (reverse-chronological)
- [ ] Workspace-level notifications page aggregating activity across all projects

**Acceptance criteria**
- Pushing a real commit to the linked repo shows up in the project's feed within a few seconds
- Manually replaying the same webhook delivery (GitHub's UI lets you redeliver) does not create a duplicate row

---

### Phase 6 — Stage-suggestion automation
**Tasks**
- [ ] On `pull_request` opened → show a dismissible "Move to In review?" suggestion banner on the project card/detail page (don't auto-move silently)
- [ ] On `pull_request` merged → suggest moving to the next stage after In review
- [ ] Optional toggle per project: mirror GitHub Issues as `Task` rows; closing the GitHub issue checks off the corresponding task

**Acceptance criteria**
- Opening a real PR on the linked repo surfaces a one-click suggestion; accepting it updates the stage; dismissing it leaves the stage untouched
- With issue-mirroring enabled, closing a linked GitHub issue checks off the matching task within a few seconds

---

### Phase 7 — Deployment tracking
**Tasks**
- [ ] Extend the webhook handler for `deployment_status` payloads → write `Deployment` rows (`environment`, `url` from `target_url`, `status`, best-effort `provider` guess from the payload's `creator`/`environment` fields)
- [ ] Show deployment badges with live links on the kanban card and the project detail page (e.g. "Preview ✅" / "Production ✅", each linking out)

**Acceptance criteria**
- Connecting the generated repo to any provider that integrates with GitHub Deployments (Vercel, Netlify, Render) and pushing a commit results in a deployment link appearing on the project — with zero provider-specific code written

---

### Phase 8 — AI assistant
**Tasks**
- [ ] `/api/ai/refine-brief`: takes the user's rough idea text + selected template context, calls the Claude API with a system prompt that asks 2-3 clarifying questions then produces a structured brief (goal, audience, key pages/features, success criteria); store the exchange in `AiMessage`
- [ ] Wire this into the New Project wizard's placeholder step from Phase 3 as a chat panel
- [ ] `/api/ai/generate-checklist`: brief text → suggested `Task` list; user reviews and edits before anything is saved
- [ ] `/api/ai/summarize-activity`: project's recent `ActivityEvent` rows → one or two plain-language sentences, shown on the detail page behind a manual refresh button (don't auto-run on every page load — costs tokens for no benefit)
- [ ] Add per-user rate limiting to all AI endpoints (e.g. 10 requests/minute, 100/day) to prevent runaway token usage — use a simple in-memory counter or Redis if available

**Acceptance criteria**
- Creating a new project surfaces a working chat that turns "a one-line idea" into a structured brief and an editable starter checklist
- Nothing the AI generates is saved without an explicit user confirm step

---

### Phase 9 — Portfolio and controlling dashboard
**Tasks**
- [ ] "Publish to portfolio" toggle, available once a project reaches the "Live" stage; generates a `PortfolioEntry` with a unique `publicSlug`
- [ ] Public page at `/p/[slug]` (no auth) rendering summary, live link, and an optional cover image
- [ ] Metrics dashboard: idea-to-live time per project (`startedAt`/creation to first "Live" transition), deployments per month, projects shipped per month — computed from real stored data, not placeholders
- [ ] Basic charts with Recharts

**Acceptance criteria**
- Toggling publish produces a working, reachable public URL with no login required
- Dashboard numbers change correctly when a new project ships

---

### Phase 10 — Polish (optional, do last)
- [ ] Mobile responsiveness pass on the board and detail pages
- [ ] Empty states and error boundaries throughout
- [ ] Basic automated tests for the webhook handler (signature verification, idempotency) and the repo-generation flow

---

## 6. Appendices

### A. GitHub App manifest skeleton
```json
{
  "name": "your-app-name",
  "url": "https://your-deployed-app.vercel.app",
  "hook_attributes": { "url": "https://your-deployed-app.vercel.app/api/webhooks/github" },
  "redirect_url": "https://your-deployed-app.vercel.app/api/github/callback",
  "public": false,
  "default_permissions": {
    "contents": "write",
    "administration": "write",
    "issues": "read",
    "pull_requests": "read",
    "deployments": "read",
    "metadata": "read"
  },
  "default_events": ["push", "pull_request", "issues", "deployment_status"]
}
```

### B. CLAUDE.md template
```markdown
# Project conventions

- Stack: Next.js App Router, TypeScript, Tailwind, Prisma/Postgres, Auth.js, Anthropic SDK.
- Package manager: pnpm only — never npm/yarn lockfiles.
- One phase from /docs/PLAN.md per branch/PR. Do not start a later phase's tasks early.
- Never silently auto-move a project's stage or save AI-generated content — always require an explicit user confirm.
- All secrets/tokens that aren't already environment variables (e.g. third-party deploy tokens, if added later) must be encrypted at rest via lib/crypto.ts (AES-256-GCM), never stored in plaintext.
- Webhook handler must verify the GitHub HMAC signature before processing anything, and must be idempotent on the delivery ID.
- Webhook handler must return 200 immediately after signature verification — process events asynchronously via a queue. Never do DB writes or API calls inline.
- All GitHub API calls must use rate-limit handling with exponential backoff (don't defer this to a later phase).
- AI endpoints must enforce per-user rate limits to prevent runaway token usage.
- After implementing a phase, run through that phase's acceptance criteria in PLAN.md and report results before moving on.
```

### C. Sample Claude API system prompt (Phase 8, brief refinement)
```
You are a project-scoping assistant. The user will describe a website idea in one or two sentences.
Ask at most 2-3 short clarifying questions (audience, must-have pages/features, any deadline).
Once you have enough, output a structured brief with these fields: goal, audience, key_pages, success_criteria.
Keep the whole exchange under 6 turns. Never invent specifics the user didn't imply.
```
