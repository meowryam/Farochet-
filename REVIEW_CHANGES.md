# Review and Change Log — 18 November 2026

## Scope reviewed

Reviewed `PRD.md`, `architecture.md`, `AGENTS.md`, ADR-001 through ADR-004, and `Guardrails.md` for gaps, ambiguities, contradictions, missing implementation decisions, and cross-document consistency.

**Explicit exclusion honored:** The separately uploaded `VERTICAL SLICE IMPLEMENTATION PLAN.md` was not opened, read, used, or included in this review.

## Main decisions added

1. **Public-sale discount:** One fixed, positive, whole-PKR discount amount applies to every listed product. It must be lower than every listed product's standard catalogue price. Percentage discounts and stacking are not supported. Effective price is standard catalogue price minus the fixed discount.
2. **Negotiation history:** Use append-only `NegotiationEntry` records. One `Customization` may have zero or many entries; each entry belongs to exactly one `Customization`. Each entry records proposer, proposed price, optional note, and timestamp. Access is limited to Raazia and the owning customer.
3. **Initial payment status:** NULL until Raazia manually records one of the PRD payment states. Display `Not yet recorded`.
4. **Initial delivery status:** NULL until Raazia records `Delivered`. Display `Not yet recorded`; dispatch and tracking are delivery information, not additional status values.
5. **Technology boundary:** Programming language, framework, database vendor, ORM, hosting/deployment platform, and external providers remain unselected. No technology was invented or added.

## File-by-file changes

### `PRD.md` — Version 1.4
- Updated document version/date/status and made clear the new implementation decisions have not been re-reviewed by the TA.
- Replaced the vague public-discount calculation reference with the fixed-amount rule.
- Rewrote all 25 business rules as short, action-oriented implementation rules.
- Made initial payment and delivery values explicitly NULL until recorded and specified the UI fallback.
- Clarified independent status behavior, cancellation/refund recording, wishlist uniqueness/persistence, optional estimated completion date, and inclusive PKT sales-summary filtering.
- Updated NFR-03 and FR-03 acceptance criteria to test the actual fixed-discount formula.
- Added an implementation-decision section and updated traceability.

### `architecture.md`
- Added the `NegotiationEntry` persistence model and cardinality.
- Replaced the unresolved discount calculation with the fixed whole-PKR formula and validation boundary.
- Defined nullable initial payment/delivery statuses and the `Not yet recorded` display.
- Replaced the old human-confirmation register with an implementation-decision register.
- Updated PRD version references, ADR references, component ownership, and cross-document traceability.
- Kept the Multi-Tier Layered Architecture, nine Business Logic components, and all four existing ADR decisions intact.

### `AGENTS.md`
- Replaced the old STOP-AND-ASK instructions for negotiation persistence, public discounts, and initial statuses with the ADR-005 implementation rules.
- Updated the negotiation data model, discount validation, initial status handling, decision register, tests, and source references.
- Retained STOP-AND-ASK for genuinely new scope, material conflicts, or unapproved technology/architecture changes.
- Kept the technology stack intentionally unselected.

### `ADR/ADR-005 Resolution of Implementation Gaps.md` — added
- Records the three resolved implementation decisions: negotiation history persistence, fixed public-sale discount, and nullable initial payment/delivery statuses.
- Includes consequences and validation tests.
- Explicitly leaves technology choices unselected.

### `Guardrails.md`
- Updated the negotiation, public-discount, and initial-status guardrails to match ADR-005.
- Replaced the old pending-decision section with resolved decisions and the remaining technology boundary.
- Updated source register and PRD/ADR references.

## Preserved unchanged

- ADR-001 through ADR-004 decision content.
- Existing reference documents and evidence files.
- The chosen Multi-Tier Layered Architecture, MVC placement, nine Business Logic components, centralized Repository, and centralized authorization boundary.
- No programming language, framework, database vendor, ORM, hosting platform, payment gateway, courier provider, or file-storage provider was selected.
- No implementation plan was generated or edited.
