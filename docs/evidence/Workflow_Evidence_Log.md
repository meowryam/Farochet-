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
