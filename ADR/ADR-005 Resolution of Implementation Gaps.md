# ADR-005: Resolution of Implementation Gaps

**Status:** Accepted as the implementation baseline on 18 November 2026  
**Decision owners:** Project team  
**Scope:** Resolves the implementation gaps recorded in PRD v1.3, architecture.md, AGENTS.md, and Guardrails.md. It does not select a technology stack.

## Context

The reviewed documents required negotiation history but did not define its persistent representation; referred to an existing public-discount agreement without containing the calculation rule; and left initial payment and delivery status values unspecified. These gaps blocked consistent implementation and testing.

## Decision 1 — Negotiation history

Persist each negotiation exchange as an append-only `NegotiationEntry` record.

- One `Customization` has zero or many `NegotiationEntry` records.
- Each `NegotiationEntry` belongs to exactly one `Customization`.
- Required fields: identifier, `customization_id`, proposer (`RAAZIA` or `CUSTOMER`), proposed price in whole PKR rupees, and timestamp.
- Optional field: note.
- A new offer creates a new entry; prior entries are never overwritten or deleted as part of negotiation.
- Only Raazia and the Customer who owns the related Customization may read or add entries.
- `PendingOrderRequest` continues to reference one `Customization`; it does not gain a redundant `inquiry_id`.
- On acceptance, Order Management snapshots the agreed Negotiated Price into the confirmed Order. Negotiation history remains linked to Customization.

**Consequences:** Clear one-to-many persistence, chronological history, straightforward retrieval, and preserved lifecycle ownership.

## Decision 2 — Public sale discount

A public sale uses one fixed positive whole-rupee PKR discount amount.

- The same amount is subtracted from the Standard Catalogue Price of every listed Product during that sale.
- The amount must be less than the Standard Catalogue Price of every listed Product.
- Reject activation/update of a sale if the discount would make any listed Product's effective price zero or negative.
- Percentage discounts are not supported.
- Multiple public discounts cannot be stacked.
- Effective price = Standard Catalogue Price − fixed sale discount.
- Store money as whole PKR rupees for this prototype; no fractional currency rounding is required.
- Raazia sets the amount; the system validates it and calculates the displayed price. It does not calculate profitability.

**Consequences:** One deterministic calculation and one shared validation rule for catalogue cards and product details. The sale cannot be activated with an amount that makes any listed Product free or negative-priced.

## Decision 3 — Initial payment and delivery status

Both `payment_status` and `delivery_status` are nullable on a newly confirmed Order.

- `manufacturing_status` is initialized to `Incomplete`.
- `payment_status` remains NULL until Raazia manually records one of the PRD payment states.
- `delivery_status` remains NULL until Raazia records delivery completion as `Delivered`.
- The interface displays `Not yet recorded` for either NULL field.
- NULL is a data absence state, not a new business status.
- Do not default payment to `Unpaid`, delivery to `Pending`, or delivery to `Not Delivered`.
- Status dimensions remain independent.

**Consequences:** The schema can create a confirmed Order without inventing business facts. UI and reports must handle NULL explicitly.

## Technology boundary

This ADR does not choose a programming language, framework, database vendor, ORM, hosting/deployment platform, authentication provider, file-storage provider, or courier/payment integration. Existing workspace technology must be discovered by repository inspection; no new technology is authorized by this ADR.

## Validation

- Test a public sale with multiple products and prove the same fixed amount is applied to all.
- Reject zero, negative, fractional, equal-to-price, and greater-than-price discounts.
- Test no stacking and unchanged Standard Catalogue Prices.
- Test multiple negotiation entries for one Customization, ownership restrictions, chronological retrieval, and append-only behavior.
- Test a newly confirmed Order with `Incomplete` manufacturing status and NULL payment/delivery statuses; verify `Not yet recorded` display.
- Test that updating one status does not alter the other two.
