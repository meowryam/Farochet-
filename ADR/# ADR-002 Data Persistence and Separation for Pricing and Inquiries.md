# ADR-002: Data Persistence and Separation for Pricing and Inquiries

**Status:** Accepted

**Context:** 
Raazia’s system must handle highly specific data ownership and storage requirements. The identified Architecture Significant Requirements (ASRs) cover keeping catalogue, public-discount, negotiated, and final agreed prices distinct ([ASRs identification.docx](../References/ASRs%20identification.docx); [PRD FR-12](../PRD.md#fr-12-order-specific-pricing-and-price-change-records), [PRD FR-03](../PRD.md#fr-03-public-discount-management-and-calculation)). Additionally, customer inquiries must be stored and retained separately from confirmed orders, regardless of whether an inquiry eventually converts into an order ([PRD FR-06](../PRD.md#fr-06-inquiry-history-retention)).

**Alternatives Considered:**
1. **Denormalized Storage (Single Table/Document Model):** Storing all price variations directly on the `Product` record, or appending `Inquiry` data directly into an `Order` record as a single JSON blob or wide table. 
   * *Trade-offs:* While faster to read, this heavily risks overwriting standard prices (violating FR-12) and couples inquiries tightly to orders, meaning if an order is never created, the inquiry data might be lost or awkwardly orphaned.
2. **Normalized Relational Model (Entity Separation):** Creating distinct, strongly typed database tables (or collections) for `Products`, `Inquiries`, and `Orders`, linked via foreign keys.

**Decision:**
We will adopt a **Normalized Relational Data Model**. `Products`, `Inquiries`, and `Orders` will be strictly separated into distinct database entities. 
* The `Product` entity will store the *Standard Catalogue Price*.
* Public discounts will be handled dynamically in the Business Logic layer or stored in a separate `Promotion` table, leaving the standard price untouched.
* While a request is pending, the *Negotiated Price* and its negotiation history belong to Customization and Quotation Management and are associated with the relevant `PendingOrderRequest` / `Customization` records.
* When the request is accepted and a confirmed order is created, Order Management stores an order-level snapshot of the relevant Negotiated Price where applicable. The confirmed `Order` stores the *Approved Price*, including applicable delivery charges.
* The `Inquiry` entity will exist independently and, if an order is confirmed, the `Order` will hold a direct reference (foreign key) to the original `Inquiry`.
* No separate `inquiry_id` foreign key is added to `PendingOrderRequest`; the existing relationship chain provides the connection for the pending request.

**Rationale:**
* **Consistency of Price Calculations (FR-12, FR-03):** By physically decoupling the `Order` entity from the `Product` entity's price fields, it becomes structurally impossible for an order-specific Approved Price to overwrite the Standard Catalogue Price ([PRD FR-12](../PRD.md#fr-12-order-specific-pricing-and-price-change-records), [PRD FR-03](../PRD.md#fr-03-public-discount-management-and-calculation)).
* **Data Storage and Ownership (FR-06):** Giving `Inquiries` their own dedicated table guarantees they are preserved independently. This satisfies the requirement that inquiries are kept separate irrespective of whether they become an order ([PRD FR-06](../PRD.md#fr-06-inquiry-history-retention)). The direct `Order`-to-`Inquiry` reference preserves traceability without merging the entities. Keeping the direct reference on the confirmed `Order` does not require a redundant `inquiry_id` on `PendingOrderRequest`. Separating the pending Negotiated Price from the confirmed Order's Approved Price and snapshot preserves the lifecycle boundary between negotiation and confirmation.

**Trade-offs / Consequences:**
* **Pros:** Supports data integrity, prevents accidental data overwriting, and addresses the data ownership ASRs ([ASRs identification.docx](../References/ASRs%20identification.docx); [PRD FR-06](../PRD.md#fr-06-inquiry-history-retention), [PRD FR-12](../PRD.md#fr-12-order-specific-pricing-and-price-change-records)).
* **Cons:** Requires the Business Logic layer to perform table JOINs (or multiple queries) to assemble a complete view of a customer's history. Given the small scale of the application, this performance overhead is entirely negligible compared to the critical need for data accuracy.