> HISTORICAL SOURCE DRAFT - preserved for traceability only.
> This file contains superseded data contracts and assumptions. Do not use it to guide implementation.
> The reconciled active plan is the root `plan.md`.

# Vertical Slice Implementation Plan (`plan.md`)

This document provides an execution-ready, cycle-by-cycle implementation plan for **Member 1**, **Member 2**, **Member 3**, and **Member 4**. Each vertical slice includes agreed cross-member data contracts, mock/fixture strategies for parallel development, acceptance criteria, and a **copy-pasteable Agent Prompt** that each member can hand directly to their AI coding agent.

---

## 1. Global Rules & Architectural Alignment (For All Members & Agents)

Before executing any slice prompt, instruct your AI coding agent to read the repository's foundational governance and architecture documents:
- **`PRD.md`**: Functional requirements, user flows, reporting rules, and business constraints for Raazia (Admin) and Customers.
- **`architecture.md` & `AGENTS.md`**: Folder structure, tech stack conventions, naming rules, and slice module boundaries.
- **`Guardrails.md`**: Security, input validation, error handling, and coding standards.
- **`ADR-001` (Overall Architectural Style)**: Maintain clean vertical-slice modularity so parallel feature branches integrate without merge conflicts.
- **`ADR-002` (Data Persistence & Separation for Pricing and Inquiries)**: Keep catalogue product pricing and public discounts strictly separated from inquiry and quotation negotiation records so historical quotes never mutate catalogue prices (and vice versa).
- **`ADR-003` (Independent Status Management for Orders)**: Maintain independent, decoupled status lifecycles on orders for `orderStatus`, `manufacturingStatus`, `paymentStatus`, and `deliveryStatus`.
- **`ADR-004` (Centralized Access Control & Authorization Boundary)**: Enforce authentication and role checks (`ADMIN` for Raazia vs. `CUSTOMER`) at the centralized auth middleware/guard boundary rather than scattering ad-hoc role checks.

### Parallel Execution Workflow
1. **Branch Naming**: Each member creates a dedicated branch per cycle: `cycle-<N>/member-<M>-<slice-slug>` (e.g., `cycle-1/member-2-auth-role-access`).
2. **Contract-First Development**: Build against the canonical JSON contracts in Section 2. Where upstream slices are not yet merged, seed mock fixtures matching these exact shapes.
3. **End-of-Cycle Integration**: At the close of each 1-day cycle, merge all 4 member branches into `dev`, swap temporary mock stubs for live services, and verify the cycle integration checklist.

---

## 2. Shared Cross-Member Data Contracts

All agents must adhere to these canonical entity structures so mock fixtures match production persistence models:

```json
// 1. User (Owner: Member 2)
{
  "id": "usr_001",
  "name": "Raazia",
  "email": "raazia@example.com",
  "role": "ADMIN", // "ADMIN" | "CUSTOMER"
  "createdAt": "2026-11-17T10:00:00Z"
}

// 2. Product, Pricing & Availability (Owner: Member 1)
{
  "id": "prd_001",
  "name": "Handcrafted Silk Ensemble",
  "description": "Custom-tailored festive wear",
  "category": "Apparel",
  "images": ["/images/prd_001.jpg"],
  "basePrice": 15000,
  "discount": {
    "type": "PERCENTAGE", // "NONE" | "PERCENTAGE" | "FIXED"
    "value": 10,
    "isActive": true
  },
  "effectivePrice": 13500,
  "availabilityStatus": "IN_STOCK", // "IN_STOCK" | "MADE_TO_ORDER" | "OUT_OF_STOCK"
  "isArchived": false,
  "createdAt": "2026-11-17T10:00:00Z",
  "updatedAt": "2026-11-17T10:00:00Z"
}

// 3. Inquiry (Owner: Member 2 & Member 3)
{
  "id": "inq_001",
  "customerId": "usr_002",
  "productId": "prd_001",
  "subject": "Size and fabric inquiry",
  "message": "Can this be made in emerald green?",
  "quantity": 1,
  "status": "OPEN", // "OPEN" | "IN_REVIEW" | "QUOTED" | "CLOSED"
  "adminNotes": "",
  "createdAt": "2026-11-17T11:00:00Z",
  "updatedAt": "2026-11-17T11:00:00Z"
}

// 4. Customization Request & Quotation (Owner: Member 3)
{
  "id": "cst_001",
  "inquiryId": "inq_001",
  "customerId": "usr_002",
  "productId": "prd_001",
  "specifications": "Emerald green raw silk, custom sleeve length 22in",
  "feasibilityStatus": "FEASIBLE", // "PENDING" | "FEASIBLE" | "NOT_FEASIBLE"
  "feasibilityNotes": "Fabric available in workshop",
  "requestOutcome": "PENDING", // "PENDING" | "ACCEPTED" | "REJECTED"
  "quotation": {
    "currentOfferedPrice": 16500,
    "status": "NEGOTIATING", // "DRAFT" | "NEGOTIATING" | "AGREED" | "REJECTED"
    "history": [
      {
        "round": 1,
        "proposedBy": "ADMIN",
        "price": 17000,
        "note": "Includes custom dyeing",
        "timestamp": "2026-11-17T12:00:00Z"
      },
      {
        "round": 2,
        "proposedBy": "CUSTOMER",
        "price": 16500,
        "note": "Counter-offer",
        "timestamp": "2026-11-17T12:30:00Z"
      }
    ]
  },
  "createdAt": "2026-11-17T11:30:00Z"
}

// 5. Confirmed Order, Manufacturing, Payment & Delivery (Owner: Member 4)
{
  "id": "ord_001",
  "sourceRequestId": "cst_001",
  "customerId": "usr_002",
  "items": [
    {
      "productId": "prd_001",
      "title": "Handcrafted Silk Ensemble (Custom)",
      "quantity": 1,
      "unitPrice": 16500
    }
  ],
  "subtotal": 16500,
  "deliveryCharge": 500,
  "totalAmount": 17000,
  "orderStatus": "CONFIRMED", // "CONFIRMED" | "MODIFIED" | "CANCELLED" | "COMPLETED"
  "manufacturingStatus": "NOT_STARTED", // "NOT_STARTED" | "IN_PROGRESS" | "QUALITY_CHECK" | "READY"
  "paymentStatus": "UNPAID", // "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED"
  "deliveryStatus": "PENDING", // "PENDING" | "DISPATCHED" | "IN_TRANSIT" | "DELIVERED"
  "deliveryMethod": "COURIER",
  "createdAt": "2026-11-17T14:00:00Z",
  "updatedAt": "2026-11-17T14:00:00Z"
}

// 6. Wishlist Item (Owner: Member 2)
{
  "id": "wsh_001",
  "customerId": "usr_002",
  "productId": "prd_001",
  "createdAt": "2026-11-17T15:00:00Z"
}
```

---

## 3. Team Member Slice Matrix

| Member | Cycle 1 | Cycle 2 | Cycle 3 | Cycle 4 | Cycle 5 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Member 1** | Product Catalogue Administration | Product Availability Management | Pricing & Public Discount Management | Product Details | Sales Summary |
| **Member 2** | Authentication & Role Access | Customer Inquiry Submission | Product Catalogue Browsing | Wishlist Management | Customer Inquiry History |
| **Member 3** | Inquiry Review & Management | Customization Request Submission | Customization Request Review | Quotation & Price Negotiation | Request Acceptance & Rejection |
| **Member 4** | Confirmed Order Management | Manufacturing Status Management | Payment Management | Delivery Management | Order Changes & Cancellation |

---

# Cycle 1 — Core Foundations
**Suggested Duration:** 1 Day  
**Why These Run in Parallel:** Each member agrees to the shared data contracts in Section 2 and uses mock records or session stubs where upstream functionality is not yet available. Nobody needs another member's implementation to begin.

---

### Cycle 1 — Member 1: Product Catalogue Administration
- **Function:** Raazia can add, edit, view, and remove products.
- **Mocks / Stubs:** Temporary `ADMIN` session stub until Member 2's centralized auth middleware is merged.

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, ADR-002, and ADR-004.
Implement Cycle 1 — Member 1 Slice: "Product Catalogue Administration".

Goal:
Enable Raazia (ADMIN role) to add, edit, view, and remove products in the catalogue.

Requirements:
1. Data & Persistence: Implement the Product schema/model (id, name, description, category, images, basePrice, availabilityStatus, isArchived, timestamps) following ADR-002. Include realistic seed/fixture products matching the shared Product contract.
2. Backend / API Layer: Build endpoints/controllers for Create Product, List All Products (Admin view), Get Product by ID, Update Product, and Remove/Archive Product. Validate all inputs (non-empty name, positive numeric basePrice, valid category).
3. Access Control: Protect all mutation routes behind the centralized admin authorization boundary (ADR-004), using a mock ADMIN session stub if auth middleware is not yet merged.
4. Frontend UI: Create an Admin Product Catalogue Management interface allowing Raazia to view all products, open an Add/Edit Product form, and remove/archive a product with confirmation feedback.
5. Testing: Write unit and integration tests covering add, edit, view, remove, and invalid input validation.
```

#### Acceptance Criteria
- [ ] Raazia can create a new product with valid fields and persist it.
- [ ] Raazia can view the full admin product list and edit existing product details.
- [ ] Raazia can remove/archive a product with confirmation.
- [ ] Seeded products conform to Section 2 so Member 2 and Member 3 can reuse them.

---

### Cycle 1 — Member 2: Authentication & Role Access
- **Function:** Customers and Raazia can register, log in, log out, and access permitted areas.
- **Mocks / Stubs:** Placeholder landing views for Admin and Customer dashboards.

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, and ADR-004.
Implement Cycle 1 — Member 2 Slice: "Authentication & Role Access".

Goal:
Enable Customers and Raazia (ADMIN) to register, log in, log out, and access only their role-permitted areas via a centralized authorization boundary.

Requirements:
1. Data & Persistence: Implement the User model (id, name, email, passwordHash, role: "ADMIN" | "CUSTOMER", createdAt). Seed one default Admin account for Raazia and at least one test Customer account.
2. Centralized Auth Boundary (ADR-004): Implement secure password hashing, session/token handling, and reusable middleware/guards (`requireAuth`, `requireRole("ADMIN")`, `requireRole("CUSTOMER")`) that all other slices can import directly.
3. Backend / API Layer: Build endpoints for Customer Registration (strictly assigning CUSTOMER role), Login, Logout, and Current User (`/me`).
4. Frontend UI: Create Register, Login, and Logout UI flows along with role-aware navigation and route guards that redirect unauthorized users to Login or an Access Denied view.
5. Testing: Write tests verifying registration, login, logout, password hashing, and 401/403 enforcement across protected admin and customer routes.
```

#### Acceptance Criteria
- [ ] Customers can register and log in; Raazia can log in with the `ADMIN` role.
- [ ] Logging out clears session/token state and revokes access to protected routes.
- [ ] Customers attempting to access Admin areas are blocked (`403` / redirected).
- [ ] Reusable `requireAuth` and `requireRole` guards are exported for all teammates.

---

### Cycle 1 — Member 3: Inquiry Review & Management
- **Function:** Raazia can view and manage inquiry records using agreed test data.
- **Mocks / Stubs:** Agreed `Inquiry` JSON test fixtures linked to mock `customerId` and `productId` values.

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, ADR-002, and ADR-004.
Implement Cycle 1 — Member 3 Slice: "Inquiry Review & Management".

Goal:
Enable Raazia (ADMIN) to view, filter, and manage customer inquiry records using agreed test data fixtures.

Requirements:
1. Data & Persistence: Implement the Inquiry model (id, customerId, productId, subject, message, quantity, status: "OPEN" | "IN_REVIEW" | "QUOTED" | "CLOSED", adminNotes, timestamps) separated from pricing tables per ADR-002. Populate a seed/fixture file with realistic test inquiries.
2. Backend / API Layer: Build Admin endpoints to list all inquiries (with status filtering), retrieve single inquiry details, and update inquiry status and internal admin notes.
3. Access Control: Restrict all inquiry management routes to ADMIN via the centralized auth boundary (ADR-004).
4. Frontend UI: Build an Admin Inquiry Management dashboard displaying all inquiries, status badges, a detail drawer/page, and controls for Raazia to update inquiry status and save review notes.
5. Testing: Write tests covering listing, status transitions, note updates, and unauthorized access rejection.
```

#### Acceptance Criteria
- [ ] Admin inquiry dashboard loads agreed test inquiry records cleanly.
- [ ] Raazia can inspect full details of an inquiry, update its status, and persist internal notes.
- [ ] Non-admin users are prevented from accessing inquiry management endpoints or UI.

---

### Cycle 1 — Member 4: Confirmed Order Management
- **Function:** Create and manage confirmed orders using mock accepted requests.
- **Mocks / Stubs:** Mock accepted customization/quotation request fixtures (`sourceRequestId`).

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, ADR-003, and ADR-004.
Implement Cycle 1 — Member 4 Slice: "Confirmed Order Management".

Goal:
Enable Raazia (ADMIN) to create and manage confirmed orders using mock accepted request records.

Requirements:
1. Data & Persistence: Implement the ConfirmedOrder model with independent status columns per ADR-003 (`orderStatus`, `manufacturingStatus`, `paymentStatus`, `deliveryStatus`), line items, agreed pricing, customerId, and sourceRequestId. Seed mock accepted request fixtures for testing.
2. Backend / API Layer: Create endpoints and a reusable internal service function (`createConfirmedOrderFromRequest(acceptedRequest)`) so Member 3 can call it in Cycle 5, plus endpoints to list, view, and update confirmed orders.
3. Access Control: Guard all order management routes behind ADMIN role checks (ADR-004).
4. Frontend UI: Build an Admin Confirmed Orders view with a "Create Order from Accepted Request" workflow (using mock accepted requests) and an order management list/detail view.
5. Testing: Write tests validating order creation from mock accepted requests, duplicate-order prevention per request, and retrieval.
```

#### Acceptance Criteria
- [ ] Raazia can create a confirmed order from a mock accepted request fixture.
- [ ] Confirmed orders initialize with independent `orderStatus`, `manufacturingStatus`, `paymentStatus`, and `deliveryStatus` fields (ADR-003).
- [ ] Reusable `createConfirmedOrderFromRequest` service function is exported for Cycle 5 handoff.

---

### Cycle 1 Integration Checklist
- [ ] Merge Member 2's centralized auth middleware (`ADR-004`) first and attach it to Member 1, 3, and 4 admin routes.
- [ ] Verify shared `Product`, `Inquiry`, and `ConfirmedOrder` schemas match Section 2.

---

# Cycle 2 — Availability and Inquiry Workflows
**Suggested Duration:** 1 Day  
**Why These Run in Parallel:** Member 2 and Member 3 build against agreed inquiry structures and mock inquiry records. Member 4 builds against mock confirmed orders.

---

### Cycle 2 — Member 1: Product Availability Management
- **Function:** Raazia can manually update and view product availability.
- **Mocks / Stubs:** Product records established in Cycle 1.

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, and ADR-004.
Implement Cycle 2 — Member 1 Slice: "Product Availability Management".

Goal:
Enable Raazia (ADMIN) to manually update and view product availability statuses across the catalogue.

Requirements:
1. Data & Persistence: Utilize/extend the Product availability fields (`availabilityStatus`: "IN_STOCK" | "MADE_TO_ORDER" | "OUT_OF_STOCK", optional availabilityNote, updatedAt).
2. Backend / API Layer: Add a dedicated endpoint (`PATCH /products/:id/availability`) to update product availability status and support filtering by availability in product list queries. Validate allowed enum values.
3. Access Control: Ensure only ADMIN (Raazia) can modify product availability (ADR-004).
4. Frontend UI: Enhance the Admin Product Catalogue UI with clear availability status badges, quick inline/modal availability toggles, and an availability filter.
5. Testing: Write tests verifying valid availability transitions, invalid status rejection, and role protection.
```

#### Acceptance Criteria
- [ ] Raazia can view availability status for every product and switch between `IN_STOCK`, `MADE_TO_ORDER`, and `OUT_OF_STOCK`.
- [ ] Availability updates persist immediately and reflect in product API responses.

---

### Cycle 2 — Member 2: Customer Inquiry Submission
- **Function:** Customers can submit inquiries about catalogue products.
- **Mocks / Stubs:** Agreed `Product` fixtures (or Cycle 1 products) and authenticated `CUSTOMER` session.

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, ADR-002, and ADR-004.
Implement Cycle 2 — Member 2 Slice: "Customer Inquiry Submission".

Goal:
Allow authenticated Customers to submit inquiries about specific catalogue products.

Requirements:
1. Data & Persistence: Connect to the agreed Inquiry model (ADR-002), ensuring new inquiries default to status "OPEN" and link `customerId` (derived from the authenticated session) and `productId`.
2. Backend / API Layer: Implement `POST /inquiries` for authenticated CUSTOMER users. Validate that `productId` exists, `message` is non-empty, and `quantity` is a positive integer.
3. Access Control: Enforce authenticated CUSTOMER access via the centralized auth boundary (ADR-004); prevent spoofing `customerId` in request bodies.
4. Frontend UI: Build a Customer Inquiry Submission form (accessible from product context or inquiry page) with product selection, quantity, message input, validation messages, and submission confirmation.
5. Testing: Write tests covering valid submission, missing/invalid product ID, unauthenticated rejection, and persistence matching Member 3's inquiry schema.
```

#### Acceptance Criteria
- [ ] Logged-in customers can submit an inquiry referencing a catalogue product.
- [ ] Submitted inquiries appear in the shared `Inquiry` store with `status: "OPEN"` and display in Member 3's Admin Inquiry Management view.

---

### Cycle 2 — Member 3: Customization Request Submission
- **Function:** Customers can submit customization requests linked to an originating inquiry.
- **Mocks / Stubs:** Mock `Inquiry` records owned by the logged-in test customer.

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, ADR-002, and ADR-004.
Implement Cycle 2 — Member 3 Slice: "Customization Request Submission".

Goal:
Enable authenticated Customers to submit customization requests linked to an originating inquiry.

Requirements:
1. Data & Persistence: Implement the CustomizationRequest model (id, inquiryId, customerId, productId, specifications, feasibilityStatus: "PENDING", requestOutcome: "PENDING", createdAt) per ADR-002. Seed mock originating inquiries if Member 2's submission is not yet merged.
2. Backend / API Layer: Implement `POST /customization-requests` and `GET /customization-requests/mine`. Validate that `inquiryId` exists, belongs to the authenticated customer, and contains non-empty customization specifications.
3. Access Control: Enforce CUSTOMER authentication and ownership checks at the centralized boundary (ADR-004) so a customer cannot link a customization request to another customer's inquiry.
4. Frontend UI: Build a Customization Request form allowing a customer to select one of their originating inquiries, enter detailed customization specifications, and submit with confirmation state.
5. Testing: Write tests for valid linked submission, ownership violation (`403`), non-existent `inquiryId` (`404`), and empty specification validation.
```

#### Acceptance Criteria
- [ ] Customers can submit a customization request linked to one of their own inquiries.
- [ ] Requests linked to another user's inquiry or an invalid inquiry ID are rejected.
- [ ] Newly created customization requests default to `feasibilityStatus: "PENDING"`.

---

### Cycle 2 — Member 4: Manufacturing Status Management
- **Function:** Raazia can update manufacturing/order status independently.
- **Mocks / Stubs:** Mock `ConfirmedOrder` records from Cycle 1.

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, ADR-003, and ADR-004.
Implement Cycle 2 — Member 4 Slice: "Manufacturing Status Management".

Goal:
Enable Raazia (ADMIN) to update manufacturing status independently of payment, delivery, and general order status.

Requirements:
1. Data & Persistence: Use the independent `manufacturingStatus` field ("NOT_STARTED" | "IN_PROGRESS" | "QUALITY_CHECK" | "READY") on ConfirmedOrder per ADR-003, plus optional manufacturing notes/timestamps.
2. Backend / API Layer: Create `PATCH /orders/:id/manufacturing-status` for ADMIN users. Ensure updating `manufacturingStatus` does NOT overwrite or require changes to `paymentStatus` or `deliveryStatus` (ADR-003).
3. Access Control: Restrict endpoint and UI controls to ADMIN via ADR-004.
4. Frontend UI: Add a Manufacturing Status selector/timeline control inside the Admin Order Management view so Raazia can view and update production stages independently.
5. Testing: Write tests confirming independent updates to `manufacturingStatus`, enum validation, and preservation of unrelated order statuses.
```

#### Acceptance Criteria
- [ ] Raazia can update `manufacturingStatus` across all defined stages (`NOT_STARTED`, `IN_PROGRESS`, `QUALITY_CHECK`, `READY`).
- [ ] Updating `manufacturingStatus` leaves `paymentStatus` and `deliveryStatus` completely unchanged (ADR-003).

---

### Cycle 2 Integration Checklist
- [ ] Wire Member 2's Customer Inquiry Submission into Member 3's Inquiry Review & Customization Request Submission.
- [ ] Verify product availability updates (Member 1) persist on the shared `Product` table.

---

# Cycle 3 — Customer Interaction and Business Rules
**Suggested Duration:** 1 Day  
**Why These Run in Parallel:** Each member works against agreed interfaces and test fixtures. Product Catalogue Browsing uses the product records established in Cycle 1.

---

### Cycle 3 — Member 1: Pricing & Public Discount Management
- **Function:** Raazia can manage standard prices and public discounts.
- **Mocks / Stubs:** Existing `Product` records from Cycles 1–2.

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, ADR-002, and ADR-004.
Implement Cycle 3 — Member 1 Slice: "Pricing & Public Discount Management".

Goal:
Enable Raazia (ADMIN) to manage standard product prices and public discounts with accurate effective price calculation.

Requirements:
1. Data & Persistence: Implement pricing and public discount management on Product (`basePrice`, `discount.type`: "NONE" | "PERCENTAGE" | "FIXED", `discount.value`, `discount.isActive`, computed `effectivePrice`) keeping catalogue pricing cleanly separated from negotiated inquiry quotations per ADR-002.
2. Business Rules & Validation: Enforce non-negative prices, percentage discounts bounded between 0 and 100, fixed discounts not exceeding `basePrice`, and deterministic `effectivePrice` calculation (never negative).
3. Backend / API Layer: Create `PATCH /products/:id/pricing` for ADMIN users and ensure all product read endpoints return `basePrice`, active discount metadata, and `effectivePrice`.
4. Frontend UI: Build an Admin Pricing & Discount panel/modal where Raazia can update standard base price, configure or toggle public discounts, and preview the final customer-facing price.
5. Testing: Write unit and API tests covering percentage discount, fixed discount, inactive discount, boundary validation (e.g., >100% or discount > basePrice), and role protection.
```

#### Acceptance Criteria
- [ ] Raazia can update a product's standard price and apply/remove public percentage or fixed discounts.
- [ ] Invalid discounts (negative values, >100%, or resulting in negative price) are blocked with clear validation feedback.
- [ ] Catalogue pricing updates do not alter existing negotiated inquiry quotations (ADR-002).

---

### Cycle 3 — Member 2: Product Catalogue Browsing
- **Function:** Customers can browse and view catalogue products.
- **Mocks / Stubs:** Product records established in Cycle 1 (with availability & pricing fields).

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, and ADR-004.
Implement Cycle 3 — Member 2 Slice: "Product Catalogue Browsing".

Goal:
Enable Customers (and public visitors if permitted by PRD.md) to browse, search, and filter catalogue products.

Requirements:
1. Backend / API Layer: Create public/customer `GET /products` endpoint returning non-archived products with name, thumbnail image, category, `basePrice`, active public discount, `effectivePrice`, and `availabilityStatus`. Support search by keyword and filtering by category and availability.
2. Access Control: Ensure archived/removed admin products are excluded from customer catalogue responses (ADR-004).
3. Frontend UI: Build a responsive Customer Product Catalogue grid showing product cards with image, title, category, availability badge, original vs. discounted price, search bar, and category/availability filters. Include navigation hooks to Product Details (`/products/:id`) and Inquiry/Wishlist actions.
4. Testing: Write tests verifying archived products are hidden, search/filter queries work, and discounted pricing displays accurately.
```

#### Acceptance Criteria
- [ ] Customers can browse active catalogue products, search by keyword, and filter by category or availability.
- [ ] Archived/removed products never appear in the customer catalogue.
- [ ] Active public discounts and availability badges render clearly on each product card.

---

### Cycle 3 — Member 3: Customization Request Review
- **Function:** Raazia can review customization requests and manually record feasibility decisions.
- **Mocks / Stubs:** Mock `CustomizationRequest` records from Cycle 2.

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, ADR-002, and ADR-004.
Implement Cycle 3 — Member 3 Slice: "Customization Request Review".

Goal:
Enable Raazia (ADMIN) to review submitted customization requests and manually record feasibility decisions.

Requirements:
1. Data & Persistence: Update `CustomizationRequest` with `feasibilityStatus` ("PENDING" | "FEASIBLE" | "NOT_FEASIBLE"), `feasibilityNotes`, and review timestamp.
2. Backend / API Layer: Create `GET /admin/customization-requests` (filterable by feasibility status) and `PATCH /admin/customization-requests/:id/feasibility` for ADMIN users. Require `feasibilityNotes` when marking a request as `NOT_FEASIBLE`.
3. Access Control: Restrict review endpoints and UI strictly to ADMIN via ADR-004.
4. Frontend UI: Build an Admin Customization Review queue and detail panel displaying the linked inquiry, product info, customer specifications, and a Feasibility Decision form (`Feasible` / `Not Feasible` + notes).
5. Testing: Write tests covering feasibility decision recording, mandatory notes on `NOT_FEASIBLE`, filtering, and non-admin access rejection.
```

#### Acceptance Criteria
- [ ] Raazia can view all customer customization requests alongside their originating inquiry details.
- [ ] Raazia can record a `FEASIBLE` or `NOT_FEASIBLE` decision with notes.
- [ ] Marking a request `NOT_FEASIBLE` enforces providing a reason/note.

---

### Cycle 3 — Member 4: Payment Management
- **Function:** Raazia can manually record payments and update payment status.
- **Mocks / Stubs:** Mock `ConfirmedOrder` records.

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, ADR-003, and ADR-004.
Implement Cycle 3 — Member 4 Slice: "Payment Management".

Goal:
Enable Raazia (ADMIN) to manually record customer payments and update order payment status independently.

Requirements:
1. Data & Persistence: Implement `PaymentRecord` (id, orderId, amount, method, referenceNote, recordedAt) linked to `ConfirmedOrder`, and manage the independent `paymentStatus` ("UNPAID" | "PARTIAL" | "PAID" | "REFUNDED") per ADR-003.
2. Backend / API Layer: Create `POST /orders/:id/payments` (to log a payment entry and recalculate/update `paymentStatus`) and `PATCH /orders/:id/payment-status` for ADMIN users. Validate positive payment amounts and ensure `manufacturingStatus` and `deliveryStatus` remain independent (ADR-003).
3. Access Control: Enforce ADMIN authorization via ADR-004.
4. Frontend UI: Build a Payment Management section within the Admin Order Detail view showing total order amount, amount paid, balance due, payment history log, and a "Record Payment / Update Payment Status" form.
5. Testing: Write tests verifying partial vs. full payment calculation, manual payment status updates, invalid negative amounts, and status independence (ADR-003).
```

#### Acceptance Criteria
- [ ] Raazia can record manual payments (with amount, method, and reference) against a confirmed order.
- [ ] Order `paymentStatus` (`UNPAID`, `PARTIAL`, `PAID`, `REFUNDED`) updates accurately without affecting manufacturing or delivery statuses.

---

### Cycle 3 Integration Checklist
- [ ] Verify Member 2's Catalogue Browsing displays live prices and discounts from Member 1's Pricing Management.
- [ ] Verify Member 3's Customization Review reads requests created by Cycle 2's Customization Submission.

---

# Cycle 4 — Extended Customer and Quotation Functionality
**Suggested Duration:** 1 Day  
**Why These Run in Parallel:** Product Details and Wishlist use the agreed `Product` contract. Quotation uses reviewed customization records. Delivery uses the confirmed-order structure.

---

### Cycle 4 — Member 1: Product Details
- **Function:** Customers can view detailed information about an individual product.
- **Mocks / Stubs:** Agreed `Product` records (with pricing, discounts, and availability).

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, and ADR-004.
Implement Cycle 4 — Member 1 Slice: "Product Details".

Goal:
Enable Customers to view full detailed information about an individual product.

Requirements:
1. Backend / API Layer: Ensure `GET /products/:id` returns complete product details (id, name, description, category, gallery images, basePrice, public discount info, effectivePrice, availabilityStatus) for non-archived products, returning `404` if not found or archived.
2. Frontend UI: Build a dedicated Customer Product Details page (`/products/:id`) displaying high-detail product imagery, full description, category, availability status indicator, base vs. discounted price breakdown, and action buttons for "Submit Inquiry" (linking to Member 2's inquiry flow) and "Save to Wishlist" (linking to Member 2's wishlist action).
3. Testing: Write tests verifying valid product detail retrieval, 404 handling for archived/non-existent IDs, and UI rendering of pricing/availability states.
```

#### Acceptance Criteria
- [ ] Clicking a product in the catalogue opens `/products/:id` with full description, images, pricing, discount breakdown, and availability status.
- [ ] Archived or invalid product IDs display a clean "Product Not Found" state.

---

### Cycle 4 — Member 2: Wishlist Management
- **Function:** Customers can add, view, and remove saved products, with duplicate prevention.
- **Mocks / Stubs:** `CUSTOMER` auth session and agreed `Product` fixtures.

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, and ADR-004.
Implement Cycle 4 — Member 2 Slice: "Wishlist Management".

Goal:
Enable authenticated Customers to add, view, and remove saved products in a personal wishlist with strict duplicate prevention.

Requirements:
1. Data & Persistence: Implement the `WishlistItem` model (id, customerId, productId, createdAt) with a unique composite constraint/index on `(customerId, productId)`.
2. Backend / API Layer: Implement `GET /wishlist` (returning hydrated product summaries for the logged-in customer), `POST /wishlist` (with duplicate prevention — either returning `409 Conflict` or idempotently preventing duplicate rows), and `DELETE /wishlist/:productId`.
3. Access Control: Restrict all wishlist routes to authenticated CUSTOMER users via ADR-004, scoping queries strictly to `req.user.id`.
4. Frontend UI: Build a Customer Wishlist page (`/wishlist`) displaying saved products with availability/price and a "Remove" button, plus a reusable "Add to Wishlist / Saved" toggle button for Catalogue and Product Detail views.
5. Testing: Write tests specifically verifying duplicate prevention when adding the same product twice, removal, cross-customer isolation, and unauthenticated rejection.
```

#### Acceptance Criteria
- [ ] Logged-in customers can add products to their wishlist, view their saved list, and remove items.
- [ ] Adding the same product twice never creates duplicate wishlist entries.
- [ ] Customers can only view and modify their own wishlist.

---

### Cycle 4 — Member 3: Quotation & Price Negotiation
- **Function:** Raazia and customers can negotiate prices and maintain negotiation history.
- **Mocks / Stubs:** Reviewed `CustomizationRequest` fixtures (marked `FEASIBLE`).

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, ADR-002, and ADR-004.
Implement Cycle 4 — Member 3 Slice: "Quotation & Price Negotiation".

Goal:
Enable Raazia (ADMIN) and the originating Customer to propose/counter-propose prices on customization requests while maintaining an immutable negotiation history.

Requirements:
1. Data & Persistence: Implement Quotation & Negotiation History persistence linked to `CustomizationRequest` (currentOfferedPrice, status: "DRAFT" | "NEGOTIATING" | "AGREED" | "REJECTED", and append-only `history` entries recording round, proposedBy: "ADMIN" | "CUSTOMER", price, note, timestamp) separated from catalogue product pricing per ADR-002.
2. Business Rules: Only allow quotations on `FEASIBLE` customization requests. Validate positive offered prices. Preserve every offer/counter-offer in chronological order without overwriting prior history entries.
3. Backend / API Layer: Create endpoints for Raazia to send an initial/counter quote (`POST /admin/customization-requests/:id/quotes`), for the owning Customer to submit a counter-offer or accept a quote (`POST /customization-requests/:id/counter-offer`), and for both parties to view the full negotiation thread.
4. Access Control: Enforce centralized auth (ADR-004) so only ADMIN and the specific owning CUSTOMER can access or post to a quotation thread.
5. Frontend UI: Build a Quotation Negotiation timeline/thread component usable in both Admin and Customer views showing every historical offer, notes, timestamps, and a counter-offer input form.
6. Testing: Write tests verifying multi-round negotiation history preservation, rejection of quotes on `NOT_FEASIBLE` requests, and authorization boundaries.
```

#### Acceptance Criteria
- [ ] Raazia can send a price quotation on a feasible customization request, and the customer can submit counter-offers.
- [ ] Every offer and counter-offer is preserved in chronological negotiation history.
- [ ] Only Raazia and the specific customer who owns the request can view or negotiate on that quotation.

---

### Cycle 4 — Member 4: Delivery Management
- **Function:** Raazia can manage delivery methods, charges, and delivery status.
- **Mocks / Stubs:** Mock `ConfirmedOrder` records.

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, ADR-003, and ADR-004.
Implement Cycle 4 — Member 4 Slice: "Delivery Management".

Goal:
Enable Raazia (ADMIN) to manage delivery methods, delivery charges, and delivery status independently for confirmed orders.

Requirements:
1. Data & Persistence: Manage delivery fields on `ConfirmedOrder` (`deliveryMethod`: e.g. "PICKUP" | "COURIER" | "EXPRESS", `deliveryCharge`, `deliveryAddress`, `trackingReference`, and independent `deliveryStatus`: "PENDING" | "DISPATCHED" | "IN_TRANSIT" | "DELIVERED") per ADR-003. Ensure `totalAmount` reflects `subtotal + deliveryCharge`.
2. Backend / API Layer: Create `PATCH /orders/:id/delivery` for ADMIN users to update delivery method, charge, tracking info, and delivery status without mutating `manufacturingStatus` or `paymentStatus` (ADR-003). Validate non-negative delivery charges.
3. Access Control: Restrict delivery management routes to ADMIN via ADR-004.
4. Frontend UI: Add a Delivery Management panel inside the Admin Order Detail view allowing Raazia to configure delivery method, edit delivery charge (showing recalculated order total), enter tracking info, and update delivery status.
5. Testing: Write tests verifying delivery charge total recalculation, independent `deliveryStatus` transitions, negative charge rejection, and role protection.
```

#### Acceptance Criteria
- [ ] Raazia can set/edit delivery method, delivery charge, and tracking details on confirmed orders.
- [ ] Order `totalAmount` updates accurately when `deliveryCharge` changes.
- [ ] `deliveryStatus` updates independently of manufacturing and payment statuses (ADR-003).

---

### Cycle 4 Integration Checklist
- [ ] Connect "Save to Wishlist" and "Submit Inquiry" buttons on Member 1's Product Details page to Member 2's Wishlist and Inquiry endpoints.
- [ ] Verify Member 3's Quotation Negotiation attaches cleanly to Member 3's Cycle 3 reviewed customization requests.

---

# Cycle 5 — Completion and Advanced Functionality
**Suggested Duration:** 1 Day  
**Why These Run in Parallel:** Each member uses test records representing the necessary completed workflows. The actual handoffs and reporting are integrated and validated immediately after implementation.

---

### Cycle 5 — Member 1: Sales Summary
- **Function:** Raazia can view order summaries using the approved reporting rules.
- **Mocks / Stubs:** Test `ConfirmedOrder` records across various statuses (`CONFIRMED`, `COMPLETED`, `CANCELLED`, `PAID`, `PARTIAL`, `UNPAID`).

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, ADR-003, and ADR-004.
Implement Cycle 5 — Member 1 Slice: "Sales Summary".

Goal:
Enable Raazia (ADMIN) to view accurate order and revenue summaries following the approved reporting rules in PRD.md.

Requirements:
1. Reporting Rules & Queries: Review PRD.md for exact reporting rules (e.g., total confirmed orders, completed orders, cancelled orders excluded from active revenue, total billed revenue vs. collected/paid revenue, optional date-range filter). Query the ConfirmedOrder repository cleanly.
2. Backend / API Layer: Create `GET /admin/reports/sales-summary` supporting optional `startDate` and `endDate` query parameters, returning aggregated metrics and a breakdown table.
3. Access Control: Restrict reporting endpoints and dashboard strictly to ADMIN via ADR-004.
4. Frontend UI: Build an Admin Sales Summary dashboard with KPI summary cards (Total Orders, Active Revenue, Collected Payments, Cancelled Orders), date-range filter controls, and an order summary breakdown table.
5. Testing: Write tests using fixture orders across multiple statuses (`CONFIRMED`, `CANCELLED`, `PAID`, `PARTIAL`) to verify exact aggregation math and date filtering.
```

#### Acceptance Criteria
- [ ] Sales summary metrics match the approved reporting rules in `PRD.md` (including proper treatment of cancelled and partially paid orders).
- [ ] Date-range filtering dynamically updates summary totals and breakdown rows.

---

### Cycle 5 — Member 2: Customer Inquiry History
- **Function:** Customers can view their previous inquiries and their statuses.
- **Mocks / Stubs:** Test `Inquiry` (and linked `CustomizationRequest` / `Quotation` status) records belonging to the logged-in test customer.

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, ADR-002, and ADR-004.
Implement Cycle 5 — Member 2 Slice: "Customer Inquiry History".

Goal:
Enable authenticated Customers to view all of their previous inquiries, current statuses, and any linked customization/quotation progress.

Requirements:
1. Backend / API Layer: Create `GET /inquiries/mine` returning all inquiries submitted by the authenticated customer (`req.user.id`), ordered newest first, enriched with product name/thumbnail and current status (`OPEN`, `IN_REVIEW`, `QUOTED`, `CLOSED`) plus linked customization/quotation status if present.
2. Access Control: Enforce CUSTOMER authentication and strict user-scoping via ADR-004 so customers can never see other customers' inquiries.
3. Frontend UI: Build a Customer Inquiry History page (`/my-inquiries`) displaying a list/table of past inquiries with product info, submission date, status badges, and an expandable/detail view showing the original message and current progress.
4. Testing: Write tests verifying chronological ordering, strict customer data isolation, and accurate status reflection when admin updates an inquiry.
```

#### Acceptance Criteria
- [ ] Logged-in customers see all of their submitted inquiries along with up-to-date statuses.
- [ ] Customers cannot access or view inquiries belonging to any other customer.

---

### Cycle 5 — Member 3: Request Acceptance & Rejection
- **Function:** Raazia can accept or reject requests and initiate the agreed order handoff.
- **Mocks / Stubs:** Agreed `CustomizationRequest` / `Quotation` records and Member 4's `createConfirmedOrderFromRequest` service (or mock adapter).

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, ADR-002, ADR-003, and ADR-004.
Implement Cycle 5 — Member 3 Slice: "Request Acceptance & Rejection".

Goal:
Enable Raazia (ADMIN) to accept or reject customization/quotation requests and, upon acceptance, initiate the agreed handoff to Confirmed Order creation.

Requirements:
1. Business Rules:
   - Rejecting a request sets `requestOutcome: "REJECTED"` (with optional rejection reason) and does NOT create an order.
   - Accepting a request sets `requestOutcome: "ACCEPTED"`, locks the agreed negotiated price, and invokes Member 4's `createConfirmedOrderFromRequest` service (or agreed handoff contract) atomically/idempotently so duplicate orders are never created if clicked twice.
2. Backend / API Layer: Create `POST /admin/customization-requests/:id/accept` and `POST /admin/customization-requests/:id/reject` for ADMIN users. Prevent accepting a `NOT_FEASIBLE` or already-processed request.
3. Access Control: Restrict both endpoints to ADMIN via ADR-004.
4. Frontend UI: Add "Accept Request & Create Order" and "Reject Request" actions with confirmation dialogs on the Admin Customization/Quotation Review screen, displaying the resulting Confirmed Order ID upon acceptance.
5. Testing: Write tests covering acceptance + order handoff invocation, idempotency (preventing double order creation), rejection without order creation, and invalid state guards.
```

#### Acceptance Criteria
- [ ] Raazia can reject a request cleanly without creating an order.
- [ ] Raazia can accept a feasible/quoted request, automatically triggering `createConfirmedOrderFromRequest` to generate a Confirmed Order with the agreed negotiated price.
- [ ] Re-submitting acceptance on an already-accepted request does not create duplicate orders.

---

### Cycle 5 — Member 4: Order Changes & Cancellation
- **Function:** Raazia can manage order changes, revised prices, and cancellations.
- **Mocks / Stubs:** Existing `ConfirmedOrder` records.

#### Agent Prompt (Copy & Paste)
```text
Read PRD.md, architecture.md, Guardrails.md, AGENTS.md, ADR-001, ADR-003, and ADR-004.
Implement Cycle 5 — Member 4 Slice: "Order Changes & Cancellation".

Goal:
Enable Raazia (ADMIN) to apply post-confirmation order changes, revise agreed prices, and cancel orders with clear auditability.

Requirements:
1. Data & Persistence: Support updating order line items / revised prices (`subtotal`, recalculated `totalAmount = subtotal + deliveryCharge`), setting `orderStatus: "MODIFIED"` or `"CANCELLED"`, and recording a `changeReason` / revision log on `ConfirmedOrder` while keeping `manufacturingStatus`, `paymentStatus`, and `deliveryStatus` decoupled per ADR-003.
2. Business Rules: Require a non-empty `reason` for price revisions or cancellations. Prevent modifying an already `CANCELLED` or `DELIVERED` order (per PRD.md rules). Validate non-negative revised prices.
3. Backend / API Layer: Create `PATCH /orders/:id/revise` and `POST /orders/:id/cancel` for ADMIN users.
4. Access Control: Enforce ADMIN authorization via ADR-004.
5. Frontend UI: Add "Modify Order / Revise Price" and "Cancel Order" modals/panels inside the Admin Order Detail view showing original vs. revised totals, reason input, and revision history.
6. Testing: Write tests covering price revision recalculation, cancellation state transitions, mandatory reason validation, and blocking edits on cancelled orders.
```

#### Acceptance Criteria
- [ ] Raazia can modify order details/revised prices with a documented reason and see `totalAmount` recalculate accurately.
- [ ] Raazia can cancel an active order with a reason, transitioning `orderStatus` to `CANCELLED`.
- [ ] Cancelled orders cannot be further modified and are excluded from active revenue in Member 1's Sales Summary.

---

## 4. Final End-to-End Integration & Validation Checklist (Post-Cycle 5)

Once all 5 cycles are merged into `dev`/`main`, validate these complete cross-slice workflows together:

1. **Auth & Guardrails (`Member 2` + All)**: Verify Raazia (`ADMIN`) and Customer (`CUSTOMER`) sessions work across every route and unauthorized requests return `401`/`403`.
2. **Catalogue → Discovery → Wishlist (`Member 1` + `Member 2`)**: Admin adds product, updates availability, and applies public discount → Customer sees updated card in Catalogue, opens Product Details, and saves to Wishlist without duplicates.
3. **Inquiry → Customization → Negotiation → Order Handoff (`Member 2` + `Member 3` + `Member 4`)**: Customer submits inquiry → links customization request → Admin marks feasible & sends quote → Customer counter-offers → Admin accepts request → Confirmed Order is created automatically with the negotiated price.
4. **Order Fulfillment & Reporting (`Member 4` + `Member 1`)**: Admin independently updates manufacturing status, logs partial/full payment, configures delivery charge/status, tests an order price revision or cancellation, and verifies the numbers in Raazia's Sales Summary.