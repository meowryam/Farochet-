# Raazia’s Customer Inquiry, Quotation, and Custom Order Management System
## Product Requirements Document — Version 1.4 (Implementation Rules Resolved)

**Document Status:** TA clarifications incorporated; implementation decisions adopted by project team (not re-reviewed by TA)  
**Version:** 1.4  
**Baseline Date:** 25 October 2026  
**Updated:** 18 November 2026

---

## 1. Purpose

This document defines requirements for a system that helps Raazia manage product information, customer inquiries, custom-order requests, order-specific pricing, order progress, payment records, and delivery information for her crochet business.

## 2. Problem Statement

Raazia currently manages customer communication through Instagram and WhatsApp. Product questions, price discussions, custom specifications, and order updates can be spread across conversations, making records difficult to retrieve and order progress harder to track. Customers also lack a centralized place to browse product images and standard prices.

The proposed system centralizes the agreed product and order records while leaving feasibility decisions, price negotiations, payment recording, and status updates under Raazia’s control.

## 3. Goals and Scope

### 3.1 Goals
- Display product images, descriptions, and standard catalogue prices.
- Let Raazia maintain product information and public discounts.
- Record customer inquiries and retain their inquiry history.
- Collect custom-order specifications for Raazia’s review.
- Distinguish Pending Order Requests from confirmed orders.
- Record Negotiated Price, Approved Price, and relevant price changes.
- Track manufacturing, payment, and delivery separately.
- Allow Raazia to update availability manually.
- Restrict customer access to their own permitted records.
- Allow customers to maintain personal wishlists independently of inquiries and orders.
- Display the latest estimated completion date for each confirmed order alongside its manufacturing status.
- Provide Raazia with a sales summary for a user-selected date range.

### 3.2 In Scope
Product catalogue; standard price management; public discount records; customer inquiries and inquiry history; customer access restrictions; custom-order request submission; manual request decisions; order status management; order-specific pricing and price history; manual payment, delivery, cancellation, and refund recording; customer wishlists; estimated completion dates for confirmed orders; and date-range sales summaries.

### 3.3 Out of Scope
- Integrated online payment processing.
- Courier booking or courier-service integration.
- AI-generated designs or customization recommendations.
- Comprehensive accounting or tax management.
- Comprehensive inventory management.
- External calendar synchronization.
- Automatic feasibility decisions or automatic order acceptance.

## 4. Users and Permissions

**Customer:** Can browse products and, when logged in, manage a personal wishlist whose contents persist across sessions. Customers can also access their own permitted inquiries, customization details, quotations, and order history. A customer cannot access another customer’s restricted records or perform Raazia-only actions.

**Raazia:** Can manage product information, availability, inquiries, requests, prices, and the order, payment, delivery, cancellation, and refund records authorized for her role.

## 5. Ubiquitous Language Glossary

| Term | Definition |
|---|---|
| Product Catalog | Customer-facing list of products, images, descriptions, and standard prices. |
| Standard Catalog Price | Normal listed product price, separate from private negotiation and public discounts. |
| Public Discount | A public price reduction applied uniformly to customers covered by a promotion. |
| Customer Inquiry | A customer’s question or request about product details, prices, availability, or customization. |
| Inquiry History | Records of customer inquiries, including those that do not become orders. |
| Quotation | Price presented using the standard catalogue price before individual negotiation or an applicable public discount. |
| Pending Order Request | A customer’s order request awaiting Raazia’s review and decision. |
| Order Acceptance / Confirmation | The same event: Raazia accepts the request, creating a confirmed Incomplete Order. |
| Incomplete Order | A confirmed order for which manufacturing has not started. |
| In Progress | An order whose manufacturing has started but is not finished. |
| Completed | **Manufacturing is finished.** This does not mean that delivery or full payment is complete. |
| Cancelled | An order for which manufacturing or delivery will not proceed as intended. |
| On Hold | A temporary state in which work must not proceed under outdated specifications or pricing while revised terms are discussed. |
| Change Request | A minor change to a catalogue item, such as colour or size, without substantial design changes. |
| Custom Order | An order involving a substantial design modification or a product made to specific requirements, even if based on a catalogue template. |
| Negotiated Price | A customer-specific proposed price discussed with Raazia. |
| Approved Price | The final price mutually agreed by Raazia and the customer for a particular order, including applicable delivery charges. |
| Product Unavailability | Required product materials are unavailable. |
| Raazia’s Unavailability | A period when Raazia has manually declared herself unavailable. |
| Order Infeasibility | Raazia determines she cannot fulfil a request because of schedule, materials, complexity, skills, deadline, or scope. |
| Order History | Records of confirmed orders, agreed details, order and delivery status, payment information, and applicable policies. |
| Advance Payment Received | A manually recorded state indicating an advance has been paid. |
| Partial Payment | A manually recorded state indicating some, but not all, of the applicable amount has been paid. |
| Full Payment | A manually recorded state indicating the full applicable amount has been paid. |
| Refunded | A manually recorded state indicating a refund has been processed. |
| Local/In-City Handover | Direct in-person delivery or handover without an additional delivery fee under the agreed rule. |
| Service-Based Delivery | Delivery requiring a courier or other delivery service and an applicable delivery fee. |
| Wishlist | A customer-specific saved list of catalogue products that can be viewed and managed without submitting an inquiry or order request. |
| Estimated Completion Date | The latest date Raazia estimates an individual confirmed order’s manufacturing will be completed; it may be updated by Raazia. |
| Sales Summary | A report for a user-selected date range showing confirmed-order and cancelled-order counts and the total Approved Price of confirmed non-cancelled orders. It is not a record of payments received. |

## 6. Functional Requirements

### FR-01: Product Catalog Display
The system shall allow customers to browse the product catalogue and view each listed product’s images, description, and standard catalogue price.

### FR-02: Standard Catalog Price Management
The system shall allow Raazia to manage the standard catalogue prices of listed products.

### FR-03: Public Discount Management and Calculation
The system shall allow Raazia to apply public discounts to listed products, calculate and display the resulting prices using the agreed currency-rounding rule, and apply each public discount uniformly to covered customers without changing standard catalogue prices. The fixed-amount rule in Business Rule 2 governs calculation.

### FR-04: Raazia’s Availability Display
The system shall allow Raazia to manually update her availability information and display the current information to customers.

### FR-05: Customer Inquiry Submission
The system shall allow customers to submit inquiries about product details, prices, availability, and customization possibilities.

### FR-06: Inquiry History Retention
The system shall retain customer inquiries in Inquiry History, including inquiries that do not result in a confirmed order.

### FR-07: Inquiry and Customer Record Review
The system shall allow Raazia to review customer inquiries and access associated customer records needed to manage those inquiries.

### FR-08: Role-Based Record Access
The system shall restrict customers to their own permitted inquiries, quotations, customization details, and order history, while allowing Raazia to access the business and customer records authorized for her role.

### FR-09: Custom Order Request Submission
The system shall allow customers to submit custom-order requests containing applicable product type, reference images, size, colour, materials, quantity, budget, special instructions, required completion date, and delivery address.

### FR-10: Pending Order Request Review
The system shall allow Raazia to review each Pending Order Request and record acceptance or rejection after assessing material availability, her schedule, and order feasibility.

### FR-11: Order Confirmation and Lifecycle Tracking
The system shall distinguish Pending Order Requests from confirmed Incomplete Orders and allow order status to be updated as manufacturing progresses through Incomplete, In Progress, Completed, or Cancelled. Completed means manufacturing is finished, not that delivery has occurred.

### FR-12: Order-Specific Pricing and Price-Change Records
The system shall allow Raazia to record a Negotiated Price and an Approved Price for a specific order, restrict price overrides to Raazia’s authorized account, and ensure order-specific price adjustments do not change standard catalogue prices for other customers. Relevant price-change records shall include original price, revised price, timestamp, affected order identifier, and acting user identifier. A fully immutable audit system is not required.

### FR-13: Price Re-Evaluation After Specification Changes
The system shall allow Raazia to record specification changes that affect an order’s cost, place the order On Hold while the revised price is negotiated, and record the revised Approved Price only after mutual agreement. If no mutually acceptable price can be reached and Raazia determines that proceeding would cause a financial loss, the system shall allow the order to be cancelled. The system does not calculate financial loss automatically.

### FR-14: Independent Order, Payment, and Delivery Statuses
The system shall maintain manufacturing/order status, payment status, and delivery status as three independent attributes on each Order. A newly confirmed Order starts with manufacturing/order status Incomplete. Payment status and delivery status are nullable until Raazia records them; the interface displays “Not yet recorded” while either is NULL. Updating one status shall not change another. **Completed means manufacturing is finished only**; it does not imply Delivered or Full Payment. Payment states include Advance Payment Received, Partial Payment, Full Payment, and Refunded, recorded manually.

### FR-15: Delivery Fees, Courier-Fee Changes, Cancellation, and Refund Recording
The system shall allow Raazia to record delivery method and applicable delivery fee, record a revised Approved Price following mutual agreement on a significant pre-dispatch courier-fee increase, and record cancellation and refund outcomes separately from manufacturing status. A courier-fee increase of **PKR 200 or more** is significant and requires customer notification and agreement before dispatch. Increases **below PKR 200** are absorbed by Raazia. Unexpected additional courier charges arising after the parcel is handed to the courier are absorbed by Raazia. This requirement does not include courier booking or automatic refund execution.

### FR-16: Customer Wishlist Management
The system shall allow logged-in customers to add products from the catalogue to a personal wishlist, view their saved products, and remove products from the wishlist without submitting an inquiry or order request. Wishlist contents shall remain saved across sessions.

### FR-17: Estimated Completion Date Recording and Display
The system shall allow Raazia to confirm an order without immediately entering an estimated completion date, and to record or update that date later. Until an estimate is recorded, the system shall display “Not yet provided” to the corresponding customer. Once recorded, the system shall display the latest estimated completion date alongside the order’s current manufacturing status.

### FR-18: Sales Summary by Date Range
The system shall allow Raazia to generate a sales summary for a user-selected date range, using each order’s confirmation date and Pakistan Standard Time (PKT), with both the start and end dates inclusive. The summary shall display (1) the number of orders confirmed within the selected range, including those subsequently cancelled; (2) the number of those confirmed orders that were subsequently cancelled; and (3) the total Approved Price of confirmed orders that have not been cancelled. The total Approved Price shall not be represented as, or treated as, payments received.

## 7. Non-Functional Requirements

### NFR-01: Basic Access Control
The system shall enforce Customer and Raazia roles for prototype records. Verification: test with one Raazia account and two customer accounts to confirm customers cannot access one another’s restricted records or perform Raazia-only price-management actions.

### NFR-02: Basic Data Persistence
The system shall save supported wishlist, inquiry, order, price, payment, and delivery records so that saved records remain available after the application is closed and reopened. Verification: save representative records, restart the application, and retrieve them.

### NFR-03: Essential Data Integrity
The system shall preserve the separation between order, payment, and delivery status and apply the fixed public-sale discount formula in Business Rule 2. Verification: run status-independence tests and price-calculation tests using whole-PKR amounts.

### NFR-04: Basic Usability for Core Tasks
The system shall provide an interface through which a representative Raazia tester can complete agreed core tasks without directly editing the database or application code. Verification: use a predefined task checklist and record task completion.

## 8. Business Rules (Implementation Baseline)

1. **Catalogue price:** Store one Standard Catalogue Price on each Product. Negotiated Price and Approved Price are stored separately and never overwrite it.
2. **Public sale discount:** Raazia sets one positive whole-rupee fixed discount amount for a public sale. Apply that same amount to every listed product. Do not use percentage discounts or stack discounts. Reject the sale if the discount is greater than or equal to the Standard Catalogue Price of any listed product. Customer price = Standard Catalogue Price − fixed discount.
3. **Negotiated price:** Store each proposed price against the relevant customer's Customization. It is private to that customer and does not change catalogue prices.
4. **Approved Price:** When Raazia confirms an accepted request, store the mutually agreed order price as the Order's Approved Price. Include the applicable delivery fee in that amount. Preserve the negotiated-price snapshot where one exists.
5. **Request lifecycle:** A Pending Order Request is not an Order. Raazia alone accepts or rejects it. Acceptance creates exactly one confirmed Order with manufacturing/order status `Incomplete`. Rejection creates no Order and retains the request and Inquiry.
6. **Feasibility:** Raazia manually decides feasibility after considering materials, schedule, complexity, skills, deadline, and scope. The system records her decision; it does not decide for her.
7. **Change Request vs Custom Order:** A minor colour or size change without substantial design changes is a Change Request. A substantial design change or made-to-specific-requirements product is a Custom Order, even when based on a catalogue template.
8. **Manufacturing status meanings:** `Incomplete` = manufacturing has not started; `In Progress` = manufacturing has started but is unfinished; `Completed` = manufacturing is finished; `On Hold` = work is paused while revised specifications/pricing are discussed; `Cancelled` = the order will not proceed.
9. **Independent statuses:** Store manufacturing/order, payment, and delivery status separately on the Order. Changing one must not automatically change either of the others.
10. **Initial status values:** New Orders start with manufacturing/order status `Incomplete`. Payment and delivery status are `NULL` until Raazia records a value. Show `Not yet recorded` for either NULL status. Do not substitute `Unpaid`, `Pending`, or `Not Delivered`.
11. **Payment recording:** Raazia manually records one of `Advance Payment Received`, `Partial Payment`, `Full Payment`, or `Refunded`. The prototype does not calculate mandatory advances, enforce payment percentages, process online payments, or execute refunds.
12. **Delivery recording:** Raazia manually records delivery method, applicable fee, tracking/delivery information, and `Delivered` when delivery is complete. Until delivery is recorded as complete, delivery status remains NULL and displays `Not yet recorded`. No courier booking or courier API is used.
13. **Local handover:** Direct local/in-city in-person handover has no additional delivery fee.
14. **Courier fee at confirmation:** For courier/service delivery, include the applicable delivery fee in the Approved Price before finalizing it.
15. **Courier fee increase before dispatch:** If the fee increases by less than PKR 200, Raazia absorbs the increase. If it increases by PKR 200 or more, Raazia notifies the customer and obtains agreement before revising the Approved Price and dispatching.
16. **Courier fee after handover:** Raazia absorbs unexpected additional courier charges that arise after the parcel has been handed to the courier.
17. **Specification changes:** If a requested specification change affects cost, place the Order `On Hold`. Do not proceed under outdated terms. Record a revised Approved Price only after both Raazia and the customer agree.
18. **Cancellation:** A customer may request cancellation, but the system does not cancel automatically. Raazia reviews the request and records the decision. A cancelled Order cannot be treated as active or dispatched.
19. **Refund:** Raazia manually records any refund outcome. The system does not calculate refund entitlement or execute a refund automatically.
20. **Access control:** Customers can access only their own inquiries, customizations, quotations, wishlists, and Orders. Raazia can access administrative business records. Role checks occur in centralized middleware; record ownership is checked in the relevant Business Logic component.
21. **Inquiry retention:** Retain every saved Inquiry whether or not it leads to a Pending Order Request or confirmed Order. Retain rejected requests. Do not replace an Inquiry with an Order.
22. **Wishlist:** Only logged-in customers can add, view, or remove wishlist items. Each wishlist belongs to one customer, persists across sessions, and has at most one entry per customer/product pair. Wishlist actions do not create inquiries or orders.
23. **Estimated completion date:** The estimate is optional at confirmation. Until Raazia enters one, display `Not yet provided`. When updated, show the latest date to the owner of that Order. The estimate is not a guarantee.
24. **Sales Summary date filter:** Filter by Order confirmation date using inclusive start and end dates in Pakistan Standard Time (PKT). Convert the selected PKT date boundaries to the stored timestamp timezone before querying.
25. **Sales Summary counts and total:** Confirmed count includes all Orders confirmed in the selected range, even if later cancelled. Cancelled count includes only Orders that were confirmed in that range and later cancelled; such Orders appear in both counts. Approved Price total sums only confirmed Orders in the range that are not cancelled. Label it `Total Approved Price (Order Value)`, never payments received.

## 9. Operating Rules

### 9.1 Request Review
Raazia manually reviews each Pending Order Request and records acceptance or rejection. An accepted request becomes a confirmed Incomplete Order.

### 9.2 Specification Changes
If a specification change affects cost, Raazia discusses the revised price with the customer. The order remains On Hold while the revised terms are negotiated. The revised Approved Price is recorded only after mutual agreement.

### 9.3 Cancellation and Refunds
Customers may request cancellation, but Raazia decides whether to approve it. The system records cancellation and any applicable refund separately. It does not promise or automatically calculate a full or partial refund.

### 9.4 Delivery Fee Recording
For direct in-person local handover, no additional delivery fee is charged. For courier/service delivery, the applicable fee is included in the order total before the Approved Price is finalized.

### 9.5 Payment Recording
The system supports manual recording of the payment states **Advance Payment Received, Partial Payment, Full Payment, and Refunded**. Payment states are maintained independently from order and delivery status. The prototype does **not** automatically enforce a payment percentage, calculate mandatory advances, process online payments, or execute refunds. Raazia records the payment state and relevant outcome manually.

### 9.6 Courier-Fee Changes
A pre-dispatch courier-fee increase of **PKR 200 or more** is significant. Raazia must notify the customer and obtain agreement before the Approved Price is revised and the order is dispatched. Routine increases of **less than PKR 200** are absorbed by Raazia and do not trigger customer renegotiation. If a significant increase is not accepted, the order must not be dispatched under the revised price. Unexpected extra courier charges after the parcel has been handed to the courier are absorbed by Raazia.

## 10. Constraints and Exclusions

- Business feasibility and acceptance decisions remain with Raazia.
- Availability and order statuses are updated manually.
- Payment states are manually recorded; no integrated payment gateway is included.
- No courier booking or courier API integration is included.
- The system does not generate designs using AI.
- Comprehensive accounting, tax management, and inventory management are excluded. The sales summary is a limited operational report, not a comprehensive accounting report or payment-reconciliation feature.
- The system does not automatically calculate financial loss or decide whether to accept a custom order.

## 11. Dependencies

- Raazia supplies product information, images, and standard catalogue prices.
- Raazia reviews requests and manually updates availability, decisions, prices, payment states, delivery information, and estimated completion dates.
- The fixed public-sale discount rule in Business Rule 2 is the implementation baseline.
- Customer and Raazia account permissions must be configured and tested in the implemented system.

## 12. Assumptions

- Product and order information entered by Raazia is the business record used by the system.
- Customer communication and business decisions remain under Raazia’s control.
- The application records information and decisions rather than automatically processing payments or arranging delivery.
- The sales summary reports Approved Price values for confirmed non-cancelled orders; it does not calculate or report actual receipts.
- The PKR 200 courier-fee threshold and the stated absorption rule are established business rules for this baseline.

## 13. Acceptance Criteria — Given / When / Then

### FR-01: Product Catalog Display
- **Given** a product is listed and has saved images, description, and standard catalogue price, **when** a customer opens the product catalogue, **then** the saved information is displayed.
- **Given** a product has a private order-specific negotiated price, **when** another customer views the catalogue, **then** the standard catalogue price remains displayed rather than that private price.

### FR-02: Standard Catalog Price Management
- **Given** Raazia is authorized to manage product prices, **when** she saves a change to a product’s standard catalogue price, **then** the updated standard price is stored and displayed in the catalogue.
- **Given** an order has an Approved Price, **when** Raazia changes that order-specific price, **then** the product’s standard catalogue price is not changed by that order update.

### FR-03: Public Discount Management and Calculation
- **Given** Raazia configures an approved public discount for a listed product, **when** a customer views a product covered by the promotion, **then** the system displays `Standard Catalogue Price − fixed public-sale discount`, provided the discount is valid for every listed product.
- **Given** a public discount applies to a product, **when** different customers view that product during the same promotion, **then** they receive the same public discounted price.
- **Given** a public discount is applied, **when** the product’s standard catalogue price is retrieved, **then** the standard price remains unchanged.

### FR-04: Raazia’s Availability Display
- **Given** Raazia is authorized to update availability, **when** she saves new availability information, **then** the latest saved information is displayed to customers.
- **Given** no availability update has been saved, **when** a customer views availability, **then** the system does not invent a fixed 15-days-on/15-days-off schedule.

### FR-05: Customer Inquiry Submission
- **Given** a customer enters an inquiry about product details, price, availability, or customization, **when** the customer submits it, **then** the inquiry is saved with the submitted information.
- **Given** an inquiry is saved, **when** Raazia reviews it, **then** she can access the inquiry details needed to respond.

### FR-06: Inquiry History Retention
- **Given** a customer inquiry has been saved, **when** it does not become a confirmed order, **then** it remains available in Inquiry History.
- **Given** a saved inquiry later leads to a confirmed order, **when** Inquiry History is viewed, **then** the original inquiry record remains available.

### FR-07: Inquiry and Customer Record Review
- **Given** Raazia is authenticated and authorized, **when** she opens inquiry records, **then** she can review saved inquiries and their associated customer information.
- **Given** a customer is not authorized to administer business records, **when** that customer attempts an administrator-only record action, **then** the action is denied.

### FR-08: Role-Based Record Access
- **Given** Customer A and Customer B have separate accounts and restricted records, **when** Customer A attempts to access Customer B’s restricted inquiry, customization, quotation, or order history, **then** access is denied.
- **Given** a customer account is active, **when** it attempts a Raazia-only price-management action, **then** the action is denied.
- **Given** Raazia is authenticated with the authorized role, **when** she accesses business records within her permissions, **then** the records are available to her.

### FR-09: Custom Order Request Submission
- **Given** a customer enters the applicable custom-order details, including available specification fields, **when** the customer submits the request, **then** the request and entered details are saved for Raazia’s review.
- **Given** a custom-order request includes reference images or special instructions, **when** Raazia opens the request, **then** those submitted details are available to her.
- **Given** a request is based on a catalogue item but substantially changes its design, **when** the request is classified, **then** it is treated as a Custom Order.

### FR-10: Pending Order Request Review
- **Given** an order request is pending, **when** Raazia completes her feasibility review and records acceptance, **then** the request becomes a confirmed Incomplete Order.
- **Given** an order request is pending, **when** Raazia records rejection, **then** it is not treated as a confirmed order.
- **Given** materials, schedule, complexity, skills, or deadline affect feasibility, **when** Raazia reviews the request, **then** the system allows her to record her decision without automatically deciding feasibility.

### FR-11: Order Confirmation and Lifecycle Tracking
- **Given** a request has been accepted and confirmed but manufacturing has not started, **when** its order status is viewed, **then** it is Incomplete.
- **Given** manufacturing has started but is not finished, **when** Raazia updates the order status, **then** the order can be recorded as In Progress.
- **Given** manufacturing is finished, **when** Raazia updates the order status, **then** the order can be recorded as Completed regardless of whether it has been delivered or fully paid.
- **Given** an order has been cancelled, **when** its order status is viewed, **then** it is recorded as Cancelled separately from payment and delivery status.

### FR-12: Order-Specific Pricing and Price-Change Records
- **Given** Raazia records a proposed customer-specific price, **when** the price is saved before mutual agreement, **then** it is distinguishable as a Negotiated Price rather than an Approved Price.
- **Given** Raazia and the customer agree to an order price, **when** Raazia records that agreement, **then** the agreed amount is stored as the Approved Price for that order.
- **Given** an order-specific price changes, **when** the price-change record is saved, **then** the record includes the original price, revised price, timestamp, affected order identifier, and acting user identifier.
- **Given** an order-specific price is changed, **when** another customer views the product catalogue, **then** the standard catalogue price is unaffected.

### FR-13: Price Re-Evaluation After Specification Changes
- **Given** a customer requests a specification change that affects cost, **when** Raazia begins price discussions, **then** the order can be placed On Hold and must not proceed under outdated terms.
- **Given** a revised price has been discussed but not accepted by both parties, **when** the order price is viewed, **then** the revised amount is not represented as the new Approved Price.
- **Given** Raazia and the customer mutually agree to the revised price, **when** Raazia records the agreement, **then** the revised amount becomes the Approved Price and the previous price information remains available.
- **Given** no mutually acceptable price is reached and Raazia determines that proceeding would cause financial loss, **when** she records cancellation, **then** the order can be marked Cancelled without the system calculating financial loss automatically.

### FR-14: Independent Order, Payment, and Delivery Statuses
- **Given** an order’s manufacturing status is Completed, **when** delivery status is checked, **then** it may remain not Delivered until delivery is recorded.
- **Given** an order’s delivery status is Delivered, **when** manufacturing status is checked, **then** delivery does not itself set or redefine manufacturing status.
- **Given** an order status is changed, **when** payment and delivery statuses are retrieved, **then** neither is automatically changed solely because of the order-status update.
- **Given** a payment state is recorded, **when** manufacturing or delivery status is retrieved, **then** those statuses remain unchanged unless separately updated by an authorized user.

### FR-15: Delivery Fees, Courier-Fee Changes, Cancellation, and Refund Recording
- **Given** an order uses direct local in-person handover, **when** Raazia records its delivery method, **then** no additional delivery fee is charged under the agreed rule.
- **Given** an order uses courier/service delivery, **when** Raazia finalizes the Approved Price, **then** the applicable delivery fee is included in the order total.
- **Given** a pre-dispatch courier fee increases by less than PKR 200, **when** the revised fee is recorded, **then** Raazia absorbs the increase and the customer is not charged the increase.
- **Given** a pre-dispatch courier fee increases by PKR 200 or more, **when** Raazia identifies the increase, **then** the customer is notified and agreement is obtained before the Approved Price is revised and the parcel is dispatched.
- **Given** a significant courier-fee increase is not accepted by the customer, **when** the issue remains unresolved, **then** the parcel is not dispatched using the revised price.
- **Given** an unexpected additional courier charge arises after the parcel has been handed to the courier, **when** the charge is recorded, **then** Raazia absorbs the charge rather than adding it to the customer’s Approved Price.
- **Given** a cancellation or refund outcome is approved by Raazia, **when** she records the outcome, **then** cancellation and refund information is stored separately from manufacturing status.

### FR-16: Customer Wishlist Management
- **Given** a customer is not logged in, **when** the customer attempts to add, view, or remove wishlist items, **then** the system requires the customer to log in before allowing wishlist management.
- **Given** a customer is logged in and viewing a product in the catalogue, **when** the customer adds that product to their wishlist, **then** the product is saved to that customer’s personal wishlist without submitting an inquiry or order request.
- **Given** a logged-in customer has saved products in a wishlist, **when** the customer opens the wishlist, **then** the customer can view the saved products.
- **Given** a logged-in customer has saved wishlist items, **when** the customer closes the application or ends the session and later logs in again, **then** the saved wishlist items remain available.
- **Given** a product is in a customer’s wishlist, **when** the customer removes that product, **then** the product is removed from that wishlist and no inquiry or order request is submitted.

### FR-17: Estimated Completion Date Recording and Display
- **Given** an order is confirmed and no estimated completion date has been entered, **when** the customer views the order, **then** the system displays “Not yet provided” alongside the current manufacturing status.
- **Given** an order is confirmed, **when** Raazia records an estimated completion date, **then** the date is saved against that order and displayed to the corresponding customer.
- **Given** an estimated completion date has already been recorded, **when** Raazia updates it, **then** the latest saved date replaces the previous estimate for customer-facing display.
- **Given** a customer views one of their confirmed orders, **when** the order details are displayed, **then** the latest estimated completion date is shown alongside the current manufacturing status.
- **Given** a customer attempts to view another customer’s order, **when** access is checked, **then** the customer cannot view that order’s estimated completion date or manufacturing status.

### FR-18: Sales Summary by Date Range
- **Given** Raazia selects a start date and end date, **when** she generates the sales summary, **then** both dates are included in the reporting period and the system interprets the date range using Pakistan Standard Time (PKT).
- **Given** an order’s confirmation date falls within the selected inclusive date range in PKT, **when** the sales summary is generated, **then** that order is included in the confirmed-order count even if it was subsequently cancelled.
- **Given** an order was confirmed and subsequently cancelled, and its confirmation date falls within the selected inclusive date range in PKT, **when** the sales summary is generated, **then** it is included in the cancelled-order count as well as the confirmed-order count.
- **Given** an order was never confirmed, **when** the sales summary is generated, **then** it is not included in either the confirmed-order count or the cancelled-order count.
- **Given** confirmed orders in the selected date range include orders that have not been cancelled, **when** the sales summary is generated, **then** the total Approved Price is calculated from confirmed non-cancelled orders only.
- **Given** a confirmed order has been cancelled, **when** the sales summary total Approved Price is calculated, **then** that cancelled order’s Approved Price is excluded from the total.
- **Given** the sales summary displays a total Approved Price, **when** the report is viewed or exported, **then** the amount is identified as Approved Price/order value and is not labelled or treated as payments received.

### NFR-01: Basic Access Control
- **Given** two customer accounts and one Raazia account exist, **when** the predefined access-control tests are run, **then** each customer is prevented from accessing the other customer’s restricted records and from performing Raazia-only actions.
- **Given** Raazia is authenticated with the authorized role, **when** she performs an allowed management action, **then** the action is available to her.

### NFR-02: Basic Data Persistence
- **Given** representative product, inquiry, order, price, payment, and delivery records have been saved, **when** the application is closed and reopened, **then** those records remain retrievable.
- **Given** a saved record is retrieved after restart, **when** its saved fields are compared with the pre-restart record, **then** the stored values match.

### NFR-03: Essential Data Integrity
- **Given** an order has separate order, payment, and delivery statuses, **when** each status is updated independently, **then** the other two statuses remain unchanged unless separately updated.
- **Given** a valid fixed whole-PKR public-sale discount is configured, **when** the discount is calculated, **then** the displayed result equals Standard Catalogue Price minus that fixed amount.

### NFR-04: Basic Usability for Core Tasks
- **Given** a representative tester is provided with the approved task checklist, **when** the tester reviews an inquiry, records an order decision, updates an order status, and records an agreed price, **then** each task can be completed through the interface without directly editing the database or application code.
- **Given** the usability demonstration is complete, **when** the checklist is reviewed, **then** task completion outcomes and observed difficulties are recorded.

## 14. TA Clarifications Incorporated

The TA reviewed Version 1.2 and provisionally validated the PRD subject to the following clarifications. These decisions have been incorporated into the functional requirements, business rules, and acceptance criteria; the related open questions are therefore resolved:

1. **Wishlist access and persistence:** Customers must be logged in to manage personal wishlists. Wishlist items remain saved across sessions.
2. **Estimated completion date:** Raazia may confirm an order without entering an estimate immediately. Until an estimate is provided, the customer-facing system displays “Not yet provided.”
3. **Sales-summary date basis:** The order confirmation date determines whether an order falls within the selected date range.
4. **Date-range boundaries and timezone:** Both start and end dates are inclusive. The reporting period uses Pakistan Standard Time (PKT).
5. **Confirmed-order count:** Count all orders confirmed within the selected confirmation-date range, including orders subsequently cancelled.
6. **Cancelled-order count:** Count only orders that were previously confirmed and subsequently cancelled, using the same confirmation-date range. These orders are included in both the confirmed-order count and the cancelled-order count.
7. **Approved Price total:** Include only confirmed non-cancelled orders. Exclude cancelled orders from this total; do not treat the total as payments received.

## 15. Implementation Decisions Added on 18 November 2026

- Public sale discount: one fixed PKR amount, applied uniformly to all listed products; positive whole rupees; must be less than every listed product's Standard Catalogue Price; no percentage or stacked discounts.
- Negotiation history: persisted as append-only `NegotiationEntry` child records linked to one `Customization` (one Customization to zero-or-many entries). Each entry stores proposer, proposed amount, optional note, and timestamp.
- Initial payment and delivery statuses: nullable until manually recorded; display `Not yet recorded`. No invented `Unpaid` or `Pending` default.
- Delivery status: nullable until Raazia records completion; `Delivered` is the only completed delivery status required by the PRD. Dispatch and tracking details are separate delivery information.
- Payment states remain manual. The system does not enforce an advance amount or payment percentage.
- These decisions are recorded in ADR-005 and reflected in architecture.md, AGENTS.md, and Guardrails.md.

## 16. Traceability and Consistency Check

- FR-01 through FR-18 and NFR-01 through NFR-04 are included with corresponding acceptance criteria.
- FR-16 through FR-18 incorporate the three additional requirements supplied by the TA and the subsequent clarifications provided for provisional validation.
- Only logged-in customers can manage wishlists; wishlist contents persist across sessions, and wishlist actions do not submit inquiries or create order requests.
- If no estimated completion date has been recorded, the customer sees “Not yet provided”; otherwise, the latest Raazia-recorded estimate is displayed alongside manufacturing status.
- Sales summaries use inclusive confirmation-date ranges in PKT; confirmed-order counts include subsequently cancelled orders, cancelled-order counts include only previously confirmed orders cancelled later, and cancelled orders are excluded from the Approved Price total.
- The sales-summary Approved Price total is an order-value figure and is not treated as payments received.
- “Completed” consistently means manufacturing is finished and is separate from delivery status “Delivered”.
- Payment states are recorded manually; automated percentage enforcement and online payment processing are excluded.
- The PKR 200 courier-fee threshold is applied consistently: increases below PKR 200 are absorbed by Raazia; increases of PKR 200 or more are significant and require customer notification and agreement before dispatch.
- Public sale discount is one fixed whole-rupee PKR amount subtracted from every listed product; percentage and stacked discounts are not supported.
- Cancellation/refund recording remains manual and does not imply automatic refund calculation or execution.

**End of PRD**
