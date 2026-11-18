# Raazia — Customer Inquiry, Quotation, and Custom Order Management System

D4 starter pack for the project group. This repository contains the approved product/architecture context, AI-agent instructions, implementation plan, ADRs, supporting references, Farochet UI Kit, and evidence templates. A Bootstrap scaffold for `frontend/` and `backend/` is present in the working tree; business feature slices remain unimplemented.

## Project objective

Build a working system for Raazia's crochet business to manage product catalogue information, customer inquiries, custom-order requests, quotations/negotiation, confirmed Orders, manufacturing/payment/delivery information, wishlists, estimated completion dates, and the FR-18 sales summary.

The application records manual decisions. Online payment processing, automatic refunds, courier integrations, automatic feasibility/acceptance, comprehensive inventory, and comprehensive accounting/tax functionality are outside the approved scope.

## Approved technology stack

The stack is recorded in [`ADR-006`](./ADR/ADR-006-Approved-Implementation-Technology-Stack.md).

| Area | Choice |
|---|---|
| Runtime | Node.js 26 LTS |
| Package manager | npm |
| Frontend | React + Vite + JavaScript/JSX + React Router |
| Styling | Farochet UI Kit CSS/components |
| Backend | Node.js + Express 5 (REST API) |
| Validation | Zod |
| Database | Supabase-hosted PostgreSQL |
| ORM | Prisma ORM 7 stable + `@prisma/adapter-pg` + `pg` |
| Authentication | Supabase Auth; Express Middleware enforces roles |
| Reference image storage | Supabase Storage private bucket, backend-mediated |
| Testing | Vitest + Supertest |
| Initial execution | Local frontend and backend; Supabase-hosted data/auth/storage |

**Architecture is not changing:** React → Express Controllers/Middleware → the nine Business Logic components → one centralized Repository (Prisma) → one PostgreSQL database. MVC remains within Presentation only. Supabase must not replace the Express backend or the approved Business Logic/Repository boundaries.

## Start here

Read these in order:

1. [`PRD.md`](./PRD.md) — authoritative product requirements and business rules (v1.4).
2. [`architecture.md`](./architecture.md) — approved architecture baseline.
3. [`ADR/`](./ADR/) — accepted decisions ADR-001 through ADR-006.
4. [`AGENTS.md`](./AGENTS.md) — binding instructions for coding agents.
5. [`Guardrails.md`](./Guardrails.md) — rationale for project restrictions.
6. [`plan.md`](./plan.md) — active, prioritized D4 implementation plan.
7. [`docs/ui/Farochet_UI_Kit_v1.1/`](./docs/ui/Farochet_UI_Kit_v1.1/) — UI components, design guidelines, screen specifications and visual references.
8. [`References/Technology_Stack_References.md`](./References/Technology_Stack_References.md) — official technology documentation.

The original plan draft is preserved at `docs/plan-history/plan-v00-original-draft.md` for history only. **Do not use its old contracts.** The active reconciled plan is root `plan.md`.

## Bootstrap status

The Bootstrap foundation is present in the working tree (not yet committed):

- `frontend/`: React 19 + Vite + JavaScript/JSX + React Router, with the Farochet UI Kit components, layouts, tokens and styles integrated under `frontend/src/`.
- `backend/`: Express 5 REST API with Presentation, exactly nine Business Logic module folders, and a centralized Data Access/Repository layer.
- Prisma 7 configuration, schema baseline and centralized Prisma Client behind the Repository. The current `prisma-client` generator emits TypeScript into ignored `backend/src/generated/prisma`; no business models or migrations have been authored yet.
- `GET /api/health` endpoint and a Bootstrap-only frontend page that calls it.
- Backend lockfile and frontend lockfile committed-ready; both apps use ESM.

Bootstrap does **not** include feature slices. Catalogue, inquiry, quotation, negotiation, order, status, wishlist, and sales-summary behavior must be implemented later through the approved plan and contracts.

## Local setup

### Prerequisites

- Git.
- Node.js 26 LTS per `.nvmrc` and ADR-006. Use `nvm install 26` and `nvm use 26`.
- npm (bundled with Node).
- A Supabase project only when database/auth/storage work begins. Live credentials are not required to run the Bootstrap health check.

### Install, configure and run

From the repository root:

```powershell
# 1. Select the approved runtime when Node 26 is installed
nvm install 26
nvm use 26

# 2. Backend
cd backend
npm ci                         # postinstall generates the Prisma Client
Copy-Item .env.example .env    # macOS/Linux: cp .env.example .env
npm run dev

# 3. Frontend (open a second terminal)
cd frontend
npm ci
Copy-Item .env.example .env    # macOS/Linux: cp .env.example .env
npm run dev
```

- Frontend: http://localhost:5173
- Backend health check: http://localhost:5000/api/health
- The Bootstrap page calls the configured `VITE_API_BASE_URL` (default `http://localhost:5000/api`).

### Environment templates

Two generations of templates exist and both are intentionally retained:

- `backend/.env.example` and `frontend/.env.example` are the **authoritative local configuration templates**. Copy them to `backend/.env` and `frontend/.env`.
- Root `backend.env.example` and `frontend.env.example` are the original tracked starter-pack templates, restored from Git. They are retained for history/compatibility; use the per-app templates for local setup.

Never commit `.env`, database passwords, Supabase service-role keys, access tokens, or customer data. Frontend `VITE_*` values must contain only public configuration; never place server secrets in `VITE_*` variables.

### Supabase and Prisma setup remaining

Bootstrap does not establish a live database connection because Supabase credentials are not configured in this working tree. To complete this step later:

1. Create/select the Supabase project and secure the credentials outside chat and Git.
2. Put the Session Pooler PostgreSQL URL (port 5432) in `backend/.env` as `DATABASE_URL`, plus the approved server-side Supabase values.
3. Put only the public Supabase URL/anon key in `frontend/.env` when Auth work begins.
4. Run `npm run prisma:generate` from `backend/`.
5. Add business models/migrations only after the approved contracts are reviewed. The project coordinator/schema steward applies migrations to the shared Supabase database; do not run migrations against a shared database without approval.

Prisma note: the backend uses Prisma 7's current `prisma-client` generator. It emits TypeScript into `backend/src/generated/prisma`, which is ignored by Git and regenerated by `npm ci`/`npm run prisma:generate`. Node 26 strips the generated types at runtime, so no separate transpilation step is required. The centralized Repository imports `PrismaClient` from the generated `client.ts`; `@prisma/client` remains the runtime package. Do not import the generated client outside the Repository.

### Tests and builds

```powershell
cd backend
npm test              # Vitest + Supertest health/routing tests

cd frontend
npm run build         # Vite production build
```

Frontend unit/component tests are not configured yet; add them only when a concrete slice requires them. Bootstrap backend tests, schema validation, the Express health check and the frontend build/dev-server checks were executed under Node 26.13.1 via `npx node@26`; the system Node remains 22.22.1, so installed-Node-26 sign-off is still outstanding. Clean-install verification uses each application's committed `package-lock.json` with `npm ci`.

## Expected project layout after Bootstrap

```text
raazia-management-system/
├── frontend/                 # React + Vite application
├── backend/                  # Express application
│   └── src/
│       ├── presentation/     # routes, controllers, middleware
│       ├── business-logic/   # exactly nine business components
│       └── data-access/      # centralized repository
├── ADR/                      # ADR-001 ... ADR-006
├── docs/
│   ├── ui/                   # Farochet UI Kit and UI docs
│   ├── evidence/              # D4 workflow/testing/contribution logs
│   └── plan-history/          # versioned implementation plan history
├── References/
├── PRD.md
├── architecture.md
├── AGENTS.md
├── Guardrails.md
├── plan.md
└── README.md
```

## Local development configuration

The Bootstrap task must create:

- `frontend/.env.example` for public frontend configuration (for example, local API base URL and Supabase public URL/anon key where used for Auth only).
- `backend/.env.example` for server-side configuration (port, frontend origin, Supabase URL/public key, PostgreSQL connection string, and any approved server-only Storage secret).

Create personal `.env` files from these examples. Never commit `.env`, database passwords, Supabase service-role/secret keys, access tokens, or customer data. Never place server credentials in `VITE_*` variables.

For the local, long-running Express server, ADR-006 chooses the Supabase Session Pooler connection (port 5432) as the initial Prisma PostgreSQL connection. Follow the official Supabase/Prisma reference; do not copy an outdated Prisma 6 setup. Prisma 7 requires the PostgreSQL driver adapter and a Prisma config file.

## Git workflow (direct commits to `main`)

All collaborators work directly on `main`. There is no `dev` branch, no feature branches, and no pull-request workflow.

### Before starting work

1. Switch to and update `main`:

```powershell
git switch main
git pull --ff-only origin main
```

2. Work only on your assigned files/features. Coordinate before editing shared files (see the warning below).

### Stage, commit, synchronize and push

1. Review changes with `git status` and `git diff`; confirm no `.env` or secret file is included.
2. Stage only the relevant files; do not use blanket staging such as `git add .`:

```powershell
git add <relevant-file-or-folder>
```

3. Commit with a descriptive message:

```powershell
git commit -m "feat: add product catalogue listing"
```

4. Synchronize with remote `main` before pushing:

```powershell
git pull --rebase origin main
```

5. Resolve any conflicts, rerun the relevant checks, then push directly to `origin main`:

```powershell
git push origin main
```

### If a push is rejected

A rejection normally means another member pushed first. Do not force-push. Pull and rebase onto remote `main`, resolve conflicts, stage the resolved files, continue the rebase, rerun the relevant checks, and push again:

```powershell
git pull --rebase origin main
git add <resolved-file>
git rebase --continue
git push origin main
```

If conflict resolution is unclear, stop and coordinate with the other member. Do not discard their work.

### Prohibited Git actions

- Never force-push to `origin main`, including `git push --force` and `git push --force-with-lease`.
- Never use destructive resets or clean-up commands that discard others' work, such as `git reset --hard` or `git clean -fd`.
- Never stage or commit `.env` files. Only `.env.example` belongs in Git.
- Do not commit database passwords, Supabase service-role keys, access tokens, or customer data.

### Shared-file warning

Coordinate before making simultaneous edits to shared files, including:

- `backend/prisma/schema.prisma`, Prisma migrations, and `backend/prisma.config.ts`
- `package.json` and `package-lock.json` files
- `architecture.md`, ADRs, `plan.md`, and `AGENTS.md`
- Shared configuration such as `.env.example`, Vite configuration, and root configuration

Pull `main` immediately before editing a shared file, announce the edit to the team, keep the change narrow, and synchronize again before committing. The project coordinator remains the Prisma schema/migration steward; only the coordinator applies migrations to the shared Supabase database after review. Never run concurrent migrations from multiple sessions.

## AI coding-agent rules

Every agent must read root `AGENTS.md`, `PRD.md`, `architecture.md`, relevant ADRs, `Guardrails.md`, active `plan.md`, and relevant UI guidance before editing. Assign one slice only. Agents must list changed files, tests actually executed, real results, assumptions, and unresolved issues. Human members must review generated code and make the Accept / Revise / Reject decision.

The frontend must use Express for business data. Supabase Auth can handle identity flows, but authorization is enforced by Express Middleware and customer ownership by Business Logic. Do not put business rules or database calls in React.

## Deliverable 4 evidence

Maintain these files throughout development:

- `docs/evidence/Workflow_Evidence_Log.md`
- `docs/evidence/Group_Contribution_Log.md`
- `docs/evidence/Testing_Evidence_Log.md`
- `docs/plan-history/plan-vNN.md` or retrievable Git history for every meaningful plan version.

Record slice/FR, owner, acceptance criteria, HITL/AFK mode, AI task reference, important iterations, tests/checks and actual results, human decision, change/issues, plan version, commit and integration status. Do not reconstruct evidence at the end.

## Current status

The documentation/UI-reference baseline and Bootstrap scaffold are present. The current Prisma generator and Node 26.13.1 checks passed via `npx`; the system Node is still 22.22.1. Remaining before feature work: install/sign off Node 26 locally, verify the clean-clone `npm ci` path on a second machine, configure Supabase credentials, confirm the live Prisma connection, and complete human Bootstrap acceptance. Feature slices and the business Prisma schema remain intentionally unimplemented. Check [`plan.md`](./plan.md) for the current status and order.

## Official stack references

See [`Technology_Stack_References.md`](./References/Technology_Stack_References.md) and ADR-006 for the current official documentation links used in the technology decision.
