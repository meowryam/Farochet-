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

### Cycle 2 — Member 2 Customer Inquiry Submission

- **Related PRD requirements:** FR-05; supports FR-06 and FR-08.
- **Owner:** Member 2.
- **Plan version:** 2.3 (23 November 2026).
- **Branch / Pull Request / merge:** `main` working tree; no commit or pull request created.
- **HITL / AFK mode:** HITL implementation with local verification.
- **Reason for mode:** This slice adds customer-facing persistence and ownership behavior to the shared Inquiry component.
- **AI chat/task reference:** Current Copilot chat — Member 2 Cycle 2 Customer Inquiry Submission.
- **Context supplied to agent:** PRD v1.4; architecture; ADR-002, ADR-004 and ADR-006; `plan.md` Cycle 2 Member 2; Farochet C-06/C-07 UI specifications; existing authentication, catalogue, wishlist and Inquiry implementations.
- **Acceptance criteria:** Authenticated Customer submit; authenticated identity supplies `customerId`; optional valid/unknown Product handling; message validation; owned history/detail retrieval; Raazia review preserved; no Customization/PendingOrderRequest/Order side effect.
- **Important iterations/corrections:**
  - Reused the existing Inquiry model, Repository, Inquiry Management component and admin review routes.
  - Added customer submit/list/detail routes without introducing a second Repository or new Business Logic component.
  - The frontend validation state was corrected so an empty inquiry produces the application's visible validation message instead of relying on native browser validation.
  - Manual runtime diagnosis traced the generic 500 to the live `farochet_runtime` role having SELECT but no INSERT privilege on `Inquiry`; a rollback-safe DB probe and authenticated route reproduction confirmed PostgreSQL `42501`.
  - Added a corrective INSERT grant/RLS-policy migration and moved local frontend, CORS and auth callback configuration to port 5174.
- **Rejected/revised approach (if any):** No client-supplied identity, inquiry status vocabulary, chat timeline, automatic custom request, or confirmed order creation was introduced.
- **Tests/checks actually run:** Targeted and full backend Vitest/Supertest suites; focused and full frontend Vitest suites; Vite production build; Prisma schema validation/status; live read-only runtime-role permission checks; rollback-only insert probe; authenticated API route reproduction; local port/health/CORS smoke tests.
- **Actual results:** The initial pre-deployment probe found `farochet_runtime` lacked Inquiry INSERT and the POST failed with PostgreSQL `42501`; that historical failure was resolved after the two approved migrations were deployed by the authorized database operator. Final read-only Prisma status found 10 local migration directories and reported the database schema up to date. Read-only database checks verified `farochet_runtime` has Inquiry INSERT privilege and `runtime_inquiry_insert` exists; RLS and the existing SELECT policy were also present. Customer A submitted a synthetic general inquiry through the authenticated UI; PostgreSQL persistence, A's history and details were verified. Customer B submitted a separate synthetic catalogue-linked inquiry; B's history contained only B's own record, and direct access to A's inquiry was denied with 403. The authenticated Raazia Admin list and detail view displayed A's inquiry. The Admin UI shows the customer ID but reports the name/email as unavailable. No Order row was created. `Customization` and `PendingOrderRequest` tables are absent from the deployed database; the submission code path calls only Inquiry creation, so no such records were created by this endpoint. No migration was applied by the coding agent during final verification.
- **Human decision:** Pending human acceptance.
- **Decision reason:** Automated, database, customer workflow, ownership-isolation, and Admin visibility checks are recorded, but no formal human Accept / Revise / Reject decision was supplied.
- **Major issue/change:** At the earlier integration verification, the Admin Inquiry projection displayed only the customer ID, so associated profile name/email were unavailable in that UI. The follow-up below resolves the projection using the existing Inquiry-to-User relation; no schema or privileged database access was added.
- **Integration status:** Prior evidence records live inquiry submission, ownership checks, Admin list/detail access, and a read-only up-to-date migration status. This resumption did not rerun database checks or apply migrations. The current profile projection is covered by automated tests; an authenticated Admin browser session was not available for a live recheck. Changes are not committed or pushed, and formal human acceptance remains pending. Earlier evidence records the absence of Customization and PendingOrderRequest tables, so no live count for those record types is claimed.
- **Evidence link(s):** `backend/tests/inquiries.test.js`; `frontend/src/features/inquiries/CustomerInquiryPage.test.jsx`; `backend/prisma/migrations/20261123024800_allow_runtime_inquiry_submission/migration.sql`; `docs/evidence/Testing_Evidence_Log.md`.

#### Resumption follow-up — Admin identity and sidebar labels (23 November 2026)

- Implemented the Admin inquiry list/detail projection of the linked User `displayName` and `email` when present. The customer UUID remains secondary information; missing fields use explicit unavailable labels. The existing Raazia-only routes and Customer ownership behavior remain unchanged.
- Updated Admin navigation labels while retaining existing paths, keys/active state, and responsive layout. An isolated browser DOM/CSS preview matching the sidebar classes and labels showed readable white-on-plum labels, original paths, and the active Customer Inquiries state at desktop and at 390px mobile width with the menu open. The protected application route redirected to `/admin/sign-in` because no authenticated Raazia browser session was shared; the live Admin page and profile data were not rechecked.
- Backend and frontend test suites and the production build were rerun; exact results are recorded in the testing evidence log. No database migration was run.

### Cycle 3 — Member 1 Pricing & Public Discount Management

- **Related PRD requirements:** FR-02, FR-03; ADR-002 and ADR-005.
- **Owner:** Member 1.
- **Plan version:** 1.7 (22 November 2026).
- **Branch / Pull Request / merge:** Current working tree; no commit or pull request created.
- **HITL / AFK mode:** HITL implementation with local verification.
- **Reason for mode:** Schema, discount activation, and frontend contract changes affect the shared vertical slice.
- **AI chat/task reference:** Current Copilot chat — Member 1 Cycle 3 Pricing & Public Discount Management.
- **Context supplied to agent:** PRD v1.4; `plan.md` Sections 4 and 11; architecture; ADR-002, ADR-005 and ADR-006; AGENTS.md; Guardrails.md; Farochet UI Kit guidelines/catalog/workflow.
- **Acceptance criteria:** Independent Standard Catalogue Price updates; one authoritative fixed whole-PKR public discount; uniform effective prices; boundary and invalid-input rejection; Raazia-only mutations; public read state; unchanged catalogue prices.
- **Important iterations/corrections:**
  - Public discount persistence uses a singleton `PublicDiscount` record containing `active` and nullable `fixedDiscountAmount`.
  - Sale activation/update is rejected with `409 NO_LISTED_PRODUCTS` when no products are listed.
  - Active-sale product creation or Standard Catalogue Price update is rejected when the proposed price is equal to or below the fixed discount.
  - The public read response reports both `standardCataloguePrice` and `effectivePublicPrice`; removing the sale restores effective prices to the unchanged standard prices.
- **Rejected/revised approach (if any):** No percentage discount, stacking, per-product public discount, negotiated/approved price on Product, stock field, or standard-price mutation was introduced.
- **Tests/checks actually run:** Prisma validate/format/generate; backend Vitest + Supertest suite; frontend Vite production build.
- **Actual results:** Prisma validate passed; format check passed after formatting; Prisma 7.10.1 generated successfully. Backend 10 test files / 84 tests passed. Frontend 103 modules built successfully; Vite reported only the existing single-chunk size advisory.
- **Human decision:** Pending human acceptance.
- **Decision reason:** Automated checks passed, but no live Supabase migration deployment or human UI review was performed.
- **Major issue/change:** Migration `20261122180000_public_discount` is ready but not deployed to Supabase.
- **Integration status:** Implemented in the working tree; live database deployment and human acceptance remain outstanding.
- **Evidence link(s):** `backend/tests/pricing.test.js`; `backend/tests/products.test.js`; `frontend/src/features/catalogue/ProductManagementPage.jsx`.

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
- **Branch / Pull Request / merge:** Direct to main (no branches); commit 61aa571.
- Author note: Commit author label shows i253009 <i253009@isb.nu.edu.pk> because of local Git settings on the machine used. Correct GitHub account is WareeshaFatima. The pushed commit was not rewritten.
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
- **Integration status:** Pushed to main on 19 Nov 2026 as commit 61aa571. Migration pending the coordinator; customerId relation to User pending Member 2's User model.
- **Evidence link(s):** `docs/evidence/Testing_Evidence_Log.md`.

### C1-M2 - Authentication & Role Access

- **Related PRD requirements:** NFR-01; prerequisite for protected slices (plan.md Cycle 1, Member 2).
- **Owner:** Member 2.
- **Plan version:** 1.4 (19 November 2026).
- **Branch / Pull Request / merge:** `main` working tree; no commit or push.
- **HITL / AFK mode:** HITL.
- **Reason for mode:** Shared User schema/migration requires agreement by all four members; Member 2 authorized independent authentication implementation.
- **AI chat/task reference:** Current Copilot chat — Cycle 1 Member 2 Authentication & Role Access.
- **Context supplied to agent:** PRD v1.4, architecture, ADR-004/ADR-006, AGENTS.md, Guardrails.md, plan.md Cycle 1 Member 2, Farochet C-04/C-05/A-01.
- **Acceptance criteria:** Supabase Auth identity tokens are verified by Express; persisted application role controls protected API access; `/api/auth/me` reports the persisted profile; Customer registration provisions only a verified identity's CUSTOMER profile; React session persistence/sign-out and role-protected routes work; public admin registration is unavailable.
- **Important iterations/corrections:** Local Supabase URL and publishable key were placed in ignored per-app `.env` files; the publishable key is API configuration only, never proof of identity. Express verifies bearer tokens with Supabase Auth and uses the Repository for persisted roles. After four-member schema approval, added the User/role schema, Inquiry relation and migration; at the time of the earlier record, the migration was unapplied. The later manual checks do not establish current migration status. The four members then unanimously approved the narrow Auth Profile Provisioning interface and corresponding architecture exception; documentation records that Middleware's Repository exception remains lookup-only.
- **Rejected/revised approach (if any):** Removed the temporary development-token login from Product/Inquiry screens. Did not add a tenth Business Logic component, public admin registration, client-controlled roles, or profile overwrite behavior. Initial new tests failed because their Express test harness lacked `express.json()` and then because the mocked Supabase responses were out of sequence; both test issues were fixed before the final test run.
- **Tests/checks actually run:** Backend `npm test` using Node 26.13.1; frontend `npm run build`; Prisma generation/validation; live invalid-token probe and local Express smoke from the earlier auth stage; schema/migration and local `.env` behavior reviewed. The latest full backend result is 6 files / 32 tests passed.
- **Actual results:** Auth routes and Repository profile-provisioning tests passed against mocked Supabase and Prisma in the earlier recorded run: 6 files / 32 tests. Prisma Client generation and schema validation passed. Final frontend build passed (96 modules) with Vite's >500 kB chunk advisory. `git diff --check` passed after removing newly introduced trailing whitespace. At that stage, live registration/login, database-backed profile lookup and migration were not run. Subsequent user-reported manual results are recorded below; they do not imply migration or production verification.
- **Human decision:** User schema/migration agreement and Auth Profile Provisioning interface approval were confirmed; implementation review and slice acceptance remain pending with all four members.
- **Decision reason:** The approved architecture exception is documented and locally tested. The later user-reported manual checks establish successful Customer/Raazia sign-in and profile access, but do not establish migration status or human acceptance.
- **Major issue/change:** `POST /api/auth/profile` verifies the Supabase identity, accepts only display name, derives identity fields server-side, and uses a create-only Repository operation that assigns CUSTOMER and leaves existing profiles/roles unchanged. No Prisma application migration was applied in the earlier recorded status; the current manual tests do not establish later migration status.
- **Integration status:** Authentication, Customer registration and profile provisioning are implemented locally; Customer/Raazia sign-in and role-specific access were subsequently reported as manually verified. Customer registration/sign-out, migration status, production deployment and human acceptance remain unverified.
- **Evidence link(s):** `backend/tests/authentication.test.js`; `docs/evidence/Testing_Evidence_Log.md`.

### C1-M2 manual authentication and permission checks

- **Related requirements / decisions:** NFR-01; ADR-004 and ADR-006.
- **Owner:** Member 2.
- **Plan version:** 1.6 (21 November 2026).
- **HITL / AFK mode:** HITL.
- **AI chat/task reference:** User-reported manual checks in the current ChatGPT session.
- **Test type / execution:** Manual checks performed by the user; reported in chat and not independently rerun during this documentation update. These results are not automated-test results.
- **Checks and reported results:** (1) CUSTOMER sign-in and customer profile access — passed. (2) CUSTOMER attempted `/admin/sign-in` and received the expected access-denied result — passed. (3) A separate Supabase Auth identity for Raazia was created — passed. (4) Its matching `public.User` application profile with role `RAAZIA` was created and verified — passed. (5) Raazia sign-in — passed. (6) Farochet Admin workspace access — passed. (7) Temporary PostgreSQL SET membership was removed/restored to the restricted state; `can_set_migrator_role = false` was verified — passed.
- **Limits:** These manual checks do not establish migration application, production deployment, a complete database-configuration audit, or automated authentication-test outcomes. Earlier automated test results remain separately documented and were not rerun for this update. No credentials or connection values are recorded here.
- **Integration / remaining approval:** These checks do not replace the four-member migration review or human slice acceptance. No code, environment, database, or migration changes were made by this documentation update.

### C1-M2 — Runtime and migration database-role separation

- **Related PRD requirements:** NFR-01; ADR-004 and ADR-006 database/security boundaries.
- **Owner:** Member 2.
- **Plan version:** 1.4 (19 November 2026).
- **Branch / Pull Request / merge:** `main` working tree; no commit or push.
- **HITL / AFK mode:** HITL.
- **Reason for mode:** Database role creation, permissions, and applying the new migration require explicit human approval; shared migration governance also applies.
- **AI chat/task reference:** Current Copilot chat — runtime/migration database role implementation.
- **Context supplied to agent:** Approved role direction; Supabase Postgres role metadata; current Prisma 7 config, Repository operations, routes, tests, connection mode, and team guardrails.
- **Acceptance criteria:** Separate runtime and CLI URLs; runtime role is non-owner and lacks elevated attributes; migration role can own/create migration objects; direct Data API roles receive no business-table access; grants match implemented Repository operations; customer ownership remains in Business Logic.
- **Important iterations/corrections:** Confirmed the live current connection was the `postgres` database role with `BYPASSRLS`, while application tables and both custom role names were absent. Configured Prisma CLI to read `MIGRATION_DATABASE_URL`; Repository continues to use `DATABASE_URL`. After explicit user approval, created both roles and the approved database/schema grants; at that time, the `.env` was not changed because the roles still needed secure passwords.
- **Rejected/revised approach (if any):** No `service_role` DML grant, Product `DELETE`, `FORCE ROW LEVEL SECURITY`, runtime table ownership, or client-supplied profile role. Existing product archive remains an `UPDATE`.
- **Tests/checks actually run:** Node 26.13.1 backend `npm test`; Prisma Client generation and schema validation (using a nonconnecting dummy migration URL for local CLI validation); frontend production build; `git diff --check`.
- **Actual results:** 6 backend test files / 32 tests passed; Prisma 7.10.1 generation and schema validation passed; Vite production build passed (96 modules); whitespace check passed. The approved SQL created the database roles and schema grants; no Prisma application migrations were executed.
- **Human decision:** User approved the exact role-creation SQL and action sequence. Team review of the shared security migration remains pending.
- **Decision reason:** Role DDL was executed only after explicit approval. The later manual checks do not establish the current password or role-specific URL configuration; no such values are recorded here. `psql.exe` is available at `C:\Program Files\PostgreSQL\19\bin\psql.exe`; this documentation update did not run password-setting commands or migrations.
- **Major issue/change:** The role-specific password and `DATABASE_URL` / `MIGRATION_DATABASE_URL` configuration status is not established by the later manual checks. Those checks do not constitute a complete database-configuration audit.
- **Integration status:** Prisma config, template, security migration, tests, and docs are prepared locally; roles/schema grants were created earlier. The later manual verification of `can_set_migrator_role = false` confirms only the reported SET-membership state. Migration application and production deployment were not verified.
- **Evidence link(s):** `backend/prisma.config.ts`; `backend/prisma/migrations/20261120000000_runtime_roles_and_rls/migration.sql`; `backend/tests/auth-profile-repository.test.js`; `docs/evidence/Testing_Evidence_Log.md`.

### C2-M4 — Manufacturing Status Management

- **Related PRD requirements:** FR-11, FR-14, FR-17.
- **Owner:** Member 4.
- **Plan version:** 1.7 (21 November 2026).
- **Branch / Pull Request / merge:** `main` working tree; no commit or push.
- **HITL / AFK mode:** AFK implementation under the current task instructions; no human decision made inside this chat.
- **Reason for mode:** Existing status fields, migration and order routes provided a complete local vertical-slice contract; no shared schema or migration change was required.
- **AI chat/task reference:** Current Copilot chat — Cycle 2 Member 4 Manufacturing Status Management.
- **Context supplied to agent:** AGENTS.md, PRD.md, architecture.md, Guardrails.md, plan.md Cycle 2 Member 4, ADR-003, ADR-004, and the Farochet UI Kit guidelines/catalog/screen workflow.
- **Acceptance criteria:** Raazia can set the approved manufacturing statuses and optional Estimated Completion Date; new confirmed Orders remain `Incomplete`; completed manufacturing does not alter payment or delivery; Customers see own status/estimate and `Not yet provided` when absent; cross-Customer access and update attempts are denied.
- **Important iterations/corrections:** Added the approved Status Management Business Logic module and an order-status Repository operation. Added `PATCH /api/admin/orders/:id/status`; it updates only `manufacturingStatus` and/or `estimatedCompletionDate`. The Raazia-only route and role checks remain centralized in Middleware, with a defensive Raazia check in Status Management.
- **Rejected/revised approach (if any):** Did not change the Prisma schema or migrations, create new status values, couple status fields, or expose direct database access from React.
- **Tests/checks actually run:** Focused order tests; full backend Vitest/Supertest suite; frontend Vite production build; `git diff --check`; worktree status review.
- **Actual results:** Focused order suite 11/11 passed; full backend 60/60 passed across 8 test files; frontend build passed with 101 modules and a >500 kB chunk advisory; no whitespace errors.
- **Human decision:** Pending human Accept / Revise / Reject review.
- **Decision reason:** Automated checks and build passed, but no live Supabase/PostgreSQL workflow or human UI acceptance was performed.
- **Major issue/change:** No schema or migration change was needed because the existing confirmed-Order model already contains all required fields. Live persistence and browser acceptance remain pending.
- **Integration status:** Implemented locally in the working tree; no commit or push.
- **Evidence link(s):** `backend/tests/orders.test.js`; `docs/evidence/Testing_Evidence_Log.md`; `frontend/src/features/orders/OrderManagementPage.jsx`.

### C2-M3 — Customization Request Submission

- **Related PRD requirements:** FR-09; plan.md Section 10 (Cycle 2, Member 3).
- **Owner:** Member 3.
- **Plan version:** Not supplied in this task.
- **Branch / Pull Request / merge:** Direct to main (no branches); commit 6dd7e1c, pushed 22 Nov 2026.
- **HITL / AFK mode:** AFK build by OpenCode in 4 stages (A schema, B backend, C tests, D frontend), with human review after each stage.
- **Reason for mode:** Not supplied in this task.
- **AI chat/task reference:** OpenCode agent — Cycle 2 Member 3, Customization Request Submission (FR-09).
- **Context supplied to agent:** plan.md Section 10, ADR-006, a compact prompt with written decisions and rules (no migrations, no installs, no .env, no commit, STOP AND ASK). Agent was told not to re-read the whole repo.
- **Acceptance criteria:** An authenticated Customer submits custom-order details; the system saves a Customization linked to its Inquiry plus a separate PendingOrderRequest (status pending, no inquiryId); no feasibility check, acceptance, pricing or Order creation; role and validation rules enforced.
- **Important iterations/corrections:** OpenCode built the slice in 4 parts: A schema, B backend, C backend tests, D frontend.
  - Agent's Part A summary claimed inquiryId was unique; schema review showed it is not. The agent's own question 8 was the correct one.
- **Rejected/revised approach (if any):** Not supplied in this task.
- **Files changed (11):** `backend/prisma/schema.prisma`; `backend/src/business-logic/customization/index.js`; `backend/src/data-access/repositories/index.ts`; `backend/src/data-access/storage/inMemoryImageStorage.js`; `backend/src/presentation/controllers/customization.controller.js`; `backend/src/presentation/routes/customization.routes.js`; `backend/src/app.js`; `backend/tests/customization.test.js`; `frontend/src/services/api.js`; `frontend/src/features/customization/CustomizationRequestPage.jsx`; `frontend/src/App.jsx`.
- **Agent-report error found by human review:** The agent's Part A summary wrongly said `Customization.inquiryId` was unique; the schema file showed it is not.
- **Human check by Wareesha:** Reviewed the `schema.prisma` diff by hand. `PendingOrderRequest` has `customizationId` (unique) and no `inquiryId`. `Customization.inquiryId` has NO `@unique`.
- **Member 3 default, pending team confirmation:**
  - Budget is stored as free text (`String?`), no numeric rule invented.
  - Images are sent as base64 inside JSON, not multipart.
  - The file picker is a plain inline file input, not a shared component.
  - The form is reachable at `/customization/request` and not linked from the customer account page yet.
- **Open items for the team — Pending:**
  1. Coordinator adds `Customization` and `PendingOrderRequest` tables, then runs `prisma generate`.
  2. Who builds the real Supabase Storage adapter (images are only in an in-memory stub now).
  3. Confirm the pending status word "PENDING" before Cycle 3 depends on it.
  4. Confirm whether `Customization.inquiryId` should get `@unique` before the migration.
  5. Special instructions are saved twice (`Customization` and `Inquiry.message`), and the inquiry message is `""` when omitted. Member 2 should know because it touches `submitInquiry`.
- **Tests/checks actually run:** Human-run by Wareesha: full backend test suite and frontend production build before and after Cycle 2.
- **Actual results:** Before Cycle 2 — backend 64/64 tests passed; frontend build OK (102 modules). After Cycle 2 — backend 74/74 tests passed (10 new in `backend/tests/customization.test.js`); frontend build OK (103 modules).
- **Not tested:** Real database (tables not migrated yet); real image upload; the form in a browser (update this line later if Wareesha tests it).
- **Decision:** Accept / Revise / Reject
- **Decision reason:** Not supplied in this task.
- **Major issue/change:** Agent-report error on `Customization.inquiryId` uniqueness, found by human review.
- **Integration status:** Pushed to main as commit 6dd7e1c. Customization and PendingOrderRequest tables not migrated yet (pending the coordinator); real image storage pending.
- **Evidence link(s):** `docs/evidence/Testing_Evidence_Log.md`; `backend/tests/customization.test.js`; `backend/prisma/schema.prisma`.

### C1-M2 — Product Catalogue Browsing

- **Related PRD requirements:** FR-01; supports FR-02 and FR-03 without changing Standard Catalogue Prices.
- **Owner:** Member 2.
- **Plan version:** 1.8 (22 November 2026).
- **Branch / Pull Request / merge:** `main` working tree; no commit or push.
- **HITL / AFK mode:** AFK implementation followed by local automated verification.
- **Reason for mode:** The existing Product model and public route pattern allowed a focused implementation without a missing architectural decision.
- **AI chat/task reference:** Current Copilot chat — Member 2 complete Product Catalogue Browsing implementation.
- **Context supplied to agent:** Pasted Member 2 execution task; PRD v1.4; architecture; ADR-001 through ADR-006; `AGENTS.md`; `Guardrails.md`; Farochet UI v1.1 guides; existing admin Product implementation and tests.
- **Acceptance criteria:** Public customers can browse listed Product records with images, descriptions and Standard Catalogue Price; loading, empty and error states are handled; private/archived records are not exposed.
- **Important iterations/corrections:** Reused the centralized Product Management and Repository. Added public DTO projection in the Presentation controller and separate public routes; no private status, negotiated price or approved order price is returned. The public page uses only the shared customer shell, UI primitives and feature-specific ProductCard.
- **Rejected/revised approach (if any):** No hardcoded catalogue data, direct frontend database access, per-product availability/status fields, stock indicators, cart/checkout, or private price fields were introduced. Public discount calculation was not guessed because no active sale configuration exists.
- **Tests/checks actually run:** Focused `backend/tests/products.test.js`; full backend `npm test`; frontend `npm run build`; `git diff --check`; protected `CustomerHeader.jsx` diff check.
- **Actual results:** Focused product suite passed 12 tests; full backend suite passed 60 tests; frontend build passed. The build emitted one >500 kB chunk advisory. The protected CustomerHeader remained unchanged. Live browser/API/database integration was not executed.
- **Human decision:** Pending; coding-agent implementation is provisional.
- **Decision reason:** Human acceptance and live Supabase persistence/browser verification remain required.
- **Major issue/change:** Public discount sale pricing is not active in the current data model. This slice displays only the persisted Standard Catalogue Price and does not claim or calculate a public-sale effective price.
- **Integration status:** Implemented in the working tree; not committed or migrated.
- **Evidence link(s):** `backend/tests/products.test.js`; `frontend/src/features/catalogue/CustomerCataloguePage.jsx`; `frontend/src/features/catalogue/ProductCard.jsx`; `docs/evidence/Testing_Evidence_Log.md`.

### C4-M2 — Wishlist Management

- **Related PRD requirements:** FR-16; NFR-02; ADR-004; ADR-006.
- **Owner:** Member 2.
- **Plan version:** 1.9 (22 November 2026).
- **Branch / Pull Request / merge:** `main` working tree; no commit or push.
- **HITL / AFK mode:** AFK implementation followed by local automated verification; one schema correction was made only after explicit user authorization.
- **Reason for mode:** FR-16, the approved Wishlist Management component, existing Customer authentication boundary, and centralized Repository patterns defined the implementation. Prisma validation exposed an orphan `User.customizations` relation; only that field was removed after the user authorized the minimal correction.
- **AI chat/task reference:** Current Copilot chat — Member 2 Cycle 4 Wishlist Management.
- **Context supplied to agent:** PRD v1.4; `plan.md`; architecture; ADR-001 through ADR-006; `AGENTS.md`; `Guardrails.md`; Farochet UI v1.1 guides; existing Product, authentication, Repository, and UI implementations.
- **Acceptance criteria:** Authenticated Customers can add/list/remove their own catalogue Products; duplicate pairs are handled idempotently; wishlist actions remain independent of Inquiry, Customization, PendingOrderRequest, and Order creation; loading, empty, error/retry, and account-switch states are handled.
- **Important iterations/corrections:** Added the `WishlistItem` persistence model and unique Customer/Product constraint, Repository operations, Wishlist Management ownership checks and safe Product projection, Customer-only API routes, and catalogue/wishlist UI. Existing saved Products remain retrievable/removable if archived. The generated Prisma client was refreshed and schema validation passed after the authorized dangling-relation correction.
- **Rejected/revised approach (if any):** No client-selected owner, direct frontend database access, new Business Logic component, public discount logic, or order/inquiry creation was introduced. The migration was intentionally left unapplied during implementation; its later deployment is recorded below.
- **Tests/checks actually run:** Focused `backend/tests/wishlist.test.js` and `backend/tests/wishlist-repository.test.js`; full backend `npm test`; full frontend `npm test`; frontend `npm run build`; `npx prisma validate`; `git diff --check`.
- **Actual results:** Focused Wishlist API/Repository tests passed 12/12; full backend suite passed 90/90 across 11 files; frontend suite passed 11/11 across 2 files; production build passed with 107 modules transformed and a >500 kB chunk advisory; Prisma validation and `git diff --check` passed. The in-memory API test and mocked Repository tests do not establish PostgreSQL durability. No browser, live PostgreSQL, migration, or RLS/grant verification was run.
- **Human decision:** Formal Accept / Revise / Reject record remains pending; the user reports successful browser testing.
- **Decision reason:** The user-reported browser result is recorded separately from automated tests; no formal acceptance outcome was supplied.
- **Major issue/change:** Prisma validation initially failed because `User.customizations` had no opposite relation on `Customization`. After explicit user approval, that orphan field alone was removed; the Wishlist relations/model were added.
- **Integration status:** Wishlist migration applied to the shared development database; no commit or push.
- **Evidence link(s):** `backend/tests/wishlist.test.js`; `backend/tests/wishlist-repository.test.js`; `backend/prisma/migrations/20261122192000_customer_wishlist/migration.sql`; `frontend/src/features/wishlist/CustomerWishlistPage.test.jsx`; `frontend/src/features/wishlist/CustomerWishlistPage.jsx`; `docs/evidence/Testing_Evidence_Log.md`.
- **22 Nov pre-migration follow-up:** Read-only diagnosis confirmed `public.WishlistItem` was missing (Prisma `P2021`); the backend-reachable frontend request was not a CORS failure. No schema or migration was changed or applied during that diagnostic step. The Repository now maps only the missing WishlistItem table error to an actionable HTTP 503. Added accessible outlined/filled hearts to catalogue cards and Wishlist navigation; automated tests cover toggling and propagation.
- **22 Nov final verification:** Prisma status reported all eight migrations up to date after the user-reported successful migration application. Latest automated checks: focused Wishlist backend 15/15; full backend 93/93; focused Wishlist frontend 9/9; full frontend 12/12; Prisma validation passed; Vite production build passed (109 modules; >500 kB chunk advisory). The user reports successful browser Wishlist testing. The browser was not shared with the coding agent, so the manual test is user-reported and was not independently repeated. No further database migration or data changes were made during this final verification; no Git staging, commit, or push was performed.

### C3-M3 — Customization Request Review

- **Related PRD requirements:** FR-09, FR-10; plan.md Section 11 (Cycle 3, Member 3).
- **Owner:** Member 3.
- **Plan version:** Not supplied in this task.
- **Branch / Pull Request / merge:** Direct to main (no branches); commit hash to be added after push.
- **HITL / AFK mode:** AFK build by OpenCode in 3 parts (A backend, B backend tests, C frontend), then one small fix. Human review and test runs by Wareesha after the build. The agent did all three parts in one run without stopping between them, although it was asked to stop after each part.
- **Reason for mode:** Not supplied in this task.
- **AI chat/task reference:** OpenCode agent — Cycle 3 Member 3, Customization Request Review (FR-09, FR-10).
- **Context supplied to agent:** plan.md Section 11, PRD FR-09/FR-10 and business rules 5, 6, 21, ADR-004, ADR-006, the Cycle 2 customization files, and the Cycle 1 inquiry pattern; a compact prompt with written decisions and rules (no migrations, no installs, no .env, no commit, STOP AND ASK).
- **Acceptance criteria:** Raazia inspects submitted specifications and accessible reference images; no automatic feasibility decision or accept/reject; rejected requests retained and create no Order; customer access restricted to the owning customer's data.
- **Important iterations/corrections:** AFK build by OpenCode in 3 parts (A backend, B backend tests, C frontend), then one small fix. Human review found a bug: `getReferenceImageForViewer` used `return image ?? imageNotFound()`, which returns an error object instead of throwing when a recorded image has no stored file. Fixed to `if (!image) throw imageNotFound()`, and one test was added. The tests had not covered this case. Human review also checked: customer ownership comes from the persisted Inquiry customerId, never from the request; a customer opening another customer's request gets 404; the review functions contain no write calls.
- **Rejected/revised approach (if any):** Not supplied in this task.
- **Files changed (11):** `backend/src/app.js`; `backend/src/business-logic/customization/index.js`; `backend/src/data-access/repositories/index.ts`; `backend/src/data-access/storage/inMemoryImageStorage.js`; `backend/src/presentation/controllers/customization.controller.js`; `backend/src/presentation/routes/customization.routes.js`; `backend/tests/customization.test.js`; `frontend/src/App.jsx`; `frontend/src/components/layout/AdminSidebar.jsx`; `frontend/src/services/api.js`; `frontend/src/features/customization/CustomizationReviewPage.jsx` (new).
- **Member 3 defaults, pending team confirmation (not group decisions):** (1) review only, no change to PendingOrderRequest.status, no accepted/rejected values, no Order creation, with decision recording left to Cycle 5; (2) Raazia list shows PENDING requests, newest first; (3) customer can read only their own request and images; (4) image access goes through the injected storage interface with the in-memory stub, no public URLs, no @supabase/supabase-js; (5) no new fields for review notes.
- **Open items, Pending:** (a) does showing the submitted information satisfy FR-10 for Cycle 3, or must a decision record exist now; (b) the docs mention schedule, complexity, skills and scope, but the schema has no such fields, so is free text enough; (c) when Cycle 5 adds accepted/rejected values, rejected requests will drop out of the PENDING-only list, so how will Raazia see them; (d) the real Supabase Storage adapter must reject paths that point outside the bucket; (e) the Customization and PendingOrderRequest tables are still not migrated by the coordinator.
- **Tests/checks actually run:** Human-run by Wareesha: backend 115/115 passed (22 in `backend/tests/customization.test.js`, up from 10); frontend build OK (110 modules). No separate baseline was run for this cycle, so none is recorded. The 115 includes other members' tests.
- **Actual results:** Backend 115/115 passed (22 in `backend/tests/customization.test.js`, up from 10); frontend build OK (110 modules).
- **Not tested:** Real database, real image storage, the review page in a browser.
- **Decision:** Accept / Revise / Reject
- **Decision reason:** Not supplied in this task.
- **Major issue/change:** Human review found `getReferenceImageForViewer` used `return image ?? imageNotFound()`, which returns an error object instead of throwing when a recorded image has no stored file. Fixed to `if (!image) throw imageNotFound()`, and one test was added. The tests had not covered this case. No schema change, no migration needed.
- **Integration status:** Implemented locally in the working tree; not committed or pushed. Branch / Pull Request / merge: Direct to main (no branches); commit hash to be added after push.
- **Evidence link(s):** `docs/evidence/Testing_Evidence_Log.md`; `backend/tests/customization.test.js`.

### C4-M3 — Quotation & Price Negotiation

- **Related PRD requirements:** FR-12, FR-13; plan.md Section 12 (Cycle 4, Member 3); ADR-002, ADR-005.
- **Owner:** Member 3 (Wareesha Fatima, 25I-3009).
- **Plan version:** Not supplied in this task.
- **Branch / Pull Request / merge:** Direct to main (no branches); commit pending — the student will fill in the hash.
- **HITL / AFK mode:** AFK build by an OpenCode agent in four parts (A schema, B backend, C tests, D frontend), with a short summary after each part. The agent did not run tests; the student ran them.
- **Reason for mode:** Not supplied in this task.
- **AI chat/task reference:** OpenCode agent, read-limited prompt — Cycle 4 Member 3, Quotation & Price Negotiation (FR-12, FR-13).
- **Context supplied to agent:** A read-limited prompt. No migration, `prisma generate`, dependency install, `.env` read, test run, or commit was performed by the agent.
- **Acceptance criteria:** Not restated in this task; see plan.md Section 12 (Cycle 4, Member 3).
- **Important iterations/corrections:** Built in four ordered parts (A schema, B backend, C tests, D frontend), one short summary after each part. The agent did not run tests; the student ran them. No migration, `prisma generate`, or dependency install was run.
- **Rejected/revised approach (if any):** Not supplied in this task.
- **Files changed (11):** `backend/prisma/schema.prisma`; `backend/src/business-logic/customization/index.js`; `backend/src/data-access/repositories/index.ts`; `backend/src/presentation/controllers/customization.controller.js`; `backend/src/presentation/routes/customization.routes.js`; `backend/tests/negotiation.test.js`; `frontend/src/App.jsx`; `frontend/src/features/customization/CustomizationReviewPage.jsx`; `frontend/src/features/customization/CustomerNegotiationPage.jsx`; `frontend/src/features/customization/NegotiationPanel.jsx`; `frontend/src/services/api.js`.
- **Team-defined defaults, pending team confirmation (not PRD rules):** (1) quotation response shape `{ standardCataloguePrice, publicPrice }` with `publicPrice` null when no discount is active; (2) discount formula duplicated from the pricing component rather than reused; (3) `REQUEST_NOT_PENDING` returns 409; (4) note capped at 500 characters; (5) no turn-taking — the same party may add consecutive entries; (6) unknown fields and `note: null` rejected.
- **Open items, Pending:** NegotiationEntry needs a coordinator migration after the Customization and PendingOrderRequest migrations; the team-defined defaults above require team confirmation.
- **Tests/checks actually run:** Student-run: backend `npm test` — 13 test files / 156 tests passed (21 in `backend/tests/negotiation.test.js`; `backend/tests/customization.test.js` still passes with 22 tests). Frontend `npm run build` succeeded (113 modules). Student manual checks are recorded in `docs/evidence/Testing_Evidence_Log.md`. The agent ran no tests.
- **Actual results:** Backend 13 test files / 156 tests passed; frontend build succeeded (113 modules). Student manual checks confirmed the ADR-005 Decision 1 schema shape, no PUT/PATCH/DELETE negotiation routes, and no "agreed", "accepted" or "approved" wording in the new frontend files.
- **Not tested:** Live database persistence is not claimed; NegotiationEntry needs a coordinator migration after the Customization and PendingOrderRequest migrations.
- **Decision:** Accept / Revise / Reject
- **Decision reason:** Not supplied in this task.
- **Major issue/change:** Added the append-only `NegotiationEntry` model and negotiation flow. The agent ran no migration, `prisma generate`, dependency install, or test run; the coordinator migration remains outstanding.
- **Integration status:** Implemented locally in the working tree; commit pending. Branch / Pull Request / merge: Direct to main (no branches); commit hash to be filled by the student.
- **Evidence link(s):** `docs/evidence/Testing_Evidence_Log.md`; `backend/tests/negotiation.test.js`.

### C3-M4 — Payment Management

- **Related PRD requirements:** FR-14, FR-15; ADR-003, ADR-005; plan.md Section 11.
- **Owner:** Member 4.
- **HITL / AFK mode:** AFK implementation and local automated verification; human acceptance pending.
- **AI chat/task reference:** Current Copilot chat — Cycle 3 Member 4 Payment Management.
- **Acceptance criteria:** Raazia can record only the four PRD payment states; NULL remains “Not yet recorded” until set; payment updates leave manufacturing and delivery unchanged; no payment or refund is processed.
- **Implementation:** Added a Raazia-only `PATCH /api/admin/orders/:id/payment-status` route through Status Management and the centralized Repository, plus a payment-state selector in the existing admin Order details view. No new Business Logic component or Order field was added.
- **Tests/checks actually run:** Focused backend order tests (13 passed); full backend suite with one Vitest thread worker (12 files / 117 tests passed); frontend production build passed (110 modules); `git diff --check` passed. A default-parallel backend run exhausted the environment's Node worker memory; the single-worker run passed. Frontend unit tests were not run because the frontend `vitest` executable is unavailable in the current install.
- **Database integration limitation:** The configured `farochet_runtime` role has no Order-table privileges. Live payment persistence therefore remains unavailable: this operation needs permitted access to `public."Order"` (including updating `paymentStatus`). No migration, grants/permissions, or credentials were changed. API behavior was tested using the in-memory repository only.
- **Human decision:** Pending Accept / Revise / Reject.
- **Integration status:** Local working tree only; live database behavior and browser acceptance unverified.
- **Evidence link(s):** `backend/tests/orders.test.js`; `frontend/src/features/orders/OrderManagementPage.jsx`; `docs/evidence/Testing_Evidence_Log.md`.

### C4-M4 — Delivery Management

- **Related PRD requirements:** FR-14, FR-15; ADR-003, ADR-004, ADR-005 and ADR-006.
- **Owner:** Member 4.
- **Plan version:** 2.7 (23 November 2026).
- **Branch / Pull Request / merge:** `main`; direct commit and push requested; no feature branch or pull request.
- **HITL / AFK mode:** AFK implementation with automated local verification; live database/browser and human acceptance remain pending.
- **Reason for mode:** Delivery fields, threshold behavior and UI contracts can be implemented and tested locally, while Supabase migration deployment and shared-browser verification require coordinator/user execution.
- **AI chat/task reference:** Current Copilot chat — complete Cycle 4 Member 4 delivery contribution audit.
- **Context supplied to agent:** PRD v1.4 FR-14/FR-15, architecture Status Management and Order responsibilities, accepted ADR-003/ADR-004/ADR-005/ADR-006, plan Cycle 4 Member 4, AGENTS/Guardrails/UI rules and the existing Member 4 payment/manufacturing implementation.
- **Acceptance criteria:** Raazia records delivery method, fee and tracking information; local handover is fee zero; courier delivery has no invented status; delivery status remains NULL until `Delivered`; the PKR 199/200 threshold is exact; significant increases require customer agreement and a revised Approved Price; approved revisions are audited; delivery updates do not change manufacturing/payment status; no courier API/payment/refund automation is introduced.
- **Implementation:** Added delivery fields and `OrderPriceRevision` to the Prisma model; added an idempotent migration with data-type/constraint/grant/policy checks; added Raazia-only delivery validation and update behavior in Status Management; added Repository transaction support for significant Approved Price revisions; added the admin PATCH API/UI and customer display. Backend tests cover local handover, courier validation, 199/200 behavior, agreement, status independence and role denial. Frontend component tests cover 199/200 controls, revised-price agreement and local-handover fee.
- **Rejected/revised approach (if any):** No `PENDING`, `DISPATCHED` or `IN_TRANSIT` delivery status, payment gateway, refund execution, courier booking/API, automatic customer contact or automatic dispatch behavior was introduced.
- **Tests/checks actually run:** Prisma `validate`; Prisma `format` and subsequent validate; full backend suite with one Vitest thread worker; full frontend suite; frontend production build; `git diff --check`; repository status/diff review.
- **Actual results:** Prisma schema validation passed after formatting. Backend 12 test files / 135 tests passed. Frontend 9 test files / 32 tests passed. Vite production build passed (111 modules) with the existing >500 kB chunk advisory. The delivery migration was not applied or verified against live Supabase/PostgreSQL.
- **Human decision:** Pending Accept / Revise / Reject.
- **Decision reason:** Automated implementation and UI behavior passed locally, but no live migration, authenticated browser workflow or human acceptance was performed.
- **Major issue/change:** The migration adds delivery fields and an `OrderPriceRevision` table plus runtime grants/policies. It must be coordinator-reviewed and applied before live persistence can be claimed.
- **Integration status:** Implemented and documented in the working tree; live database/E2E integration remains outstanding until the migration is applied and shared browser verification is performed.
- **Evidence link(s):** `backend/tests/orders.test.js`; `frontend/src/features/orders/OrderManagementPage.test.jsx`; `backend/prisma/migrations/20261123150000_delivery_management/migration.sql`; `docs/evidence/Testing_Evidence_Log.md`.
### Cycle 2 — Member 2 final review and Admin/product follow-up (23 November 2026)

- **Related PRD requirements:** FR-01, FR-02, FR-03, FR-05, FR-07, FR-16; ADR-004 and ADR-006.
- **Owner:** Member 2.
- **Plan version:** 2.5 (23 November 2026).
- **Branch / Pull Request / merge:** `main`; prepared for a direct-to-main commit and push after checks; no feature branch or pull request.
- **HITL / AFK mode:** HITL; the user authenticated in the shared Raazia browser session for live UI checks.
- **Reason for mode:** Authenticated Admin identity and route access required the user's existing sign-in; database permissions remained human-governed.
- **AI chat/task reference:** Current Copilot chat — Member 2 final review, dashboard repair, and push.
- **Context supplied to agent:** PRD v1.4; architecture and accepted ADRs; `AGENTS.md`; `Guardrails.md`; existing code, tests, and UI Kit guidance.
- **Acceptance criteria:** Inquiry list/detail display linked Customer name/email and UUID secondarily; drawer exposes all existing Admin routes at desktop/mobile widths; Product Management separates product-load and pricing-load failures and never renders a failed product request as an empty catalogue.
- **Important iterations/corrections:** Replaced desktop persistent sidebar with an accessible shared drawer; added Escape/backdrop/close handling, focus trapping/restoration, route closure, and scroll lock. Product and public-pricing requests now load independently; unavailable pricing disables discount mutations and does not imply an inactive sale. The generated Prisma client initially lacked the PublicDiscount delegate and was regenerated. Restarted backend logs then confirmed the remaining live pricing failure is PostgreSQL `42501 permission denied for table PublicDiscount` (Prisma `P2039`): the existing table migration omits runtime grants. No migration or data change was performed.
- **Rejected/revised approach (if any):** No auth bypass, database permission change, migration application, or fabricated pricing state was used. Customer-facing Admin footer link, environment-file edits, confirmed-order migration edits, backups, and scratch artifacts were excluded from the intended commit.
- **Tests/checks actually run:** Backend `npm test`; frontend `npm test`; frontend `npm run build`; `npm run prisma:generate`; `git diff --check`; `git diff --cached --check`; live authenticated browser/API checks.
- **Actual results:** Backend 113/113 and frontend 30/30 passed. Production build passed (110 modules) with the existing >500 kB advisory. Browser verified all four Admin links and active state at 1280px and 390px, Admin inquiry list/detail customer identity, and 2 product rows despite a pricing failure. `/api/pricing/public` remains HTTP 500 until a reviewed permission migration is applied by the authorized database steward. No migration was run.
- **Human decision:** The user authorized commit and push. Formal product Accept / Revise / Reject remains pending.
- **Decision reason:** Requested implementation and checks pass; the unrelated public-pricing grant remains a documented integration blocker rather than being silently altered.
- **Major issue/change:** Public pricing still lacks `SELECT` for `farochet_runtime`. The mobile product table also creates document-level horizontal overflow; this is separate from the drawer and remains a follow-up limitation.
- **Integration status:** No changes had been committed or pushed when this evidence entry was written; the existing local Wishlist commit remains ahead of `origin/main`.
- **Evidence link(s):** `frontend/src/components/layout/AdminShell.test.jsx`; `frontend/src/features/catalogue/ProductManagementPage.test.jsx`; `backend/prisma/migrations/20261122180000_public_discount/migration.sql`; `docs/evidence/Testing_Evidence_Log.md`; `plan.md`.
### Member 2 — Integrated resumption after origin/main fast-forward (23 November 2026)

- **Related PRD requirements:** FR-01, FR-02, FR-03, FR-05, FR-07, FR-16; ADR-004 and ADR-006.
- **Owner:** Member 2.
- **Plan version:** 2.6 (23 November 2026).
- **Branch / Pull Request / merge:** `main` fast-forwarded to `origin/main` at `bf9699e`; no new commit or push.
- **HITL / AFK mode:** HITL; reused the user's authenticated Raazia browser session without bypassing authorization.
- **AI chat/task reference:** Current Copilot chat — resume after origin/main fast-forward.
- **Acceptance criteria:** Preserve the newly merged Customization Requests route in the shared Admin drawer; verify current route labels and active state; verify linked Customer identity in Admin Inquiry list/detail; keep product records visible when public pricing fails.
- **Important iterations/corrections:** Resolved the overlapping Admin route and backend route-registration changes by preserving both the Customer Inquiry routes and the incoming Admin Customization routes. The shared drawer now includes five current routes. Preserved Member 3/4 evidence and code while reapplying Member 2 changes. No migration or database record was changed.
- **Tests/checks actually run:** Backend `npm test -- --pool=threads --maxWorkers=1`; frontend `npm test`; frontend `npm run build`; `git diff --check`; `git diff --cached --check`; authenticated browser checks at 1280px and 390px; public pricing endpoint probe.
- **Actual results:** Backend 127/127, frontend 30/30, and production build passed (111 modules; existing >500 kB advisory). The authenticated drawer showed all five routes with the active route at both widths. Admin Inquiry list/detail showed linked Customer name/email and UUID. Product Management showed two saved products with pricing unavailable. `/api/pricing/public` returned HTTP 500; prior backend logs identified PostgreSQL `42501 permission denied for table PublicDiscount`. The Customization Requests route loaded but its live data request returned HTTP 500; the page showed an error and zero pending requests. No migration was run.
- **Human decision:** Formal Accept / Revise / Reject remains pending.
- **Decision reason:** Combined automated checks passed; live pricing and Customization data remain blocked by existing database permissions/migration state.
- **Major issue/change:** The repository still reports a rebase in progress with `REBASE_HEAD` pointing to the existing Wishlist commit, although that commit is already in remote history. `git rebase --quit` could not remove `.git/rebase-merge` because of its deny-delete ACL. No rebase continuation, commit, push, ACL change, or destructive Git action was performed. The re-applied Member 2 work remains staged, and the original work remains in `stash@{0}`.
- **Integration status:** No Member 2 commit or push; must clear the stale Git operation metadata before committing safely.
- **Evidence link(s):** `frontend/src/components/layout/AdminShell.test.jsx`; `frontend/src/components/layout/AdminSidebar.test.jsx`; `frontend/src/features/catalogue/ProductManagementPage.test.jsx`; `frontend/src/features/inquiries/InquiryManagementPage.test.jsx`; `docs/evidence/Testing_Evidence_Log.md`.
### Cycle 4 — Member 1 Product Details

- **Related PRD requirements:** FR-01, FR-05, FR-09, FR-16; ADR-001 through ADR-006.
- **Owner:** Member 1.
- **Plan version:** 2.7 (23 November 2026).
- **Branch / Pull Request / merge:** Local detached `HEAD` based on `origin/main`; conflict-resolution changes are not committed or pushed.
- **HITL / AFK mode:** AFK implementation followed by local automated verification.
- **Reason for mode:** The existing Product, Inquiry, Customization, Pricing and React page contracts provided implementation points for the narrow product-detail actions.
- **AI chat/task reference:** Current Copilot chat — Member 1 Cycle 4 Product Details.
- **Context supplied to agent:** PRD v1.4; `plan.md` Sections 4 and 12; architecture; ADR-001 through ADR-006; `AGENTS.md`; `Guardrails.md`; Farochet UI Kit v1.1 guidelines, screen specification, component catalog, workflow and visual notes.
- **Acceptance criteria:** Public product detail and uniform public pricing; unknown/malformed product handling; product inquiry submission; product-specific customization handoff preserving Inquiry → Customization → PendingOrderRequest; customer-authenticated add/check wishlist action; loading, error and missing-image states; no private price or stock exposure.
- **Important iterations/corrections:**
  - Resolved all committed merge-marker conflicts while retaining Member 2's full Wishlist and Inquiry history/API behavior, Member 3's customization review routes, and Member 1's Product Details changes. Removed duplicate declarations and imports uncovered during the reconciliation.
  - The public Product DTO now exposes `standardCataloguePrice`, `effectivePublicPrice`, and nullable `fixedDiscountAmount`, derived by Pricing and Discount Management and projected through Product Management; the Standard Catalogue Price remains unchanged.
  - The product-card links open `/products/:id`. Unauthenticated Customer actions route through the existing sign-in flow; sign-in preserves the original search query for the product-specific customization handoff.
  - Customer inquiry submission is exposed at `POST /api/customer/inquiries`; the authenticated identity supplies `customerId`.
  - The existing `POST /api/customer/customization/requests` workflow accepts an optional originating `productId` and records it on the generated Inquiry without adding a direct Inquiry link to PendingOrderRequest.
  - Product detail Wishlist actions use only customer-scoped `GET`/`PUT /api/customer/wishlist/:productId`; no standalone Wishlist page, listing, or removal API was added. The pair is unique and add is idempotent.
- **Migration reconciliation:**
  - Restored the local migration definitions `20261122192000_customer_wishlist` and `20261123024800_allow_runtime_inquiry_submission`; both are already applied in the shared database, and `prisma migrate status` reports no modified/missing applied migrations.
  - Reconciled the schema to the shared database by adding the existing WishlistItem `(customerId, createdAt)` index and removing the schema-only `"current"` defaults from `PublicDiscount.id` and `RaaziaAvailability.id`; repository upserts explicitly set `"current"`.
  - Applied `20261123200000_customization_request_lifecycle`, creating `Customization` and `PendingOrderRequest` with the Inquiry/Customization foreign keys, indexes, RLS policies and `farochet_runtime` SELECT/INSERT grants. PendingOrderRequest references only Customization.
  - Applied `20261123210000_runtime_public_discount_read` after live API checks exposed the pre-existing missing PublicDiscount permission; it grants only SELECT to `farochet_runtime` and adds its SELECT RLS policy.
  - Existing historical migrations `20261119190000_inquiry_management` and `20261119233000_user_roles_and_inquiry_relation` both create `Inquiry`. They were left untouched as required; this is a pre-existing clean-empty-database replay caveat and does not appear as drift in the already-migrated shared database.
- **Rejected/revised approach (if any):** No cart/checkout, stock fields, private Negotiated/Approved prices, wishlist manager page, Member 3 quotation/negotiation work, or Member 4 delivery work was introduced.
- **Tests/checks actually run:** Backend `npm test`; frontend `npm test` and `npm run build`; `npx prisma validate`, `npx prisma format --check`, and `npx prisma generate`; `prisma migrate status` and `prisma migrate diff`; read-only runtime privilege/policy queries; rollback-only runtime Inquiry → Customization → PendingOrderRequest insert transaction; live read-only API probes.
- **Actual results:** Backend Vitest/Supertest: 12 files, 135 tests passed. Frontend Vitest: 8 files, 29 tests passed. Frontend build succeeded with 113 modules; Vite reported the existing >500 kB chunk advisory (567.30 kB JS). Prisma validation, format check and client generation passed. Both migrations deployed successfully; status reports 12 migrations and an up-to-date database, and schema diff reports no difference. Runtime SELECT/INSERT grants and the intended RLS policies were verified; the rollback-only lifecycle insert/FK test passed and committed no rows. Live `/api/health`, `/api/pricing/public`, `/api/products`, and `/api/products/:id` returned HTTP 200; the Product Details response contained only public pricing fields and passed the effective-price check.
- **24 Nov final verification:** Live unauthenticated customization POST to `http://localhost:5000/api/customer/customization/requests` returned 401 `AUTHENTICATION_REQUIRED`. Final backend `npm test` passed 12 files / 135 tests. Final frontend `npm run build` passed with 113 modules. An automated signed-out browser smoke verified Product Details and customer-action sign-in gating.
- **24 Nov browser smoke:** The integrated browser loaded the Product Details route and verified product/category and PKR 20,000 Standard Catalogue Price, missing-image fallback, absence of private price/stock fields, all three customer actions, sign-in redirection for Inquiry/customization/Wishlist while signed out, and the unknown-product not-found state. This is automated public-page smoke evidence only; it is not the requested authenticated UI acceptance or a human decision.
- **Human UI Acceptance Checklist (under 2 minutes):**
  1. Open `http://localhost:5174/products/e0973344-fa2f-44c3-9f2e-b335d2a944d9`; confirm gloves details, category, images/unavailable state, Standard Catalogue Price PKR 20,000 and no private price fields.
  2. Sign in as a valid Customer; return to the product URL; confirm Inquiry, Custom Piece and Wishlist actions are visible.
  3. Open Custom Piece and submit Product type `gloves`, quantity `1`, size `Verification size`, colour `Verification colour`, materials `Verification yarn`, special instructions `Human UI acceptance probe`, delivery address `Verification address`, then Submit; confirm success.
  4. Add the product to Wishlist and verify the saved state; open `/wishlist` and confirm it appears; remove it and confirm it disappears.
  5. Submit a catalogue-linked inquiry with message `Human UI acceptance inquiry` and confirm success/return flow.
- **24 Nov user-reported completion:** User stated “now completed cycle 4 m1”. This is recorded as completion of the live authenticated Customer customization submission, human UI acceptance, and formal Member 1 Cycle 4 acceptance. No response codes, record IDs, or test counts were included in that report. The shared browser snapshot available to this assistant remained signed out; therefore the authenticated request and human UI review were not independently observed in this session.
- **Human decision:** Accept (user-reported completion, 24 Nov 2026).
- **Decision reason:** The user reported the full Member 1 Cycle 4 slice complete after the prior verification gaps were identified.
- **Major issue/change:** Both required migrations are deployed and the public Product Details read path works. The user reports the authenticated customization and human acceptance steps are now complete. Historical Inquiry table creation is duplicated in two already-applied migrations, so clean empty-database replay remains a separate caveat.
- **Integration status:** Database migrations and live public Product Details reads are verified; code changes remain local and uncommitted. The live unauthenticated endpoint is verified 401. Authenticated submission, UI acceptance, and formal acceptance are marked complete based on the user's report; exact authenticated HTTP/database evidence was not independently captured here.
- **Evidence link(s):** `backend/tests/products.test.js`; `backend/tests/inquiries.test.js`; `backend/tests/customization.test.js`; `backend/tests/wishlist.test.js`; `frontend/src/features/catalogue/ProductDetailsPage.jsx`; `backend/prisma/migrations/20261122192000_customer_wishlist/migration.sql`; `backend/prisma/migrations/20261123024800_allow_runtime_inquiry_submission/migration.sql`; `backend/prisma/migrations/20261123200000_customization_request_lifecycle/migration.sql`; `backend/prisma/migrations/20261123210000_runtime_public_discount_read/migration.sql`.
