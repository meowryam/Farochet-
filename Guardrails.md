# Guardrails

## Raazia's Customer Inquiry, Quotation, and Custom Order Management System

**Document purpose:** Architectural and implementation governance rationale

**Companion document:** `AGENTS.md`

**Source baseline reviewed:** PRD Version 1.4; consolidated `architecture.md`; accepted ADR-001 through ADR-006; existing `AGENTS.md`

**Status note:** The group has reviewed and approved the consolidated architecture. ADR-001 through ADR-005 remain the accepted architecture/business-rule baseline; ADR-006 selects the D4 implementation stack by project-coordinator decision. This status does not imply TA or faculty approval.

---

## 1. Introduction

Architectural and implementation guardrails are boundaries that keep design and code changes aligned with the requirements, business rules, and architectural decisions established for this project. They explain not only what must be preserved, but why a boundary exists, which risk it prevents, and how an AI coding agent is expected to behave.

This project needs explicit guardrails because it combines customer-specific inquiries and customizations, manual quotation and negotiation, confirmed orders, several independent status dimensions, and sensitive customer and pricing information. A technically valid implementation can still be wrong for this project. For example, an agent could build a single `status` field that works in isolation but contradicts the accepted requirement to update manufacturing, payment, and delivery independently. Similarly, an agent could introduce a payment gateway or a new database because it appears convenient, even though neither is in the approved scope or selected architecture.

AI coding agents can generate plausible code quickly, but they may fill gaps with familiar patterns, simplify distinct business concepts, or make technology and data-model choices without recognizing that those choices require human approval. Explicit guardrails prevent those assumptions from becoming undocumented project decisions.

This document complements, and does not replace, the project's source documents:

- **PRD v1.4** defines the product requirements, business rules, terminology, user permissions, scope, constraints, and acceptance criteria.

- **Accepted ADR-001 through ADR-006** establish the architectural decisions they address.

- **`architecture.md`** consolidates the layers, components, interfaces, data ownership, and interactions. The group has reviewed and approved it as a complete document.

- **`AGENTS.md`** translates the authoritative requirements and decisions into binding operational instructions for AI coding agents.

- **This `Guardrails.md`** explains the rationale and governance risks behind those operational boundaries.

## 2. Why guardrails are necessary

The following risks are specific to this system and its approved operating model.

| Risk | Project-specific example | Why a guardrail is needed |
|---|---|---|
| Architectural drift | An agent moves pricing calculations into Controllers or introduces separately deployed services for each business component. | The accepted design is a three-layer Multi-Tier Layered Architecture, with MVC only inside Presentation. |
| Unauthorized design decisions | An agent stores negotiation exchanges as append-only `NegotiationEntry` children of `Customization`, as approved by ADR-005. | ADR-005 defines the physical representation and cardinality for negotiation history. |
| Inconsistent business rules | One workflow absorbs a courier increase below PKR 200 while another asks the customer to pay it. | Courier-fee handling is a defined business rule and must not vary by implementation path. |
| Incorrect data relationships | A `PendingOrderRequest` receives a redundant `inquiry_id`, or a confirmed Order loses its direct reference to the original Inquiry. | The accepted traceability chain and confirmed-order relationship must remain consistent. |
| Security and authorization weaknesses | A customer changes an identifier in a request and retrieves another customer's inquiry or wishlist. | Middleware performs role authorization, and the relevant Business Logic component enforces record ownership. |
| Uncontrolled technology selection | An agent chooses a framework, ORM, hosting provider, or external file-storage service before the team selects one. | ADR-006 selects the D4 implementation stack; agents must use it and must not introduce unapproved major dependencies/providers. |
| Scope creep | An agent adds courier booking, online payment, automatic refunds, or inventory management as a convenience. | These capabilities are excluded from the agreed scope. |
| Incorrect pricing calculations | A later catalogue-price or public-discount update silently changes an already confirmed Order's Approved Price. | Catalogue, discount, negotiated, and approved prices have distinct meanings and ownership. |
| Inconsistent Order statuses | Setting manufacturing to `Completed` automatically marks an Order `Delivered` or `Full Payment`. | FR-14 and ADR-003 require three independently updated status attributes. |
| Loss of inquiry and negotiation history | An Inquiry is deleted after rejection, or negotiation history is discarded because no Order was confirmed. | Inquiry retention and negotiation-history preservation are required across the lifecycle. |
| Unapproved automation | The system automatically decides feasibility, accepts a request, cancels an Order, or executes a refund. | These decisions and operations remain manual and under Raazia's control. |
| Difficult integration and maintenance | A new external courier or identity provider is introduced without agreed interfaces or ownership. | Supabase is the selected managed platform for PostgreSQL, identity and private reference-image storage; payment, courier, calendar and other business-process integrations remain excluded. |
| Documentation/implementation contradiction | Code implements a single Order status while the architecture and tests describe three independent statuses. | Changes must be checked against the PRD, ADRs, architecture baseline, and `AGENTS.md`. |


## 3. Architectural guardrails

Each guardrail below states the boundary, its rationale, the risk it prevents, the expected agent behaviour, and its source.

### 3.1 Preserve Multi-Tier Layered Architecture

- **Guardrail:** Use the accepted Multi-Tier Layered Architecture with Presentation, Business Logic, and Data Access layers. Do not substitute microservices, independently deployed business services, or another architectural style without an approved change.

- **Why it exists:** ADR-001 selects a layered structure suited to this centralized, manually operated application without the operational and consistency overhead of microservices.

- **Risk prevented:** Unnecessary deployment complexity, duplicated responsibilities, network-dependent workflows, and fragmented data ownership.

- **Required agent behaviour:** Implement features within the existing layers and interfaces. If a proposed change requires another architecture or deployment boundary, stop and obtain explicit approval before implementing it.

- **Authoritative source:** ADR-001 (Accepted); `architecture.md`, Sections 3 and 4; `AGENTS.md`, Section 4.1.

### 3.2 Restrict MVC to Presentation

- **Guardrail:** MVC organizes Views, Controllers, and presentation-level state within the Presentation Layer only. It does not replace or absorb Business Logic or Data Access.

- **Why it exists:** Presentation concerns must remain separate from substantive business rules and persistence.

- **Risk prevented:** Business rules embedded in UI models or Controllers, duplicated calculations, and presentation code becoming coupled to database details.

- **Required agent behaviour:** Keep Views focused on presentation, Controllers focused on request handling and delegation, and business rules in the appropriate Business Logic component. Do not interpret a presentation-level Model as the domain/business layer.

- **Authoritative source:** ADR-001 (Accepted); `architecture.md`, Sections 3.2 and 4.1–4.2; `AGENTS.md`, Sections 4.1–4.2.

### 3.3 Preserve the three-layer separation

- **Guardrail:** Maintain the distinct Presentation, Business Logic, and Data Access responsibilities.

- **Why it exists:** The system needs clear ownership for user interaction, business decisions, and persistence.

- **Risk prevented:** Direct UI-to-database coupling, business rules scattered across layers, and changes that unintentionally affect unrelated responsibilities.

- **Required agent behaviour:** Route user interactions through Controllers and the appropriate Business Logic interfaces. Keep persistence behind the centralized Repository. Do not move responsibilities between layers for convenience.

- **Authoritative source:** ADR-001 (Accepted); `architecture.md`, Section 4; `AGENTS.md`, Section 4.

### 3.4 Preserve exactly nine Business Logic components

- **Guardrail:** Preserve these nine distinct components: Product Management; Availability Management; Pricing and Discount Management; Inquiry Management; Customization and Quotation Management; Order Management; Status Management; Wishlist Management; and Sales Summary.

- **Why it exists:** The architecture assigns separate responsibilities and data ownership to these business capabilities.

- **Risk prevented:** Component proliferation, blurred ownership, accidental coupling, and unauthorized changes to the approved architecture.

- **Required agent behaviour:** Place new behaviour within the existing component whose responsibility owns it. Do not merge, rename, remove, or add an architectural Business Logic component without explicit human approval.

- **Authoritative source:** `architecture.md`, Section 4.2 and its nine component subsections; `AGENTS.md`, Sections 4.3 and 5. ADR-001 establishes the overall architecture; the nine-component decomposition is recorded in the consolidated architecture and operational baseline.

### 3.5 Use one centralized Repository

- **Guardrail:** Business Logic components use the centralized Repository for persistence; the Data Access Layer contains the centralized Repository and centralized relational database. Do not create separate repositories or databases for individual components.

- **Why it exists:** Centralized persistence supports consistent data access and the accepted separation of Products, Inquiries, Orders, and their pricing information.

- **Risk prevented:** Divergent persistence logic, inconsistent records, duplicated database access, and data ownership fragmentation.

- **Required agent behaviour:** Put database interaction behind the Repository and keep component-level persistence requests within the established boundary. Do not allow Business Logic components to bypass the Repository.

- **Authoritative source:** ADR-001 (centralized Data Access tier); ADR-002 (Accepted normalized relational data model); `architecture.md`, Sections 4.3 and 6; `AGENTS.md`, Section 4.4.

### 3.6 Respect the approved dependency direction

- **Guardrail:** The ordinary dependency direction is `Views → Controllers → Business Logic → Repository → Relational Database`.

- **Why it exists:** This direction preserves separation of concerns and prevents lower-level persistence details from leaking into the user interface.

- **Risk prevented:** Circular or inverted dependencies, hard-to-test business rules, and direct database coupling.

- **Required agent behaviour:** Use the defined logical interfaces and dependency direction. Do not introduce an alternate access path merely to shorten an implementation.

- **Authoritative source:** `architecture.md`, Sections 4 and 5; `AGENTS.md`, Sections 4.5–4.6; ADR-001 and ADR-004.

### 3.7 Prohibit direct database access from Views and ordinary Controllers

- **Guardrail:** Views and ordinary Controllers must not access the Repository or database. Views communicate through Controllers; Controllers delegate substantive operations to Business Logic.

- **Why it exists:** UI and request-handling code should not own persistence or business decisions.

- **Risk prevented:** Authorization bypasses, duplicated data-access code, hidden business rules, and inconsistent validation across entry points.

- **Required agent behaviour:** Call the appropriate Business Logic interface. Do not import, instantiate, or call the Repository/database from a View or ordinary Controller.

- **Authoritative source:** `architecture.md`, Sections 4.1 and 6.9; `AGENTS.md`, Sections 4.2 and 4.5.

### 3.8 Keep the Middleware-to-Repository exception narrow

- **Guardrail:** Centralized Controller Middleware may use the Repository only to retrieve persisted User account and role information needed for authentication and role identification. This is the sole documented direct Presentation-to-Data Access exception.

- **Why it exists:** ADR-004 explicitly places account/role lookup at the centralized request boundary while retaining customer-record ownership decisions in Business Logic.

- **Risk prevented:** Broadening a narrow security lookup into general Presentation-layer database access or moving ownership authorization into the Repository.

- **Required agent behaviour:** Restrict Middleware's Repository use to User account/role lookup. Do not extend it to inquiries, quotations, orders, wishlists, or general business data. Do not create a separate User Management Business Logic component or authentication service unless separately approved.

- **Authoritative source:** ADR-004 (Accepted); `architecture.md`, Sections 4.1 and 6.9; `AGENTS.md`, Sections 4.5 and 6.

### 3.9 Do not make unauthorized architecture changes

- **Guardrail:** Changes to layers, component boundaries, dependencies, persistence boundaries, or accepted relationships require explicit approval where they alter the approved architecture.

- **Why it exists:** The architecture is a group-owned design baseline, not an invitation for an agent to redesign the system during implementation.

- **Risk prevented:** Unreviewed architectural drift and implementation decisions being mistaken for team-approved decisions.

- **Required agent behaviour:** Explain the proposed change, affected decision, rationale, and consequences; do not implement it until authorized. Treat the complete `architecture.md` as group-approved, without implying TA or faculty approval. Continue to respect the four accepted ADRs and verified group decisions.

- **Authoritative source:** ADR-001–ADR-004 (Accepted); `architecture.md`, Sections 11–12; `AGENTS.md`, Sections 2, 17, and 20.

## 4. Security and authorization guardrails

Security is divided between centralized role authorization at the request boundary and customer-specific ownership enforcement in Business Logic. These responsibilities are complementary, not interchangeable.

### 4.1 Centralized authentication and role-based authorization

- **Guardrail:** All inbound requests pass through centralized Controller Middleware. Middleware authenticates the request, identifies the persisted account and role, enforces role-based authorization, and rejects disallowed operations.

- **Why it exists:** A single request-boundary control avoids relying on every individual endpoint to independently implement role checks.

- **Risk prevented:** Missing role checks, customers invoking Raazia-only operations (such as standard catalogue price management), and inconsistent authorization across Controllers.

- **Required agent behaviour:** Ensure protected requests pass through Middleware. Do not treat hidden buttons or client-side checks as authorization. Do not trust a client-supplied user ID as proof of identity.

- **Authoritative source:** ADR-004 (Accepted); PRD NFR-01; `architecture.md`, Section 4.1; `AGENTS.md`, Section 6.1.

### 4.2 Business Logic enforces customer-specific ownership

- **Guardrail:** The relevant Business Logic component decides whether the authenticated Customer may access or modify the requested private record.

- **Why it exists:** Role authorization answers whether a role may perform an operation; it does not establish that a Customer owns a particular Inquiry, quotation, customization, Order, or Wishlist.

- **Risk prevented:** Insecure direct-object access, where a Customer changes an identifier to read or modify another Customer's records.

- **Required agent behaviour:** Perform ownership checks in the relevant Business Logic operation using the authenticated user ID passed by Middleware. Never rely solely on a record identifier supplied by the client.

- **Authoritative source:** ADR-004 (Accepted); PRD business rule 18 and NFR-01; `architecture.md`, Sections 4.2 and 6; `AGENTS.md`, Section 6.2.

### 4.3 Repository is not an authorization boundary

- **Guardrail:** Repository persists and retrieves data; it does not independently decide whether a user is authorized to access a business record.

- **Why it exists:** ADR-004 assigns customer-specific ownership decisions to Business Logic, even if Repository queries are scoped using identifiers.

- **Risk prevented:** Incomplete authorization based on query filters alone, or inconsistent policy hidden inside persistence code.

- **Required agent behaviour:** Keep the authorization decision in Business Logic. Repository-level query scoping may support retrieval but must not replace the ownership check.

- **Authoritative source:** ADR-004 (Accepted); `architecture.md`, Section 6.9; `AGENTS.md`, Section 6.3.

### 4.4 Propagate authenticated identity

- **Guardrail:** Middleware passes the authenticated user's ID to relevant Business Logic operations.

- **Why it exists:** Business Logic needs a trusted identity context to enforce ownership without accepting identity claims from an untrusted client.

- **Risk prevented:** Confused identity, forged owner IDs, and customer data leakage.

- **Required agent behaviour:** Pass the identity established by Middleware through the relevant logical interfaces. Do not substitute a request-body user ID for the authenticated identity.

- **Authoritative source:** ADR-004 (Accepted); `architecture.md`, Section 4.1; `AGENTS.md`, Sections 6.1–6.2.

### 4.5 Preserve the two approved roles

- **Guardrail:** The approved roles are `Customer` and `Raazia`.

- **Why it exists:** The PRD defines these two user categories and the prototype's access-control verification uses one Raazia account and customer accounts.

- **Risk prevented:** Unspecified privilege levels and accidental expansion of the authorization model.

- **Required agent behaviour:** Implement the two established roles and their documented permissions. Do not invent additional roles, permission tiers, identity providers, or authentication services without approval.

- **Authoritative source:** PRD Section 4 and NFR-01; ADR-004 (Accepted); `architecture.md`, Section 1.2; `AGENTS.md`, Sections 3 and 6.

## 5. Data and lifecycle guardrails

### 5.1 Keep the four lifecycle concepts distinct

`Inquiry`, `Customization`, `PendingOrderRequest`, and confirmed `Order` represent different records and lifecycle responsibilities. They must not be collapsed into one generic request/order record or treated merely as interchangeable status values.

- **Inquiry:** The customer's inquiry record and retained inquiry history.

- **Customization:** The customization information associated with an originating Inquiry.

- **PendingOrderRequest:** A request awaiting Raazia's manual review and decision; it is not yet a confirmed Order.

- **Confirmed Order:** The record created when Raazia accepts the request. Acceptance and confirmation are the same event, and the new Order begins with Manufacturing/Order Status `Incomplete`.

**Why this matters:** Combining these concepts can erase rejected requests, lose inquiry history, make pending requests appear confirmed, or confuse the source of a confirmed Order. Agents must preserve separate ownership and lifecycle transitions.

**Risk prevented:** Lost history, incorrect customer-visible state, invalid reporting, and ambiguous order conversion.

**Required agent behaviour:** Preserve separate records and their defined responsibilities. Rejection must not create a confirmed Order. Acceptance creates a distinct confirmed Order; it does not overwrite the Inquiry or PendingOrderRequest.

**Authoritative source:** PRD FR-06 and FR-11; PRD business rules 6, 18, and 19; ADR-002 (Accepted); `architecture.md`, Section 6.3; `AGENTS.md`, Sections 7.1 and 7.3.

### 5.2 Preserve the approved traceability relationships

The accepted pending-stage relationship chain is:

`Inquiry → Customization → PendingOrderRequest`

The following relationships are binding:

- Each `Customization` references its originating `Inquiry`.

- Each `PendingOrderRequest` references exactly one `Customization`.

- Each `Customization` may be associated with zero or one `PendingOrderRequest`.

- No additional Inquiry-to-Customization cardinality has been approved; do not infer one.

- A confirmed `Order` directly references the original `Inquiry`.

- Do not add a redundant `inquiry_id` to `PendingOrderRequest`.

**Why this matters:** This preserves traceability across the pending and confirmed lifecycle without duplicating the Inquiry reference on the pending request.

**Risk prevented:** Conflicting sources of truth, accidental many-to-many or one-to-many assumptions, and broken traceability after conversion.

**Required agent behaviour:** Implement only the stated relationships and cardinalities. If a physical schema or migration appears to require a different relationship, stop and request clarification rather than silently adding one.

**Authoritative source:** Verified group decision recorded in `architecture.md`, Sections 6.3 and 11.1; ADR-002 (Accepted) for the direct confirmed Order-to-Inquiry reference and absence of redundant `inquiry_id`; `AGENTS.md`, Section 7.2.

### 5.3 Retain rejected requests and inquiries

- **Guardrail:** A rejected `PendingOrderRequest` remains retained and does not create an Order. Inquiry History retains an Inquiry even if it never produces a PendingOrderRequest or confirmed Order.

- **Why it exists:** The project requires inquiry history and a distinction between pending requests and confirmed orders.

- **Risk prevented:** Deletion of customer history, loss of the reason/context for prior decisions, and inaccurate lifecycle/reporting records.

- **Required agent behaviour:** Do not delete, merge, or overwrite the Inquiry or rejected request as a side effect of rejection or order confirmation. Preserve relevant customization and negotiation history within their established responsibilities.

- **Authoritative source:** PRD FR-06 and FR-11; PRD business rule 19; ADR-002 (Accepted); `architecture.md`, Section 6.3; `AGENTS.md`, Sections 7.3–7.5.

### 5.4 Preserve negotiation history using the approved model

- **Guardrail:** Store each negotiation exchange as an append-only `NegotiationEntry` linked to exactly one `Customization`; one Customization may have zero or many entries.
- **Why it exists:** Negotiation history must remain available across quotation rounds and must not be overwritten.
- **Risk prevented:** Lost offer history, inconsistent price negotiation, and unauthorized access to another customer's negotiation.
- **Required agent behaviour:** Append a new entry for each offer/counter-offer. Restrict access to Raazia and the Customer who owns the Customization. Follow ADR-005.
- **Authoritative source:** ADR-005; `architecture.md`, Section 6.6; `AGENTS.md`, Section 7.4.


## 6. Pricing guardrails

### 6.1 Keep the five pricing concepts distinct

| Concept | Project meaning | Ownership |
|---|---|---|
| **Standard Catalogue Price** | The normal listed product price. | Pricing and Discount Management |
| **Public Discount** | A public reduction applied uniformly to customers covered by the same promotion; it does not permanently change the Standard Catalogue Price. | Pricing and Discount Management |
| **Quotation** | Price presented using the Standard Catalogue Price before individual negotiation or an applicable public discount. | Customization and Quotation Management |
| **Negotiated Price** | Customer-specific proposed price discussed with Raazia. | Customization and Quotation Management |
| **Approved Price** | Final mutually agreed price for a particular confirmed Order, including applicable delivery charges. | Order Management |


- **Why it exists:** These values serve different stages and audiences. Treating them as interchangeable can expose private negotiated values, overwrite catalogue pricing, or misstate the final agreed order value.

- **Risk prevented:** Cross-customer price leakage, incorrect discount application, catalogue-price corruption, and inconsistent Order totals.

- **Required agent behaviour:** Keep each concept and its ownership distinct in data, interfaces, calculations, and tests. Do not use an Order-specific price to update a Product's Standard Catalogue Price.

- **Authoritative source:** PRD Glossary, FR-03, FR-12, and business rules 1–5; ADR-002 (Accepted); `architecture.md`, Section 6.4; `AGENTS.md`, Sections 8.1–8.2.

### 6.2 Preserve pricing ownership boundaries

- **Guardrail:** Pricing and Discount Management owns Standard Catalogue Prices and public-discount rules; Customization and Quotation Management owns quotations, negotiation, and pending Negotiated Prices; Order Management owns confirmed Order Approved Prices, applicable snapshots, and price-change records.

- **Why it exists:** Each stage has a different source of truth and lifecycle.

- **Risk prevented:** Multiple components independently calculating or modifying the same price, and pending negotiation data being confused with confirmed Order values.

- **Required agent behaviour:** Route price operations to the component that owns the relevant concept. Do not move price ownership into Controllers, Repository, or an unrelated component.

- **Authoritative source:** `architecture.md`, Sections 4.2 and 6.4; ADR-002 (Accepted); `AGENTS.md`, Section 8.2.

### 6.3 Protect confirmed Order prices and snapshots

- **Guardrail:** A confirmed Order's Approved Price must not be silently recalculated when catalogue prices or public discounts later change. Preserve the relevant Negotiated Price snapshot at confirmation where applicable. Approved Price is the final mutually agreed amount, including applicable delivery charges.

- **Why it exists:** A confirmed Order records a specific agreement with a customer; it must not drift because shared catalogue or promotion data changes later.

- **Risk prevented:** Retroactive price changes, disputes over agreed amounts, and inability to reconstruct the price basis at confirmation.

- **Required agent behaviour:** Store the order-level price information and relevant Negotiated Price snapshot at confirmation. Keep later catalogue and public-discount changes separate from existing confirmed Orders. Include applicable delivery charges before Approved Price is finalized.

- **Authoritative source:** PRD FR-12 and business rules 1–5, 12–15; ADR-002 (Accepted); `architecture.md`, Sections 5.3.4 and 6.4; `AGENTS.md`, Sections 8.3 and 8.7.

### 6.4 Apply the fixed public-sale discount

- **Guardrail:** Use one fixed positive whole-PKR discount amount for every listed Product in a public sale. It must be lower than every listed Product's Standard Catalogue Price. Percentage and stacked discounts are not supported.
- **Why it exists:** One deterministic rule prevents different product screens from calculating different sale prices.
- **Risk prevented:** Zero/negative sale prices, inconsistent discounts, and silent catalogue-price mutation.
- **Required agent behaviour:** Calculate `effectivePrice = standardCataloguePrice - fixedSaleDiscount`; reject invalid configurations; do not calculate profitability.
- **Authoritative source:** ADR-005; PRD v1.4 Business Rule 2; `architecture.md`, Section 6.4; `AGENTS.md`, Section 8.6.


## 7. Order status guardrails

- **Guardrail:** Manufacturing/Order Status, Payment Status, and Delivery Status are three independent attributes within the `Order` data model, updated independently.

- **Why it exists:** The business must be able to record manufacturing completion while payment or delivery remains outstanding.

- **Risk prevented:** A single combined status with an unmanageable number of combinations, and incorrect automatic transitions between unrelated lifecycle dimensions.

- **Required agent behaviour:** Preserve the three independent attributes and update only the status explicitly changed. Do not cascade changes from one status to either of the others.

- **Authoritative source:** PRD FR-14 and NFR-03; ADR-003 Option A (Accepted); `architecture.md`, Sections 6.5 and 11; `AGENTS.md`, Section 11.

The accepted status rules are:

- A newly confirmed Order starts with Manufacturing/Order Status `Incomplete`.
- Payment status is NULL until Raazia manually records `Advance Payment Received`, `Partial Payment`, `Full Payment`, or `Refunded`.
- Delivery status is NULL until Raazia records `Delivered`; dispatch/tracking information is stored separately.
- The interface displays `Not yet recorded` for NULL payment or delivery status.
- No automatic cascading status changes are permitted.
- `Completed` means manufacturing is finished only. It does not mean `Delivered` or `Full Payment`.


## 8. Courier, cancellation, specification changes, and refunds

These workflows intentionally preserve Raazia's manual business judgment. The system records decisions and outcomes; it must not convert them into autonomous decisions or external transactions.

### 8.1 Delivery method and courier fees

- **Guardrail:** Local/in-city direct handover has no additional delivery fee. For courier/service delivery, the applicable fee is included before Approved Price is finalized.

- **Why it exists:** The delivery method changes the agreed customer price and must be reflected before confirmation.

- **Risk prevented:** Charging a local customer an unsupported delivery fee or finalizing an Approved Price that omits the applicable service fee.

- **Required agent behaviour:** Record the delivery method and applicable fee, and include the fee in the final mutually agreed Approved Price where applicable. Do not add courier booking or integration.

- **Authoritative source:** PRD FR-15 and business rules 12–13; `architecture.md`, Sections 5.3 and 7; `AGENTS.md`, Section 9.

### 8.2 Apply the PKR 200 pre-dispatch threshold

- **Guardrail:** A pre-dispatch courier-fee increase below PKR 200 is absorbed by Raazia. An increase of PKR 200 or more is significant: Raazia notifies the customer and obtains agreement before revising Approved Price and dispatching.

- **Why it exists:** The threshold defines when the business absorbs a small increase and when customer agreement is required.

- **Risk prevented:** Inconsistent fee treatment, unapproved customer charges, and dispatch under a revised price the customer has not accepted.

- **Required agent behaviour:** Apply the exact threshold: `< PKR 200` is absorbed; `≥ PKR 200` requires notification and agreement before the revised Approved Price and dispatch. If the customer declines, do not dispatch using the revised price. Do not reinterpret the boundary.

- **Authoritative source:** PRD FR-15 and business rules 14 and 16; `architecture.md`, Section 5.3; `AGENTS.md`, Section 9.

### 8.3 Absorb unexpected post-handover courier charges

- **Guardrail:** Unexpected additional courier charges arising after the parcel has been handed to the courier are absorbed by Raazia.

- **Why it exists:** The customer-approved price is not to be changed retrospectively for these unexpected charges.

- **Risk prevented:** Post-agreement price changes and disputes over charges incurred after courier handover.

- **Required agent behaviour:** Record relevant delivery information as supported, but do not add the unexpected post-handover charge to the customer's Approved Price.

- **Authoritative source:** PRD FR-15 and business rule 15; `architecture.md`, Section 5.3; `AGENTS.md`, Section 9.

### 8.4 Keep cost-affecting specification changes under manual agreement

- **Guardrail:** When a specification change affects cost, the Order is placed `On Hold` while revised terms are negotiated. A revised Approved Price is recorded only after mutual agreement. If no agreement is reached and Raazia determines proceeding would cause a loss, she may decide to cancel.

- **Why it exists:** The system must not proceed using outdated specifications or an unagreed price, and financial-loss judgment remains with Raazia.

- **Risk prevented:** Manufacturing against obsolete terms, unilateral price changes, and automated financial decisions unsupported by the PRD.

- **Required agent behaviour:** Record the change and On Hold state; support recording the revised Approved Price only after agreement. Do not calculate financial loss or automatically cancel an Order.

- **Authoritative source:** PRD FR-13 and Operating Rules Section 9.2; `architecture.md`, Section 5.3; `AGENTS.md`, Section 10.

### 8.5 Preserve Raazia's cancellation authority and manual refund handling

- **Guardrail:** A Customer may request cancellation, but Raazia decides whether to approve it. Cancellation and refund outcomes are recorded separately; refund processing is not automated.

- **Why it exists:** Cancellation depends on business circumstances, and the PRD does not define an automatic cancellation or refund-calculation rule.

- **Risk prevented:** Unapproved cancellation, incorrect refund promises, and financial transactions executed without human authorization.

- **Required agent behaviour:** Support recording Raazia's decision and any applicable refund outcome. Do not automatically approve cancellation, calculate a full or partial refund, or execute a refund.

- **Authoritative source:** PRD FR-15, business rule 17, and Operating Rules Section 9.3; `architecture.md`, Sections 5.3 and 7; `AGENTS.md`, Sections 10 and 14.

## 9. Availability, wishlist, and other boundaries

### 9.1 Availability means Raazia's business availability

- **Guardrail:** Availability Management represents Raazia's manually maintained business/personal availability. It is not product stock, raw-material availability, supplier inventory, or automated scheduling.

- **Why it exists:** FR-04 concerns Raazia's availability for reviewing and handling requests, not the quantity or feasibility of materials.

- **Risk prevented:** Customers being shown unsupported stock claims or the system making feasibility decisions from a calendar or inventory assumption.

- **Required agent behaviour:** Implement only the manually maintained availability responsibility. Keep material availability and overall feasibility within Raazia's manual review process.

- **Authoritative source:** PRD FR-04 and business rule 7; `architecture.md`, Section 4.2 (Availability Management); `AGENTS.md`, Section 12.1.

### 9.2 Wishlist is personal and persistent

- **Guardrail:** A logged-in Customer's Wishlist is customer-specific, persists across sessions, and remains separate from Inquiry, PendingOrderRequest, and Order creation.

- **Why it exists:** Saving a product for later is not an inquiry or an order request.

- **Risk prevented:** Cross-customer wishlist exposure and accidental creation of business records from a save/remove action.

- **Required agent behaviour:** Enforce ownership and persistence. Do not let adding, viewing, or removing a Wishlist item create an Inquiry or order request.

- **Authoritative source:** PRD FR-16 and business rule 20; `architecture.md`, Sections 4.2 and 6.8; `AGENTS.md`, Section 12.2.

### 9.3 Keep reference images accessible without selecting an unapproved provider

- **Guardrail:** Reference images and relevant custom-order request details must remain accessible to Raazia. No storage provider has been selected.

- **Why it exists:** Images are part of the customization context, but the project has not approved a cloud or external storage provider.

- **Risk prevented:** Lost or inaccessible request context, and an unapproved external dependency being introduced under the guise of implementation detail.

- **Required agent behaviour:** Preserve image accessibility within the approved design. Do not select a storage vendor or external image-hosting service without approval.

- **Authoritative source:** PRD custom-order requirements and scope; `architecture.md`, Sections 6.6 and 7; `AGENTS.md`, Sections 12.3 and 15.

### 9.4 Estimated Completion Date is optional and not a guarantee

- **Guardrail:** Raazia may confirm an Order without an Estimated Completion Date, add or update it later, and the customer sees `Not yet provided` until one is entered. The date is an estimate, not a guarantee.

- **Why it exists:** Confirmation must not be blocked solely because an estimate is unavailable, and customers must not mistake an estimate for a commitment.

- **Risk prevented:** Unnecessary order-confirmation blockers and misleading delivery promises.

- **Required agent behaviour:** Keep the field optional at confirmation, display the required fallback, show the latest saved estimate with manufacturing status, and do not label it a guaranteed delivery date.

- **Authoritative source:** PRD FR-17 and business rule 21; `architecture.md`, Section 6.8; `AGENTS.md`, Section 12.4.

### 9.5 Implement Sales Summary exactly as FR-18 defines

- **Guardrail:** Sales Summary filters by Order confirmation date, uses PKT, and treats both date boundaries as inclusive. Confirmed count includes subsequently cancelled Orders; cancelled count includes only Orders confirmed in the selected range and later cancelled; Approved Price total excludes cancelled Orders. PendingOrderRequests are excluded, and Approved Price total is not payments received.

- **Why it exists:** The report is an operational summary of confirmed Order value, not cash accounting or payment reconciliation.

- **Risk prevented:** Incorrect date populations, double-counting or exclusion errors, and misrepresenting order value as revenue received.

- **Required agent behaviour:** Follow all FR-18 filters and calculations. Do not substitute inquiry, payment, delivery, manufacturing-completion, or cancellation date for confirmation date. Do not label Approved Price total as payments received.

- **Authoritative source:** PRD FR-18 and business rules 22–25; `architecture.md`, Section 5.3.7 and 6.9; `AGENTS.md`, Section 13.

## 10. Technology and scope guardrails

### 10.1 Follow the approved technology stack

- **Guardrail:** Agents must use the D4 stack in ADR-006: Node.js 26 LTS; React + Vite + JavaScript/JSX; Express 5; Supabase-hosted PostgreSQL; Prisma ORM 7 stable with `@prisma/adapter-pg`; Supabase Auth; private Supabase Storage for reference images; npm; Vitest + Supertest; and local application execution.

- **Why it exists:** The team needs one reproducible stack that fits the approved layered architecture, existing React UI starter, relational model, and short implementation window. Choosing new frameworks/providers independently would fragment the implementation and increase integration risk.

- **Risk prevented:** Incompatible dependencies, multiple application architectures, uncontrolled migration, credential exposure, and untestable deployment commitments.

- **Required agent behaviour:** Inspect existing manifests and lockfiles, follow ADR-006, keep Prisma behind the centralized Repository, route business data through Express, and avoid unapproved major dependencies/providers. A material stack or deployment change requires project-coordinator approval and an ADR update where necessary.

- **Authoritative source:** ADR-006; `architecture.md`, Sections 4, 7, 8, and 11; `AGENTS.md`, Sections 15 and 17.

### 10.2 Do not expand the approved scope

The following capabilities are excluded or not approved for implementation unless the project explicitly authorizes a scope change:

- Integrated online payment processing/payment gateways.

- Automatic refund execution.

- Courier booking or courier-service integration.

- External calendar synchronization.

- AI-generated designs or customization recommendations.

- Automated feasibility decisions.

- Automatic order acceptance or rejection.

- Comprehensive inventory management, including raw-material/supplier stock management.

- Comprehensive accounting or tax functionality.

- **Why it exists:** The product is a self-contained record-management system in which Raazia retains the relevant manual decisions and operations.

- **Risk prevented:** Scope creep, external integration burden, unapproved financial actions, and automation that contradicts the agreed operating model.

- **Required agent behaviour:** Do not add excluded features as enhancements or dependencies. If a requested feature appears to require one, identify the scope conflict and obtain explicit approval before proceeding. Manual recording of payment, delivery, cancellation, and refund outcomes is not permission to automate the underlying transaction.

- **Authoritative source:** PRD Sections 3.2–3.3, 8–10, and Operating Rules; ADR-001 (Accepted); `architecture.md`, Sections 7 and 8; `AGENTS.md`, Sections 14–15.

## 11. Resolved implementation decisions and remaining technology boundary

ADR-005 resolves the previously identified implementation gaps:

- Negotiation history uses append-only `NegotiationEntry` records linked many-to-one to `Customization`.
- Public sale uses one fixed positive whole-PKR discount amount applied uniformly to every listed Product; no percentage or stacking; it must be less than every listed Product's Standard Catalogue Price.
- Initial payment and delivery statuses are NULL until manually recorded and display `Not yet recorded`.
- The only required completed delivery status is `Delivered`; dispatch and tracking are separate information.

ADR-006 selects the D4 implementation stack: Node.js 26 LTS, React + Vite + JavaScript/JSX, Express 5, Supabase-hosted PostgreSQL, Prisma ORM 7 stable with the PostgreSQL driver adapter, Supabase Auth, private Supabase Storage for reference images, npm, Vitest + Supertest, and local application execution. Agents must follow these choices. The architecture remains a single layered monolith with MVC inside Presentation, exactly nine Business Logic components, and one centralized Repository/database. Additional major technologies, providers, integrations or production-deployment commitments remain unapproved unless the project coordinator authorizes them and updates the relevant ADR.

### 11.1 STOP AND ASK for genuinely new scope or conflicts

Stop only when a new request conflicts with the PRD/accepted ADRs, changes an accepted architecture boundary, introduces an unapproved technology/provider, expands excluded scope, or requires a business decision not covered by PRD v1.4 or ADR-005. Report the exact source, affected behavior, impact, and decision required. Do not reopen decisions already resolved in ADR-005.


## 12. How guardrails protect the project

Applied consistently, these guardrails provide practical benefits:

- **Consistent implementation:** Team members and agents use the same layer boundaries, component ownership, relationships, and business rules.

- **Reduced rework:** Unapproved entities, providers, integrations, and architecture changes are identified before they become expensive dependencies.

- **Code/document alignment:** Implementation and tests can be traced to the PRD, accepted ADRs, architecture baseline, and operational instructions.

- **Fewer unauthorized assumptions:** Values intentionally left unselected (such as the technology stack) remain explicitly documented rather than guessed.

- **More reliable testing:** Tests can verify the specific rules, such as independent statuses, price snapshots, customer ownership, and FR-18 reporting.

- **Better security:** Centralized role checks and Business Logic ownership enforcement reduce unauthorized access to customer records.

- **Easier code review:** Reviewers can assess whether each change respects known responsibilities and boundaries.

- **Controlled architectural evolution:** Proposed changes are surfaced for human review rather than introduced through routine feature work.

- **Clear accountability:** Accepted decisions and the approved ADR-006 stack and the remaining unapproved dependency boundary remain distinguishable.

## 13. Relationship with AGENTS.md

`AGENTS.md` is the **binding operational instruction manual** for AI coding agents. It specifies the actions, prohibitions, implementation workflow, testing expectations, and mandatory STOP AND ASK conditions agents must follow.

`Guardrails.md` provides the **rationale and governance explanation** for those instructions. It explains why the boundaries exist and the project risks they are intended to prevent. It does not replace, weaken, or expand the binding instructions in `AGENTS.md`.

When sources appear inconsistent, an agent must apply the documented source authority and approval status: the PRD is the primary authority for product requirements and business rules; accepted ADRs govern the architectural decisions they establish; verified group decisions apply where their exact meaning is established; and `AGENTS.md` provides binding operational instructions consistent with those authorities. `architecture.md` is the consolidated architecture reviewed and approved by the group. An agent must identify and report a material conflict rather than silently choosing an interpretation.

This document does **not** grant permission to change the architecture, alter an accepted ADR, introduce a major technology/provider beyond ADR-006, or expand project scope. Any such change requires the approval specified by the project's governing documents.

---

## Source register

The following project files were used or reviewed when preparing this document. Links below point to files that are present in the current project workspace.

1. [PRD.md](./PRD.md) — Product Requirements Document, Version 1.4.
2. [architecture.md](./architecture.md) — group-reviewed and approved architecture baseline and implementation decision register.
3. [ADR-001 — Overall Architectural Style](./ADR/%23%20ADR-001%20Overall%20Architectural%20Style.md) — Accepted.
4. [ADR-002 — Data Persistence and Separation for Pricing and Inquiries](./ADR/%23%20ADR-002%20Data%20Persistence%20and%20Separation%20for%20Pricing%20and%20Inquiries.md) — Accepted.
5. [ADR-003 — Independent Status Management for Orders](./ADR/%23%20ADR-003%20Independent%20Status%20Management%20for%20Orders.md) — Accepted.
6. [ADR-004 — Centralized Access Control and Authorization Boundary](./ADR/%23%20ADR-004%20Centralized%20Access%20Control%20and%20Authorization%20Boundary.md) — Accepted.
7. [ADR-005 — Resolution of Implementation Gaps](./ADR/ADR-005%20Resolution%20of%20Implementation%20Gaps.md) — Accepted.
8. [ADR-006 — Approved Implementation Technology Stack](./ADR/ADR-006-Approved-Implementation-Technology-Stack.md) — approved D4 implementation stack and technology boundaries.
9. [AGENTS.md](./AGENTS.md) — operational instruction manual.
9. [ASRs identification.docx](./References/ASRs%20identification.docx) — supporting architecture-significant requirements.
10. [Exploration of Architectural Alternatives](./References/Exploration%20of%20Architectural%20Alternatives%2Cjustificationand%20interfaces.docx) — supporting architectural alternatives, justification, and interfaces.

11. [Deliverable–3.pdf](./References/Deliverable%E2%80%933.pdf) — assignment guidance used for document structure, not as a source of additional product requirements or architectural decisions.

ADR-005 records the implementation decisions that close the former gaps. The group's review and approval of `architecture.md` is confirmed; no TA or faculty approval is claimed.
