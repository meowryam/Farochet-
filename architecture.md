# Architecture Context

## Raazia's Customer Inquiry, Quotation, and Custom Order Management System

**Document:** `architecture.md`\
**Status:** D3 architecture baseline reviewed and accepted by the group; D4 technology baseline selected by the project coordinator and recorded in ADR-006.\
**Basis:** Final PRD Version 1.4 (updated 18 November 2026), ASRs Identification, Exploration of Architectural Alternatives, and ADR-001 through ADR-006. No TA or faculty approval is claimed.\
**Architecture decision status:** ADR-001 through ADR-005 and the consolidated architecture form the D3 baseline. ADR-005 resolves negotiation-history persistence, public-sale discount, and initial payment/delivery status gaps. ADR-006 records the D4 implementation stack selected by the project coordinator. The accepted `Inquiry` → `Customization` → `PendingOrderRequest` traceability chain and the `NegotiationEntry` relationship are defined in the current baseline.

------------------------------------------------------------------------

## 1. System Overview

### 1.1 Purpose

Raazia's Customer Inquiry, Quotation, and Custom Order Management System
is a centralized application for managing the customer-facing product
catalogue and the business records associated with inquiries,
custom-order requests, quotations, confirmed orders, order-specific
prices, manufacturing progress, payments, delivery, wishlists, and sales
summaries.

The system addresses the current fragmentation of product questions,
price discussions, custom specifications, and order updates across
social and messaging channels. It provides customers with a central
place to browse catalogue information and submit inquiries or
custom-order requests, while giving Raazia a central place to review
requests and maintain business records.

### 1.2 Users

-   **Customer:** Can browse the product catalogue and access their own
    permitted inquiries, customization details, quotations, and order
    history. Logged-in customers can manage a personal wishlist.
    Customers cannot access another customer's restricted records or
    perform Raazia-only actions.
-   **Raazia:** Acts as the business administrator. She manages product
    information, availability, inquiries, requests, prices, order
    records, and the manual recording of payment, delivery,
    cancellation, and refund information.

### 1.3 Scope and operating model

The application supports product catalogue and standard price
management, public discounts, inquiry submission and history,
custom-order requests, manual request decisions, order-specific pricing,
independent order/payment/delivery tracking, wishlist management,
estimated completion dates, and date-range sales summaries.

The system is self-contained. Raazia remains responsible for human
decisions such as feasibility, acceptance or rejection, negotiation,
approved prices, availability, payment recording, delivery updates,
cancellation, and refund outcomes. The system records and presents these
decisions; it does not replace them with automatic business decisions.

### 1.4 Key workflow distinction

A **Customer Inquiry** is retained in Inquiry History whether or not it
leads to an order. A **Pending Order Request** is a request awaiting
Raazia's review and decision. It is not a confirmed order. Raazia's
acceptance of a request is the confirmation event and results in
creation of a confirmed **Incomplete Order**. Rejection does not create
a confirmed Order, and the request remains retained.

------------------------------------------------------------------------

## 2. Architectural Goals, Drivers, and ASRs

### 2.1 Architectural goals

The architecture is intended to:

1.  Separate presentation, business rules, and persistence
    responsibilities.
2.  Centralize authentication and role-based access control at the
    request boundary.
3.  Preserve inquiries independently of confirmed orders.
4.  Keep standard catalogue prices, public discounts, Negotiated Prices,
    and Approved Prices distinct.
5.  Support independent manufacturing/order, payment, and delivery
    status updates.
6.  Keep the application self-contained and avoid integrations excluded
    by the PRD.
7.  Provide maintainable, testable component boundaries appropriate to
    the scope of a small business application.
8.  Preserve records across application restarts and support core tasks
    through the user interface.

### 2.2 Architecture Significant Requirements

The following ASRs are taken from the group's ASR identification
document. They are deliberately limited to requirements and constraints
identified as architecturally significant.

| ASR | Source requirement | Why architecturally significant | Architectural concern |
|---|---|---|---|
| ASR-01: Security and authentication | NFR-01 | Customers and Raazia have different permissions; customers must not access other customers' restricted records or perform administrator-only actions. | Authentication, centralized authorization, and customer-specific data access. |
| ASR-02: Inquiry data storage and ownership | FR-06 | Inquiries must remain available even when they do not become confirmed orders. | Separate ownership and persistence of Inquiry records and confirmed Order records. |
| ASR-03: Independent status data | FR-14, NFR-03 | Manufacturing completion must not imply payment completion or delivery. A single combined lifecycle status would couple independent concerns. | Data model and business operations must preserve independent order, payment, and delivery statuses. |
| ASR-04: Price consistency | FR-12, FR-03 | Catalogue price, public discount, Negotiated Price, and final Approved Price have different meanings and scopes. | Separate price responsibilities and rules to prevent customer/order-specific prices from overwriting catalogue prices. |
| ASR-05: Self-contained system boundary | PRD Section 10 | The system is intended to record and manage business activity manually without payment gateways or courier integrations. | System boundary, deployment simplicity, and avoidance of unnecessary external dependencies. |

### 2.3 Relevant supporting requirements

The architecture also addresses the following PRD requirements:

| Requirement | Architectural implication |
|---|---|
| FR-01 to FR-03 | Product catalogue and pricing responsibilities must be distinct; public discounts must not overwrite Standard Catalogue Price. |
| FR-04 | Raazia's availability must be manually updated and displayed. Availability Management owns this information. The PRD does not define a separate product-availability feature. |
| FR-05 to FR-08 | Inquiry submission, retention, review, and role-restricted access require separate inquiry responsibility and access control. |
| FR-09 to FR-11 | Custom-order request submission and review must be distinguished from confirmed Order creation and lifecycle tracking. |
| FR-12 to FR-13 | Negotiated Price and Approved Price must remain distinct; price changes must preserve the specified change information; affected Orders may be placed On Hold during renegotiation. |
| FR-14 to FR-15 | Order, payment, and delivery statuses are independently updated; delivery fees, cancellations, and refund outcomes are manually recorded. |
| FR-16 | Wishlist records are customer-specific and independent of inquiries and order requests. |
| FR-17 | Estimated Completion Date is optional at confirmation and can be updated later by Raazia. |
| FR-18 | Sales Summary uses Order confirmation date, inclusive date boundaries in PKT, and the specified confirmed/cancelled Order and Approved Price calculations. |

### 2.4 Non-functional requirements

| NFR | Requirement | Architectural response |
|---|---|---|
| NFR-01: Basic Access Control | Enforce Customer and Raazia roles and prevent customers from accessing each other's restricted records or Raazia-only actions. | Centralized Controller Middleware; authenticated user identity is passed through the application for customer-specific ownership enforcement. Customer profile creation requires the approved verified-identity-bound registration intent. |
| NFR-02: Basic Data Persistence | Wishlist, inquiry, order, price, payment, and delivery records remain available after closing and reopening the application. | Persistent centralized relational data store accessed through the Repository. |
| NFR-03: Essential Data Integrity | Preserve independent order/payment/delivery statuses and fixed whole-PKR public-sale discount calculation. | Separate logical status values and distinct pricing responsibilities; business rules are handled in the Business Logic Layer. |
| NFR-04: Basic Usability for Core Tasks | Raazia can complete agreed core tasks through the interface without directly editing the database or application code. | Presentation Layer provides the user-facing screens and request flows; direct database or code editing is not part of normal operation. |

------------------------------------------------------------------------

## 3. Selected Architectural Style and Rationale

### 3.1 Selected style: Multi-Tier (Layered) Architecture

The system uses a **Multi-Tier (Layered) Architecture** consisting of
three distinct layers:

1.  **Presentation Layer**
2.  **Business Logic Layer**
3.  **Data Access Layer**

Each layer has a defined responsibility. The Presentation Layer handles
user interaction and request handling. The Business Logic Layer contains
business capabilities and rules. The Data Access Layer provides
persistence operations through a centralized Repository and relational
database.

The selected structure is a single, centralized application
architecture. It does not introduce independently deployed microservices
or separate databases for individual business capabilities.

### 3.2 MVC placement

The **Model-View-Controller (MVC) pattern is used within the
Presentation Layer only**.

-   **View:** Presents screens and information to Customers and Raazia.
-   **Controller:** Receives user requests, applies the centralized
    request-boundary access control, validates and routes requests to
    the appropriate Business Logic component, and returns results to the
    View.
-   **Presentation Model:** Represents the data/state needed by
    presentation views. It does not replace the Business Logic Layer,
    own business rules, or act as the persistence layer.

Business rules remain in the separate Business Logic Layer. Persistence
remains in the Data Access Layer.

This placement reflects the group's clarification that MVC organizes the
presentation concerns only; it does not collapse presentation and
business logic into one layer.

### 3.3 Alternatives considered

The architectural alternatives document considered:

-   **Multi-Tier (Layered) Architecture:** Separates UI, business logic,
    and data responsibilities. It supports separation of concerns,
    centralized business rules and security, testability, and
    maintainability. A centralized database can become a bottleneck at
    very large scale, but that concern is not considered significant for
    the stated small-business scope.
-   **Microservices Architecture:** Separates business capabilities into
    independently deployed services, typically with isolated data
    stores. It offers fault isolation and independent scalability but
    introduces operational complexity, distributed data consistency
    concerns, and network latency that are not justified by this
    project's scope.
-   **Model-View-Controller:** Separates presentation data/state, views,
    and request/control handling. The alternatives document recognizes
    MVC primarily as a presentation-tier pattern, not a complete
    architecture for backend business rules and persistence.

### 3.4 Rationale

Multi-Tier Architecture is selected because it separates user
interaction, business rules, and persistence while keeping the
application self-contained. It supports the ASRs by providing:

-   A centralized request boundary for security and role checks.
-   Separate business ownership for inquiries and confirmed orders.
-   A Business Logic Layer for pricing rules and independent status
    updates.
-   A centralized Data Access Layer for persistent records.
-   Less operational and data-distribution complexity than
    microservices.

MVC is used only to organize the Presentation Layer. It is not treated
as a substitute for the three-layer architecture.

**Related ADR:** [ADR-001 --- Overall Architectural
Style](./ADR/%23%20ADR-001%20Overall%20Architectural%20Style.md) ---
**Accepted**.

------------------------------------------------------------------------

## 4. Layers, Components, Responsibilities, and Boundaries

### 4.1 Presentation Layer

The Presentation Layer manages user interaction and the request/response
boundary.

#### User Interface / Views

Responsibilities:

-   Display the product catalogue, product images, descriptions, and
    prices.
-   Provide inquiry and custom-order request forms.
-   Display customer-specific inquiry, quotation, customization,
    wishlist, and order information according to permissions.
-   Provide Raazia-facing screens for managing products, requests,
    prices, orders, statuses, and summaries.
-   Display estimated completion dates and status information.
-   Support core tasks through the interface.

Boundary:

-   Views do not implement business rules or access the database
    directly.
-   Views communicate through Controllers.

#### Controllers / Request Handling

Responsibilities:

-   Receive requests from the user interface.
-   Validate request structure and basic input formatting.
-   Ordinary Controllers invoke the relevant Business Logic component
    through its defined interface. Auth Profile Provisioning follows
    only the explicitly approved exception below.
-   Return business results to the Presentation Layer for display.

Boundary:

-   Controllers do not contain the substantive pricing, order,
    negotiation, or status business rules.
-   Ordinary Controllers do not access the Repository or database
    directly.
-   The Auth Profile Provisioning Controller has only the separate,
    narrowly scoped Repository exception defined below.

#### Auth Profile Provisioning Controller — approved exception

Customer signup is initiated through `POST /api/auth/register`. The
backend validates the registration request and creates a new Supabase
Auth identity through the Auth Admin API using a server-only credential.
The backend stores a `CustomerRegistrationIntent` only after Supabase
returns the newly created identity ID and canonical email. A duplicate
identity receives the same generic response as a successful request and
does not receive an intent. Signup does not create an application `User`
profile. The service-role credential is never sent to the browser or
used to access application tables.

If Supabase requires email confirmation, the backend requests the
provider's configured signup confirmation. After sign-in, identity
verification Middleware verifies the bearer token and attaches the
verified Supabase user ID, email, and email-confirmation timestamp. The
`POST /api/auth/registration/activate` Controller asks the Repository to
activate only the intent bound to that verified identity. The first
verified request with a confirmed email starts a fixed 30-minute
completion period; repeated activation does not extend it.

The `POST /api/auth/profile` Controller accepts an empty body and invokes
the Repository's atomic completion operation using only the verified
identity. The Repository conditionally consumes the matching, unexpired,
single-use intent and creates the application `User` in one database
transaction. The intent's stored display name is used; the Repository
assigns `CUSTOMER`. Existing profiles and roles are returned unchanged,
including `RAAZIA`; missing, mismatched, expired, and consumed intents
are rejected. Client-supplied identity, email, role, or display name
cannot authorize completion.

This unanimous amendment is limited to the signup, activation, and
atomic completion operations described above. Middleware's Repository
access remains limited to account/role lookup. It does not permit
general Controller-to-Repository access or add a User Management
Business Logic component; the existing nine Business Logic components
remain unchanged.

#### Centralized Access Control / Controller Middleware

Responsibilities:

-   Authenticate the request and identify the authenticated user and
    role (Customer or Raazia), using account and role information
    persisted through the Repository.
-   Intercept inbound requests before they reach Business Logic.
-   Apply centralized role-based authorization and reject requests that
    are not authorized for the user's role.
-   Pass the authenticated user ID to the relevant Business Logic
    operations so those components can enforce customer-specific record
    ownership.

Boundary:

-   This is the single centralized authorization boundary identified in
    ADR-004.
-   Business components do not each implement a separate, duplicated
    role-based authorization system. The relevant Business Logic
    components do, however, enforce ownership rules for customer-specific
    records within their operations.
-   The Repository persists and retrieves User account and role data and
    performs persistence operations requested by Business Logic; it is
    not an authorization boundary and does not independently decide
    record ownership.
-   **Narrowly scoped layer-boundary exceptions:** ADR-004 requires
    centralized Middleware to use the Repository for persisted User
    account and role lookup. The unanimously approved registration
    amendment permits the Auth Profile Provisioning Controller to use
    only the registration-intent and atomic profile-completion operations
    for its defined signup routes. Views and ordinary Controllers do not
    access the Repository or database, and no other Presentation
    component or Repository operation may use either exception.

**Related ADR:** [ADR-004 --- Centralized Access Control and
Authorization
Boundary](./ADR/%23%20ADR-004%20Centralized%20Access%20Control%20and%20Authorization%20Boundary.md)
--- **Accepted**.

### 4.2 Business Logic Layer

The Business Logic Layer contains business capabilities and rules. It is
separate from MVC's presentation-level Model.

#### 1. Product Management

Responsibilities:

-   Maintain product information.
-   Maintain catalogue descriptions and product information presented to
    customers.
-   Retrieve product catalogue entries and product details.
-   Provide product information to other business components when
    required.

Boundary:

-   Owns product catalogue information.
-   Does not own Raazia's personal availability information.
-   The PRD does not define a separate product-availability feature or
    assign ownership for one; this architecture does not add that
    capability.
-   Does not own public discount rules or order-specific
    negotiated/approved prices.

#### 2. Availability Management

Responsibilities:

-   Allow Raazia to manually create and update her availability
    information.
-   Retrieve the latest saved Raazia availability for customer-facing
    display.
-   Represent the absence of a saved availability update without
    inventing a fixed schedule.

Boundary:

-   Owns Raazia's personal/business availability information required by
    FR-04.
-   Scope is limited to Raazia's availability information under FR-04;
    it does not determine product or material availability.
-   Does not automatically determine order feasibility or accept/reject
    Pending Order Requests; those decisions remain with Raazia.

#### 3. Pricing and Discount Management

Responsibilities:

-   Manage Standard Catalogue Prices.
-   Manage public discount information.
-   Calculate applicable public discounted prices using the
    fixed whole-PKR public-sale discount rule defined in PRD v1.4 and ADR-005.
-   Keep public discount calculations separate from Standard Catalogue
    Price.
-   Provide catalogue and public-discount pricing information to other
    business components.

Boundary:

-   Does not own customer-specific negotiation information or an order's
    final Approved Price.
-   Does not automatically recalculate prices already agreed for
    confirmed orders when catalogue prices or public discounts change.

#### 4. Inquiry Management

Responsibilities:

-   Accept and retain customer inquiries.
-   Retrieve and update inquiry information.
-   Provide Inquiry History, including inquiries that do not result in
    confirmed orders.
-   Make inquiry information available to Raazia for review.

Boundary:

-   Owns Inquiry records and Inquiry History.
-   Inquiry records remain available independently of whether a
    confirmed Order is created.
-   Does not create confirmed Orders.

#### 5. Customization and Quotation Management

Responsibilities:

-   Record customization specifications and revisions.
-   Prepare and retrieve quotations.
-   Record Negotiated Price and negotiation information while a request
    is pending.
-   Maintain Pending Order Requests awaiting Raazia's decision.
-   Record Raazia's acceptance or rejection.
-   Provide the accepted request details to Order Management when
    acceptance/confirmation occurs.

Boundary:

-   Owns customization specifications, quotation information,
    negotiation information/history, and Pending Order Requests before
    confirmation. This logical ownership does not prescribe a separate
    persistent `Negotiation` entity.
-   A quotation or Pending Order Request does not itself constitute a
    confirmed Order.
-   Rejection leaves the request retained and does not create a
    confirmed Order.
-   Acceptance is the confirmation event; Order Management then creates
    the confirmed Order.
-   The original Inquiry, quotation information, and negotiation
    history remain retained within their respective owning
    responsibilities; this does not prescribe a separate physical
    `Negotiation` entity.

#### 6. Order Management

Responsibilities:

-   Create a confirmed Order when it receives an accepted request.
-   Create the Order initially with manufacturing/order status
    **Incomplete**.
-   Maintain confirmed Order information and retrieve order history.
-   Preserve an order-level snapshot of the relevant Negotiated Price at
    confirmation, where applicable.
-   Record and maintain the Approved Price for the confirmed Order.
-   Record or update the optional Estimated Completion Date.
-   Support authorized order information and price updates, including
    the required price-change information.

Boundary:

-   Owns confirmed Order records.
-   Does not own pending negotiations before request acceptance.
-   Does not merge Pending Order Requests with confirmed Orders into one
    lifecycle entity.
-   Does not automatically change an Approved Price because a Standard
    Catalogue Price or public discount changes.
-   Negotiated Price and Approved Price remain distinct concepts; they
    may have the same amount but are not interchangeable.

#### 7. Status Management

Responsibilities:

-   Record and retrieve manufacturing/order status.
-   Record and retrieve payment status.
-   Record and retrieve delivery status.
-   Initialize the three independent status attributes when Order
    Management creates a confirmed Order. The manufacturing/order
    status is initially **Incomplete**, as required by FR-11. Payment and delivery status remain NULL until Raazia records them; the interface displays `Not yet recorded`, as defined in ADR-005.
-   Allow each status to be updated independently.

Boundary:

-   One unified business component is responsible for status management.
-   Manufacturing/order, payment, and delivery statuses are logically
    independent.
-   Updating one status must not automatically change either of the
    other two.
-   Payment states use the PRD terminology: **Advance Payment Received,
    Partial Payment, Full Payment, Refunded**.
-   Manufacturing/order lifecycle terminology includes **Incomplete, In
    Progress, Completed, Cancelled**, and **On Hold** where applicable
    to specification-change renegotiation.
-   Completed means manufacturing is finished only; it does not mean
    Delivered or Full Payment.
-   By the group's accepted architecture decision, the three statuses
    are represented as three separate attributes within the `Order`
    entity: manufacturing/order status, payment status, and delivery
    status. Each is updated independently.
-   The three attributes are separately maintained status values
    within the `Order` record. This is the group's accepted interpretation
    of FR-14's requirement to maintain the three statuses as separate
    records: the statuses remain distinct and independently updateable,
    but FR-14 does not prescribe separate database tables or related
    entities. No PRD wording change is made.

#### 8. Wishlist Management

Responsibilities:

-   Add catalogue products to a logged-in customer's personal wishlist.
-   Retrieve the customer's wishlist.
-   Remove products from the wishlist.
-   Preserve wishlist contents across sessions.

Boundary:

-   Wishlist data is customer-specific.
-   A wishlist is independent of inquiries, Pending Order Requests, and
    confirmed Orders.
-   Adding, viewing, or removing a wishlist item does not create an
    inquiry or order request.

#### 9. Sales Summary

Responsibilities:

-   Generate a sales summary for Raazia for a user-selected date range.
-   Obtain confirmed-order information through the Order Management
    interface; Order Management remains the owner of confirmed Order
    records.
-   Calculate the confirmed-order count, cancelled-order count, and
    total Approved Price according to FR-18.
-   Return the generated report without permanently persisting report
    results; the PRD does not require saved report records.

Boundary:

-   Uses order confirmation date, not inquiry date, manufacturing
    completion date, payment date, or delivery date.
-   Date range boundaries are inclusive and interpreted in Pakistan
    Standard Time (PKT).
-   Confirmed-order count includes orders confirmed in the selected
    range even if subsequently cancelled.
-   Cancelled-order count includes cancelled orders from that same
    confirmed-order set.
-   Total Approved Price includes only confirmed orders that have not
    been cancelled.
-   Total Approved Price is not payments received.
-   Pending Order Requests are excluded.

### 4.3 Data Access Layer

#### Centralized Repository / Data Access

Responsibilities:

-   Provide Create, Read, Update, and Delete persistence operations to
    the Business Logic Layer.
-   Retrieve and persist records in the centralized relational database.
-   Preserve the data boundaries and relationships required by the
    business components.
-   Apply customer-specific record filtering using the authenticated
    user ID passed through the application.
-   Persist pending Customer registration intents and provide the
    narrowly approved create, activate, resend-lookup, and atomic
    consume/profile operations used by the Auth Profile Provisioning
    Controller. Assign `CUSTOMER` in the Repository and leave any
    existing profile unchanged.

Boundary:

-   Business Logic components access persistence through the Repository.
-   Presentation access is prohibited except for Middleware's User
    account/role lookup and the narrowly scoped Customer registration
    and profile-completion operations approved in ADR-004.
-   The Repository does not become a second, independent
    role-authorization system.

#### Centralized relational database

The database provides persistent storage for the system's business
records. The architecture requires a relational data store and distinct
records/ownership for key concepts such as Products, Inquiries, and
confirmed Orders. The D4 implementation baseline selects Supabase-hosted PostgreSQL, accessed through the centralized Repository using Prisma ORM 7. See ADR-006. This technology choice does not change the centralized relational persistence boundary.

**Related ADR:** [ADR-002 --- Data Persistence and Separation for
Pricing and
Inquiries](./ADR/%23%20ADR-002%20Data%20Persistence%20and%20Separation%20for%20Pricing%20and%20Inquiries.md)
--- **Accepted**.

### 4.4 Component boundary summary

-   Presentation components interact with Business Logic through
    Controllers.
-   Business Logic components own their stated business responsibilities
    and communicate through defined operations.
-   Business Logic components use the centralized Repository for
    persistence.
-   The Repository communicates with the centralized relational
    database.
-   No View or Controller accesses the database directly.
-   The centralized Access Control Middleware is the request-boundary
    authentication and role-based authorization mechanism.
-   The only Controller-to-Repository calls outside Business Logic are
    the approved Customer registration-intent operations; identity
    verification occurs in Middleware and profile creation/intent
    consumption are atomic in the Repository.
-   The Repository persists and retrieves account and role information
    represented by the shared `User` entity. Middleware uses that
    information for authentication and authorization and passes the
    authenticated user ID to relevant Business Logic operations.
-   Relevant Business Logic components enforce customer-specific record
    ownership. No separate User Management Business Logic component is
    introduced.
-   The nine listed business components remain distinct; the
    architecture does not merge Inquiry Management, Customization and
    Quotation Management, and Order Management.
-   Payment and delivery recording are not separate business components;
    they are responsibilities within Status Management.

------------------------------------------------------------------------

## 5. Component Interfaces and Interactions

The following operations describe the logical interfaces required by the
architecture. They are not prescriptions for specific
programming-language method names, API routes, or technology.

### 5.1 Presentation interfaces

| Presentation component | Logical operations / responsibilities |
|---|---|
| Views / User Interface | Display catalogue and product details; submit inquiries and custom-order requests; display permitted customer records; display wishlist and Order information; provide Raazia-facing management and reporting screens. |
| Controllers | Receive and validate requests; invoke the appropriate Business Logic operation; return results for presentation. The Auth Profile Provisioning Controller may call only the approved registration-intent persistence operations for `/api/auth/register`, `/api/auth/registration/activate`, and `/api/auth/profile`. |
| Access Control Middleware | Verify Supabase identity; for protected application operations retrieve persisted account/role through the ADR-004 Repository exception; apply role-based authorization; pass authenticated user ID to Business Logic operations. For registration activation/completion it attaches verified ID, email, and email-confirmation timestamp without querying the Repository. |

### 5.2 Business component interfaces

| Business component | Logical operations |
|---|---|
| Product Management | Retrieve Products; Retrieve Product Details; Update Product Information. |
| Availability Management | Update Raazia Availability; Retrieve Current Raazia Availability for Customer Display. |
| Pricing and Discount Management | Retrieve Standard Catalogue Price; Manage Public Discounts; Calculate Applicable Public Discounted Price. |
| Inquiry Management | Submit Inquiry; Retrieve Inquiry; Update Inquiry Information; Retrieve Inquiry History. |
| Customization and Quotation Management | Record Customization Details; Record Customization Revisions; Prepare Quotation; Retrieve Quotation; Record Negotiated Price; Create Pending Order Request; Retrieve Pending Order Request; Record Request Decision; Provide Accepted Request Details. |
| Order Management | Create Confirmed Order; Retrieve Order; Update Order Information; Preserve Negotiated Price Snapshot; Record Approved Price; Revise Approved Price; Record Estimated Completion Date; Retrieve Order History; Provide Confirmed-Order Information for Sales Summary. |
| Status Management | Initialize Order Status Attributes; Update Manufacturing/Order Status; Update Payment Status; Update Delivery Status; Retrieve Status Information. |
| Wishlist Management | Add Wishlist Item; Remove Wishlist Item; Retrieve Wishlist. |
| Sales Summary | Generate Sales Summary; Retrieve Summary for Date Range. |

**Availability ownership:** Availability Management owns Raazia's
manually maintained availability information and provides the latest
saved information for customer display (FR-04). This is distinct from
product availability; the PRD does not define a separate product-
availability feature or assign it to Product Management, so none is
introduced by this architecture.

### 5.3 Key business interactions

#### 5.3.1 Raazia's availability

1.  Raazia submits an availability update through the Presentation Layer.
2.  The centralized access-control middleware verifies that the request
    is authorized for Raazia.
3.  Availability Management validates and records the manually supplied
    availability information through the Repository.
4.  When customers view availability, the Presentation Layer retrieves
    the latest saved information from Availability Management.
5.  If no update has been saved, the system does not invent a fixed
    schedule or assume Raazia's availability.

#### 5.3.2 Product and pricing

-   Product Management provides product catalogue information to the
    Presentation Layer and relevant business operations.
-   Pricing and Discount Management provides Standard Catalogue Price
    and applicable public-discount calculations.
-   Public discounts do not overwrite Standard Catalogue Price.
-   An order-specific Negotiated Price or Approved Price does not change
    the catalogue price shown to other customers.

#### 5.3.3 Inquiry, customization, quotation, and request review

1.  A customer submits an inquiry through the Presentation Layer.
2.  Inquiry Management stores the inquiry and retains it in Inquiry
    History.
3.  If customization or a quotation is required, the relevant
    information is handled by Customization and Quotation Management.
4.  Customization and Quotation Management maintains customization
    specifications, quotation records, negotiation information, and the
    Pending Order Request.
5.  Raazia reviews the Pending Order Request and records acceptance or
    rejection.
6.  If rejected, the request remains retained and no confirmed Order is
    created.
7.  If accepted, acceptance is the confirmation event. Customization and
    Quotation Management provides the accepted request details to Order
    Management.
8.  Order Management creates a confirmed Incomplete Order and preserves
    the relevant Negotiated Price snapshot where applicable.
9.  The original Inquiry, customization and quotation information, and
    negotiation history remain retained within their respective
    ownership responsibilities; this does not prescribe a separate
    physical `Negotiation` entity.

#### 5.3.4 Pricing ownership and order-level price preservation

The following price concepts must remain distinct:

-   **Standard Catalogue Price:** The normal listed product price.
-   **Public Discount:** A public reduction applied uniformly to
    customers covered by the promotion.
-   **Quotation:** Price presented using the Standard Catalogue Price
    before individual negotiation or an applicable public discount. This
    retains the PRD glossary definition; the architecture does not add a
    new quotation calculation sequence.
-   **Negotiated Price:** A customer-specific proposed price discussed
    with Raazia.
-   **Approved Price:** The final price mutually agreed for a particular
    order, including applicable delivery charges.

Ownership and timing:

-   Pricing and Discount Management owns Standard Catalogue Price and
    public discount rules/calculations.
-   Customization and Quotation Management maintains Negotiated Price
    and the required negotiation history/information while the request
    is pending. The physical representation of that history remains
    open as described in Section 11.1.
-   When Raazia accepts the request, Order Management creates the
    confirmed Order and preserves an order-level snapshot of the
    relevant Negotiated Price, where applicable.
-   Order Management records the Approved Price for the confirmed Order.
-   Negotiated Price and Approved Price remain distinct, even if their
    amounts happen to be equal.
-   Original quotation information and negotiation history remain
    retained within Customization and Quotation Management. This logical
    retention requirement does not prescribe a separate `Negotiation`
    entity.
-   A later change to catalogue pricing or a public discount does not
    automatically recalculate the price of an already confirmed Order.
-   An authorized change to an order's Approved Price is an explicit
    order-level update and must preserve the price-change information
    required by FR-12: original price, revised price, timestamp,
    affected order identifier, and acting user identifier.
-   A revised Approved Price following specification changes is recorded
    only after mutual agreement.
-   No automatic financial-loss calculation or automatic order
    cancellation is introduced.

**Delivery-fee and courier-change handling (PRD FR-15, Business Rules
12–15, Operating Rules 9.4–9.6):**

-   For local/in-city direct handover, no additional delivery fee is
    charged.
-   For courier/service delivery, the applicable delivery fee is
    included in the order total before the Approved Price is finalized.
-   If a pre-dispatch courier-fee increase is below PKR 200, Raazia
    absorbs the increase; it is not added to the customer's Approved
    Price.
-   If a pre-dispatch courier-fee increase is PKR 200 or more, Raazia
    notifies the customer and obtains agreement before revising the
    Approved Price and dispatching.
-   If the customer does not accept a significant increase, the parcel
    is not dispatched using the revised price.
-   Unexpected additional courier charges arising after handover to
    the courier are absorbed by Raazia and are not added to the
    customer's Approved Price.
-   The system supports Raazia's manual recording of delivery method,
    applicable delivery costs, customer agreement, and any resulting
    Approved Price revision. Raazia handles customer communication and
    obtains agreement; the system does not automatically contact
    customers, book couriers, or integrate with courier services.
-   A revised Approved Price is recorded only after the required
    customer agreement. The system records the business decision; it
    does not automate courier booking or dispatch.
-   The implementation stores delivery method, fee and tracking
    information on `Order`, keeps delivery status independent and
    separate, and records significant courier-increase Approved Price
    revisions in `OrderPriceRevision`. The delivery migration and this
    audit are implemented in the working tree; live migration and
    database/E2E acceptance remain unverified until explicitly run.

#### 5.3.5 Order and status management

-   Order Management creates and maintains confirmed Order records.
-   When Order Management creates a confirmed Order, it invokes Status
    Management to initialize the three independent status attributes
    within that Order.
-   Order Management uses Status Management to retrieve or update the
    order's manufacturing/order, payment, and delivery statuses.
-   Status Management updates each status independently and does not
    automatically change either of the other two.
-   Manufacturing status **Completed** does not imply delivery or full
    payment.
-   An order may be placed **On Hold** while a cost-affecting
    specification change is being discussed. The order must not proceed
    under outdated specifications or pricing. This does not automatically
    change payment or delivery status.
-   The revised Approved Price is recorded only after Raazia and the
    customer mutually agree. If no mutually acceptable price can be
    reached and Raazia determines that proceeding would cause financial
    loss, the system allows Raazia to decide and record cancellation;
    cancellation is not automatic and the system does not calculate the
    financial loss.
-   Cancellation and any applicable refund outcome are recorded
    separately. The system does not automatically calculate or execute
    a refund. Payment and delivery information is manually recorded by
    Raazia; no payment processing or courier service integration is
    implied.

#### 5.3.6 Wishlist

-   Wishlist Management retrieves product information from Product
    Management as needed.
-   Wishlist records remain customer-specific and independent of Inquiry
    Management and Order Management.
-   Wishlist operations do not submit inquiries or create order
    requests.

#### 5.3.7 Sales Summary

-   Sales Summary requests the confirmed-order information required for
    reporting from Order Management through its defined Business Logic
    interface. Order Management retains ownership of confirmed Order
    records and obtains any required data through the Repository.
-   Sales Summary derives the report values in accordance with FR-18 and
    returns the generated report; generated report results are not
    permanently stored because the PRD does not require report
    persistence.
-   The report uses confirmation date and the exact inclusion/counting
    rules in FR-18.
-   Pending Order Requests are not included.
-   The report total is Approved Price for confirmed, non-cancelled
    orders; it is not a sum of payment transactions.

### 5.4 Persistence interaction

-   Controller Middleware uses the Repository only to retrieve
    persisted User account and role information for authentication and
    role-based authorization.
-   For the approved Auth Profile Provisioning routes, identity-
    verification Middleware verifies Supabase access tokens and the
    Controller invokes only the corresponding registration-intent
    Repository operations. Profile creation and intent consumption are
    atomic. No View or ordinary Controller accesses the Repository.
-   Business Logic components request persistence operations from the
    centralized Repository for the records they own.
-   The Repository performs the corresponding operations against the
    centralized relational database.
-   Results return from the database through the Repository to the
    requesting Business Logic component.
-   The Business Logic result returns through the Controller to the
    relevant View.
-   No direct Presentation-to-Database path is permitted.

------------------------------------------------------------------------

## 6. Data Architecture and Ownership

### 6.1 Data storage approach

The system uses a centralized relational database accessed through one
centralized Repository / Data Access component.

The relational approach is consistent with the architectural
alternatives and ADR-002, which identify distinct Products, Inquiries,
and Orders records. The architecture does not prescribe a specific
database engine, schema language, hosting provider, or ORM.

### 6.2 Data ownership

| Data category | Business owner | Important responsibility |
|---|---|---|
| User accounts and role information | Repository (persistence); Controller Middleware (authentication/authorization) | Persist and retrieve shared `User` account and role information. Middleware uses this information for authentication and role-based authorization; relevant Business Logic components enforce customer-specific record ownership. No separate Customer and Raazia entity types or User Management Business Logic component are introduced. |
| Product catalogue and product information | Product Management | Product details, descriptions, catalogue presentation information, and product images. |
| Standard Catalogue Price and public discounts | Pricing and Discount Management | Maintain standard price separately from public discount information and calculations. |
| Customer Inquiry and Inquiry History | Inquiry Management | Retain inquiries whether or not they result in a confirmed Order. |
| Customization specifications and revisions | Customization and Quotation Management | Preserve submitted specifications and relevant revisions. |
| Quotation and negotiation information | Customization and Quotation Management | Maintain quotation information, pending Negotiated Price, and append-only NegotiationEntry records linked to Customization as defined in ADR-005. |
| Pending Order Requests | Customization and Quotation Management | Retain requests pending Raazia's decision and record acceptance/rejection. |
| Confirmed Orders and Approved Price | Order Management | Create confirmed Incomplete Orders, preserve applicable price snapshots, and maintain Approved Price. |
| Manufacturing/order, payment, and delivery statuses | Status Management | Maintain three logically independent status values and their updates within the Order entity. |
| Wishlist | Wishlist Management | Maintain customer-specific saved catalogue products across sessions. |
| Sales summary results | Sales Summary | Derive report values from confirmed-Order information supplied by Order Management according to FR-18. Results are returned, not permanently persisted; saved reports are not a PRD requirement. |
| Raazia's availability | Availability Management | Maintain Raazia's manually updated availability information and provide the latest saved information for customer display (FR-04). |

### 6.3 Inquiry, Pending Order Request, and confirmed Order separation

-   Inquiry Management owns Inquiry records and Inquiry History.
-   Customization and Quotation Management owns customization
    information, quotation information, negotiation history/information,
    and Pending Order Request records while the request awaits Raazia's
    decision.
-   Order Management owns confirmed Order records.
-   An inquiry remains retained even when it does not result in a
    Pending Order Request or confirmed Order.
-   A rejected Pending Order Request remains retained and does not
    become a confirmed Order.
-   Acceptance and confirmation are the same event.
-   On acceptance, Order Management creates a confirmed Incomplete
    Order.
-   Pending Order Requests and confirmed Orders must not be represented
    as one indistinguishable lifecycle record.
-   Each `Customization` references its originating `Inquiry`.
-   Each `PendingOrderRequest` references exactly one `Customization`;
    each `Customization` may be associated with zero or one
    `PendingOrderRequest`.
-   Negotiation history is persisted as append-only `NegotiationEntry`
    records linked many-to-one to `Customization`, exactly as resolved by
    ADR-005: one `Customization` has zero or many entries, and each entry
    belongs to exactly one `Customization`. Each entry records proposer,
    proposed whole-PKR price, timestamp, and an optional note. Previous
    entries are not overwritten or deleted as part of negotiation.
-   Only Raazia and the Customer who owns the related `Customization` may
    read or add its negotiation entries. On acceptance, Order Management
    snapshots the agreed Negotiated Price into the confirmed Order; the
    history remains linked to `Customization`.
-   Additional `Customization` records may preserve specification
    revisions without changing the one-to-at-most-one association rule
    between a particular Customization record and a PendingOrderRequest.

**Group-confirmed pending-stage traceability:** The group approved the
persistent relationship chain `Inquiry` → `Customization` →
`PendingOrderRequest`. Each `Customization` references its originating
`Inquiry`; each `PendingOrderRequest` references exactly one
`Customization`; and each `Customization` may be associated with zero
or one `PendingOrderRequest`. No redundant direct `inquiry_id` is added
to `PendingOrderRequest`. A confirmed `Order` separately holds a direct
reference to its original `Inquiry`, as specified by ADR-002. No
additional cardinality rule is imposed on the Inquiry-to-Customization
relationship.

### 6.4 Pricing data responsibilities

The system must preserve separate concepts for Standard Catalogue Price,
Public Discount, Negotiated Price, and Approved Price.

-   Standard Catalogue Price belongs to the product catalogue and must
    not be overwritten by a public discount or order-specific price.
-   Public Discount information is managed separately and applied
    by subtracting the fixed whole-PKR amount defined in PRD Business Rule 2 and ADR-005.
-   Negotiated Price belongs to the pending negotiation managed by
    Customization and Quotation Management.
-   At confirmation, Order Management preserves an order-level snapshot
    of the relevant Negotiated Price where applicable.
-   Approved Price belongs to the confirmed Order and represents the
    final mutually agreed amount, including applicable delivery charges.
-   A Negotiated Price is not automatically an Approved Price.
-   A catalogue price or public discount change does not automatically
    alter a confirmed Order's Approved Price.
-   An authorized order-specific price change preserves the original
    price, revised price, timestamp, affected order identifier, and
    acting user identifier.
-   A fully immutable audit system is not required by the PRD.
-   Public sale discount is one fixed positive whole-rupee PKR amount applied uniformly to every listed Product.
-   The discount must be lower than every listed Product's Standard Catalogue Price; reject the sale configuration if it would produce a zero or negative price.
-   Percentage discounts and stacked public discounts are not supported.
-   Customer-facing price is Standard Catalogue Price minus the fixed discount; no fractional rounding is required.

### 6.5 Order, payment, and delivery status data

The system maintains three logically independent status concerns
associated with an Order:

1.  **Manufacturing/order status:** Incomplete, In Progress, Completed,
    Cancelled, and On Hold where applicable.
2.  **Payment status:** Advance Payment Received, Partial Payment, Full
    Payment, and Refunded.
3.  **Delivery status:** Independently recorded delivery
    progress/information.

The system must not infer that Completed means Delivered or Full
Payment. A change to one status must not automatically change either of
the other two. FR-11 specifies that a newly confirmed Order starts with
manufacturing/order status **Incomplete**. Payment and delivery status attributes are nullable until Raazia records a value. The application displays `Not yet recorded` while either value is NULL. This is an explicit no-value state, not an invented payment or delivery status.

**Selected representation:** The group selected Option A: the `Order`
entity contains three separate attributes for manufacturing/order
status, payment status, and delivery status. Status Management updates
each attribute independently. This preserves the independence required
by FR-14 and NFR-03.

**Interpretation of PRD FR-14:** The PRD requires order,
payment, and delivery statuses to be maintained as separate records and
updated independently. The architecture interprets "separate records"
as three distinct status values/attributes maintained separately within
the `Order` record, rather than as a requirement for three separate
database tables or related entities. This interpretation is consistent
with the independence requirement in FR-14 and NFR-03 and with the
independent-attribute option selected in ADR-003. The PRD does not explicitly prescribe a relational schema or table count.
The group has accepted this interpretation; no change to the PRD is made
by this architecture document.

Payment-state terminology follows the PRD exactly: **Advance Payment
Received, Partial Payment, Full Payment, and Refunded**. No additional delivery-status values are introduced beyond the PRD's stated `Delivered` state. Until delivery is recorded as complete, the status attribute remains NULL and the interface displays `Not yet recorded`. Dispatch/tracking details are stored as delivery information, not as extra status values.

### 6.6 Negotiation history persistence

Negotiation history is stored as append-only `NegotiationEntry` records. Each entry has one required foreign key to `Customization`; one Customization may have zero or many entries. Each entry stores proposer (`Raazia` or the owning Customer), proposed amount in whole PKR rupees, optional note, and timestamp. Entries are ordered by timestamp and are never overwritten when a new offer is made. The `PendingOrderRequest` continues to reference exactly one Customization, and no redundant Inquiry foreign key is added. At Order confirmation, Order Management copies the agreed Negotiated Price snapshot to the Order; pending negotiation entries remain attached to Customization.

### 6.7 Customization revisions and reference images

Custom-order requests may contain product type, reference images, size,
colour, materials, quantity, budget, special instructions, required
completion date, and delivery address, as applicable. Customization and
Quotation Management owns the customization details and relevant
revisions.

The architecture requires submitted reference images and details to
remain accessible to Raazia as part of the request information. It does
not select a file-storage provider or introduce an external image
service.

### 6.8 Wishlist and Estimated Completion Date

-   Wishlist records are customer-specific and remain independent of
    inquiry and order records.
-   Wishlist contents persist across application sessions.
-   Estimated Completion Date is associated with a confirmed Order.
-   Raazia may confirm an Order without entering an estimate.
-   Until an estimate is entered, the customer-facing display states
    **"Not yet provided"**.
-   Raazia may record or update the estimate later.
-   The latest saved estimate is displayed alongside the current
    manufacturing status.
-   An estimate is not a guarantee.

### 6.9 Reporting and data integrity

Sales Summary follows FR-18:

-   The user-selected date range is based on Order confirmation date.
-   Start and end dates are inclusive.
-   Date boundaries use Pakistan Standard Time (PKT).
-   Confirmed-order count includes every Order confirmed within the
    selected range, including those subsequently cancelled.
-   Cancelled-order count includes cancelled Orders from that same set.
-   Total Approved Price includes confirmed Orders in the selected range
    that have not been cancelled.
-   Total Approved Price is not represented as payments received.
-   Pending Order Requests are excluded.

### 6.10 Data access boundaries

-   Controller Middleware uses the Repository interface to retrieve
    persisted User account and role information for authentication and
    role-based authorization.
-   The Auth Profile Provisioning Controller uses only the Repository's
    approved create/activate/resend-lookup/atomic-completion operations
    for the backend-controlled signup and verified profile-completion
    flow.
-   Business Logic components access the persistent records they own
    through the centralized Repository.
-   The authenticated user ID is passed through the application from the
    centralized request boundary.
-   The shared `User` entity represents Customer and Raazia accounts;
    the role information is used by centralized access control to
    determine permitted operations.
-   Relevant Business Logic components use that user ID to enforce
    customer-specific record ownership within their operations; the
    Repository does not independently make authorization decisions.
-   Customers can access only their own permitted inquiries,
    customization details, quotations, wishlists, and order history.
-   Raazia can access the business records and administrative operations
    authorized for her role.
-   The Repository is not a second role-authorization mechanism.

------------------------------------------------------------------------

## 7. External Systems and Services

### 7.1 External integration boundary

The application remains a single layered monolith. ADR-006 selects Supabase as the managed platform for the centralized PostgreSQL database, identity (Supabase Auth), and private custom-reference-image storage (Supabase Storage). The browser uses Express for business data; Supabase is not a replacement for the application backend or Repository. No payment, courier, calendar, or other business-process integrations are introduced.

### 7.2 Explicit exclusions

The architecture does not introduce:

-   An online payment gateway or integrated payment processing.
-   Automatic refund execution.
-   Courier booking or courier-service integration.
-   External calendar synchronization.
-   AI-generated designs or customization recommendations.
-   Comprehensive accounting or tax management.
-   Comprehensive inventory management.
-   Automatic feasibility assessment or automatic order acceptance.

### 7.3 Manual responsibilities

Raazia manually manages availability, material and schedule feasibility,
request acceptance/rejection, price negotiation, Approved Price,
payment-state recording, delivery information, courier-fee decisions,
cancellation, and refund outcomes.

The system records and displays these business decisions. It does not
connect to external services to perform them automatically.

------------------------------------------------------------------------

## 8. Architectural Constraints

1.  **Three-layer separation:** Keep Presentation, Business Logic, and
    Data Access responsibilities separate.
2.  **MVC placement:** Use MVC within the Presentation Layer only. Do
    not move business rules into the presentation-level Model.
3.  **Presentation access boundary:** Views and ordinary Controllers
    must not access the Repository or database. The two approved,
    narrowly scoped exceptions are: (a) centralized Controller
    Middleware retrieving persisted User account and role information
    under ADR-004; and (b) the Auth Profile Provisioning Controller
    invoking only the approved Customer registration-intent operations
    for backend-controlled signup, verified activation, and atomic
    profile completion. No other Presentation component or Repository
    operation may use these exceptions.
4.  **Centralized persistence:** Business components use the centralized
    Repository and relational database.
5.  **Centralized access control:** Use the centralized Controller
    Middleware request boundary described by ADR-004; do not duplicate
    independent role checks across every business component.
6.  **Customer data restriction:** Customer-specific data access must
    use the authenticated user identity passed through the application.
7.  **Inquiry retention:** Inquiry records must remain independently
    retained whether or not a confirmed Order results.
8.  **Request/order distinction:** Pending Order Requests must remain
    distinct from confirmed Orders. Acceptance is the confirmation
    event.
9.  **Pricing separation:** Standard Catalogue Price, Public Discount,
    Negotiated Price, and Approved Price must remain distinct.
    Order-specific price changes must not overwrite catalogue prices.
10. **Price history:** Preserve the price-change information required by
    FR-12; do not claim a fully immutable audit mechanism.
11. **Independent statuses:** Manufacturing/order, payment, and delivery
    statuses must be independently updated. One status change must not
    automatically change another. A confirmed Order starts with
    manufacturing/order status **Incomplete**; the PRD does not prescribe
    initial payment or delivery status values, so none are invented.
12. **Manual operations:** Feasibility, order acceptance, negotiation,
    payment recording, delivery updates, cancellation, and refund
    outcomes remain under Raazia's control.
13. **No excluded integrations:** Do not introduce payment gateways,
    courier integrations, or external calendar services.
14. **No excluded product scope:** Do not introduce comprehensive
    accounting/tax, comprehensive inventory, AI design
    generation/recommendations, or automatic feasibility/order
    acceptance.
15. **Consistent business rules:** Apply the fixed whole-PKR public-sale discount and the payment, delivery, and courier-fee rules defined in PRD v1.4 and ADR-005. Do not add percentage or stacked discounts, invent status values, or create fixed availability schedules.
16. **Courier-fee rules:** Follow the complete delivery-fee and
    courier-change behavior in Section 5.3.4. These business rules are
    manually handled and recorded; no automatic customer contact,
    courier booking, or courier integration is introduced.
17. **Persistence:** Supported wishlist, inquiry, order, price, payment,
    and delivery records must remain available after application
    restart.
18. **Usability:** Core tasks must be completed through the user
    interface without direct database or application-code editing.
19. **Approved D4 technology baseline:** Use the implementation stack
    selected in ADR-006: Node.js 26 LTS; React + Vite + JavaScript/JSX;
    Express 5; Supabase-hosted PostgreSQL, Supabase Auth, and private
    Supabase Storage; Prisma ORM 7 stable with the PostgreSQL driver
    adapter; npm; and Vitest + Supertest. ADR-006 implements the existing
    architecture and does not authorize replacement of the approved
    layers, nine Business Logic components, centralized Repository, or
    relational database boundary. Any major technology/provider change
    requires an approved ADR update.

------------------------------------------------------------------------

## 9. Architecture Diagram

The diagram shows the three layers, presentation-level MVC, the nine
Business Logic components, the centralized Repository/database, the
inquiry-to-request-to-order workflow, the direct Order-to-Inquiry
reference, the accepted pending-stage Inquiry → Customization →
PendingOrderRequest traceability chain, and the three independent
status attributes within Order. Logical record nodes inside the database
cluster describe accepted traceability only; they do not prescribe
additional physical tables beyond the relational model already selected.
The Middleware-to-Repository edge is limited to User account and role
lookup under ADR-004. The Controller-to-Repository edge is limited to
the unanimously approved Customer registration-intent operations for
`POST /api/auth/register`, `/api/auth/registration/activate`, and
`/api/auth/profile`; profile creation and intent consumption are atomic.
Neither is a general Presentation-to-Data Access dependency.

``` mermaid
flowchart TB
    subgraph P["Presentation Layer — MVC is used only here"]
        V["Views / User Interface"]
        C["Controllers / Request Handling"]
        AC["Centralized Access Control Middleware"]
        PM["Presentation Model"]
        V <--> PM
        V --> C
        C <--> AC
    end

    subgraph B["Business Logic Layer"]
        PROD["Product Management"]
        AVAIL["Availability Management"]
        PRICE["Pricing and Discount Management"]
        INQ["Inquiry Management"]
        CQM["Customization and Quotation Management"]
        ORD["Order Management"]
        STATUS["Status Management"]
        WISH["Wishlist Management"]
        SALES["Sales Summary"]
    end

    subgraph D["Data Access Layer"]
        REP["Centralized Repository"]
        subgraph DB["Centralized Relational Database — logical records"]
            INQREC["Inquiry"]
            CUSTREC["Customization"]
            PENDREC["PendingOrderRequest"]
            ORDERREC["Confirmed Order"]
            INQREC -->|"origin reference; no additional cardinality specified"| CUSTREC
            CUSTREC -->|"each request references exactly one Customization; each Customization has 0..1 request"| PENDREC
            ORDERREC -->|"direct reference to original Inquiry"| INQREC
        end
    end

    AC -->|"User account and role lookup"| REP
    C -->|"Customer registration-intent and atomic profile operations"| REP
    AC -->|"Authorized request + authenticated user ID"| PROD
    AC --> AVAIL
    AC --> PRICE
    AC --> INQ
    AC --> CQM
    AC --> ORD
    AC --> STATUS
    AC --> WISH
    AC --> SALES

    PROD <--> PRICE
    INQ -->|"Inquiry details when needed"| CQM
    CQM -->|"Accepted request only — acceptance = confirmation"| ORD
    ORD --> STATUS
    WISH -->|"Catalogue product information"| PROD
    SALES -->|"Confirmed-order information for reporting"| ORD

    PROD <--> REP
    AVAIL <--> REP
    PRICE <--> REP
    INQ <--> REP
    CQM <--> REP
    ORD <--> REP
    STATUS <--> REP
    WISH <--> REP
    REP <--> DB

    C -->|"Business results return through Controller"| V

    NOTE1["Rejected request remains retained in CQM; no confirmed Order is created."]
    NOTE2["Manufacturing/order, payment, and delivery statuses are independent."]
    NOTE3["Availability Management covers Raazia's availability only; no product-availability feature is added."]
    NOTE4["Order stores three independent status attributes: manufacturing/order, payment, and delivery."]
    NOTE5["Pending-stage traceability is Inquiry → Customization → PendingOrderRequest; no direct inquiry_id is stored on PendingOrderRequest."]
    CQM -.-> NOTE1
    STATUS -.-> NOTE2
    AVAIL -.-> NOTE3
    STATUS -.-> NOTE4
    CQM -.-> NOTE5
```

### 9.1 Diagram interpretation

-   The MVC elements are contained within the Presentation Layer. The
    presentation-level Model does not replace Business Logic.
-   Controllers pass authorized requests to Business Logic after the
    centralized access-control boundary.
-   The authenticated user ID is passed to relevant Business Logic
    components, which enforce customer-specific record ownership.
-   Business components that own persistent records use the centralized
    Repository; the Repository interacts with the centralized relational
    database. Sales Summary obtains confirmed-order information through
    Order Management and does not persist generated report results.
-   Inquiry Management and Customization and Quotation Management remain
    separate from Order Management.
-   Only an accepted Pending Order Request is passed to Order Management
    for confirmed Order creation.
-   Rejected requests remain retained in Customization and Quotation
    Management.
-   Order Management uses the unified Status Management component for
    independent manufacturing/order, payment, and delivery status
    updates.
-   Sales Summary obtains confirmed-order information through the Order
    Management business interface. It derives and returns report values
    without permanently persisting generated report results.
-   Availability Management owns Raazia's availability; Product
    Management remains separate.
-   A confirmed Order directly references its original Inquiry. No
    separate `inquiry_id` is added to PendingOrderRequest.
-   The three independent status attributes are stored within Order by
    the group's accepted Option A; this is the architecture's accepted
    interpretation of FR-14's "separate records" requirement.

------------------------------------------------------------------------

## 10. ADR References and Traceability

The following ADR files are included in the project archive. ADR-001
through ADR-004 are the original D3 architecture decisions; ADR-005 records
the resolved implementation gaps; ADR-006 records the D4 implementation
stack selected by the project coordinator. Approval status is stated per
record below. The links preserve the filenames as they appear in the archive.

| ADR | Decision area | Architecture coverage | Current status |
|---|---|---|---|
| [ADR-001 — Overall Architectural Style](./ADR/%23%20ADR-001%20Overall%20Architectural%20Style.md) | Multi-Tier architecture and MVC | Sections 3, 4, 8, and 9; MVC is limited to Presentation. | Accepted |
| [ADR-002 — Data Persistence and Separation for Pricing and Inquiries](./ADR/%23%20ADR-002%20Data%20Persistence%20and%20Separation%20for%20Pricing%20and%20Inquiries.md) | Relational persistence, separate Inquiry/Order data, and pricing | Sections 4, 5, 6, and 8; Negotiated Price snapshot timing and direct Order-to-Inquiry reference are incorporated. | Accepted |
| [ADR-003 — Independent Status Management for Orders](./ADR/%23%20ADR-003%20Independent%20Status%20Management%20for%20Orders.md) | Independent manufacturing/order, payment, and delivery statuses | Sections 4, 5, 6, 8, and 9; Option A is represented as three independent Order attributes. | Accepted |
| [ADR-004 — Centralized Access Control and Authorization Boundary](./ADR/%23%20ADR-004%20Centralized%20Access%20Control%20and%20Authorization%20Boundary.md) | Centralized request-boundary authentication and authorization | Sections 4, 5, 6, 8, and 9; Middleware uses the Repository only for User account/role lookup; the unanimously approved backend-controlled Customer signup intent is verified and consumed atomically with profile creation; Business Logic enforces customer-specific ownership. | Accepted; Customer registration-intent amendment unanimously approved by the four-member team |
| [ADR-005 — Resolution of Implementation Gaps](./ADR/ADR-005%20Resolution%20of%20Implementation%20Gaps.md) | Append-only negotiation history, fixed public-sale discount, and initial payment/delivery status values | Sections 5, 6, and 11; resolves the previously recorded implementation gaps. | Accepted as implementation baseline |
| [ADR-006 — Approved Implementation Technology Stack](./ADR/ADR-006-Approved-Implementation-Technology-Stack.md) | D4 implementation technologies and integration boundaries | Implements, but does not replace, the approved layers, components, Repository and database boundary. | Accepted for D4 implementation |

### 10.1 ADR alignment and approval status

The group reviewed and accepted the D3 architecture baseline and ADR-001
through ADR-004. ADR-005 is the accepted implementation-gap resolution.
ADR-006 is the D4 technology decision selected by the project coordinator;
it is not represented as a TA/faculty or group vote.

-   **ADR-001:** MVC is used within the Presentation Layer only.
    Business Logic and Data Access remain separate layers.
-   **ADR-002:** The direct Order-to-Inquiry reference is adopted. No
    redundant `inquiry_id` is added to PendingOrderRequest.
    Customization and Quotation Management retains pending negotiation
    information while Order Management stores the order-level snapshot
    at confirmation.
-   **ADR-003:** The group's accepted Option A is recorded: three
    independent status attributes within `Order`. Payment terminology is
    aligned with the PRD. The group's accepted interpretation of FR-14
    treats "separate records" as distinct, independently maintained
    status values, not as a mandated table count.
-   **ADR-004:** The centralized Controller Middleware performs
    authentication and role-based authorization. The Repository persists
    User account and role information; the authenticated user ID is
    passed to Business Logic, where customer-specific ownership rules
    are enforced.
-   **ADR-005:** Negotiation exchanges are append-only `NegotiationEntry`
    records under `Customization`; the public sale uses one fixed positive
    whole-PKR discount; new Orders start with manufacturing/order status
    `Incomplete` and nullable payment and delivery status.
-   **ADR-006:** The D4 implementation uses the stack recorded in that ADR.
    This technology decision does not change the logical architecture or
    business requirements.

------------------------------------------------------------------------

## 11. Implementation Decision Register

The following implementation decisions close the previously recorded gaps. They are adopted as the project baseline on 18 November 2026 and recorded in ADR-005.

### 11.1 Negotiation history persistence
Use append-only `NegotiationEntry` child records linked many-to-one to `Customization`: one Customization has zero or many entries; each entry belongs to exactly one Customization. Each entry records proposer, proposed price, optional note, and timestamp. No separate link from `PendingOrderRequest` to Inquiry is added.

### 11.2 Public sale discount
Use one fixed positive whole-PKR discount amount for the public sale, applied to every listed Product. It must be lower than every listed Product's Standard Catalogue Price. Reject invalid configurations. Do not support percentage discounts or discount stacking.

### 11.3 Initial payment and delivery status
Both fields are nullable until manually recorded by Raazia. Display `Not yet recorded` while NULL. The only delivery completion status required is `Delivered`; dispatch and tracking are separate delivery information.

### 11.4 D4 implementation technology stack
The D4 stack is selected in ADR-006: Node.js 26 LTS; React + Vite + JavaScript/JSX; Express 5; Supabase-hosted PostgreSQL; Prisma ORM 7 stable with `@prisma/adapter-pg`; Supabase Auth; private Supabase Storage for custom-order reference images; npm; Vitest + Supertest; and local application execution. This selection implements the existing layers and does not alter the business architecture. See `References/Technology_Stack_References.md` for official documentation.

### 11.5 Review and approval status
ADR-001 through ADR-005 remain the accepted D3 architecture/business-rule baseline; ADR-006 records the D4 implementation technology decision made by the project coordinator. The group-approved architecture baseline is updated to reflect these decisions; this document does not claim TA or faculty approval.

---

## 12. Source Basis and Document Control

### 12.1 Source documents

This validated consolidated architecture is based on:

1.  [**PRD.md**](./PRD.md) --- Product Requirements Document Version
    1.4, updated 18 November 2026.
2.  [**ASRs identification.docx**](./References/ASRs%20identification.docx)
    --- the group's identified architecture-significant requirements
    and concerns.
3.  [**Exploration of Architectural Alternatives,justificationand
    interfaces.docx**](./References/Exploration%20of%20Architectural%20Alternatives%2Cjustificationand%20interfaces.docx)
    --- comparison of Multi-Tier, Microservices, and MVC, plus initial
    layer responsibilities and interfaces.
4.  [**ADR-001 --- Overall Architectural Style**](./ADR/%23%20ADR-001%20Overall%20Architectural%20Style.md)
    --- group status: Accepted.
5.  [**ADR-002 --- Data Persistence and Separation for Pricing and
    Inquiries**](./ADR/%23%20ADR-002%20Data%20Persistence%20and%20Separation%20for%20Pricing%20and%20Inquiries.md)
    --- group status: Accepted.
6.  [**ADR-003 --- Independent Status Management for Orders**](./ADR/%23%20ADR-003%20Independent%20Status%20Management%20for%20Orders.md)
    --- group status: Accepted.
7.  [**ADR-004 --- Centralized Access Control and Authorization
    Boundary**](./ADR/%23%20ADR-004%20Centralized%20Access%20Control%20and%20Authorization%20Boundary.md)
    --- group status: Accepted.
8.  [**ADR-005 --- Resolution of Implementation Gaps**](./ADR/ADR-005%20Resolution%20of%20Implementation%20Gaps.md)
    --- accepted implementation decisions for negotiation history, public sale discounts, and initial statuses.
9.  [**ADR-006 --- Approved Implementation Technology Stack**](./ADR/ADR-006-Approved-Implementation-Technology-Stack.md) --- D4 implementation stack and technology boundaries.
10. **Group decisions recorded during architecture validation
    discussions** --- including separate Inquiry Management,
    Customization and Quotation Management, and Order Management;
    unified Status Management; centralized Repository; centralized
    access control at the Presentation request boundary; separate
    Pending Order Request and confirmed Order; the FR-14 Option A
    interpretation; and the accepted pending-stage traceability chain.
11. [**Deliverable–3.pdf**](./References/Deliverable%E2%80%933.pdf)
    --- used only as documentation and deliverable-structure guidance,
    not as a source of additional product requirements or architectural
    decisions.

The supplied project package did not include separate meeting minutes or a standalone discount specification. The fixed public-sale discount rule, negotiation-history representation, and initial status handling are explicitly adopted in ADR-005 and PRD v1.4. No unresolved business-rule gap remains in these areas.

### 12.2 Status and limitations

-   The group reviewed and accepted the D3 consolidated architecture
    baseline and ADR-001 through ADR-004. ADR-005 records the accepted
    implementation-gap resolutions. ADR-006 records the D4 technology
    stack selected by the project coordinator. No TA or faculty approval
    is claimed.
-   The FR-14 interpretation and the `Inquiry` → `Customization` →
    `PendingOrderRequest` traceability chain are accepted and recorded.
    ADR-005 resolves the public-sale discount, negotiation-history
    persistence, and initial payment/delivery status representation.
-   The implementation technology stack is selected by ADR-006. The physical Prisma schema is to be generated during Bootstrap and slice implementation while preserving the approved logical relationships and status representation.
-   If the PRD, an ADR, and a later formally approved group decision
    conflict, the team must resolve and document the conflict rather
    than silently choosing one source.
-   PRD v1.4 remains the primary source for functional
    requirements, non-functional requirements, business rules,
    terminology, and scope.
