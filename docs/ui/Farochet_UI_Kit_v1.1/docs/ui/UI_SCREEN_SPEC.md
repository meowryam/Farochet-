# Farochet Screen-by-Screen UI Specification

**Version:** 1.1  
**Status:** Draft for team review and approval  
**Companion:** `UI_GUIDELINES.md`  
**Purpose:** Tell each slice owner what each screen should display and how users move through it.

> This document is intentionally screen-specific. The shared visual rules live in `UI_GUIDELINES.md`; component reuse rules live in `UI_COMPONENT_CATALOG.md`. The screen layouts below are presentation guidance, not permission to create new business capabilities. Verify exact FR references against the current PRD v1.3 in the team's repository before final sign-off.

---

## 1. Screen design principles

1. A screen should support one clear user goal.
2. Use the same design tokens and shared components on every screen.
3. Do not repeat business rules in frontend components. The backend remains authoritative.
4. Show only the data the current role is allowed to see.
5. Distinguish Inquiry, Pending Order Request, and confirmed Order. They are not interchangeable.
6. Keep Standard Catalogue Price, public discount, Negotiated Price, and Approved Price visually distinct.
7. Keep the three Order statuses in separate controls/panels: Manufacturing/Order, Payment, and Delivery.
8. Do not invent status values, calculations, fields, or workflows. Use the PRD's exact terms.
9. Every list screen needs loading, empty, error, and populated states.
10. Every form needs validation, submitting, success, and failure states.

## 2. Shared screen shells

### 2.1 Customer shell

- CustomerHeader at the top.
- Main content inside a centered ContentContainer.
- PageHeader or hero section according to the screen.
- CustomerFooter at the bottom.
- Crochet floral decoration may appear in the hero, section edges, custom-request banner, or empty states according to `UI_GUIDELINES.md`.

### 2.2 Admin shell

- AdminSidebar on the left (drawer on smaller screens).
- AdminTopbar across the workspace.
- PageHeader at the start of each route.
- Main content uses responsive cards, forms, lists, or tables.
- No large decorative floral art inside data-dense screens.

---

# Part A — Customer-facing Farochet website

## C-01 — Customer Home / Landing Page

**Purpose:** Introduce Farochet and provide clear entry points to catalogue browsing and custom requests.

**Layout:**
1. CustomerHeader with Farochet logo, catalogue navigation, custom-request navigation, account, and wishlist.
2. Hero section with a large crochet-flower photograph or editorial crochet still life on the right and a headline/subtitle on the left.
3. Primary CTA: `Explore Collection` (Deep Plum button).
4. Secondary CTA: `Submit a Custom Request` (outline button).
5. Optional business-availability notice using the latest saved Raazia availability, if this is part of the approved customer display.
6. Category/collection preview based on actual catalogue data.
7. A restrained custom-request banner with yarn/crochet imagery and one floral illustration.
8. Optional catalogue preview using actual catalogue items; do not label items “best sellers” unless that ranking is an approved/manual data feature.
9. CustomerFooter.

**Visual treatment:** Warm Cream canvas, Deep Plum typography/actions, a large crochet-flower illustration or photograph, small flower details at the outer edges, and generous whitespace.

**States:** Loading catalogue preview; catalogue empty; normal populated page; availability not yet entered (show approved neutral wording rather than inventing availability).

**Rules:** No unapproved free-shipping strip, cart, checkout, ratings, review counts, stock counters, or made-up product counts/revenue figures.

**Traceability:** Public catalogue and customer entry points; verify exact FR mapping in PRD v1.3.

## C-02 — Product Catalogue

**Purpose:** Let customers browse available catalogue products and their approved public information.

**Layout:**
- CustomerHeader.
- Page heading: `Our Collection` or approved equivalent.
- Product grid using ProductCard.
- Product image, product name, description/summary, Standard Catalogue Price, applicable public-discount presentation, and any approved availability/business notice.
- Category/search/filter controls only if included in the agreed implementation scope; keep them simple and functional.
- Wishlist action where permitted for the signed-in customer.
- CustomerFooter.

**Visual treatment:** Soft Surface product cards on Warm Cream. Images should have consistent aspect ratio and warm neutral backgrounds. Small floral decoration may sit beside the section title, not inside every product card.

**States:** Loading; no products; filtered/search result empty if filtering is implemented; request failed; populated catalogue.

**Rules:** Do not show stock quantities or “In Stock/Low Stock” unless specifically approved. Do not imply Raazia's business availability is product/material inventory. Discounted price must be supplied by Pricing and Discount Management; do not calculate it in React.

**Traceability:** Product catalogue, standard price, public discount, and customer display requirements.

## C-03 — Product Details

**Purpose:** Show the full information for one selected catalogue product.

**Layout:**
- CustomerHeader and breadcrumb/back-to-catalogue link.
- Product image/gallery area, with thumbnails only if multiple images exist.
- Product name, description, Standard Catalogue Price, public discount and displayed price as returned by the backend, plus relevant product information.
- Primary action: `Submit Inquiry`.
- Secondary action: `Request a Custom Change` or `Submit Custom Request` only where the PRD permits the relevant request type.
- Wishlist action where applicable.
- CustomerFooter.

**Rules:** Do not show cart/checkout, shipping promise, ratings/reviews, stock quantity, or unsupported delivery estimate. Do not merge the standard price and order-specific Approved Price.

**States:** Product not found; loading; image unavailable; normal details.

## C-04 — Customer Sign In

**Purpose:** Authenticate an existing customer.

**Layout:**
- Small Farochet logo and a restrained two-column/stacked layout.
- Form card with email/username and password fields matching the approved authentication contract.
- Primary `Sign In` button.
- Registration navigation if customer registration is supported.
- No ornamental art behind the form; a small side illustration is acceptable on desktop.

**Rules:** Do not expose admin sign-in/registration as a customer option unless the team approves the route arrangement. Error copy must not reveal whether a particular account exists. Backend security is authoritative.

**States:** Idle, submitting, invalid credentials, validation error, server error, successful redirect.

## C-05 — Customer Registration

**Purpose:** Create a customer account where customer registration is part of the approved authentication implementation.

**Layout:**
- Same form styling as sign in.
- Only fields required by the approved PRD/authentication contract.
- Clear `Create Account` primary button and link to Sign In.

**Rules:** No additional profile fields or marketing-consent features unless approved. No public Raazia/admin registration.

**States:** Idle, validation, submitting, duplicate/invalid details as returned by backend, server error, success.

## C-06 — Submit Customer Inquiry

**Purpose:** Let a customer submit a product-related or general inquiry.

**Layout:**
- PageHeader and short explanation.
- Optional selected-product summary if launched from Product Details.
- Inquiry form with only required contact/context fields and message/details fields from the approved PRD.
- Primary `Submit Inquiry` action.
- Clear confirmation state after successful creation.

**Visual treatment:** Soft Surface form card, Deep Plum button, subtle small crochet-flower illustration near the heading only.

**Rules:** An inquiry is not a confirmed order. Do not create a chat or in-app messaging interface. Do not promise a response time unless the PRD/team has defined one.

**States:** Empty form, validation errors, submitting, success with inquiry reference if provided, failure with retry.

## C-07 — Customer Inquiry History

**Purpose:** Let an authenticated customer see only their own submitted inquiries.

**Layout:**
- PageHeader: `My Inquiries`.
- List/table of inquiry reference, submission date, related product/topic, and only those status/details actually stored and approved.
- `View Details` action.
- Empty state with a small crochet-flower illustration and link to Submit Inquiry.

**Rules:** Never show another customer's inquiries. Do not invent an inquiry status vocabulary. The inquiry remains retained whether or not it leads to a custom request or confirmed Order.

**States:** Loading, empty, failure, populated.

## C-08 — Inquiry Details

**Purpose:** Show one inquiry and its recorded details to its owner.

**Layout:**
- Inquiry reference and date.
- Original inquiry message/details.
- Related product summary, if any.
- Relevant recorded information.
- Related custom request or Order link only where a real relationship exists and the customer is allowed to see it.

**Rules:** Do not turn this into a messaging timeline. Do not imply every inquiry becomes an order.

## C-09 — Submit Custom-Order Request

**Purpose:** Let a customer submit specifications for a custom creation/change.

**Layout:**
- Heading and short explanation.
- Form grouped into sections: requested item/design, specifications, reference image (optional where supported), and additional request information.
- Show fields only where supported by PRD: product/type, size, colour, materials, quantity, budget, instructions, required date, delivery address, and optional reference image.
- Clearly mark required versus optional according to the approved field rules.
- Primary `Submit Request` button.
- Post-submit confirmation that the request has been received for Raazia's review.

**Rules:** Submitting a request does not confirm an Order. Do not promise feasibility, price, or completion. Do not automatically accept a request. Use the approved reference-image file constraints only; do not invent file-size/type limits.

**States:** Validation, file selected/uploading where applicable, submitting, success, failure.

## C-10 — Customer Custom-Request History and Details

**Purpose:** Let a customer view their own custom-order requests and recorded decisions/details.

**Layout:**
- Request list with reference, date, concise description, and actual recorded decision/review state.
- Request detail with submitted specifications and reference image, if any.
- Negotiated-price information/revisions only to the extent approved for customer visibility.
- If accepted, show the resulting confirmed Order reference/detail as a separate entity.
- If rejected, keep the request visible in history and do not show an Order as created.

**Rules:** Clearly distinguish Pending Order Request from confirmed Order. Do not invent a separate quotation record/workflow if the PRD does not define one; present negotiation information within the relevant request/order context.

## C-11 — Wishlist

**Purpose:** Let a logged-in customer view and remove their own saved products.

**Layout:**
- PageHeader: `My Wishlist`.
- Product cards matching the catalogue design, with remove-from-wishlist action.
- Empty state with a small flower illustration and `Explore Catalogue` link.

**Rules:** Wishlist is customer-specific and persistent according to the PRD. Do not add cart or checkout actions unless a formal scope change authorizes them.

## C-12 — Customer Order History and Order Details

**Purpose:** Let a customer view their own confirmed orders and permitted order information.

**Layout:**
- Order history list with order reference/date, short item/request summary, Approved Price where customer-visible, and relevant current states.
- Order detail with agreed specifications, Approved Price, optional Estimated Completion Date, and permitted payment/delivery details.
- Three visually separate status panels: `Manufacturing / Order Status`, `Payment Status`, and `Delivery Status`.

**Rules:** A newly confirmed Order begins as `Incomplete` where specified. Never combine the three statuses into one badge or infer that manufacturing completion means delivery completion or full payment. Do not show internal-only notes or other customers' information.

---

# Part B — Raazia admin portal

## A-01 — Admin Sign In

**Purpose:** Allow the authorized Raazia administrator to enter the private management workspace.

**Layout:** Deep Plum brand panel or slim sidebar motif, Warm Cream workspace, Farochet Admin identity, and a compact sign-in card.

**Rules:** No public admin registration. All protected operations require backend middleware authorization. A hidden link is not a security boundary.

## A-02 — Admin Dashboard / Workspace Landing

**Purpose:** Provide Raazia with a starting point for daily management tasks.

**Layout:**
- AdminSidebar and AdminTopbar.
- PageHeader: `Dashboard`.
- Task-oriented shortcut cards to Product Management, Availability, Inquiries, Custom Requests, Orders, and Sales Summary.
- Recent inquiry/request/order summaries only if supported by actual backend data and access rules.
- Optional summary counts only if they are clearly defined and do not create a new reporting rule.

**Visual treatment:** Neutral canvas, white cards, Deep Plum accents, muted Lavender/Sage/Buttercream chart accents. Avoid decorative hero banners or made-up sales/revenue metrics.

**Rules:** The dashboard must not redefine FR-18. Do not label Approved Price totals as cash received or invent percentage growth metrics. Use real data only; no hard-coded demo numbers in production screens.

## A-03 — Product Management List

**Purpose:** Let Raazia review and maintain catalogue product information.

**Layout:**
- PageHeader with `Add Product` action.
- Table/list with product image, name, relevant description/category if present, and current catalogue visibility.
- Search/filter controls only if implemented and useful.
- Row actions: View/Edit, and any deletion/archival action only if permitted by requirements.

**Rules:** Product Management owns product information, images and descriptions. Do not add stock/inventory columns unless approved. Standard price and public-discount ownership remain with Pricing and Discount Management.

## A-04 — Product Create/Edit

**Purpose:** Create or update product catalogue information.

**Layout:**
- Form grouped into product information and image management.
- Fields only from approved product attributes (such as name, description, images and relevant catalogue categorization).
- Separate navigation/panel to Pricing and Discount Management rather than silently storing business price rules in product UI.
- Save/cancel actions.

**Rules:** Do not implement substantive validation or persistence rules only in React. Show server errors and preserve entered data on recoverable failure.

## A-05 — Pricing and Public Discounts

**Purpose:** Let Raazia maintain Standard Catalogue Price and approved public discount information.

**Layout:**
- Select a product or open its price section.
- Display Standard Catalogue Price as a distinct value.
- Discount controls for the approved discount forms (percentage-based or fixed-amount, where supported by PRD v1.3).
- Show the calculated public discounted display price returned by the business layer.
- Clear save/cancel feedback.

**Rules:** Standard Catalogue Price must not be overwritten by the discount. Do not calculate final display price in the UI. Do not implement unresolved rounding, discount precedence, or boundary behaviour by assumption. Negotiated Price and Approved Price belong to individual request/order contexts, not the public product price editor.

## A-06 — Raazia Availability Management

**Purpose:** Let Raazia manually maintain her own business availability information and show the latest saved information to customers where required.

**Layout:**
- PageHeader: `My Availability`.
- Simple form/list of manually entered availability periods or message, according to the approved data model.
- Current saved availability display and edit action.

**Rules:** This is Raazia's business availability, not product stock or material inventory. Do not add calendar synchronization, automatic schedule inference, or an assumed fixed cycle. Customers see only the approved public-facing availability information.

## A-07 — Inquiry Management List

**Purpose:** Let Raazia review submitted customer inquiries.

**Layout:**
- PageHeader: `Customer Inquiries`.
- Table/list with inquiry reference, date, customer identity/contact fields permitted by the PRD, related product/topic, and available recorded details.
- View Details action.
- Useful filters only where implemented against actual data.

**Rules:** Inquiries are independent records and must be retained whether or not they lead to requests/orders. Do not invent inquiry states or auto-convert inquiries.

## A-08 — Inquiry Details / Customer Context

**Purpose:** Let Raazia inspect an inquiry and relevant customer information needed to review/respond.

**Layout:**
- Inquiry detail panel with original message, date, related product, and customer context.
- Links to related request/order records only if a valid relationship exists.
- Clear separation between inquiry and any subsequent Pending Order Request or Order.

**Rules:** Do not create a chat interface. Avoid showing unrelated customer information.

## A-09 — Custom-Order Request Review

**Purpose:** Let Raazia review one pending request and assess its specifications.

**Layout:**
- Request reference/date and customer context.
- Submitted specification summary, requested design/type, reference image, size/colour/materials/quantity/budget/instructions/required date/delivery address where supplied.
- Feasibility/review area for Raazia's human decision.
- Controls to record specification revisions and negotiation information as allowed by the PRD.
- Clear Accept and Reject decision area.

**Rules:** The system records Raazia's decisions; it does not decide feasibility. A request awaiting decision is not a confirmed Order. Do not add automated recommendations or AI-based design feasibility.

## A-10 — Negotiation and Price Revision Panel

**Purpose:** Record Negotiated Price, revised specifications, and price-change history within the associated request/order context.

**Layout:**
- Original submitted specifications and current agreed/proposed specification summary.
- Negotiated Price as a distinct field.
- Price change history with date/time, previous value, proposed/revised value, and required explanatory information as supported by the PRD.
- Customer agreement indicator only when the agreement is actually recorded through the approved workflow.
- If an order is On Hold while renegotiation is unresolved, show that state clearly.

**Rules:** Do not overwrite Standard Catalogue Price. Do not treat a proposed Negotiated Price as Approved Price. Do not create a standalone quotation entity/workflow unless the approved PRD explicitly requires one. Do not update Approved Price before mutual agreement and Raazia's approval as specified.

## A-11 — Request Acceptance / Rejection

**Purpose:** Let Raazia record the decision on a Pending Order Request.

**Layout:**
- Concise review summary.
- Separate Accept and Reject actions, with accessible confirmation where needed.
- Optional free-text decision note only if allowed by PRD.
- Clear outcome confirmation and resulting reference.

**Rules:** Acceptance is the confirmation event and creates a separate confirmed Order with initial order status `Incomplete`. Rejection does not create an Order; the request remains retained. Do not make acceptance automatic or imply that merely opening the screen confirms the request.

## A-12 — Confirmed Order List and Details

**Purpose:** Let Raazia manage confirmed Orders.

**Layout:**
- Order list with reference, customer, confirmation date, summary, Approved Price, and status fields as appropriate.
- Detail page with the original Inquiry reference, accepted request/customization details, negotiated/approved prices, price history, optional Estimated Completion Date, and permitted customer/order information.
- Actions to update order information as authorized.

**Rules:** The confirmed Order directly references its original Inquiry. Keep Inquiry, Pending Order Request, and Order as distinct records. Estimated Completion Date is optional; do not block confirmation if it is absent. Do not change public Standard Catalogue Price from an order-specific screen.

## A-13 — Independent Order, Payment, and Delivery Status Management

**Purpose:** Let Raazia manually maintain the three independent status attributes and related payment/delivery records.

**Layout:**
- Order summary at the top.
- Three separate cards/sections with headings:
  1. `Manufacturing / Order Status`;
  2. `Payment Status`;
  3. `Delivery Status`.
- Each section has its own current value, update control, and save feedback.
- Payment section supports manual recording of payments/refunds as required by PRD.
- Delivery section supports manual delivery method/fee/status information as required by PRD.

**Rules:** Updating one status must not automatically update either of the other two. Use only exact PRD-defined status values. Do not add payment gateway or courier API integration.

**Delivery-fee presentation must preserve the approved business rules:**
- Local/in-city handover has no additional delivery fee.
- A courier delivery fee is included before the Approved Price is finalized.
- If a courier fee increases by PKR 200 or more before dispatch, the customer must be notified and their agreement recorded before the revised Approved Price is applied or dispatch proceeds.
- A pre-dispatch increase below PKR 200 is absorbed by Raazia.
- Unexpected fees arising after handover are absorbed by Raazia.

The UI may display the fee, notification/agreement step, and recorded decision where applicable. It must not independently decide who absorbs the fee or calculate/approve a revised Approved Price; the backend business rules remain authoritative.

## A-14 — Sales Summary

**Purpose:** Let Raazia view the business summary for a selected date range.

**Layout:**
- PageHeader: `Sales Summary`.
- Date-range control with clearly inclusive start/end dates.
- Summary cards for confirmed-order count, cancelled-order count, and total Approved Price according to FR-18.
- Optional simple chart/table if it displays the same defined metrics without changing their meaning.
- A concise explanation of the reporting basis.

**Rules:**
- Filter by Order confirmation date, not inquiry date, production completion date, payment date, or delivery date.
- Date boundaries are inclusive and interpreted in Pakistan Standard Time (PKT).
- Confirmed-order count includes orders confirmed in the selected range even if subsequently cancelled.
- Cancelled-order count includes cancelled orders from that same confirmed-order set.
- Total Approved Price excludes cancelled orders.
- Pending Order Requests are excluded.
- Total Approved Price represents order value, not cash received.
- Do not label the metric “revenue received”, “cash collected”, or “payments” unless the PRD separately defines it.

---

## 3. Reusable screen states

Every applicable screen must support:

- **Loading:** skeleton or restrained spinner; avoid layout jumps.
- **Empty:** explanatory text and a relevant next step if one exists.
- **Error:** concise message, retry where appropriate, no internal stack trace.
- **Success:** visible confirmation after backend success.
- **Disabled:** explain why an action is unavailable where useful.
- **Permission denied:** show a safe access message; never rely on UI hiding alone.
- **Not found:** clear message and a safe route back to the relevant list/catalogue.

## 4. Screen acceptance checklist

- [ ] Correct role and page shell are used.
- [ ] Screen follows `UI_GUIDELINES.md`.
- [ ] All visible fields/actions are supported by PRD requirements.
- [ ] Correct shared components are reused.
- [ ] Customer sees only their own restricted records.
- [ ] Inquiry, Pending Order Request, and Order are clearly distinguished.
- [ ] Standard, Negotiated, and Approved prices are clearly distinguished.
- [ ] Three order statuses remain visually and behaviorally separate.
- [ ] Loading, empty, error, and success states are handled.
- [ ] Keyboard navigation and mobile layout work.
- [ ] No unsupported cart, checkout, stock, ratings, free-shipping claims, or external integrations appear.

**End of Screen Specification.**
