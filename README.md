# Raazia — Customer Inquiry, Quotation, and Custom Order Management System

D4 project workspace containing the approved product/architecture context, AI-agent instructions, implementation plan, ADRs, supporting references, Farochet UI Kit, and evidence templates. The Bootstrap scaffold and the Cycle 1 Product Catalogue Administration slice are present.

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

**The layered architecture and nine Business Logic components remain unchanged:** React → Express Controllers/Middleware → Business Logic → the centralized Repository (Prisma) → one PostgreSQL database. The approved narrow exceptions are Middleware's persisted account/role lookup and the designated Auth Controllers' registration-intent persistence/activation and atomic profile-completion operations. MVC remains within Presentation only. Supabase must not replace the Express backend or the approved Business Logic/Repository boundaries.

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
- Prisma 7 configuration and centralized Prisma Client behind the Repository. The Product model and its migration implement Cycle 1; other business models remain to be coordinated and added by their slice owners.
- `GET /api/health` endpoint and a Bootstrap-only frontend page that calls it.
- Raazia-only product list/create/read/update/archive endpoints and the `/admin/products` UI.
- Backend lockfile and frontend lockfile committed-ready; both apps use ESM.

The product slice uses a temporary development token assigned the approved `RAAZIA` role server-side. It is not a replacement for Member 2's Supabase Auth middleware. The backend template sets `NODE_ENV=development`; set `NODE_ENV=production` in production, where this mock is disabled, and never configure the development token there.

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
- The frontend uses `VITE_API_BASE_URL` for Express requests (default `http://localhost:5000/api`).
- For Supabase Auth, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `frontend/.env`; set the matching `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `backend/.env`. These are public project configuration values, not proof of identity. Never put a Supabase secret/service-role key in the frontend.

### Authentication & Customer Registration (Cycle 1 — Member 2)

Customers can create an account at `/register` and sign in at `/sign-in`. Supabase Auth verifies credentials and stores passwords; the application does not store passwords. The backend creates a pending registration intent only after Supabase Auth Admin confirms a newly created identity. When email confirmation is enabled, the backend explicitly requests a signup confirmation email. After confirmation, sign in and use the Customer setup continuation; the backend verifies the identity and confirmed-email timestamp before starting the 30-minute window. `/api/auth/profile` accepts an empty body and creates a CUSTOMER profile only by atomically consuming the matching, unexpired intent. Normal sign-in/session restoration are read-only, and existing profiles/roles are never overwritten. Public Raazia/admin registration is not available.

Protected API requests send a Supabase access token to Express. Middleware verifies it with Supabase Auth, then loads the application role from the persisted `User` profile. The frontend role guards improve navigation only; backend middleware is authoritative.

### Product Catalogue Administration (Cycle 1 — Member 1)

The admin sign-in screen is available at `http://localhost:5173/admin/sign-in`; protected Product and Inquiry pages require a persisted `RAAZIA` profile. Until the User migration is applied and an authorized profile is provisioned, sign-in cannot grant application access. No public admin registration is provided.

The Product model stores `basePrice` as the Standard Catalogue Price in whole PKR rupees. Public discounts are not stored on Product; discount behavior remains separate and follows the fixed shared-discount rule. Product removal archives the row (`isArchived`) rather than deleting it. Product image entries are existing references only; this slice does not upload images or choose a storage provider. No product-availability state is introduced.

After configuring `DATABASE_URL`, generate the Prisma Client and apply the reviewed migration through the coordinator/schema steward:

```powershell
cd backend
npm run prisma:generate
npx prisma migrate deploy
```

`backend/prisma/seed-products.json` contains synthetic development-only examples. The seed command requires `NODE_ENV=development` and refuses to run against a non-empty Product table. Replace the examples with approved records before using them to represent Raazia's catalogue.

### Environment templates

Two generations of templates exist and both are intentionally retained:

- `backend/.env.example` and `frontend/.env.example` are the **authoritative local configuration templates**. Copy them to `backend/.env` and `frontend/.env`.
- Root `backend.env.example` and `frontend.env.example` are the original tracked starter-pack templates, restored from Git. They are retained for history/compatibility; use the per-app templates for local setup.

Never commit `.env`, database passwords, Supabase service-role keys, access tokens, or customer data. Frontend `VITE_*` values must contain only public configuration; never place server secrets in `VITE_*` variables.

### Supabase and Prisma setup remaining

Bootstrap does not establish a live database connection because Supabase credentials are not configured in this working tree. To complete this step later:

1. Create/select the Supabase project and secure the credentials outside chat and Git.
2. Create the approved `farochet_runtime` and `farochet_migrator` PostgreSQL roles using the administrator procedure. The Express role must not own application tables or have `BYPASSRLS`; the migration role owns objects it creates and has only `USAGE, CREATE` on `public`.
3. Put the Session Pooler PostgreSQL URL (port 5432) for `farochet_runtime` in backend `.env` as `DATABASE_URL`, and the URL for `farochet_migrator` as `MIGRATION_DATABASE_URL`. Keep both URLs and passwords backend-only. `DIRECT_URL` is not used by the Prisma config.
4. Put only the public Supabase URL and publishable/anon key in `frontend/.env`. The browser uses that public key only to access Supabase Auth; it is never proof of a user's identity.
5. Run `npm run prisma:generate` from `backend/`. Use `npm run prisma:deploy` to apply reviewed committed migrations with the migration role. `npm run prisma:migrate` (`migrate dev`) is for local migration development and may require a separate shadow database.
6. Add remaining business models/migrations only after all four team members agree on the shared contract. A team member may apply the reviewed migration after that agreement and database access is configured; do not run concurrent migrations against the shared Supabase database.

Prisma note: the backend uses Prisma 7's current `prisma-client` generator. It emits TypeScript into `backend/src/generated/prisma`, which is ignored by Git and regenerated by `npm ci`/`npm run prisma:generate`. Node 26 strips the generated types at runtime, so no separate transpilation step is required. The centralized Repository imports `PrismaClient` from the generated `client.ts`; `@prisma/client` remains the runtime package. Do not import the generated client outside the Repository.

### Tests and builds

```powershell
cd backend
npm test              # Vitest + Supertest health, product API, and authorization tests

cd ..\frontend
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

The Product Catalogue Administration Cycle 1 slice has been implemented in the working tree. Live PostgreSQL persistence, migration execution, approved product seed records, Member 2's Supabase Auth integration, and human acceptance remain to be verified. The project still requires local Node 26 sign-off, second-machine clean-clone verification, and the remaining Cycle 1 feature integrations. Check [`plan.md`](./plan.md) for the current status and order.

## Official stack references

See [`Technology_Stack_References.md`](./References/Technology_Stack_References.md) and ADR-006 for the current official documentation links used in the technology decision.
