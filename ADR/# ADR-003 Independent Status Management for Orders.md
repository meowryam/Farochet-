# ADR-003: Independent Status Management for Orders

**Status:** Accepted

**Context:** 
Raazia’s workflow requires tracking the manufacturing/order, payment, and delivery states of a single order independently. The Architecture Significant Requirements (ASRs) derived from FR-14 and NFR-03 identify the need for distinct status values rather than a single unified status ([ASRs identification.docx](../References/ASRs%20identification.docx); [PRD FR-14](../PRD.md#fr-14-independent-order-payment-and-delivery-statuses), [PRD NFR-03](../PRD.md#nfr-03-essential-data-integrity)). For example, Raazia might finish manufacturing a custom crochet item (setting its production status to "Completed"), but the item might still be unpaid and undelivered. If the system is designed with a single status field now, adding new workflow steps later would require rewriting all logic that reads or sets the status, as well as fixing existing database records ([ASRs identification.docx](../References/ASRs%20identification.docx), FR-14/NFR-03).

**Alternatives Considered:**
1. **Single Aggregated Status Field (Complex State Machine):** Using one `Status` field that attempts to capture all combinations (e.g., "Pending_Unpaid_NotDelivered", "Completed_Paid_PendingDispatch").
   * *Trade-offs:* This creates an exploding number of states that are nearly impossible to manage. It violates the requirement that statuses must be updated independently and makes future workflow changes extremely difficult and error-prone ([PRD FR-14](../PRD.md#fr-14-independent-order-payment-and-delivery-statuses), [PRD NFR-03](../PRD.md#nfr-03-essential-data-integrity)).
2. **Independent Status Attributes (Decoupled Fields):** Designing the Data Model so that `manufacturing_status`, `payment_status`, and `delivery_status` are represented as completely separate, independent attributes (or distinct related entities) within the `Order` model.

**Decision:**
We will adopt **Option A: three Independent Status Attributes** within the Order data model. The `Order` entity will contain three distinctly managed fields:
* `Manufacturing_Status` (Incomplete, In Progress, Completed, Cancelled, and On Hold where applicable)
* `Payment_Status` (Advance Payment Received, Partial Payment, Full Payment, and Refunded)
* `Delivery_Status` (delivery progress recorded independently; Delivered is the PRD-defined completed delivery state)

These fields will be updated entirely independently of one another via the Business Logic layer. This is the group's selected architecture representation.

**PRD interpretation:** FR-14 requires order, payment, and delivery statuses to be maintained as separate records and updated independently. This ADR interprets "separate records" as distinct, independently maintained status values/attributes within the `Order` record; it does not interpret the phrase as mandating three separate database tables or related entities. FR-14 does not specify a physical schema. The group has accepted this interpretation. No PRD amendment is made by this ADR.

**Rationale:**
* **Data Model Design (FR-14, NFR-03):** This approach directly satisfies the ASR concern regarding data model design ([ASRs identification.docx](../References/ASRs%20identification.docx)). It ensures that Raazia can manually update the manufacturing/order status to "Completed" without the system automatically forcing a change to the payment or delivery status ([PRD FR-14](../PRD.md#fr-14-independent-order-payment-and-delivery-statuses)).
* **Maintainability:** By decoupling these fields, future changes to Raazia's delivery methods or payment structures will not require rewriting the production tracking logic or migrating old single-status records ([ASRs identification.docx](../References/ASRs%20identification.docx), FR-14/NFR-03).

**Trade-offs / Consequences:**
* **Pros:** Supports independent status updates and the PRD's manual-tracking constraints ([PRD FR-14](../PRD.md#fr-14-independent-order-payment-and-delivery-statuses), [PRD NFR-03](../PRD.md#nfr-03-essential-data-integrity)).
* **Cons:** The User Interface will need to display three separate inputs/dropdowns for Raazia to manage an order, slightly increasing the manual data entry footprint.