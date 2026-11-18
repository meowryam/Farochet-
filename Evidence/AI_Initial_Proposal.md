
# AI Validation — Initial Project Structure Proposal

**Project:** Raazia's Customer Inquiry, Quotation, and Custom Order Management System  
**Role:** Member 4 — Architecture Documentation and AI Validation  
**Status:** Initial proposal captured  
**Purpose:** Preserve the coding agent's first proposed project structure before evaluation and refinement.

## 1. Documents Reviewed by the AI

The coding agent reported that it located and read the following eight documents:

1. [AGENTS.md](../AGENTS.md)
2. [Guardrails.md](../Guardrails.md)
3. [PRD.md](../PRD.md)
4. [architecture.md](../architecture.md)
5. [ADR-001 Overall Architectural Style](../ADR/%23%20ADR-001%20Overall%20Architectural%20Style.md)
6. [ADR-002 Data Persistence and Separation for Pricing and Inquiries](../ADR/%23%20ADR-002%20Data%20Persistence%20and%20Separation%20for%20Pricing%20and%20Inquiries.md)
7. [ADR-003 Independent Status Management for Orders](../ADR/%23%20ADR-003%20Independent%20Status%20Management%20for%20Orders.md)
8. [ADR-004 Centralized Access Control and Authorization Boundary](../ADR/%23%20ADR-004%20Centralized%20Access%20Control%20and%20Authorization%20Boundary.md)

The agent also searched and reread relevant sections before proposing the structure.

## 2. Initial AI-Proposed Project Structure

The following structure was proposed by the AI coding agent. It represents an initial organizational suggestion, not an approved implementation structure.


project-root/
├── AGENTS.md
├── application/
│   ├── presentation/
│   │   ├── views/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── models/                  # Presentation-only state, if needed
│   ├── business-logic/
│   │   ├── product-management/
│   │   ├── availability-management/
│   │   ├── pricing-and-discount-management/
│   │   ├── inquiry-management/
│   │   ├── customization-and-quotation-management/
│   │   ├── order-management/
│   │   ├── status-management/
│   │   ├── wishlist-management/
│   │   └── sales-summary/
│   └── data-access/
│       ├── repository/              # One centralized Repository boundary
│       └── relational-database/     # One centralized relational store
└── docs/
    ├── governance/
    │   └── Guardrails.md
    ├── requirements/
    │   └── PRD.md
    └── architecture/
        ├── architecture.md
        └── decisions/
            ├── # ADR-001 Overall Architectural Style.md
            ├── # ADR-002 Data Persistence and Separation for Pricing and Inquiries.md
            ├── # ADR-003 Independent Status Management for Orders.md
            └── # ADR-004 Centralized Access Control and Authorization Boundary.md
└── tests/
    ├── acceptance/
    ├── architecture/
    ├── presentation/
    ├── business-logic/
    │   ├── product-management/
    │   ├── availability-management/
    │   ├── pricing-and-discount-management/
    │   ├── inquiry-management/
    │   ├── customization-and-quotation-management/
    │   ├── order-management/
    │   ├── status-management/
    │   ├── wishlist-management/
    │   └── sales-summary/
    └── data-access/


## 3. AI Explanation of the Proposed Structure

### 3.1 Presentation Layer

Located in `application/presentation/`.

- `views/` displays information and collects user input.
- `controllers/` validates request structure and delegates to Business Logic.
- `middleware/` handles centralized authentication and role authorization.
- Middleware's Repository access is limited to persisted account/role lookup allowed by ADR-004.
- `models/`, if required, contain presentation state only and no substantive business rules.

### 3.2 Business Logic Layer

Located in `application/business-logic/`.

The AI included all nine Business Logic components from the architecture:

1. Product Management
2. Availability Management
3. Pricing and Discount Management
4. Inquiry Management
5. Customization and Quotation Management
6. Order Management
7. Status Management
8. Wishlist Management
9. Sales Summary

The AI stated that these components would preserve their assigned responsibilities and use the shared Repository for persistence.

It also noted that Sales Summary should obtain confirmed-order information through Order Management rather than taking ownership of Order persistence.

### 3.3 Data Access Layer

Located in `application/data-access/`.

- `repository/` represents the single centralized persistence boundary.
- `relational-database/` represents the centralized relational store.
- No particular database vendor or schema technology was selected.
- Repository and Presentation code should not independently become the customer-record ownership authorization boundary.

### 3.4 Tests

The AI proposed a test directory organized by concern:

- Acceptance tests for PRD workflows.
- Architecture tests for layer boundaries.
- Presentation tests.
- Business Logic tests organized by component.
- Data Access tests.

The AI stated that this organization did not prescribe a particular testing framework.

### 3.5 Documentation

The AI proposed separating project documentation into:

- Governance documents.
- Requirements.
- Architecture documentation.
- Architectural decision records.

It also recommended keeping `AGENTS.md` at the project root.

## 4. Issues and Missing Information Identified by the AI

The initial agent response identified the following:

1. **Document-name mismatches:** The initial report identified inconsistent document names. The current workspace contains `PRD.md` and `Guardrails.md`, and the references in `AGENTS.md` now match those names and the files' actual locations.

2. **Supporting documents:** The ASR identification document, architectural alternatives document, and Deliverable 3 PDF are present under `References/`. No separate architecture review report or consistency checklist was located.

3. **Public-discount specification:** Exact approved discount parameters and rounding rules were not available in the inspected documents.

4. **Negotiation model:** The physical representation of negotiation history, including a separate Negotiation entity and cardinality, remained unapproved.

5. **Initial status values:** Initial payment and delivery status values were unspecified.

6. **Architecture approval:** The group has since reviewed and approved the complete `architecture.md`. This does not imply TA or faculty approval.

7. **Technology choices:** No programming language, framework, database vendor, ORM, hosting provider, or image-storage provider had been selected.

## 5. Initial Validation Result

The AI produced a technology-neutral project organization that represented the three architectural layers and all nine Business Logic components.

It did not generate application code, install dependencies, or select an implementation technology.

This response was retained as the baseline for human evaluation and subsequent refinement.