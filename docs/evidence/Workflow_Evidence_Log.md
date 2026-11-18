# Workflow Evidence Log

Use one entry per vertical slice. Keep evidence concise but sufficient to reconstruct the work during the D4 demo. Do not claim tests passed unless you ran them.

## Slice entry template

### [Slice ID] — [Slice name]

- **Related PRD requirements:**
- **Owner:**
- **Plan version:**
- **Branch / Pull Request / merge:**
- **HITL / AFK mode:**
- **Reason for mode:**
- **AI chat/task reference:**
- **Context supplied to agent:**
- **Acceptance criteria:**
- **Important iterations/corrections:**
- **Rejected/revised approach (if any):**
- **Tests/checks actually run:**
- **Actual results:**
- **Human decision:** Accept / Revise / Reject
- **Decision reason:**
- **Major issue/change:**
- **Integration status:**
- **Evidence link(s):**

---

## Entries

_Add new slice entries below._

### Cycle 1 — Member 1 Product Catalogue Administration

- **Related PRD requirements:** FR-02; supports FR-01; NFR-01 and NFR-02.
- **Owner:** Member 1.
- **Plan version:** 1.3 (18 November 2026).
- **Branch / Pull Request / merge:** Current working tree; no commit or pull request created.
- **HITL / AFK mode:** HITL.
- **Reason for mode:** Coordinator decisions were needed for the product schema, temporary auth boundary, and soft-removal behavior.
- **AI chat/task reference:** Current Copilot chat — Cycle 1 Member 1 Product Catalogue Administration.
- **Context supplied to agent:** PRD v1.4; `plan.md` Sections 2, 4 and 9; architecture; ADR-002, ADR-004 and ADR-006; AGENTS.md; Guardrails.md; Farochet UI A-03/A-04.
- **Acceptance criteria:** Product create/read/edit/archive, positive whole-PKR Standard Catalogue Price validation, persistence layer and Raazia-only route boundary implemented. Live database persistence after restart remains unverified.
- **Important iterations/corrections:**
  - The initially proposed temporary `ADMIN` role, product `availabilityStatus`, and per-product discount representation conflicted with the existing approved sources. The implementation uses the approved `RAAZIA` role, omits product availability states, and keeps public discounts separate from Product.
  - Product removal is a confirmed soft archive (`isArchived`); Product rows are retained.
  - The temporary session token is server-verified and assigns `RAAZIA`; it does not accept a client role or user ID and is disabled for `NODE_ENV=production`.
  - Synthetic seed records are development-only, require an empty Product table, and were supplied for this task.
  - Browser smoke testing initially used `127.0.0.1`, which did not match the configured CORS origin; the UI was rechecked at the documented `localhost` origin.
- **Rejected/revised approach (if any):** No `ADMIN` role, Product availability state, hard delete, or per-product discount/effective-price storage was introduced.
- **Tests/checks actually run:** Node 26.13.1 — backend Vitest/Supertest suite; Vite production build; Prisma Client generation, schema validation and format check; Prisma schema-to-SQL diff; `git diff --check`; browser page load at 375px viewport.
- **Actual results:** 3 backend test files / 14 tests passed; frontend build passed (45 modules); Prisma validation and formatting passed; schema-to-SQL diff succeeded; whitespace check passed; page rendered at 375px with no horizontal overflow. Browser check verified the local-session gate and Product-only admin navigation, not a live API/database workflow.
- **Human decision:** Coordinator approved the slice decisions and seed fixtures; implementation Accept / Revise / Reject review is pending.
- **Decision reason:** Human acceptance and live persistence verification are still outstanding.
- **Major issue/change:** Supabase credentials were unavailable; the migration and seed script were not run against a database. Member 2's Supabase Auth integration remains pending.
- **Integration status:** Implemented in the working tree; not committed or integrated with Supabase.
- **Evidence link(s):** `backend/tests/products.test.js`; `docs/evidence/Testing_Evidence_Log.md`.

### Bootstrap — application foundation

- **Related PRD requirements:** None directly; enables all slices through ADR-006 and plan Section 7.
- **Owner:** Project coordinator / coding agent under HITL review.
- **Plan version:** 1.2 (18 November 2026).
- **Branch / Pull Request / merge:** `main` working tree; no commit or PR created.
- **HITL / AFK mode:** HITL.
- **Reason for mode:** Bootstrap touches shared architecture, dependency and configuration decisions.
- **AI chat/task reference:** Bootstrap readiness audit and approved Prisma generator switch (18 November 2026).
- **Context supplied to agent:** `AGENTS.md`, `plan.md` Section 7, ADR-006, Farochet UI Kit starter, existing workspace status.
- **Acceptance criteria:** See `plan.md` Section 7 Bootstrap acceptance criteria.
- **Important iterations/corrections:**
  - Restored the original tracked root `backend.env.example` and `frontend.env.example`; per-app templates remain authoritative for local configuration.
  - Corrected the earlier Prisma generator attempt: `generatedFileExtension = "js"` was invalid (the option accepts `ts`, `mts` or `cts`), so that attempt did not establish that the TypeScript generator was unsuitable. After a readiness audit and coordinator approval, switched to the current `prisma-client` generator with TypeScript output, ESM import specifiers and Node 26 type stripping. The centralized Repository now imports generated `client.ts`; `@prisma/client` remains the runtime package.
  - Added `postinstall: prisma generate` so a clean `npm ci` creates the ignored generated client, and verified the step in a clean backend install under Node 26.13.1.
  - Upgraded Vitest from 3.x to 5.1.1 after clean install exposed critical advisories in the older test runner chain.
- **Rejected/revised approach (if any):** The previous `prisma-client-js` choice is superseded by the approved current-generator switch; no architecture or business-rule change.
- **Tests/checks actually run:** Backend clean `npm ci` with `postinstall`; Prisma `generate`, `validate` and `format --check`; backend `npm test`; repository import/initialization check; Express health request; frontend production build; Vite dev request; headless Chrome Bootstrap page load. Node 26 checks used `npx node@26`; earlier checks used system Node 22.22.1.
- **Actual results:** Backend 2 files / 4 tests passed; Prisma generation to `backend/src/generated/prisma` passed; schema validation/format passed; Express health returned `200`; Frontend build passed (38 modules); Vite dev returned `200`; the earlier Node 22.22.1 headless Chrome check rendered `Connected`; Supabase live connection not executed.
- **Human decision:** Pending Bootstrap acceptance review.
- **Decision reason:** Pending human review and installed-Node-26 sign-off.
- **Major issue/change:** Installed Node 26, Supabase credentials and second-machine clean-clone acceptance remain outstanding.
- **Integration status:** Scaffold integrated in the working tree; not committed.
- **Evidence link(s):** `docs/evidence/Testing_Evidence_Log.md`.

### C1-M3 - Inquiry Review & Management

- **Related PRD requirements:** FR-07, FR-08.
- **Owner:** Member 3.
- **Plan version:** 1.3 (18 November 2026).
- **Branch / Pull Request / merge:** Direct to `main` (no branches); commit pending.
- **HITL / AFK mode:** HITL.
- **Reason for mode:** A shared-schema decision (missing User model) needed a human decision.
- **AI chat/task reference:** OpenCode session for Member 3 Cycle 1; model: [to be filled in].
- **Context supplied to agent:** AGENTS.md, Guardrails.md, PRD.md, architecture.md, plan.md Sections 3, 4, 9, 15, 16, UI A-07/A-08, and the Product slice as the pattern.
- **Acceptance criteria:** plan.md Section 9, Member 3 Cycle 1.
- **Important iterations/corrections:**
  - The agent stopped twice with STOP AND ASK (no User model; only a Raazia-only mock auth).
  - I approved a temporary plain `customerId` with no foreign key, ownership in Business Logic with no customer-facing route, and no migration.
- **Rejected/revised approach (if any):** Rejected waiting for Member 2's User model, an in-memory-only design, and a customer-facing inquiry endpoint (overlaps Cycle 5).
- **Tests/checks actually run:** Backend `npm ci` then `npm test`; frontend `npm ci` then `npm run build`; `git status`.
- **Actual results:** Backend 4 test files / 21 of 21 tests passed, including 7 in `backend/tests/inquiries.test.js`; frontend Vite build succeeded (46 modules transformed, built in 351 ms); `git status` showed only the Inquiry slice files changed, with no `.env`, `node_modules`, `dist`, generated folder, or migration.
- **Human decision:** Accept (provisional).
- **Decision reason:** API, role boundary and ownership tests pass and the build succeeds; the screen has not been checked with real data.
- **Major issue/change:** `customerId` is temporary and customer name/email are not shown until Member 2's User model is merged; the Inquiry migration and Prisma generation against the shared database are pending the coordinator.
- **Integration status:** Commit pending.
- **Evidence link(s):** `docs/evidence/Testing_Evidence_Log.md`.
