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
