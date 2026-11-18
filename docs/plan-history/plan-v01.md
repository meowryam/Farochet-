# Raazia — Deliverable 4 Implementation Plan

**Plan version:** 1.0  
**Last updated:** 18 November 2026  
**Status:** Initial D4 execution baseline; implementation not yet started  
**Target submission/demo date:** 27 November 2026  
**Owners:** Member 1, Member 2, Member 3, Member 4; project coordinator owns integration and shared contracts.

> This is the active plan. The superseded source draft is preserved at `docs/plan-history/plan-v00-original-draft.md`. Do not use its old contracts or status enums. Before changing this plan, save the current version as `docs/plan-history/plan-vNN.md` or rely on a retrievable Git commit, then update the plan version and date.

## 1. Product objective

Deliver a working Customer Inquiry, Quotation, and Custom Order Management System for Raazia's crochet business. Customers must be able to browse products, submit inquiries and custom-order details, maintain a personal wishlist, and view their permitted inquiry/order information. Raazia must be able to manage catalogue information, her own availability, inquiries, customization requests, quotations/negotiations, confirmed Orders, manufacturing/payment/delivery information, and the FR-18 sales summary.

The system records decisions made by Raazia; it does not automate feasibility, acceptance/rejection, payment processing, refunds, courier booking, or comprehensive accounting/inventory. The PRD is the source of truth for all product behavior.

## 2. Governing context and approved stack

Read these files before changing code:

1. `PRD.md` (Version 1.4, updated 18 November 2026) — requirements and business rules.
2. `architecture.md` — approved Multi-Tier Layered Architecture, MVC in Presentation only, nine Business Logic components, centralized Repository, data relationships and interactions.
3. `AGENTS.md` and `Guardrails.md` — binding agent instructions and rationale.
4. Relevant accepted ADRs in `ADR/` — ADR-001 through ADR-006.
5. Relevant Farochet documents in `docs/ui/Farochet_UI_Kit_v1.1/docs/ui/`.

The approved D4 stack is defined in **ADR-006**:

| Area | Choice |
|---|---|
| Runtime | Node.js 26 LTS |
| Package manager | npm |
| Frontend | React + Vite + JavaScript/JSX + React Router |
| Styling | Supplied Farochet UI Kit CSS and components |
| Backend | Node.js + Express 5, REST API |
| Input validation | Zod |
| Database | Supabase-hosted PostgreSQL |
| Data access | Prisma ORM 7 stable + `@prisma/adapter-pg` + `pg` |
| Authentication | Supabase Auth, with authorization enforced by Express Middleware |
| Reference-image storage | Supabase Storage, private bucket, backend-mediated access |
| Testing | Vitest + Supertest |
| Execution | Local React/Vite and Express; hosted Supabase data/auth/storage |

Do not substitute technologies or introduce major dependencies without project-coordinator approval and an ADR update where the architecture/dependency boundary changes.

## 3. Architecture and implementation rules

- One application, not microservices.
- Preserve Presentation → Business Logic → Data Access.
- MVC exists only inside Presentation.
- Use exactly the nine distinct Business Logic components: Product Management; Availability Management; Pricing and Discount Management; Inquiry Management; Customization and Quotation Management; Order Management; Status Management; Wishlist Management; Sales Summary.
- One centralized Repository; Prisma access is confined to it. Do not add a repository per component.
- Central Middleware authenticates each protected request, enforces the two approved roles, and obtains the persisted application role via the Repository. The Middleware's only direct Presentation-to-Repository exception is User identity/role lookup.
- Business Logic enforces customer-specific record ownership. Repository is not an authorization boundary.
- React uses Express for business data. React may use Supabase Auth for sign-up/sign-in/session handling only; do not query business tables through Supabase Data API from the browser.
- Supabase Auth proves identity; the application's `User` record supplies the role. Customer registration must assign `CUSTOMER` server-side. The client must never be able to self-assign `RAAZIA`.
- Keep credentials in local `.env` files, never in Git. No service-role/secret key in the frontend.
- Reuse the supplied Farochet UI Kit. Do not install another UI system by default.

## 4. Shared domain contracts (requirements-level)

These are cross-member concepts, not permission to invent extra business rules. The Prisma schema and exact supporting artifacts may add technical fields (IDs, timestamps, foreign keys, storage paths), but must preserve these meanings and approved cardinalities.

| Record / concept | Required meaning and key constraints |
|---|---|
| `User` | Application profile linked to a Supabase Auth user ID; stores display name/email and one of the two application roles: `RAAZIA` or `CUSTOMER`. Do not store password hashes in the application table. |
| `Product` | Stores product catalogue details and one Standard Catalogue Price in whole PKR rupees. Product images may be referenced. Do not put customer-specific Negotiated/Approved Prices on Product. Do not invent stock/inventory fields. |
| `PublicDiscount` / sale configuration | One fixed positive whole-PKR amount applied uniformly to every listed Product during the public sale. No percentage discounts and no stacking. It must be lower than the Standard Catalogue Price of every listed Product; reject invalid sale activation/update. Effective public price = Standard Catalogue Price − fixed amount. Do not overwrite the Standard Catalogue Price. The physical configuration shape is a supporting schema decision; keep one authoritative active amount. |
| `RaaziaAvailability` | Stores Raazia's latest manually entered business availability information for FR-04. It is not product/material stock, does not imply a recurring schedule, and does not decide order feasibility. If no update exists, do not invent one. |
| `Inquiry` | Retained customer inquiry record. It may be associated with a Product when the inquiry is product-specific. Retain it whether or not a request/order follows. Do not invent inquiry status values not defined in PRD/architecture. |
| `Customization` | Stores a customer's custom-order specifications/revisions and references its originating Inquiry. Fields may include product type, reference images, size, colour, materials, quantity, budget, special instructions, required completion date and delivery address, as applicable. |
| `PendingOrderRequest` | A separate pending request record referencing exactly one `Customization`; each `Customization` may be associated with zero or one `PendingOrderRequest`. Do not add a redundant direct `inquiry_id`. Raazia manually accepts/rejects. A rejected request remains retained and creates no Order. |
| `NegotiationEntry` | Append-only record linked to exactly one `Customization`; one Customization may have zero or many entries. Required: proposer (`RAAZIA` or owning `CUSTOMER`), proposed whole-PKR price, timestamp; note is optional. Never overwrite previous offers. |
| `Order` | A separate confirmed Order created when Raazia accepts a request. It directly references the original Inquiry. Store the Approved Price (including applicable delivery charges) and preserve a Negotiated Price snapshot where applicable. Do not use a `sourceRequestId` as a substitute for the required direct Order-to-Inquiry reference. |
| Order statuses | Exactly three independently maintained attributes on the Order: manufacturing/order status, payment status and delivery status. New Order: manufacturing/order = `Incomplete`; payment = `NULL`; delivery = `NULL`. Display `Not yet recorded` for NULL payment/delivery. Changing one status must not change either of the others. |
| Manufacturing/order status | Use PRD terminology: `Incomplete`, `In Progress`, `Completed`, `Cancelled`, and `On Hold` where applicable. `Completed` means manufacturing finished only. |
| Payment status | Manual states only: `Advance Payment Received`, `Partial Payment`, `Full Payment`, `Refunded`. Do not add `UNPAID`, `PARTIAL`, `PAID`, automated advance calculations, payment gateway, or automatic refunds. |
| Delivery status/details | `deliveryStatus` is NULL until Raazia records `Delivered`; `Delivered` is the only required completed status. Dispatch/tracking details and delivery method are information, not new delivery statuses. No courier integration. |
| Wishlist | Customer-specific persisted Product links; at most one entry per Customer/Product pair. It is independent of Inquiry and Order. |
| Estimated Completion Date | Optional on confirmation; display `Not yet provided` until Raazia records it. Show the latest date alongside manufacturing status; it is an estimate, not a guarantee. |
| Sales Summary | Use Order confirmation date, inclusive start/end dates in PKT. Confirmed count includes all Orders confirmed in range, even later-cancelled. Cancelled count includes the subsequently cancelled Orders from that same set. Total Approved Price sums only non-cancelled confirmed Orders in range and must be labelled `Total Approved Price (Order Value)`, not payments received. |

**Never introduce these obsolete values/assumptions from the old plan:** `ADMIN` as an application role, `passwordHash` in the application User table, product stock states such as `IN_STOCK`/`OUT_OF_STOCK`, inquiry states `OPEN`/`IN_REVIEW`/`QUOTED`/`CLOSED`, discount type `PERCENTAGE`, negotiation JSON `history`, four separate order/payment/delivery status fields, payment `UNPAID`/`PAID`, delivery `PENDING`/`DISPATCHED`/`IN_TRANSIT`, or a `sourceRequestId` replacing the direct Order-to-Inquiry relationship.

## 5. Implementation assumptions and open issues

### Approved assumptions

- The D4 target is a local application connected to one Supabase development project; no separate production hosting is committed.
- One shared Supabase development project is used by the team. Database schema changes and migrations are coordinated by the project coordinator/schema steward.
- Frontend and backend have separate `package.json` and lockfiles; use `npm ci` after cloning.
- All business-table access goes through Express → Business Logic → Repository → Prisma.
- The browser uses Supabase Auth for identity flows; API requests send the access token to Express.
- Reference images use a private Supabase Storage bucket and authorized backend routes.
- Exact API routes, UI component composition, Prisma model names, and supporting artifacts may be generated by coding agents if consistent with PRD/ADRs and reviewed during the slice loop.

### Open/setup items (not business-rule gaps)

- Create the Supabase project, configure Auth, private Storage bucket, and database credentials.
- Provision one Raazia Auth account and matching `RAAZIA` application User profile using a controlled setup procedure. Customer sign-up must create `CUSTOMER` profiles only.
- Choose a safe way to share development connection credentials. Do not commit secrets or place the service-role key in chat prompts or repository files.
- Confirm every member has accepted the GitHub collaborator invitation and can clone the repository.
- During Bootstrap, create and test the Prisma 7 config/schema and confirm the actual Session Pooler connection. Do not start feature coding until the clean-clone bootstrap checks pass.

No business rule in PRD v1.4 or ADR-001 through ADR-006 may be filled in by assumption. If a required rule is missing, use `STOP AND ASK` in `AGENTS.md`.

## 6. Team ownership and integration

| Owner | Primary slice ownership |
|---|---|
| Member 1 | Product catalogue, Raazia availability, pricing/public discount, product detail, sales summary |
| Member 2 | Authentication/role access, customer inquiry submission, catalogue browsing, wishlist, inquiry/order history |
| Member 3 | Inquiry review, custom-order submission/review, quotation/negotiation, request acceptance/rejection |
| Member 4 | Confirmed Order management, manufacturing status, payment recording, delivery details/status, order change/cancellation |
| Project coordinator | Repository and branch governance, approved stack/ADR, shared API/domain contracts, Prisma schema/migration coordination, UI consistency, PR review and cross-slice integration |

A member owns their assigned feature's full vertical slice (UI, Controller/API, Business Logic, Repository/data access, and relevant tests), not just one technical layer.

## 7. Bootstrap milestone (must pass before feature slices)

**Owner:** Project coordinator, using a coding agent under HITL review.  
**Priority:** P0  
**Status:** Not started.

Create the cloneable application foundation using ADR-006:

1. Create root project scripts/documentation and `.gitignore`; add `.nvmrc` for Node 26.
2. Scaffold `frontend/` with React + Vite and `backend/` with Express 5, both using ESM where appropriate.
3. Add `frontend/.env.example` and `backend/.env.example`; exclude all real `.env` files and secrets from Git.
4. Install only approved dependencies and commit `package-lock.json` for both applications.
5. Copy/organize the Farochet components, CSS, guidelines and screen specs into the frontend/docs locations without altering the design tokens unnecessarily.
6. Create the backend's Presentation, nine Business Logic module folders, and centralized Data Access/Repository structure.
7. Create one Prisma 7 configuration with the PostgreSQL adapter and one shared `PrismaClient` instance behind the Repository. Do not invent the full schema in the bootstrap task; generate the schema from approved contracts and reviewed supporting artifacts.
8. Add a basic health endpoint, frontend-to-backend API check, test command, and README run instructions.
9. Configure Supabase Auth and a private Storage bucket only after the team has created the project and secured credentials.
10. Test the exact clone → `npm ci` → configure `.env` → run frontend/backend workflow on a second machine or a clean folder.

**Bootstrap acceptance criteria:**
- [ ] A clean clone installs frontend and backend using `npm ci` without relying on files outside the repository.
- [ ] React/Vite starts locally.
- [ ] Express starts locally and its health endpoint responds.
- [ ] Frontend can call the backend health endpoint.
- [ ] Prisma 7 can connect to the Supabase PostgreSQL development database through the chosen connection string.
- [ ] Prisma configuration, migrations and generated client follow Prisma 7 docs.
- [ ] No real credentials, service-role keys, or `.env` files are committed.
- [ ] UI Kit references are available in the repository and root `AGENTS.md` includes the UI agent rules.
- [ ] A second team member successfully clones and runs the project.

## 8. Prioritized vertical-slice matrix

All slices are **Not started** at this baseline. Each slice must deliver a small, user-visible capability across the necessary layers; do not build all UI first and APIs later.

| Cycle | Member 1 | Member 2 | Member 3 | Member 4 |
|---|---|---|---|---|
| 1 — Foundations | Product Catalogue Administration | Authentication & Role Access | Inquiry Review & Management | Confirmed Order Management (read/list/detail foundation using approved fixtures) |
| 2 — Intake | Raazia Availability Management | Customer Inquiry Submission | Customization Request Submission | Manufacturing Status Management |
| 3 — Catalogue & Review | Pricing & Public Discount Management | Product Catalogue Browsing | Customization Request Review | Payment Management |
| 4 — Customer Tools & Negotiation | Product Details | Wishlist Management | Quotation & Price Negotiation | Delivery Management |
| 5 — Complete Lifecycle | Sales Summary | Customer Inquiry and Order History | Request Acceptance & Rejection / Order Handoff | Order Changes & Cancellation |

Cycle dependencies and integration checks are in Sections 9–13.

## 9. Cycle 1 — Foundations

**Target window:** 19–20 November 2026 (adjust and preserve plan history if needed).  
**Gate:** Bootstrap must be complete.  

### Member 1 — Product Catalogue Administration

**Requirements:** FR-02; supports FR-01.  
**Scope:** Raazia can create, view and edit product catalogue information and the Standard Catalogue Price. Customer-facing catalogue browsing is implemented later in Cycle 3.  
**Do not add:** stock/inventory management, product-availability states, percentage discount fields, automatic product archiving/deletion unless explicitly required.

**Acceptance criteria:**
- [ ] Raazia can create a Product with validated catalogue information and a positive whole-PKR Standard Catalogue Price.
- [ ] Raazia can retrieve and edit saved Product information.
- [ ] Standard Catalogue Price is persisted separately from public discount, Negotiated Price and Approved Price.
- [ ] Data survives application restart.
- [ ] Unauthorized Customer requests cannot create/edit catalogue data.

**Checks:** valid creation/update; missing name; zero/negative/non-integer price; duplicate or malformed IDs where applicable; unauthorized Customer request.

### Member 2 — Authentication & Role Access

**Requirements:** NFR-01; prerequisite for protected slices.  
**Scope:** Supabase Auth sign-up/sign-in/sign-out/session; application User profile; Express token verification, role middleware and `/me` endpoint.  
**Role rule:** Only `RAAZIA` and `CUSTOMER`; customer signup is assigned `CUSTOMER` server-side. Do not implement custom password storage or `passwordHash`.

**Acceptance criteria:**
- [ ] Customer can register/sign in/sign out through Supabase Auth.
- [ ] Express Middleware validates bearer tokens rather than trusting client-supplied user IDs or role values.
- [ ] Middleware loads the application User role through the Repository and attaches authenticated identity to the request context.
- [ ] A Customer cannot assign itself the `RAAZIA` role.
- [ ] Raazia's `RAAZIA` profile is provisioned through the documented controlled setup path.
- [ ] Protected requests without a valid token are rejected; authenticated but unauthorized role requests are rejected.
- [ ] Business Logic receives the authenticated user ID and enforces record ownership where applicable.

**Checks:** no token, invalid/expired token, valid Customer token, Raazia token, attempted role escalation, missing application profile, `/me` identity consistency.

### Member 3 — Inquiry Review & Management

**Requirements:** FR-07, FR-08.  
**Scope:** Raazia can list and inspect retained Inquiry records and associated customer information needed for review. Use only Inquiry fields justified by PRD/architecture. Do not add `OPEN`, `IN_REVIEW`, `QUOTED`, `CLOSED` or other statuses unless a later approved requirement establishes them.

**Acceptance criteria:**
- [ ] Raazia can view saved Inquiry records and relevant linked customer/product details.
- [ ] Inquiry records remain distinct from Customization, PendingOrderRequest and Order.
- [ ] Customer A cannot access Customer B's restricted Inquiry.
- [ ] A Customer cannot access the administrative inquiry-review operation.

**Checks:** empty list; linked/unlinked product inquiry; customer record ownership; no-auth and Customer-role rejection.

### Member 4 — Confirmed Order Management (read/list/detail foundation)

**Requirements:** FR-11, FR-14; supports FR-15 and FR-17 later.  
**Scope:** Create the Order Management interfaces and customer/admin list/detail views using approved fixtures. Do not invent a manual order-creation path that bypasses acceptance of a PendingOrderRequest. The confirmed Order must directly reference its original Inquiry.

**Acceptance criteria:**
- [ ] Raazia can list and inspect representative confirmed Orders.
- [ ] A customer can access only their own Order details.
- [ ] The three Order status attributes exist independently: manufacturing/order, payment, delivery.
- [ ] Fixture/new Order values follow ADR-005: `Incomplete`, `NULL`, `NULL`; UI displays `Not yet recorded` for nullable payment/delivery.
- [ ] No `sourceRequestId` is used as a replacement for the direct original Inquiry reference.

**Checks:** ownership isolation; status null/default handling; no unauthorized admin access; no cross-status side effects.

### Cycle 1 integration gate

- [ ] Merge and validate Member 2's centralized Middleware before protecting other slices.
- [ ] Product, Inquiry, User and Order contracts use Section 4 terminology.
- [ ] No business data access occurs directly from React/Supabase Data API.
- [ ] Run relevant Cycle 1 regression tests; record actual output and Accept/Revise/Reject decision.

## 10. Cycle 2 — Intake and manufacturing progress

**Target window:** 20–21 November 2026.

### Member 1 — Raazia Availability Management

**Requirement:** FR-04. This is Raazia's own business availability, not product stock or raw-material availability.

**Acceptance criteria:**
- [ ] Raazia can manually enter/update the latest availability information.
- [ ] Customers can view the latest saved information.
- [ ] If none exists, the system displays an appropriate not-yet-provided state and does not invent a fixed recurring schedule.
- [ ] The feature does not decide feasibility or accept/reject requests.

**Checks:** initial absence; valid update; latest-value retrieval; customer read; Customer cannot edit.

### Member 2 — Customer Inquiry Submission

**Requirement:** FR-05; supports FR-06 and FR-08.

**Acceptance criteria:**
- [ ] Authenticated Customer can submit an inquiry about product details, price, availability or customization.
- [ ] Customer identity is derived from the authenticated request; a client-supplied `customerId` is ignored/rejected.
- [ ] Product reference is optional where the inquiry is not about a specific catalogue product.
- [ ] Submitted Inquiry is persisted and remains available after restart.
- [ ] The submission does not directly create a Customization, PendingOrderRequest or Order unless the customer separately completes that workflow.

**Checks:** empty message; optional/valid/unknown Product reference; unauthenticated request; spoofed customer ID; successful retrieval by Raazia.

### Member 3 — Customization Request Submission

**Requirement:** FR-09; uses the accepted Inquiry → Customization → PendingOrderRequest chain.

**Acceptance criteria:**
- [ ] An authenticated Customer can submit applicable custom-order details: product type, reference images, size, colour, materials, quantity, budget, special instructions, required completion date and delivery address.
- [ ] Each Customization references its originating Inquiry.
- [ ] A PendingOrderRequest references exactly one Customization; each Customization is associated with zero or one PendingOrderRequest.
- [ ] No redundant direct `inquiry_id` is added to PendingOrderRequest.
- [ ] Reference images remain accessible to Raazia through authorized backend/storage access.
- [ ] The request remains pending until Raazia records a decision.

**Checks:** missing required applicable data; unsupported file type/size according to documented upload limits; unauthorized customer ID; ownership; image access control.

### Member 4 — Manufacturing Status Management

**Requirements:** FR-11, FR-14, FR-17.

**Acceptance criteria:**
- [ ] Raazia can update manufacturing/order status using PRD terminology: `Incomplete`, `In Progress`, `Completed`, `Cancelled`, and `On Hold` where applicable.
- [ ] New confirmed Orders start at `Incomplete`.
- [ ] `Completed` does not set delivery to `Delivered` or payment to `Full Payment`.
- [ ] Raazia can record/update the optional Estimated Completion Date; customers see `Not yet provided` until one is recorded.
- [ ] Customers cannot read another customer's status or estimated date.

**Checks:** valid status transitions as supported by PRD; invalid strings; update independence; estimate absent/valid/update; customer ownership.

### Cycle 2 integration gate

- [ ] Customer Inquiry and Customization records persist and preserve accepted relations.
- [ ] Reference images are protected by private Storage and backend authorization.
- [ ] Raazia availability is not implemented as product stock.
- [ ] Manufacturing, payment and delivery remain independent.

## 11. Cycle 3 — Catalogue pricing and request review

**Target window:** 21–23 November 2026.

### Member 1 — Pricing & Public Discount Management

**Requirements:** FR-02, FR-03; ADR-002 and ADR-005.

**Acceptance criteria:**
- [ ] Raazia can update Standard Catalogue Price independently from discount/quotation/order prices.
- [ ] One fixed positive whole-PKR discount amount is applied uniformly to every listed Product during the sale.
- [ ] Effective public price is Standard Catalogue Price minus the fixed amount.
- [ ] Sale activation/update is rejected for zero, negative, fractional, equal-to-price or greater-than-price amount, and if the discount would make any listed Product zero/negative.
- [ ] Percentage discounts and stacking are not supported.
- [ ] Standard Catalogue Price remains unchanged when discount is active or removed.

**Checks:** representative valid amount; boundary values (discount below/equal/above lowest listed Product price); zero/negative/fractional values; multiple products with different prices; no stacking.

### Member 2 — Product Catalogue Browsing

**Requirement:** FR-01.

**Acceptance criteria:**
- [ ] Customers can browse listed catalogue products and view images, descriptions and Standard Catalogue Price.
- [ ] The same public sale price is shown to all covered customers.
- [ ] Product catalogue does not reveal private Negotiated Prices or another customer's Approved Price.
- [ ] Empty/loading/error states are handled.

**Checks:** no products; product with images; product with no optional image; sale on/off; verify no private price leakage.

### Member 3 — Customization Request Review

**Requirements:** FR-09, FR-10.

**Acceptance criteria:**
- [ ] Raazia can inspect the submitted specifications and accessible reference images.
- [ ] Raazia can review material/schedule/complexity/skills/deadline/scope information and record her own decision as required by the request workflow.
- [ ] The application does not automatically decide feasibility or accept/reject a request.
- [ ] Rejected requests remain retained and do not create an Order.
- [ ] Customer access is restricted to the owning customer's request data.

**Checks:** missing/nonexistent customization; reference image access; Raazia-only review action; cross-customer access; rejected request retention.

### Member 4 — Payment Management

**Requirements:** FR-14, FR-15; ADR-003 and ADR-005.

**Acceptance criteria:**
- [ ] Raazia can manually record payment state using only `Advance Payment Received`, `Partial Payment`, `Full Payment`, or `Refunded`.
- [ ] A newly confirmed Order has payment status NULL and displays `Not yet recorded` until Raazia records a state.
- [ ] Updating payment status does not alter manufacturing/order or delivery status.
- [ ] The interface does not label Approved Price as money received or automatically enforce an advance percentage.
- [ ] No payment gateway or automatic refund execution is added.

**Checks:** NULL display; each allowed state; unsupported values such as `UNPAID`/`PAID`; status independence; unauthorized Customer request.

### Cycle 3 integration gate

- [ ] Public discount calculation uses one shared whole-PKR amount and does not mutate standard prices.
- [ ] Product Catalogue displays public pricing only; private negotiation data stays private.
- [ ] Request review remains a human Raazia decision.
- [ ] Payment remains a manual status/recording operation, not gateway integration.

## 12. Cycle 4 — Customer tools and negotiation

**Target window:** 23–24 November 2026.

### Member 1 — Product Details

**Requirements:** FR-01, FR-05, FR-09, FR-16.

**Acceptance criteria:**
- [ ] Customer can open one product's full images, description, category and Standard Catalogue Price/public sale price.
- [ ] Inquiry action opens/submits an Inquiry through the agreed API.
- [ ] Custom-order action begins the Customization workflow without bypassing its Inquiry relationship.
- [ ] Wishlist action is available only through the authenticated customer workflow.

**Checks:** unknown Product; optional image; pricing display; links/actions lead to the correct API flow.

### Member 2 — Wishlist Management

**Requirement:** FR-16; ADR-004.

**Acceptance criteria:**
- [ ] Logged-in Customer can add, list and remove Products from their personal wishlist.
- [ ] Wishlist persists across sessions/restarts.
- [ ] One Customer/Product pair has at most one wishlist entry.
- [ ] Customer A cannot read or modify Customer B's wishlist.
- [ ] Wishlist operations do not create Inquiry, Customization, PendingOrderRequest or Order records.

**Checks:** duplicate add; remove existing/non-existing item; no-auth; cross-customer access; persistence after restart.

### Member 3 — Quotation & Price Negotiation

**Requirements:** FR-12, FR-13; ADR-002 and ADR-005.

**Acceptance criteria:**
- [ ] Quotation begins from the appropriate Standard Catalogue Price/public price rule as required by PRD terminology.
- [ ] Negotiated Price is customer-specific and does not change Product pricing.
- [ ] Each offer/counter-offer creates a new append-only `NegotiationEntry` linked to the relevant `Customization`.
- [ ] Proposer is `RAAZIA` or the owning `CUSTOMER`; each entry records whole-PKR proposed price and timestamp; note is optional.
- [ ] Previous entries are never overwritten or deleted by a new offer.
- [ ] Only Raazia and the Customer who owns the Customization can view/add negotiation entries.
- [ ] At confirmation, Order Management snapshots the agreed Negotiated Price where applicable; pending history remains linked to Customization.

**Checks:** multiple rounds; positive whole-PKR price; zero/negative/fractional input; chronological history; non-owner access; catalogue unchanged.

### Member 4 — Delivery Management

**Requirements:** FR-14, FR-15; ADR-003 and ADR-005.

**Acceptance criteria:**
- [ ] Raazia can record delivery method, applicable fee and delivery/tracking information.
- [ ] For local/in-city handover, no additional delivery fee is charged under the PRD rule.
- [ ] For courier/service delivery, applicable fee is included in Approved Price before finalization.
- [ ] Delivery status remains NULL until Raazia records `Delivered`; the UI displays `Not yet recorded` before then.
- [ ] Do not introduce `PENDING`, `DISPATCHED`, or `IN_TRANSIT` as delivery statuses; dispatch/tracking are separate fields.
- [ ] A pre-dispatch fee increase below PKR 200 is absorbed by Raazia; PKR 200 or more requires customer notification/agreement before revising Approved Price and dispatch.
- [ ] Unexpected extra courier charges after handover are absorbed by Raazia.
- [ ] Delivery updates do not alter manufacturing or payment status; no courier API is integrated.

**Checks:** local handover fee zero; courier fee; 199/200 PKR threshold; tracking info independent of status; NULL/Delivered state; status independence.

### Cycle 4 integration gate

- [ ] Product detail links to inquiry/customization/wishlist flows.
- [ ] Wishlist is customer-scoped and persistent.
- [ ] Negotiation entries are append-only and linked to Customization.
- [ ] Delivery fee rules and NULL/Delivered behavior match ADR-005/PRD.

## 13. Cycle 5 — Complete lifecycle, reporting and order changes

**Target window:** 24–26 November 2026.

### Member 1 — Sales Summary

**Requirement:** FR-18.

**Acceptance criteria:**
- [ ] Raazia can select an inclusive start/end date range interpreted in PKT.
- [ ] Filter uses Order confirmation date, not Inquiry, payment, manufacturing or delivery date.
- [ ] Confirmed count includes all Orders confirmed within the range, even if later cancelled.
- [ ] Cancelled count includes subsequently cancelled Orders from that same confirmed set.
- [ ] Total Approved Price sums only confirmed non-cancelled Orders in the selected range.
- [ ] Label is `Total Approved Price (Order Value)` and never `Payments Received`.
- [ ] PendingOrderRequests are excluded.

**Checks:** start/end boundary inclusivity; PKT boundary conversion; cancelled Order counted in confirmed and cancelled counts but excluded from total; pending request excluded; zero-result range.

### Member 2 — Customer Inquiry and Order History

**Requirements:** FR-06, FR-08, FR-11, FR-17.

**Acceptance criteria:**
- [ ] Customer can view their retained Inquiries, including those that never become Orders.
- [ ] Customer can view their permitted Customization/Quotation progress and confirmed Order history.
- [ ] Each customer can access only their own records.
- [ ] Original Inquiry remains available after Order confirmation.
- [ ] Customer sees latest Estimated Completion Date or `Not yet provided`, alongside manufacturing status.

**Checks:** customer with no records; inquiry with no order; inquiry linked through customization and order; cross-customer ID tampering; updated estimated date.

### Member 3 — Request Acceptance & Rejection / Order Handoff

**Requirements:** FR-10, FR-11, FR-12; ADR-002, ADR-004, ADR-005.

**Acceptance criteria:**
- [ ] Only Raazia can record request acceptance/rejection.
- [ ] Rejection retains the PendingOrderRequest and related Inquiry/Customization and creates no Order.
- [ ] Acceptance is the confirmation event and invokes Order Management to create a distinct confirmed Order.
- [ ] New Order directly references the original Inquiry.
- [ ] New Order snapshots the relevant Negotiated Price where applicable and records the Approved Price including applicable delivery fee.
- [ ] Initial statuses are manufacturing/order `Incomplete`, payment `NULL`, delivery `NULL`.
- [ ] The acceptance operation prevents a repeated click/retry from creating unintended duplicate Orders; implementation must coordinate the transaction/state transition and document the idempotency approach without inventing an unapproved relationship/cardinality.

**Checks:** acceptance; rejection; repeated acceptance; concurrent/retried request where feasible; accepted request with no negotiated offer; Order direct Inquiry link; initial status values.

### Member 4 — Order Changes & Cancellation

**Requirements:** FR-12, FR-13, FR-14, FR-15.

**Acceptance criteria:**
- [ ] Raazia can record an authorized order-specific price revision with original price, revised price, timestamp, affected Order ID and acting user ID.
- [ ] Revised Approved Price is recorded only after mutual agreement where the PRD requires it.
- [ ] A cost-affecting specification change can place the Order `On Hold` while terms are renegotiated; the Order must not proceed under outdated terms.
- [ ] Customer may request cancellation, but only Raazia decides and records the cancellation outcome.
- [ ] Cancellation/refund information remains distinct from payment and delivery status; refunds are manually recorded and never executed automatically.
- [ ] Cancelled Orders are not treated as active or dispatched; all three status dimensions remain independently maintained.

**Checks:** non-empty reason where the UI asks for one based on documented workflow; order price revision history; mutual agreement; On Hold behavior; cancellation approval; refund recording; status independence.

### Cycle 5 integration gate

- [ ] Request acceptance produces one confirmed Order with direct Inquiry traceability.
- [ ] Rejection does not create an Order and all history remains retained.
- [ ] Order, payment, delivery statuses remain independent.
- [ ] Sales Summary matches FR-18 and uses PKT inclusive dates.
- [ ] Price-change and cancellation/refund details are retained correctly.

## 14. Final end-to-end validation

**Target window:** 26–27 November 2026.

Run and retain evidence for these main flows:

1. **Authentication and role boundaries:** Raazia and two Customers sign in; Customers cannot perform Raazia actions or access one another's private records.
2. **Catalogue and pricing:** Raazia creates/edits Products and a fixed public discount; customers see consistent prices; Standard Catalogue Prices remain unchanged.
3. **Inquiry and customization:** Customer submits an Inquiry and Customization with reference image(s); Raazia reviews it; original Inquiry persists.
4. **Quotation and negotiation:** Raazia and the owning Customer exchange offers; every `NegotiationEntry` remains in history; other customers cannot see it.
5. **Acceptance/rejection:** Raazia rejects one request (no Order) and accepts another (one distinct confirmed Order linked to its original Inquiry).
6. **Order progress:** Raazia updates manufacturing/order status and Estimated Completion Date; customer sees the latest values.
7. **Payment and delivery:** Raazia manually records one of the allowed payment states and separately records delivery completion; changes do not mutate other status fields.
8. **Order change/cancellation:** Record a cost-affecting change/On Hold negotiation and a cancellation/refund outcome, without automatic refund execution.
9. **Wishlist:** Customer adds/removes an item, signs out/in, and sees persisted state.
10. **Sales Summary:** Validate date range boundaries, cancelled-order counting, and Approved Price aggregation.

### Lightweight test strategy (per D4 quality-gate instructions)

For each slice, choose only relevant checks:

- Basic functional test against acceptance criteria.
- Important negative cases (missing, invalid, unauthorized, not found, or ownership violation).
- Equivalence Partitioning where meaningful (e.g., valid/invalid price inputs or role classes).
- Boundary Value Analysis where meaningful (e.g., fixed discount relative to lowest listed Product price; PKR 199/200 courier threshold; inclusive date boundaries).
- Regression check for previously accepted functionality.

Do not create a large test suite solely for marks. Tests must be relevant, executed, and honestly recorded.

## 15. Definition of Done and quality gates

A slice may be accepted only after these gates:

1. **Slice readiness:** linked FR/ADR, limited scope, clear acceptance criteria.
2. **Functional verification:** core behavior and important negative cases actually executed.
3. **Architecture/constraint review:** no violation of PRD, ADRs, architecture, `AGENTS.md`, approved stack or exclusions.
4. **Regression/integration:** the slice works with the latest `dev` and does not break previously accepted flows.
5. **Human decision:** record `Accept`, `Revise`, or `Reject` with a short reason.
6. **Integration:** approved PR merged into `dev`; project coordinator validates cross-slice contracts.
7. **Context update:** update plan, versioned plan history and relevant supporting artifacts/ADR/evidence.

A feature is not complete because an agent says it is complete. A human team member must run the relevant checks and compare actual results with acceptance criteria.

## 16. Git and AI-agent workflow

- `main`: stable, demo-ready baseline. No direct feature work.
- `dev`: integration branch for accepted slice PRs.
- Feature branch: `cycle-<N>/member-<M>/<feature-slug>` created from the latest `dev`.
- Open Pull Requests into `dev`; do not push feature work directly to `main` or `dev`.
- A PR must state the slice, linked FR(s), acceptance criteria, files changed, checks actually run, results, assumptions and known issues.
- Each coding agent must read root `AGENTS.md`, `PRD.md`, `architecture.md`, relevant ADRs, `Guardrails.md`, active `plan.md`, and relevant UI documents before editing.
- Ask agents to implement one assigned slice only. They must not modify unrelated slices, shared contracts or global design tokens without coordination.
- Shared Prisma schema/migrations are coordinated by the project coordinator. A member may propose a schema/migration change in a feature branch, but only the coordinator applies it to the shared Supabase development database after review. Never let multiple agents migrate the shared database concurrently.
- Before a member starts work, they must pull latest `dev` and install dependencies using `npm ci`.
- Capture AI task/chat references and meaningful correction loops for D4 evidence; do not reconstruct the history at the end.

## 17. Workflow and contribution evidence

Maintain `docs/evidence/Workflow_Evidence_Log.md`, `docs/evidence/Group_Contribution_Log.md`, and `docs/evidence/Testing_Evidence_Log.md` continuously.

For every slice record:

- Slice ID/name and related PRD requirement(s).
- Responsible member.
- Acceptance criteria.
- HITL/AFK/delegated mode and reason.
- AI chat/task reference and relevant prompt/context.
- Important iterations/corrections; include rejected or revised approaches where meaningful.
- Tests/checks actually executed and actual output/result.
- Human decision: Accept / Revise / Reject and reason.
- Major issue/change and how it was resolved.
- `plan.md` version used.
- Branch/PR/merge reference and integration status.

Group Contribution Log records each member's slice implementation, AI interactions, reviews, corrections, testing, integration and demo preparation. Every member must understand the complete product and the major architecture/technology decisions.

## 18. Current status at baseline

| Workstream | Status | Owner |
|---|---|---|
| D1–D3 requirements and architecture documents | Submitted / existing baseline | Group |
| PRD v1.4 and ADR-001 to ADR-005 | Existing accepted project baseline | Group |
| ADR-006 technology stack | Included in this pack as the D4 implementation baseline | Project coordinator; team should flag blockers |
| GitHub repository/collaborators | Not started in this pack | Project coordinator |
| Application scaffold | Not started | Project coordinator + agent |
| Supabase project and credentials | Not started | Project coordinator |
| Prisma schema/migrations | Not started | Project coordinator/schema steward + assigned slice owners |
| Cycles 1–5 | Not started | Members 1–4 |
| End-to-end validation | Not started | All; coordinated by project coordinator |
| Workflow and contribution evidence | Templates to be initialized before first slice | All |

## 19. Plan change history

| Version | Date | Summary |
|---|---|---|
| `plan-v00-source-draft.md` | 18 Nov 2026 | Original submitted implementation plan preserved for historical traceability; contains superseded contracts and is not active guidance. |
| `plan-v01.md` | 18 Nov 2026 | Reconciled D4 baseline: aligns slices/contracts with PRD v1.4 and ADR-001–006; selects stack; adds bootstrap, Git workflow, quality gates and evidence requirements. |
