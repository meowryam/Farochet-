# AGENTS.md

## Raazia's Customer Inquiry, Quotation, and Custom Order Management System

**Document purpose:** Binding operational instructions for AI coding agents working on this project.  
**Status:** Project-specific implementation guardrails.  
**Architecture baseline:** `architecture.md` — reviewed and approved by the group.  
**Requirements baseline:** `PRD.md`, Version 1.4, updated 18 November 2026.  
**Technology status:** Approved D4 implementation stack recorded in ADR-006 (Node.js 26 LTS, React + Vite, Express 5, Supabase PostgreSQL/Auth/Storage, Prisma ORM 7 stable, npm, Vitest + Supertest).

---

## 1. Mission and governing principles

You are implementing Raazia's Customer Inquiry, Quotation, and Custom Order Management System. The system centralizes product-catalogue information and the business records for customer inquiries, customization requests, quotations, pending order requests, confirmed orders, order-specific prices, manufacturing progress, payment records, delivery information, wishlists, and operational sales summaries.

The application records and presents information and decisions. It does not replace Raazia's manual business judgement or introduce excluded external services.

Your primary responsibility is to implement the system that the project sources specify—not to redesign it.

### 1.1 Mandatory language

Interpret the terms in this document as follows:

- **MUST / MUST NOT:** Binding instruction.
- **SHOULD / SHOULD NOT:** Strong recommendation. Depart only for a documented, justified reason that does not violate a binding rule.
- **MAY:** Permitted, not required.
- **STOP AND ASK:** Do not make the affected implementation or architectural decision until an authorized human supplies the missing decision.

### 1.2 Non-negotiable principles

1. The PRD governs product behavior, requirements, business rules, terminology, scope, and acceptance criteria.
2. Accepted ADR-001 through ADR-006 remain binding. ADR-006 selects implementation technologies only; it does not alter product requirements or the layered architecture.
3. Preserve the consolidated architecture's structure and recorded group decisions; the group has reviewed and approved the complete `architecture.md`.
4. Do not convert an assumption, missing value, or unresolved physical data-model choice into an implementation fact.
5. Preserve manual business decisions as manual.
6. Keep implementation, tests, and documentation traceable to requirements and architectural responsibilities.
7. When convenience conflicts with a requirement or accepted architectural guardrail, the guardrail takes precedence.

---

## 2. Source authority, source files, and conflict handling

### 2.1 Authority order

Use the following order when interpreting project materials:

1. **PRD v1.4:** Primary authority for functional and non-functional requirements, business rules, terminology, user permissions, workflows, scope, constraints, and acceptance criteria.
2. **Accepted ADR-001 through ADR-006:** Binding authority for the architectural decisions they establish. Do not reopen or silently alter them.
3. **Explicitly verified group decisions:** Binding for the specific matters the group has explicitly settled, provided they do not conflict with the PRD or an accepted ADR. Use the exact verified meaning; do not extrapolate beyond it.
4. **`architecture.md`:** The consolidated architectural baseline reflecting the PRD, accepted ADRs, and recorded group decisions. The group has reviewed and approved it as a complete document. Use it to understand the architecture, interfaces, component responsibilities, data ownership, and interactions. This group approval does not imply TA or faculty approval.
5. **`AGENTS.md`:** Binding operational instructions for AI coding agents, consistent with the higher-authority sources above. It operationalizes approved requirements and decisions; it does not create new product or architectural decisions.
6. **`Guardrails.md`:** Companion rationale and governance explanation. Consult it to understand the risks behind the operational restrictions, but it does not independently create, override, or authorize requirements, architecture, or scope changes.
7. **Supporting architectural documents:** Use for rationale and context. They do not override the PRD, accepted ADRs, or verified group decisions.
8. **Existing code and tests:** Inspect them to understand the current implementation, but existing code does not authorize a violation of a higher-authority requirement or decision.

Do not treat this list as permission for a lower-level document to amend a higher-authority source. If two authoritative sources genuinely conflict, follow Section 2.4 and STOP AND ASK when the affected implementation depends on resolving the conflict.

### 2.2 Reviewed project sources

The following source files were available and inspected for this instruction set:

| Source | Use |
|---|---|
| [PRD.md](./PRD.md) | PRD v1.4 requirements, glossary, business rules, operating rules, exclusions, dependencies, assumptions, and acceptance criteria. |
| [architecture.md](./architecture.md) | Consolidated architecture, layers, nine components, interfaces, data ownership, interactions, constraints, diagram, traceability, and outstanding register. |
| [ADR-001 Overall Architectural Style](./ADR/%23%20ADR-001%20Overall%20Architectural%20Style.md) | Accepted Multi-Tier Layered Architecture; MVC confined to Presentation. |
| [ADR-002 Data Persistence and Separation for Pricing and Inquiries](./ADR/%23%20ADR-002%20Data%20Persistence%20and%20Separation%20for%20Pricing%20and%20Inquiries.md) | Accepted normalized relational persistence, separation of Product/Inquiry/Order, pricing ownership, order price snapshot, direct Order-to-Inquiry reference, and no redundant PendingOrderRequest inquiry reference. |
| [ADR-003 Independent Status Management for Orders](./ADR/%23%20ADR-003%20Independent%20Status%20Management%20for%20Orders.md) | Accepted Option A: three independent status attributes within `Order`. |
| [ADR-004 Centralized Access Control and Authorization Boundary](./ADR/%23%20ADR-004%20Centralized%20Access%20Control%20and%20Authorization%20Boundary.md) | Accepted centralized middleware, role authorization, authenticated-user propagation, Business Logic ownership enforcement, and narrow Middleware-to-Repository account/role lookup. |
| [ADR-005 Resolution of Implementation Gaps](./ADR/ADR-005%20Resolution%20of%20Implementation%20Gaps.md) | Accepted negotiation-entry persistence, fixed public-sale discount, and nullable initial payment/delivery statuses. |
| [ADR-006 Approved Implementation Technology Stack](./ADR/ADR-006-Approved-Implementation-Technology-Stack.md) | Approved Node.js/React/Vite/Express/Supabase PostgreSQL/Auth/Storage/Prisma 7/npm/testing baseline and implementation boundaries. |
| [ASRs identification.docx](./References/ASRs%20identification.docx) | ASRs derived from NFR-01, FR-06, FR-14/NFR-03, FR-12/FR-03, and the self-contained/manual system constraint. |
| [Exploration of Architectural Alternatives,justificationand interfaces.docx](./References/Exploration%20of%20Architectural%20Alternatives%2Cjustificationand%20interfaces.docx) | Architectural alternatives, rationale, and initial layer/interface exploration. |
| [Deliverable–3.pdf](./References/Deliverable%E2%80%933.pdf) | Deliverable guidance distinguishing architecture rationale from operational AI-agent instructions and emphasizing human-owned architectural decisions. |
| [Guardrails.md](./Guardrails.md) | Companion governance and rationale document; use it to understand the risks behind these operational instructions, not as an independent source of new requirements or decisions. |

The original ADR-001 through ADR-004 files are in `ADR/` and have a literal leading `#` in their filenames. ADR-005 and ADR-006 use clean filenames. Preserve the actual names and paths when linking to any ADR; do not invent alternate filenames.

### 2.3 Resolved gaps and remaining technology boundary

- ADR-005 resolves the former public-discount, negotiation-history persistence, and initial payment/delivery status gaps.
- The group has reviewed and approved the complete `architecture.md`. This instruction set does not claim TA or faculty approval.
- This starter pack contains the approved project context and UI kit; it does not contain a completed application source tree. The application scaffold is the first Bootstrap milestone in `plan.md`.
- ADR-006 explicitly approves the implementation stack. Agents MUST use that stack for the D4 baseline and must not reopen the decision based on personal preference. Inspect actual files/manifests before modifying or adding dependencies, and preserve working conventions already established in the repository.

If a source is absent, inaccessible, or silent on a point, say so. Never claim to have inspected an unavailable source. When a previously unavailable source is supplied, inspect that source before implementing any dependent rule.

### 2.4 Resolving conflicts

When sources appear to conflict:

1. Identify the exact statements and their source locations.
2. Apply the authority order in Section 2.1.
3. Preserve the higher-authority requirement or accepted ADR.
4. Determine whether the lower-authority statement is outdated, broad, ambiguous, or genuinely conflicting.
5. Do not silently reconcile a material conflict by inventing a rule, selecting the most convenient interpretation, or treating `Guardrails.md` as an authority that can override a source.
6. If implementation depends on the conflict, **STOP AND ASK**. Report (a) the conflicting statements, (b) the exact source documents and relevant requirement/ADR/architecture sections, (c) the affected component, data, workflow, or interface, (d) the practical implementation impact, (e) why neither interpretation can safely be assumed, and (f) the precise clarification or approval required.
7. Continue independent work only where it does not rely on the unresolved interpretation.
8. Do not modify the PRD or ADR files unless explicitly authorized.

Specific known interpretation:
- ADR-001 places MVC within Presentation only.
- ADR-004 requires the centralized Middleware to retrieve persisted User account and role information through the Repository.
- The four-member team unanimously approved the backend-controlled Customer registration-intent exception: Supabase Auth Admin creates a new identity on the backend, the Repository persists/activates its short-lived intent, and verified profile completion consumes that intent atomically with `User` creation. Middleware's Repository use remains limited to role lookup; ordinary Views and Controllers remain prohibited from Repository/database access.
- The supporting alternatives PDF contains broader early-stage descriptions of MVC and layer interactions. Follow the more precise accepted ADRs and consolidated architecture where that supporting wording is broader or inconsistent.

### 2.5 Relationship with Guardrails.md

- `AGENTS.md` is the **binding operational instruction manual**. Its MUST, MUST NOT, implementation, testing, reporting, and STOP AND ASK instructions govern agent conduct.
- `Guardrails.md` explains the rationale and project-specific risks behind those restrictions. Agents MUST consult both documents when planning and reviewing substantial work.
- `Guardrails.md` does not override the PRD, accepted ADRs, explicitly verified group decisions, or the binding operational instructions in this file. It does not independently authorize an architecture, technology, business-rule, or scope change.
- If `AGENTS.md` and `Guardrails.md` appear inconsistent, do not silently select an interpretation. Report the exact statements and sources, explain the impact, and request clarification. Apply the source authority and approval status in Section 2.1.
- Any change to an accepted architectural decision, established business rule, or approved scope requires the applicable explicit human approval and the change-control process in Section 20.

---

## 3. System scope and users

### 3.1 Users

The PRD defines two user roles:

- **Customer:** May browse the catalogue and manage a personal wishlist when logged in. May access only their own permitted inquiries, quotations, customization details, and order history.
- **Raazia:** May manage product information, availability, inquiries, requests, prices, confirmed orders, statuses, payment records, delivery information, cancellation records, refund outcomes, and sales summaries within the PRD's scope.

Do not invent additional roles, permission tiers, account types, or role names.

### 3.2 Product intent

The system centralizes records currently spread across social and messaging conversations. It supports catalogue browsing, inquiry submission and retention, custom-order request handling, quotations and negotiation information, confirmation into distinct Orders, independent order/payment/delivery tracking, wishlists, and a limited operational Sales Summary.

### 3.3 In-scope and out-of-scope boundary

Implement only the functionality supported by PRD v1.4, accepted ADRs, and the approved architecture.

The system is self-contained and manually operated where the PRD assigns decisions to Raazia. Do not introduce external integrations or broaden the product into accounting, tax, inventory, or automated design/feasibility software.

---

## 4. Architecture that MUST be preserved

### 4.1 Selected style

The selected architecture is **Multi-Tier Layered Architecture** with three layers:

1. Presentation Layer.
2. Business Logic Layer.
3. Data Access Layer.

MVC is used **within the Presentation Layer only**. MVC does not replace, absorb, or extend into the Business Logic or Data Access layers. In particular, a presentation-level Model is not the place for substantive business rules.

Do not introduce microservices, independently deployed business services, separate databases, or another architectural style without an approved architectural change.

### 4.2 Presentation Layer

Contains:

- Views / User Interface.
- Controllers / Request Handling.
- Centralized Access Control / Controller Middleware.

Responsibilities:

- Receive and present user interactions.
- Display permitted catalogue, inquiry, quotation, customization, wishlist, order, status, and report information.
- Receive requests and validate request structure/basic input formatting.
- Invoke the appropriate Business Logic interface.
- Apply centralized authentication and role-based authorization through Middleware.

Rules:

- Views MUST communicate through Controllers.
- Views MUST NOT contain substantive business rules.
- Views MUST NOT access the Repository or database.
- Ordinary Controllers MUST NOT access the Repository or database.
- Controllers MUST NOT implement substantive pricing, discount, negotiation, order, cancellation, or status business rules.
- Ordinary Controllers MUST call the appropriate Business Logic component through its defined logical interface. The Auth Profile Provisioning Controller is limited to the explicit exception in Section 4.5.

### 4.3 Business Logic Layer

Preserve **exactly these nine distinct Business Logic components**. Do not merge, rename, remove, or add architectural components without explicit human approval:

1. Product Management.
2. Availability Management.
3. Pricing and Discount Management.
4. Inquiry Management.
5. Customization and Quotation Management.
6. Order Management.
7. Status Management.
8. Wishlist Management.
9. Sales Summary.

Responsibilities and ownership are binding; see Section 5.

### 4.4 Data Access Layer

Contains:

- Centralized Repository.
- Centralized relational database.

Responsibilities:

- Persist and retrieve application records.
- Map application data to/from relational persistence.
- Centralize database interaction.
- Support persistence requested by Business Logic components.
- Provide the narrow User account/role lookup required by Middleware under ADR-004.
- Provide the approved Customer registration-intent create/lookup/activate operations and atomic intent-consumption/profile-creation operation used by the Auth Profile Provisioning Controller.

Rules:

- Business Logic components MUST use the centralized Repository boundary for persistence.
- Do not let Business Logic components bypass the Repository to access the database directly.
- The Repository MUST NOT independently decide whether a customer is authorized to access a record.
- Repository query scoping may limit retrieved rows using supplied identifiers, but the relevant Business Logic component remains responsible for deciding whether the authenticated customer owns/is permitted to access the requested business record.
- Do not create separate databases or repositories for individual components.

### 4.5 Dependency rules and approved security exceptions

The ordinary dependency direction is:

`Views → Controllers → Business Logic → Repository → Relational Database`

The centralized Middleware sits at the Presentation request boundary and intercepts inbound requests before Business Logic.

**Middleware exception:** Middleware MAY use the Repository solely to retrieve persisted User account and role information required to authenticate the request and identify the Customer/Raazia role. This is explicitly required by ADR-004.

**Approved backend-controlled Customer registration exception:** `POST /api/auth/register` MUST create users through Supabase Auth Admin on the backend using the backend-only service-role credential. A pending `CustomerRegistrationIntent` is created only after Auth Admin returns a genuinely new Supabase identity; duplicate responses MUST be generic and MUST NOT create an intent. The request's email/password are signup inputs to Supabase, not trusted application identity fields. The intent stores the provider-returned user ID/email and the validated display name; no application `User` profile is created at signup.

For `POST /api/auth/registration/activate` and `POST /api/auth/profile`, identity-verification Middleware MUST verify the bearer token and attach the verified Supabase user ID, email, and email-confirmation timestamp without querying the Repository. Activation MUST require the verified email-confirmed identity and start the fixed 30-minute expiry only once. Profile completion MUST accept no client-supplied identity, email, role, or display name; the Repository MUST atomically consume the matching, unexpired intent and create the `CUSTOMER` profile in one transaction. Replays, mismatches, expired/missing intents MUST be rejected. Existing profiles and roles, including `RAAZIA`, MUST never be overwritten.

These are narrow route-specific exceptions, not general Controller-to-Repository access. Normal sign-in and session restoration MUST remain read-only with respect to profile provisioning. The existing nine Business Logic components remain unchanged.

These exceptions MUST NOT be extended to:

- Views.
- Ordinary Controllers.
- General-purpose business data retrieval.
- Customer inquiry/order/wishlist ownership decisions.
- Other Presentation components or Repository operations.

Do not introduce a separate User Management Business Logic component or a new authentication service. The nine approved Business Logic components remain unchanged.

### 4.6 Logical component communication

- Views communicate through Controllers.
- Controllers invoke the appropriate Business Logic component interface.
- Business Logic components communicate through defined logical operations where collaboration is required.
- Business Logic components use the centralized Repository for persistence.
- Sales Summary obtains confirmed-order information through the Order Management interface, not by taking ownership of Order persistence.
- Wishlist Management may obtain product information through Product Management as required.
- Do not create undocumented direct storage access between components.

Logical operations describe responsibilities. Do not treat them as prescribed programming-language method names, API routes, framework conventions, or network endpoints.

---

## 5. Nine Business Logic components: ownership and boundaries

### 5.1 Product Management

Owns:

- Product catalogue records and product information.
- Product descriptions and catalogue information displayed to customers.
- Retrieval of catalogue entries and product details.
- Product information supplied to other business components as required.

MUST NOT own:

- Raazia's manually maintained personal/business availability.
- Public-discount rules/calculations.
- Customer-specific Negotiated Price.
- Confirmed Order Approved Price.
- Product stock, raw-material inventory, or supplier inventory features not defined by the PRD.

### 5.2 Availability Management

Owns Raazia's manually maintained business availability under FR-04.

MUST support:

- Raazia manually updating availability.
- Retrieving the latest saved availability for customer display.
- Representing the absence of a saved update without inventing a fixed schedule.

MUST NOT become:

- Product availability or product stock management.
- Raw-material or supplier inventory management.
- Automated inventory synchronization.
- Automated feasibility assessment.
- Automated request acceptance/rejection.

Raazia manually assesses materials, schedule, complexity, skills, deadline, and overall feasibility.

### 5.3 Pricing and Discount Management

Owns:

- Standard Catalogue Prices.
- Public Discount information and rules.
- Applicable public discounted-price calculation using the already-approved group rules.
- Providing catalogue and public-discount pricing information to other components.

MUST preserve Standard Catalogue Price independently from discounts and order-specific prices.

MUST NOT own:

- Customer-specific negotiation history or Negotiated Price.
- Confirmed Order Approved Price.
- Order-specific price-change records.
- Automatic recalculation of an already confirmed Order when catalogue prices or public discounts change.

The exact public-discount values are not present in the reviewed source files. Do not invent or implement a guessed discount calculation; see Section 8.6.

### 5.4 Inquiry Management

Owns:

- Customer Inquiry records.
- Inquiry submission, retrieval, and updates.
- Inquiry History.
- Retention of inquiries whether or not they lead to a PendingOrderRequest or confirmed Order.
- Making inquiry information available to Raazia for review.

MUST NOT create confirmed Orders.

An Inquiry remains a distinct record and is not deleted or absorbed merely because no order results.

### 5.5 Customization and Quotation Management

Owns the pending-request lifecycle information:

- Customization specifications and revisions.
- Quotation information.
- Negotiation information/history while the request is pending.
- PendingOrderRequest records.
- Raazia's acceptance/rejection decision records.
- Providing accepted request details to Order Management at confirmation.

MUST preserve the distinction between a quotation, a PendingOrderRequest, and a confirmed Order.

MUST NOT:

- Treat a quotation or PendingOrderRequest as a confirmed Order.
- Create a confirmed Order on rejection.
- Transfer ownership of confirmed Order records from Order Management.
- Replace or alter the approved `NegotiationEntry` relationship defined in ADR-005 without authorization.

Negotiation history is persisted as append-only `NegotiationEntry` records linked to `Customization`, as defined in ADR-005 and Section 7.4.

### 5.6 Order Management

Owns confirmed Order records and Order History.

MUST:

- Create a confirmed Order when an accepted PendingOrderRequest is handed off.
- Create the Order with manufacturing/order status `Incomplete`.
- Preserve the direct reference to the original Inquiry.
- Preserve the relevant Negotiated Price snapshot at confirmation where applicable.
- Record and maintain the Approved Price.
- Preserve required price-change information.
- Record/update the optional Estimated Completion Date.
- Provide confirmed-order information to Sales Summary through its logical interface.
- Keep confirmed Orders distinct from pending requests.

MUST NOT:

- Own pending negotiation before acceptance.
- Merge PendingOrderRequest and Order into one indistinguishable lifecycle record.
- Automatically change Approved Price because catalogue price or public discount changes.
- Treat Negotiated Price and Approved Price as synonyms.

### 5.7 Status Management

One unified Business Logic component owns the three independent Order status attributes:

1. Manufacturing/Order Status.
2. Payment Status.
3. Delivery Status.

MUST initialize the three attributes when Order Management creates an Order. The manufacturing/order status starts as `Incomplete`. The initial payment and delivery values are unspecified; do not invent them.

MUST update each attribute independently. A change to one MUST NOT automatically change either of the others.

MUST preserve the exact PRD payment terminology:

- `Advance Payment Received`
- `Partial Payment`
- `Full Payment`
- `Refunded`

Manufacturing/order terminology includes:

- `Incomplete`
- `In Progress`
- `Completed`
- `Cancelled`
- `On Hold` where applicable to specification-change renegotiation.

`Completed` means manufacturing is finished only. It does not mean `Delivered` or `Full Payment`.

For delivery, preserve the PRD/ADR-supported `Delivered` state and independently recorded delivery information. Do not invent additional delivery-state enumerations.

### 5.8 Wishlist Management

Owns customer-specific wishlist operations:

- Add catalogue products to a logged-in customer's wishlist.
- Retrieve that customer's wishlist.
- Remove wishlist items.
- Persist wishlist contents across sessions.

Wishlist data MUST remain customer-specific and independent of Inquiry, PendingOrderRequest, and confirmed Order records.

Adding, viewing, or removing a wishlist item MUST NOT submit an inquiry or create an order request.

### 5.9 Sales Summary

Owns generation of the limited operational Sales Summary under FR-18.

MUST:

- Generate the summary for Raazia's selected date range.
- Obtain confirmed-order information through Order Management's defined interface.
- Apply FR-18 counting and total rules exactly.
- Return the generated summary without permanently persisting report results unless the PRD is changed to require persistence.

MUST NOT:

- Become a comprehensive accounting, tax, cash-receipt, or payment-reconciliation module.
- Take ownership of confirmed Order records.
- Include PendingOrderRequests as confirmed Orders.

See Section 10 for exact report semantics.

---

## 6. Security, authentication, authorization, and ownership

ADR-004 is binding.

### 6.1 Centralized request-boundary security

All inbound requests MUST pass through centralized Controller Middleware before reaching Business Logic. The only approved application roles are **Customer** and **Raazia**; do not introduce additional roles or role aliases without explicit approval.

Middleware MUST:

1. Authenticate the request.
2. Identify the authenticated user using persisted User account information.
3. Retrieve/use the persisted role information (Customer or Raazia) through the narrowly scoped Repository exception.
4. Enforce role-based authorization centrally.
5. Reject requests not permitted for the authenticated role.
6. Pass the authenticated user ID to relevant Business Logic operations.

### 6.1.1 Customer profile provisioning

- Supabase Auth owns credential verification; application role lookup remains database-backed and separate.
- `POST /api/auth/register` is the only public signup route. It MUST use backend-only Supabase Auth Admin creation and MUST create a pending intent only for a newly created provider identity. It MUST preserve the project's email-confirmation setting and return the same generic response for duplicate signup attempts.
- The intent binds provider-returned Supabase user ID/email to a validated display name. It remains `PENDING` until Middleware verifies the user's email-confirmed identity on `POST /api/auth/registration/activate`.
- Activation MUST start a 30-minute expiry once; repeated activation MUST NOT extend it.
- `POST /api/auth/profile` MUST require the verified identity to match an active, unexpired, unconsumed intent and MUST atomically consume the intent while creating the `User` profile.
- The Repository fixes new profiles to `CUSTOMER`. Client-supplied identity, email, or role MUST NOT be trusted. Existing application profiles and roles, including `RAAZIA`, MUST remain unchanged.
- Normal sign-in and session restoration MUST only retrieve profiles. A missing profile MUST NOT trigger provisioning through either path.
- These route-specific persistence operations MUST NOT add a Business Logic component or broaden Middleware's Repository exception.
- `GET /api/auth/me` and other protected application routes continue to require a persisted profile and role.

Do not introduce decentralized, inconsistent role authorization as a replacement for Middleware.

### 6.2 Business Logic ownership enforcement

The relevant Business Logic component MUST enforce customer-specific ownership for private records, using the authenticated user ID supplied through the request boundary.

Examples include:

- Inquiry and Inquiry History access.
- Quotation and customization detail access.
- Pending request access where customer-visible.
- Confirmed Order and Order History access.
- Wishlist retrieval and modification.

A Customer MUST NOT view or modify another Customer's private records.

Raazia may access the business/customer records authorized for her role.

### 6.3 Repository is not an authorization boundary

The Repository performs persistence and retrieval. It does not independently decide whether a user is allowed to access a customer's record.

A query may be scoped to a user or record identifier as a data-access technique. That does not transfer the authorization decision to the Repository. Business Logic remains responsible for validating the ownership/permission condition.

### 6.4 Security prohibitions

MUST NOT:

- Rely on hiding a UI control as the only access restriction.
- Trust a client-supplied user ID as proof of identity.
- Permit customers to choose another customer's owner identifier.
- Put customer ownership decisions exclusively in the Repository.
- Add a new role, permission model, identity provider, or authentication service without source support and approval.
- Bypass Middleware for a protected inbound request.

---

## 7. Data relationships and lifecycle rules

### 7.1 Keep the records distinct

The following are separate business records/concepts:

- `Inquiry`
- `Customization`
- `PendingOrderRequest`
- Confirmed `Order`

Do not merge them into one generic request/order record or treat them as interchangeable states of one record.

### 7.2 Accepted pending-stage traceability

Preserve the accepted logical chain:

`Inquiry → Customization → PendingOrderRequest`

Binding relationship rules:

- Each `Customization` references its originating `Inquiry`.
- Each `PendingOrderRequest` references exactly one `Customization`.
- Each `Customization` may be associated with zero or one `PendingOrderRequest`.
- No additional Inquiry-to-Customization cardinality has been approved. Do not invent one.
- Do not add a redundant direct `inquiry_id` to `PendingOrderRequest`.
- A confirmed `Order` directly references its original `Inquiry`.

Do not alter these relationships for convenience or infer additional cardinalities.

### 7.3 Lifecycle behavior

1. A Customer submits an Inquiry.
2. Inquiry Management retains it in Inquiry History.
3. Where customization/quotation is needed, Customization and Quotation Management records the relevant customization and quotation information.
4. A PendingOrderRequest is retained while awaiting Raazia's decision.
5. Raazia manually reviews the request, including material availability, schedule, complexity, skills, deadline, and feasibility.
6. Raazia records acceptance or rejection.
7. Rejection leaves the PendingOrderRequest retained and MUST NOT create a confirmed Order.
8. Acceptance and confirmation are the same event.
9. On acceptance, Order Management creates a distinct confirmed Order with manufacturing/order status `Incomplete`.
10. The confirmed Order directly references the original Inquiry.
11. Original Inquiry, customization/quotation information, and negotiation history remain retained within their respective ownership responsibilities.

Do not introduce automatic feasibility decisions, automatic acceptance, or automatic rejection.

### 7.4 Negotiation history: approved physical representation

Negotiation history MUST be stored as append-only `NegotiationEntry` records linked to `Customization`.

- One `Customization` has zero or many entries.
- Each entry belongs to exactly one `Customization`.
- Each entry stores proposer, proposed whole-PKR price, optional note, and timestamp.
- A new offer appends an entry; it never overwrites an earlier entry.
- Only Raazia and the Customer who owns the related Customization may read or add entries.
- PendingOrderRequest continues to reference one Customization and receives no redundant `inquiry_id`.

Follow ADR-005. Do not introduce a separate negotiation service or alter the accepted nine-component architecture.

### 7.5 Inquiry retention

Inquiry History retains inquiries even when they never produce a PendingOrderRequest or confirmed Order. Do not delete, merge, or overwrite an Inquiry as a side effect of order creation.

---

## 8. Pricing, quotation, negotiation, and Approved Price

### 8.1 Keep all five concepts distinct

Do not conflate:

1. **Standard Catalogue Price:** Normal listed product price.
2. **Public Discount:** Public reduction applied uniformly to customers covered by a promotion.
3. **Quotation:** Price presented using the Standard Catalogue Price before individual negotiation or an applicable public discount.
4. **Negotiated Price:** Customer-specific proposed price discussed with Raazia.
5. **Approved Price:** Final price mutually agreed by Raazia and the Customer for a particular Order, including applicable delivery charges.

Use the PRD glossary wording for Quotation. Do not invent a new quotation calculation sequence or silently change the glossary meaning.

### 8.2 Pricing ownership

- Pricing and Discount Management owns Standard Catalogue Prices, public-discount rules, and applicable public-discount calculations.
- Customization and Quotation Management owns quotation information, pending Negotiated Price information, and negotiation history.
- Order Management owns confirmed Order pricing, Approved Price, relevant order-level price snapshots, and price-change records.

Do not move these responsibilities between components.

### 8.3 Confirmation snapshots and price preservation

At confirmation:

- Order Management preserves the relevant Negotiated Price snapshot where applicable.
- Order Management records the Approved Price for the confirmed Order.
- Negotiated Price and Approved Price remain distinct even if their numeric amounts happen to be equal.

A later change to a Standard Catalogue Price or Public Discount MUST NOT silently recalculate or alter an already confirmed Order's Approved Price.

An order-specific Approved Price revision is an explicit order-level update and must follow the relevant PRD business rule.

### 8.4 Required price-change information

For relevant price changes, preserve the FR-12 information:

- Original price.
- Revised price.
- Timestamp.
- Affected Order identifier.
- Acting user identifier.

The PRD does not require a fully immutable audit system. Do not claim or introduce one as an established requirement.

### 8.5 Negotiation-to-Order handoff

Before confirmation, Customization and Quotation Management owns the pending negotiation information/history. At acceptance/confirmation, it provides accepted request details to Order Management. Order Management creates the confirmed Order and preserves the relevant Negotiated Price snapshot where applicable.

Do not make Order Management the owner of pending negotiation lifecycle records.

### 8.6 Public-sale discount: approved implementation rule

Follow ADR-005:

- Use one fixed positive whole-PKR discount amount for the public sale.
- Apply the same amount to every listed Product.
- Reject the sale if the amount is greater than or equal to any listed Product's Standard Catalogue Price.
- Do not support percentage discounts or stacking.
- Effective price = Standard Catalogue Price − fixed discount.
- Store PKR amounts as whole rupees; no fractional rounding is required.
- Raazia sets the amount; the system validates and calculates. It does not calculate profitability.

### 8.7 Approved Price and delivery charges

Approved Price is the final mutually agreed Order price, including applicable delivery charges.

- Local/in-city direct handover has no additional delivery fee.
- Courier/service delivery includes the applicable delivery fee before Approved Price is finalized.
- Follow Section 9 for pre-dispatch courier-fee increases and post-handover additional charges.

---

## 9. Delivery and courier-fee rules

These rules are binding under **PRD FR-15** and the related business rules. Do not weaken the PKR 200 threshold or automate Raazia's manual actions.

| Situation | Required behavior |
|---|---|
| Local/in-city direct handover | No additional delivery fee. |
| Courier/service delivery | Applicable delivery fee is included before Approved Price is finalized. |
| Pre-dispatch courier-fee increase below PKR 200 | Raazia absorbs the increase; do not add it to the customer's Approved Price. |
| Pre-dispatch courier-fee increase of PKR 200 or more | Raazia notifies the customer and obtains agreement before revising Approved Price and dispatching. |
| Customer does not accept a significant increase | Do not dispatch using the revised price. |
| Unexpected additional courier charge after courier handover | Raazia absorbs the additional charge; do not add it to the customer's Approved Price. |

Additional rules:

- Raazia handles customer communication and obtains the required agreement.
- The application records delivery method, applicable delivery costs, relevant customer agreement, and resulting Approved Price changes.
- Do not automatically contact customers.
- Do not book couriers or integrate with courier services.
- Do not automatically charge the customer for unexpected post-handover increases.
- A revised Approved Price MUST NOT be recorded before the required customer agreement.
- Do not invent any other threshold or fee policy.

---

## 10. Specification changes, On Hold, cancellation, and refunds

### 10.1 Cost-affecting specification changes

When a specification change affects an Order's cost (**PRD FR-13**):

1. Record the relevant specification change.
2. Place the affected Order On Hold while revised terms are discussed.
3. Do not proceed using outdated specifications or pricing.
4. Raazia discusses the revised price with the Customer.
5. Record a revised Approved Price only after mutual agreement.

The On Hold manufacturing/order status does not automatically alter payment or delivery status.

### 10.2 If agreement is not reached

Apply **PRD FR-13 and FR-15**; cancellation remains a decision for Raazia, not an automatic consequence of a rejected price change.

- Cancellation is not automatic.
- The system does not calculate financial loss automatically.
- Raazia determines whether proceeding would cause a financial loss.
- If no mutually acceptable price can be reached and Raazia determines that proceeding would cause financial loss, the system allows Raazia to decide and record cancellation.
- A Customer cancellation request does not itself automatically cancel the Order; Raazia decides whether to approve it.

Do not automatically cancel an Order merely because a Customer rejects a revised price.

### 10.3 Refunds

Apply **PRD FR-15** and the PRD cancellation/refund operating rule.

- Record cancellation and any applicable refund outcome separately.
- Refund outcome is distinct from manufacturing/order status.
- The system does not automatically calculate a full or partial refund.
- The system does not execute refunds.
- `Refunded` is a manually recorded payment state indicating a refund has been processed; do not treat recording as processing.
- Follow the PRD. Do not invent refund percentages, timelines, eligibility policies, or execution behavior.

---

## 11. Order status management

### 11.1 Accepted representation

ADR-003 and the group have accepted **Option A**: the `Order` contains three distinct, independently updated status attributes:

1. Manufacturing/Order Status.
2. Payment Status.
3. Delivery Status.

Do not reopen the separate-table-versus-three-attributes decision. Do not replace the three attributes with one combined state.

### 11.2 Manufacturing/Order Status

Use the PRD-supported terms:

- `Incomplete`: manufacturing has not started.
- `In Progress`: manufacturing has started but is unfinished.
- `Completed`: manufacturing is finished.
- `Cancelled`: manufacturing or delivery will not proceed as intended.
- `On Hold`: temporary state while cost-affecting specification changes/revised terms are discussed, where applicable.

A newly confirmed Order MUST start with manufacturing/order status `Incomplete`.

### 11.3 Payment Status

Preserve the exact PRD terms:

- `Advance Payment Received`
- `Partial Payment`
- `Full Payment`
- `Refunded`

Payment states are recorded manually by Raazia. The prototype does not automatically enforce payment percentages or advance amounts.

### 11.4 Delivery Status

Maintain delivery status and delivery information independently. Preserve `Delivered` as the PRD/ADR-defined completed delivery state.

Do not invent additional delivery-status values or transitions.

### 11.5 Independence rules

The three status attributes MUST be independently updated:

- Manufacturing `Completed` does not imply delivery `Delivered`.
- Manufacturing `Completed` does not imply `Full Payment`.
- `Full Payment` does not imply `Delivered`.
- `Delivered` does not automatically change manufacturing or payment status.
- Updating any one status MUST NOT automatically update either of the other two.
- Placing an Order `On Hold` does not automatically change payment or delivery status.

### 11.6 Initial status values

Follow ADR-005:

- New Orders start with manufacturing/order status `Incomplete`.
- Payment and delivery status are NULL until Raazia records them.
- Display `Not yet recorded` for either NULL value.
- NULL means no value has been recorded; it is not a new status.
- Do not default to `Unpaid`, `Pending`, or `Not Delivered`.

---

## 12. Availability, wishlist, reference images, and Estimated Completion Date

### 12.1 Availability

This responsibility is defined by **PRD FR-04**.

Availability Management covers only Raazia's manually maintained business availability under FR-04.

Do not reinterpret it as product availability, stock management, raw-material availability, supplier inventory, or automated scheduling. Do not invent a fixed schedule when no saved update exists.

### 12.2 Wishlist

Apply **PRD FR-16**.

- Only logged-in Customers manage a personal wishlist.
- Wishlist records are customer-specific.
- Wishlist contents persist across sessions.
- A Customer cannot retrieve or modify another Customer's wishlist.
- Wishlist operations remain separate from Inquiry, PendingOrderRequest, and Order creation.

### 12.3 Reference images

Preserve the image and customization context required by the PRD custom-order workflow; do not infer a storage vendor from this requirement.

Custom-order requests may include reference images and applicable product type, size, colour, materials, quantity, budget, special instructions, required completion date, and delivery address.

Reference images and relevant request details MUST remain accessible to Raazia as part of the request information.

Do not select or introduce a cloud storage provider, external image-hosting service, or other file-storage vendor without approval. The architecture does not select a storage provider.

### 12.4 Estimated Completion Date

Apply **PRD FR-17**.

- Estimated Completion Date is optional at Order confirmation.
- Raazia may confirm an Order without entering it.
- Until an estimate is entered, display exactly `Not yet provided` to the corresponding Customer.
- Raazia may record or update the estimate later.
- Display the latest saved estimate alongside the current manufacturing status.
- The date is an estimate, not a guaranteed delivery commitment.

---

## 13. Sales Summary — FR-18 is binding

Sales Summary is a limited operational report, not comprehensive accounting or a payment-reconciliation feature.

For a user-selected date range, it MUST:

1. Filter by each Order's **confirmation date**.
2. Treat the start and end dates as **inclusive**.
3. Interpret date boundaries in **Pakistan Standard Time (PKT)**.
4. Count all Orders confirmed within the selected range, including Orders subsequently cancelled.
5. Count cancelled Orders only from that same set of Orders confirmed within the selected range.
6. Calculate total Approved Price only for confirmed Orders in that range that have **not** been cancelled.
7. Exclude PendingOrderRequests.
8. Present Approved Price total as order value, never as payments received.

Do not substitute inquiry date, payment date, delivery date, manufacturing completion date, or cancellation date for the confirmation-date filter.

Sales Summary MUST obtain the required confirmed-order information through the Order Management interface. Order Management remains the owner of confirmed Order records. Generated report results need not be permanently persisted because the PRD does not require saved report records.

---

## 14. Explicit exclusions and prohibited scope expansion

Unless the scope is explicitly changed and approved, MUST NOT introduce:

- Payment gateway or integrated online payment processing.
- Automatic refund execution.
- Courier booking or courier API/service integration.
- External calendar synchronization.
- AI-generated designs.
- AI recommendations.
- Automated customization feasibility assessment.
- Automated request acceptance/rejection.
- Automated negotiation or customer contact.
- Comprehensive accounting.
- Tax management.
- Comprehensive inventory or raw-material management.
- Automated financial-loss calculations.
- Automatic cancellation decisions.
- Automatic payment percentage/advance enforcement.
- Unapproved third-party integrations or external services.

The following remain manual responsibilities of Raazia:

- Feasibility assessment.
- Acceptance and rejection.
- Negotiation.
- Approved Price determination.
- Availability maintenance.
- Payment-state recording.
- Delivery updates.
- Courier-fee communication and agreement.
- Cancellation decisions.
- Refund handling and recording.

The application records and displays the relevant information and decisions. Do not automate a manual responsibility merely because it is technically possible.

---

## 15. Approved technology stack and repository conventions

The D4 implementation stack is approved in **ADR-006**. Agents MUST use the following baseline:

| Concern | Approved technology/convention |
|---|---|
| Runtime | Node.js 26 LTS; do not use Node 27 Alpha. |
| Package manager | npm; commit `package-lock.json`; use `npm ci` for clean installs. |
| Frontend | React + Vite + JavaScript/JSX + React Router. |
| Styling | Supplied Farochet UI Kit CSS/components. Do not add a second design system by default. |
| Backend | Node.js + Express 5 REST API. |
| Validation | Zod for request-shape validation; business rules stay in Business Logic. |
| Database | One Supabase-hosted PostgreSQL database. |
| ORM | Prisma ORM 7 stable with `@prisma/adapter-pg` and `pg`; ESM and `prisma.config.ts` are required. Do not use Prisma 8 release candidates. |
| Authentication | Supabase Auth for identity; Express Middleware validates tokens and retrieves the application role through the Repository. |
| File storage | Supabase Storage private bucket for reference images, accessed through authorized backend routes. |
| Testing | Vitest + Supertest. Add frontend test dependencies only when a concrete slice needs them. |
| Execution | Local frontend/backend; Supabase-hosted DB/Auth/Storage. No separate production deployment is promised. |

### 15.1 Mandatory architecture-to-technology boundaries

1. The application is one layered monolith, not microservices. Nine Business Logic components are modules in one Express backend.
2. Preserve `Views → Controllers → Business Logic → Repository → PostgreSQL`.
3. Prisma Client is instantiated once by the backend and used only inside the centralized Repository. Do not import Prisma directly into Controllers or Business Logic modules.
4. React communicates with Express for all business data. Do not query business tables directly from React through Supabase Data API.
5. The browser may use Supabase Auth for sign-up/sign-in/session handling. Each protected API request sends its access token to Express Middleware.
6. Middleware verifies identity with Supabase Auth, then retrieves the application's persisted User role through the Repository. Only the two application roles `RAAZIA` and `CUSTOMER` are allowed. Display labels may be “Raazia” and “Customer”.
7. Customer registration MUST assign `CUSTOMER` server-side. Never accept a client-supplied role or allow a Customer to self-promote to `RAAZIA`. Provision the Raazia account through the controlled procedure documented in `README.md`/the setup instructions.
8. Business Logic enforces customer-specific record ownership using the authenticated user ID. Role checks are centralized in Middleware; record ownership is not delegated to the Repository.
9. Reference images use a private Supabase Storage bucket. Backend routes check role and ownership before upload/retrieval. Never put Supabase service-role/secret keys, PostgreSQL URLs, or server credentials in frontend code or `VITE_*` variables.
10. For the initial long-running local Express server, use the Supabase Session Pooler connection (port 5432) in backend `DATABASE_URL`, following `References/Technology_Stack_References.md`. If the execution/deployment model changes, obtain approval and update ADR-006 before changing connection strategy.
11. Use the Farochet UI Kit. Do not introduce Tailwind, shadcn/ui, Bootstrap, Redux, a different ORM, a second identity provider, or another major framework by default.
12. New major dependencies, services, storage providers, database vendors, ORMs, or architecture changes require project-coordinator approval and, where material, a new/updated ADR.
13. Do not add payment gateway, courier API, external calendar, automatic refund, AI design generation, automatic feasibility, or automatic request acceptance integrations.

### 15.2 Initial repository layout

Use the layout in `plan.md` and `README.md`. Keep frontend and backend as separate npm applications with committed lockfiles. The backend must retain `presentation/`, `business-logic/` (exactly nine modules), and `data-access/repositories/`. Keep the UI kit/design documentation under `docs/ui/`; keep evidence and plan history under `docs/`.

### 15.3 Environment and secrets

- Commit `.env.example` templates only; never commit `.env`.
- PostgreSQL connection strings and any Supabase server secret/service-role key remain backend-only.
- Frontend `VITE_*` values may contain only public configuration such as the Supabase project URL/public anon key and API base URL. No server credentials are public.
- Never include real credentials, tokens, customer records or private reference images in fixtures, screenshots, prompts, commits or D4 evidence.
- Do not expose service-role keys in AI prompts or repository files. If an agent needs environment access, the human supplies it locally outside the prompt/transcript.

---
---

## 16. Implementation workflow for every task

### 16.1 Before implementation

For each feature, bug fix, refactoring, or architectural change:

1. Read this `AGENTS.md` and the relevant sections of `Guardrails.md`. Treat the latter as rationale, not as an independent authority to change requirements or decisions.
2. Inspect the current repository/workspace structure and relevant implementation before editing. Record observed manifests, lockfiles, configuration, dependencies, and conventions; verify that the implementation follows ADR-006 and inspect existing manifests/lockfiles before editing.
3. Identify the exact PRD requirement(s), business rule(s), and acceptance criteria relevant to the task.
4. Identify the relevant accepted ADR(s), architecture section(s), and any explicitly verified group decision. Do not reopen accepted ADR decisions merely because another approach appears preferable.
5. Identify the owning Business Logic component and responsible layer. Confirm that the proposed change respects the approved dependency direction and Repository boundary.
6. Trace affected records, relationships, interfaces, lifecycle transitions, and workflows. Identify the authentication, role-authorization, and customer-ownership checks that apply.
7. Check the pending-decision register in Section 17 and determine whether the task depends on any unresolved matter or approval-required change.
8. Check whether the work changes an established guardrail, adds scope, introduces a technology/provider/dependency not approved by ADR-006, or adds an integration.
9. For substantial work, briefly state the intended change, affected requirements/layers/components/data/authorization boundaries, and planned tests before editing.
10. If sources conflict, report the exact statements, source locations, and implementation impact; do not silently choose an interpretation. If a required decision is unresolved, follow the STOP AND ASK conditions rather than guessing. Continue only independent work that does not depend on the unresolved matter.

### 16.2 During implementation

- Keep each responsibility in its assigned layer and component.
- Use established interfaces and project conventions where they comply with the architecture.
- Reuse valid existing patterns; do not introduce abstractions without a requirement.
- Keep changes focused and traceable.
- Avoid duplicate business rules in multiple layers/components.
- Keep business rules out of Views and ordinary Controllers.
- Do not bypass Middleware or Business Logic ownership checks.
- Do not allow Repository access to spread beyond the defined boundary.
- Do not silently alter existing business rules, data relationships, status semantics, or scope.
- Do not create an unapproved entity, Business Logic component, separately deployed service, database, integration, or major technology dependency.
- Do not add a default for an unspecified value.
- Do not modify the PRD or ADRs unless explicitly authorized.
- Do not treat a rationale statement in `Guardrails.md`, an existing code pattern, or an agent preference as approval to add a requirement or alter an accepted decision.

### 16.3 After implementation

1. Run relevant tests and checks that are available in the actual project.
2. Verify the changed feature against its PRD acceptance criteria.
3. Verify affected workflows and edge cases.
4. Verify role authorization and customer ownership.
5. Verify the layer and component boundaries.
6. Verify that no unrelated business rule or workflow regressed.
7. Update relevant documentation if behavior or architecture changed, subject to the change-control rules.
8. Report changed files, behavior, requirements covered, tests actually run, results, and remaining limitations.
9. Explicitly disclose any assumption, deviation, source conflict, newly observed technology choice, unresolved dependency, or approval requirement. If none occurred, say so.
10. Confirm whether the change remains consistent with both `AGENTS.md` and the applicable `Guardrails.md` rationale, as well as the PRD, accepted ADRs, and architecture baseline.

Never claim a test passed unless it was actually executed and passed. If tests cannot be run, state why and what remains unverified.

---

## 17. Decision and technology register

| Matter | Status | Binding instruction |
|---|---|---|
| Negotiation history persistence | **Resolved by ADR-005** | Use append-only `NegotiationEntry` records linked many-to-one to `Customization`. |
| Public-sale discount | **Resolved by ADR-005** | One fixed positive whole-PKR amount, applied to every listed Product; no percentage or stacking; must be below every listed Product price. |
| Initial payment status | **Resolved by ADR-005** | NULL until manually recorded; display `Not yet recorded`. |
| Initial delivery status | **Resolved by ADR-005** | NULL until Raazia records `Delivered`; display `Not yet recorded`. |
| Implementation stack | **Resolved by ADR-006** | Node.js 26 LTS; React + Vite + JS; Express 5; Supabase PostgreSQL/Auth/Storage; Prisma 7 stable; npm; Vitest + Supertest; local app execution. Follow ADR-006 boundaries. |
| Customer registration-intent boundary | **Approved by unanimous four-member decision** | Backend-only Supabase Auth Admin creates new identities; `CustomerRegistrationIntent` binds provider-returned ID/email; verified email confirmation activates a 30-minute intent; atomic single-use consumption creates `CUSTOMER`; existing roles are unchanged; exactly nine Business Logic components remain. |
| Additional major technology/provider/deployment change | **Not approved** | Obtain project-coordinator approval and update the relevant ADR before introduction. |

### 17.1 Accepted decisions—do not reopen

- ADR-001: Multi-Tier Layered Architecture; MVC within Presentation only.
- ADR-002: normalized relational persistence; separate Product, Inquiry, and Order records; pricing separation and relevant Negotiated Price snapshot; direct confirmed Order-to-original-Inquiry reference; no redundant `inquiry_id` on PendingOrderRequest.
- ADR-003: Option A, three independent status attributes within `Order`.
- ADR-004: centralized Middleware authentication and role-based authorization; authenticated user ID passed to Business Logic; Business Logic ownership enforcement; Repository is not an authorization boundary; Middleware's narrow User account/role lookup through Repository.
- ADR-005: approved negotiation-entry persistence, fixed public-sale discount, and nullable initial payment/delivery statuses.
- Exactly nine distinct Business Logic components.
- The accepted `Inquiry → Customization → PendingOrderRequest` relationship chain and cardinalities stated in Section 7.2.

The group-approved architecture baseline does not imply TA or faculty approval.

---

## 18. Mandatory STOP AND ASK conditions

Stop the affected implementation and request human clarification before proceeding when:

1. A requirement conflicts with an accepted ADR.
2. The PRD and architecture cannot be reconciled confidently.
3. A required business rule is missing or materially ambiguous.
7. A new Business Logic component, layer, service, database, or major dependency is proposed.
8. A technology choice would introduce or materially change an architectural dependency.
9. A proposed feature expands the agreed scope.
10. A manual Raazia decision would be converted into an automatic system decision.
11. A change would alter an accepted data relationship or cardinality.
12. A change would modify an accepted ADR, PRD business rule, or established status behavior.
13. The implementation would require a new external provider or integration.
14. The available sources do not support the behavior needed to implement safely.

When stopping, report:

- The exact issue and the conflicting or missing statements, if applicable.
- Each source document and the exact requirement, ADR, architecture, or instruction section involved.
- The affected component, layer, interface, authorization boundary, workflow, data relationship, or dependency.
- The practical implementation and testing impact of each possible interpretation.
- The implementation decision that is blocked and why an assumption would be unsafe.
- The precise decision, approval, or existing authoritative source needed to proceed.
- Whether unrelated work can continue without making the unresolved assumption.

Do not repeatedly ask for decisions already accepted in Section 17.1.

---

## 19. Testing requirements and evidence

Testing must verify business behavior, security, data integrity, and architectural compliance—not only whether a screen renders.

### 19.1 Functional and lifecycle tests

Where applicable, verify:

- Product catalogue displays the required images, descriptions, and Standard Catalogue Prices.
- Public discounts use one fixed whole-PKR amount across all listed Products; invalid sale configurations and stacked/percentage discounts are rejected.
- Raazia's availability is manually maintained and the latest saved information is displayed.
- Inquiry submission and Inquiry History retention work, including inquiries that never become orders.
- Customization and quotation information remain distinct from Inquiry and Order.
- PendingOrderRequests remain distinct from confirmed Orders.
- Rejected requests remain retained and do not create Orders.
- Acceptance creates a confirmed Incomplete Order.
- The confirmed Order preserves its original Inquiry reference.
- Negotiation history is retained through append-only `NegotiationEntry` records linked to `Customization` as defined in ADR-005.
- Wishlist operations are customer-specific, persistent, and do not create inquiries or orders.
- Estimated Completion Date may be absent at confirmation and displays `Not yet provided` until entered.

### 19.2 Security tests

Where applicable, verify:

- Inbound protected requests pass through centralized Middleware.
- Authentication is enforced.
- Customer/Raazia role authorization is enforced centrally.
- Customers cannot read or modify another customer's private records.
- Authenticated identity is passed to relevant Business Logic operations.
- Business Logic enforces ownership.
- Repository does not independently make authorization decisions.
- Middleware's Repository exception is limited to persisted User account/role lookup.
- The Auth Profile Provisioning Controller exceptions are limited to the approved backend signup, identity-verified intent activation, and atomic profile-completion operations; the Repository creates CUSTOMER profiles only and never overwrites existing profiles or roles.
- Views and ordinary Controllers do not access Repository/database.

### 19.3 Pricing and delivery tests

Where applicable, verify:

- Standard Catalogue Price is not overwritten by public discounts or order-specific prices.
- Quotation, Negotiated Price, and Approved Price remain distinct.
- Relevant Negotiated Price snapshot is preserved at confirmation.
- Catalogue/public-discount changes do not silently alter confirmed Order Approved Price.
- FR-12 price-change information is retained.
- Applicable courier/service delivery fee is included before Approved Price finalization.
- Pre-dispatch increase below PKR 200 is absorbed by Raazia.
- Increase of PKR 200 or more requires customer notification/agreement before Approved Price revision and dispatch.
- A declined significant increase does not permit dispatch at the revised price.
- Unexpected post-handover extra courier charges are absorbed by Raazia.
- No automated courier booking, customer contact, payment, or refund execution is introduced.

Test the fixed whole-PKR discount formula and its validation boundaries defined in ADR-005.

### 19.4 Specification-change, cancellation, and refund tests

Where applicable, verify:

- Cost-affecting specification change places the Order On Hold.
- Work does not proceed using outdated specifications/pricing.
- Revised Approved Price is recorded only after mutual agreement.
- Failure to agree does not automatically cancel the Order.
- Financial loss is not automatically calculated.
- Cancellation remains Raazia's manual decision under the PRD condition.
- Cancellation and refund outcome are recorded separately.
- Recording a refund outcome does not execute a refund.

### 19.5 Status tests

Verify:

- The Order contains three independent status attributes.
- A new confirmed Order has manufacturing/order status `Incomplete`.
- Initial payment/delivery defaults are not invented.
- Payment terminology matches the PRD exactly.
- Delivery status does not receive invented values.
- Updating one status does not cascade to another.
- `Completed` means manufacturing finished only.
- `Completed` does not imply `Delivered` or `Full Payment`.
- `On Hold` does not automatically alter payment or delivery status.

### 19.6 Sales Summary tests

Verify FR-18 exactly:

- Confirmation date is the date basis.
- Start and end dates are inclusive.
- PKT semantics are preserved.
- Confirmed count includes subsequently cancelled Orders.
- Cancelled count is limited to the same confirmed-order set.
- Approved Price total excludes cancelled Orders.
- PendingOrderRequests are excluded.
- Approved Price total is not payment received.
- Sales Summary obtains data through Order Management.
- Report results are not permanently persisted unless a requirement changes.

### 19.7 Architecture tests and review

Where practical, use tests, static checks, dependency inspection, or code review to detect:

- Unauthorized layer dependencies.
- Components accessing another component's persistence directly.
- Duplicate or misplaced business rules.
- Repository authorization decisions.
- Missing ownership enforcement.
- Unapproved integrations or dependencies.
- Accidental merging of lifecycle records.
- Unapproved status coupling or defaults.

Trace tests to PRD requirements/business rules where practical.

---

## 20. Change management and documentation integrity

Any proposed business-rule, architectural, data-model, dependency, or scope change must be explicit and traceable.

Before changing an established decision:

1. Identify the current rule and its source.
2. Explain the proposed change and its reason.
3. Identify affected PRD requirements, ADRs, architecture sections, components, interfaces, relationships, workflows, and tests.
4. Explain compatibility and migration implications where relevant.
5. Obtain the required human approval.
6. Update the appropriate authoritative document through the authorized process.
7. Update implementation and tests to match the approved change.
8. Recheck cross-document consistency.

MUST NOT:

- Rewrite accepted ADRs without authorization.
- Silently modify the PRD.
- Treat this `AGENTS.md` as authority to override the PRD or accepted ADRs.
- Make an implementation decision appear approved merely by documenting it.
- Change a Mermaid diagram without updating the corresponding architecture prose.
- Remove unresolved-decision records because they complicate implementation.
- Imply TA or faculty approval of the architecture unless that approval is documented.

A change to `AGENTS.md` itself must preserve its role as operational instructions, not turn it into a competing architecture rationale document.

---

## 21. Required reporting for substantial work

For every substantial feature, architectural change, or refactoring, report:

1. Relevant PRD requirement IDs and business rules.
2. Relevant architecture components and layers.
3. Applicable ADRs and guardrails.
4. Files/components/records/workflows changed.
5. Whether the change remains compliant with the established architecture.
6. Any new dependencies, technologies, integrations, or scope implications.
7. Any unresolved decision or required approval.
8. Tests/checks actually executed and their results.
9. Tests or behavior not verified and why.
10. Documentation updated or still required.

If no guardrail is affected, state that the change does not alter the established architectural boundaries.

Never report tests as passing unless execution evidence supports that claim.

---

## 22. Final architectural guardrails checklist

Before proposing or accepting a substantial implementation change, verify all applicable items:

- [ ] Relevant `Guardrails.md` rationale has been consulted without treating it as an independent source of new decisions.
- [ ] Multi-Tier Layered Architecture remains intact.
- [ ] MVC remains confined to Presentation.
- [ ] Exactly nine accepted Business Logic components remain distinct.
- [ ] Views and ordinary Controllers do not access Repository/database.
- [ ] Middleware Repository access remains limited to persisted User account/role lookup.
- [ ] Middleware handles authentication and role authorization.
- [ ] Business Logic enforces customer-specific ownership.
- [ ] Repository remains a persistence boundary, not an authorization boundary.
- [ ] Inquiry, Customization, PendingOrderRequest, and confirmed Order remain distinct.
- [ ] Accepted traceability relationships and cardinalities remain unchanged.
- [ ] No unapproved Negotiation entity or relationship is introduced.
- [ ] All five pricing concepts remain distinct.
- [ ] Negotiated Price snapshot and Approved Price preservation are respected.
- [ ] Public-discount values are sourced from the existing agreement, never guessed.
- [ ] Courier-fee rules and PKR 200 threshold are exact.
- [ ] Cost-affecting specification changes follow On Hold and mutual-agreement rules.
- [ ] Cancellation and refund decisions/handling remain manual.
- [ ] Three independent status attributes remain within Order.
- [ ] Unspecified initial payment and delivery values remain unspecified.
- [ ] Availability Management remains Raazia's manual availability only.
- [ ] Wishlist remains customer-specific, persistent, and separate.
- [ ] Reference images remain accessible without an unapproved storage provider.
- [ ] Estimated Completion Date remains optional and non-guaranteed.
- [ ] Sales Summary follows FR-18 exactly.
- [ ] Excluded functionality and integrations remain excluded.
- [ ] Implementation uses the ADR-006 stack; no unapproved major dependency/provider or deployment commitment was introduced.
- [ ] Group approval of the complete architecture is not confused with TA or faculty approval.
- [ ] Requirements, implementation, tests, and documentation remain traceable.
- [ ] Operational instructions in `AGENTS.md` remain consistent with the corresponding rationale in `Guardrails.md`; any discrepancy has been reported rather than silently resolved.

If a guardrail is violated, do not silently reproduce or normalize the violation. Identify the guardrail, cite the governing source, explain the consequence, and propose a compliant correction. Obtain approval where the correction itself changes an accepted decision or resolves a pending matter.

---

## 23. Final enforcement principle

When implementation convenience conflicts with an established requirement or guardrail, the requirement or guardrail takes precedence.

When an accepted decision conflicts with a proposed improvement, do not silently replace the decision.

When information is missing, do not invent it.

Apply the approved `NegotiationEntry` physical model in ADR-005. Do not invent a different relationship or data model.

When a human decision is required, stop and ask.

The agent's responsibility is to implement the system the project has specified and accepted—not to independently redesign it.


## 21. D4 plan, Git, UI, and evidence workflow

- The active implementation plan is root `plan.md`. The original submitted draft is historical only at `docs/plan-history/plan-v00-original-draft.md` and contains superseded assumptions; do not use it for implementation.
- Before a meaningful plan change, preserve the previous active version under `docs/plan-history/plan-vNN.md` or ensure a retrievable Git commit exists. Update the version/date in `plan.md` and retain earlier versions.
- All collaborators work directly on `main`. Do not create or use a `dev` branch, feature branches, or pull requests. Pull the latest `main` before starting work, stage only relevant files, commit with descriptive messages, synchronize with `origin main` again before pushing, and push directly to `origin main`.
- If a push is rejected because another member pushed first, pull/rebase onto `origin main`, resolve conflicts, rerun relevant checks, and push again. Never force-push, use destructive resets, or commit `.env` files. Coordinate simultaneous edits to shared files such as the Prisma schema, package files, architecture/plan documents and configuration.
- Each member/agent owns one assigned vertical slice at a time. Do not build the product horizontally by separating all frontend, backend, and database work.
- The project coordinator is the shared Prisma schema/migration steward. Coordinate schema/migration edits made directly on `main`; only the coordinator applies migrations to the shared Supabase database after review. Do not run concurrent migrations from multiple agent sessions.
- Before frontend work, read the relevant Farochet `UI_GUIDELINES.md`, `UI_SCREEN_SPEC.md`, `UI_COMPONENT_CATALOG.md`, and `UI_TEAM_WORKFLOW.md`. Merge `AGENTS_UI_INSTRUCTIONS.md` rules into this file (they are also summarized in Section 15); do not replace root instructions with the UI snippet.
- Maintain `docs/evidence/Workflow_Evidence_Log.md`, `Group_Contribution_Log.md`, and `Testing_Evidence_Log.md`. Record HITL/AFK mode, task/chat reference, iterations, actual tests/results, human decision, commit/integration, and plan version. Do not reconstruct this evidence at the end.
- A coding agent's report is not a test result. Human members run relevant checks and make the Accept / Revise / Reject decision.

---

## 24. Shared UI development rules

This section merges the additive UI instructions from `docs/ui/Farochet_UI_Kit_v1.1/docs/ui/AGENTS_UI_INSTRUCTIONS.md`. It does not replace or override the architecture, data, security, or business-rule instructions above.

Before implementing or modifying frontend work, read:

1. `docs/ui/Farochet_UI_Kit_v1.1/docs/ui/UI_GUIDELINES.md`
2. The relevant screen section in `docs/ui/Farochet_UI_Kit_v1.1/docs/ui/UI_SCREEN_SPEC.md`
3. `docs/ui/Farochet_UI_Kit_v1.1/docs/ui/UI_COMPONENT_CATALOG.md`
4. `docs/ui/Farochet_UI_Kit_v1.1/docs/ui/UI_TEAM_WORKFLOW.md`

Rules:

- Follow the Lavender Garden design tokens and visual/interaction rules.
- Use the Farochet brand on customer-facing screens; identify the private workspace as Farochet Admin. Raazia is the administrator role, not the storefront brand.
- Reuse existing shared components before creating new ones.
- Do not duplicate or locally restyle shared Button, TextField, Card, StatusBadge, header, sidebar, or footer components.
- Implement feature-specific components inside their owning feature folder.
- Do not change global tokens or shared component behavior without coordination and review.
- Preserve the crochet-flower illustration style and approved placement/density rules. Decorative artwork must never obscure content or controls.
- Do not add cart, checkout, stock, ratings, reviews, free-shipping claims, payment-gateway, courier-API, chat, or other unapproved features.
- Do not invent business status values, price calculations, acceptance decisions, or availability logic in the frontend.
- Keep Inquiry, Pending Order Request, and confirmed Order distinct.
- Keep Standard Catalogue Price, public discount, Negotiated Price, and Approved Price distinct.
- Show manufacturing/order, payment, and delivery statuses separately.
- Do not access the database, ORM, or Repository from frontend components.
- Do not treat hidden UI controls as authorization; backend middleware and Business Logic enforce access rules.
- Before adding a dependency or selecting a new UI library, check the approved stack and repository conventions.
- If the UI specification conflicts with the PRD or architecture, stop the affected work and raise the conflict instead of inventing a rule.

The integrated copies live in `frontend/src/components/` and `frontend/src/styles/`. The original UI Kit under `docs/ui/Farochet_UI_Kit_v1.1/` remains the design reference and must be preserved.
