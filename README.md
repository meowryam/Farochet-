# Raazia — Customer Inquiry, Quotation, and Custom Order Management System

D4 starter pack for the project group. This repository contains the approved product/architecture context, AI-agent instructions, implementation plan, ADRs, supporting references, Farochet UI Kit, and evidence templates. The application code scaffold is the first Bootstrap milestone; it is not included as completed code in this documentation pack.

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

## First task after extracting this pack

Open this folder in VS Code. Before feature development, use a coding agent in HITL mode to complete **Plan Section 7 — Bootstrap milestone** only.

The first agent task is to:

- inspect all root project context and ADR-006;
- scaffold `frontend/` as React + Vite and `backend/` as Express 5;
- establish the three approved architecture layers and centralized Repository layout;
- prepare `.gitignore`, `.nvmrc`, `.env.example` files and npm lockfiles;
- organize the supplied Farochet UI Kit into the frontend/docs locations;
- configure Prisma 7 with the PostgreSQL driver adapter and `prisma.config.ts`;
- add a simple Express health endpoint and frontend-to-backend connection check;
- prepare the local run/test scripts and update the README with commands that have actually been tested;
- stop before implementing feature slices or inventing the full business schema until the shared contracts and migration plan have been reviewed.

A clean clone must be able to install using `npm ci` and start both apps without relying on files outside Git. Ask one other member to test this clean-clone path before distributing feature work.

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

## Git workflow

- `main`: stable demo-ready version.
- `dev`: shared integration branch.
- Feature branch: `cycle-<N>/member-<M>/<feature-slug>`.
- Start each task from the latest `dev`.
- Open a Pull Request into `dev`; do not push feature work directly to `dev` or `main`.
- Keep each PR limited to one assigned vertical slice.
- Do not edit shared data contracts, Prisma schema/migrations, global CSS/tokens, or common UI components without coordinating with the project coordinator.
- Only the project coordinator/schema steward applies migrations to the shared Supabase development database after review. Never have several coding agents migrate the shared DB concurrently.

## AI coding-agent rules

Every agent must read root `AGENTS.md`, `PRD.md`, `architecture.md`, relevant ADRs, `Guardrails.md`, active `plan.md`, and relevant UI guidance before editing. Assign one slice only. Agents must list changed files, tests actually executed, real results, assumptions, and unresolved issues. Human members must review generated code and make the Accept / Revise / Reject decision.

The frontend must use Express for business data. Supabase Auth can handle identity flows, but authorization is enforced by Express Middleware and customer ownership by Business Logic. Do not put business rules or database calls in React.

## Deliverable 4 evidence

Maintain these files throughout development:

- `docs/evidence/Workflow_Evidence_Log.md`
- `docs/evidence/Group_Contribution_Log.md`
- `docs/evidence/Testing_Evidence_Log.md`
- `docs/plan-history/plan-vNN.md` or retrievable Git history for every meaningful plan version.

Record slice/FR, owner, acceptance criteria, HITL/AFK mode, AI task reference, important iterations, tests/checks and actual results, human decision, change/issues, plan version, branch/PR and integration status. Do not reconstruct evidence at the end.

## Current status

This pack is the documentation and UI-reference baseline. GitHub repo/collaborators, application scaffold, Supabase project, Prisma schema and feature slices still need to be created. Check [`plan.md`](./plan.md) for the current status and order.

## Official stack references

See [`Technology_Stack_References.md`](./References/Technology_Stack_References.md) and ADR-006 for the current official documentation links used in the technology decision.
