# Farochet Shared UI Component Catalog

**Version:** 1.1  
**Status:** Draft for team review  
**Purpose:** Define the reusable frontend components, their boundaries, suggested APIs, and ownership.

---

## 1. Where the component library lives

The component library belongs inside the group's **one shared frontend project**. It is not a separate GitHub repository and does not need to be published as an npm package.

Suggested React structure (adapt it to the actual approved repository):

```text
frontend/src/
├── components/
│   ├── ui/                  # generic shared UI primitives
│   ├── layout/              # customer/admin shells and navigation
│   └── brand/               # Farochet logo and floral/yarn decorations
├── features/
│   ├── catalogue/
│   ├── wishlist/
│   ├── inquiries/
│   ├── custom-requests/
│   ├── orders/
│   ├── availability/
│   ├── pricing/
│   └── sales-summary/
├── pages/                   # route-level screens, if used
└── styles/
    ├── tokens.css
    ├── global.css
    └── components.css
```

These folders are all part of the Presentation Layer. They do not create additional backend or Business Logic components.

## 2. Three categories of frontend components

### 2.1 Shared UI primitives — `components/ui/`

Generic controls and surfaces that can be reused by multiple features. They must not know about Inquiry, Order, Pricing, or other business concepts.

| Component | Responsibility | Priority |
|---|---|---|
| `Button` | Consistent button variants, sizes, and states | First |
| `IconButton` | Accessible icon-only action | First |
| `TextField` | Labelled single-line field | First |
| `TextArea` | Labelled multi-line field | First |
| `SelectField` | Labelled selection control | First where required |
| `Checkbox` / `RadioGroup` | Accessible selection controls | As required |
| `Card` | Shared neutral content surface | First |
| `Badge` | Neutral/semantic visual label | First |
| `StatusBadge` | Display an approved status label with mapped presentation tone | First |
| `Alert` | Success, information, warning, error feedback | First |
| `EmptyState` | Shared no-record state | First |
| `Modal` | Accessible dialog shell | When a workflow requires one |
| `DataTable` | Reusable admin table presentation | When multiple screens need one |
| `LoadingState` | Shared loading/skeleton treatment | First |
| `Pagination` | Page navigation for long lists | Only if needed and approved |
| `FilePicker` | Shared file selection surface for reference images | When custom-request implementation needs it |

Do not build all possible primitives in advance. Implement the smallest set needed by accepted screens and extend only when a real slice requires it.

### 2.2 Shared layout components — `components/layout/`

| Component | Responsibility |
|---|---|
| `CustomerShell` | Customer page layout containing header, content, and footer |
| `CustomerHeader` | Shared customer navigation and utility actions |
| `CustomerFooter` | Shared Farochet footer |
| `AdminShell` | Private admin layout around a screen |
| `AdminSidebar` | Deep-plum admin navigation |
| `AdminTopbar` | Admin page top bar and approved account actions |
| `PageHeader` | Consistent title, description, and optional action area |
| `ContentContainer` | Consistent maximum width and page gutters |
| `Breadcrumbs` | Contextual page navigation where useful |

Customer and admin shells intentionally have different structures but use the same brand tokens and component styles.

### 2.3 Brand and decorative components — `components/brand/`

| Component | Responsibility |
|---|---|
| `FarochetLogo` | Brand wordmark and optional approved yarn/heart mark |
| `CrochetFlower` | Small reusable stitched crochet-flower illustration |
| `FloralSprig` | Botanical stem/flower detail for section edges |
| `FloralDecoration` | Responsive decorative wrapper that hides purely decorative art from assistive technology |

Decorative components must not contain business logic or become clickable unless the design explicitly requires a link.

### 2.4 Feature-specific components — `features/<feature>/`

These components understand one part of the product and should live with that feature. They reuse shared primitives rather than recreating them.

| Feature folder | Example components |
|---|---|
| `catalogue/` | `ProductCard`, `ProductGrid`, `ProductGallery`, `ProductSummary` |
| `wishlist/` | `WishlistItem`, `WishlistList` |
| `inquiries/` | `InquiryForm`, `InquiryRow`, `InquirySummary`, `InquiryDetailsPanel` |
| `custom-requests/` | `CustomRequestForm`, `ReferenceImageField`, `SpecificationSummary`, `NegotiationPanel`, `RequestDecisionPanel` |
| `orders/` | `OrderSummary`, `OrderDetailsPanel`, `OrderStatusPanel`, `PaymentRecordForm`, `DeliveryDetailsPanel` |
| `availability/` | `AvailabilityNotice`, `AvailabilityEditor` |
| `pricing/` | `StandardPriceField`, `PublicDiscountEditor`, `PriceBreakdown` |
| `sales-summary/` | `SalesDateRange`, `SalesMetricCard`, `SalesSummaryTable` |

Do not put `ProductCard`, `InquiryForm`, or `OrderStatusPanel` in the generic `ui/` folder. They understand domain-specific content and belong with their feature.

---

## 3. Shared component contracts

These are proposed React APIs. The exact prop naming may be adapted to the selected stack; the responsibilities and visual behavior should stay consistent.

### 3.1 Button

```jsx
<Button variant="primary" size="md" type="button" disabled={false}>
  Explore Catalogue
</Button>
```

Props:
- `variant`: `primary | secondary | outline | ghost | danger`;
- `size`: `sm | md | lg`;
- `type`: `button | submit | reset`;
- `disabled`: boolean;
- `loading`: boolean;
- `fullWidth`: boolean;
- `onClick`: callback;
- `children`: visible label/content.

Rules: native `<button>` semantics; primary action uses Deep Plum and white text; no clickable `div`; visible focus; disabled/loading state must be clear.

### 3.2 IconButton

```jsx
<IconButton label="Open wishlist" onClick={openWishlist}>
  <HeartIcon aria-hidden="true" />
</IconButton>
```

Props: `label` (required accessible name), `variant`, `size`, `disabled`, `onClick`, `children` icon.

Rules: no icon-only action without a programmatic accessible name; keep target around 40–44 px.

### 3.3 TextField

```jsx
<TextField
  id="customer-email"
  label="Email address"
  type="email"
  value={email}
  onChange={setEmail}
  required
  error={emailError}
/>
```

Props: `id`, `name`, `label`, `type`, `value`, `onChange`, `placeholder`, `required`, `helpText`, `error`, `disabled`, `autoComplete`.

Rules: visible label, associated help/error text, standard field height, shared focus treatment.

### 3.4 TextArea and SelectField

Use the same conventions as `TextField`. A placeholder is not a substitute for a visible label. Options must come from approved UI/business data; do not invent status options inside the component.

### 3.5 Card

```jsx
<Card title="Product information" description="Catalogue details">
  {children}
</Card>
```

Responsibilities: background, border, radius, padding, optional heading/description/action slots. It must not fetch data or know what an Order/Inquiry is.

### 3.6 Badge and StatusBadge

```jsx
<StatusBadge label={record.status} tone={statusTone(record.status)} />
```

Rules:
- caller supplies the actual approved label;
- shared tone mapping controls visual colours;
- no status label or workflow value is invented in the generic component;
- manufacturing/order, payment, and delivery statuses remain separate values and panels.

### 3.7 Alert

Props: `tone: success | info | warning | error`, `title`, `message`, optional `children` or dismiss callback.

Rules: presentational feedback only; never use an alert to perform a business decision.

### 3.8 EmptyState

Props: `title`, `description`, optional `action`, optional illustration.

Rules: customer-facing empty states may include one small crochet flower; admin empty states remain minimal.

### 3.9 Modal

Props: `open`, `title`, `description`, `onClose`, action/footer slot.

Rules: keyboard accessible, focus managed, Escape behavior appropriate to the action, and clear destructive confirmation copy.

### 3.10 DataTable

Props: `columns`, `rows`, `loading`, `emptyState`, optional row-action slot.

Rules: presentational only; data retrieval, filtering authorization, and business logic live outside the table. Provide mobile behavior and accessible table headings.

### 3.11 FloralDecoration / CrochetFlower

Props: `kind`, `size`, `className`, optional `placement` or `tone` constrained to approved tokens.

Rules: purely decorative artwork must be `aria-hidden="true"`; never obscure controls, prices, tables, labels, or form validation. Use one consistent illustrated style.

---

## 4. Shared layout contracts

### CustomerHeader

- Wordmark left; catalogue/custom-request navigation; account and wishlist actions right.
- No cart icon unless the PRD is formally changed.
- Mobile menu must be keyboard accessible.

### CustomerFooter

- Farochet identity, approved navigation links, and approved static information only.
- Do not invent shipping guarantees, policies, newsletter subscription, or social integrations.
- Small crochet floral/yarn decorations may appear at the outer edges.

### AdminSidebar

- Deep Plum background; white/light text; distinct active state.
- Navigation labels reflect actual implemented screens.
- No decorative floral wallpaper.
- Sidebar becomes a drawer on mobile.

### AdminTopbar / PageHeader

- Neutral surface, restrained search only if functional, clear page title and optional primary action.
- Do not add decorative non-functional controls.

---

## 5. When should a component be shared?

Promote a component into the shared library when:

- at least two screens/features need the same presentation/interaction; or
- it is a core design primitive used across the application; or
- the team wants to enforce one consistent implementation for a common control.

Keep it feature-specific when:

- it has domain-specific fields or workflow behavior;
- it is used only by one feature and is unlikely to repeat; or
- making it generic would require many unrelated props.

Do not build a large universal component with dozens of flags. Prefer several small components with clear responsibilities.

---

## 6. Shared ownership and Git rules

| Work item | Responsibility |
|---|---|
| Brand palette, typography, floral-detail standard | UI coordinator proposes; team approves |
| `tokens.css` and global visual baseline | UI coordinator coordinates |
| Initial generic Button/Input/Card/Badge primitives | UI coordinator or agreed shared owner |
| Customer/Admin shells | UI coordinator coordinates; members review |
| Feature-specific components | Slice owner |
| Proposal for new shared primitive | Proposing member; UI coordinator reviews |
| Change to shared component behavior/API | Discuss before merge; update examples/tests/docs |
| Final cross-screen consistency review | UI coordinator plus feature owners |

Rules:
- Do not have all four members independently editing the same shared component or token file in parallel.
- Feature owners may propose a shared change through a pull request or team discussion.
- Do not create duplicate `Button`, `TextField`, `Card`, or `StatusBadge` components.
- Keep shared components backwards-compatible where practical; coordinate breaking changes.
- UI coordination does not make one member responsible for implementing every feature screen.

---

## 7. Component implementation order

1. `tokens.css` and global typography/reset;
2. `FarochetLogo`, `CrochetFlower`, `FloralSprig`, and `FloralDecoration`;
3. `Button` and `IconButton`;
4. `TextField`, `TextArea`, and `SelectField`;
5. `Card`, `Badge`, and `StatusBadge`;
6. `Alert`, `EmptyState`, and `LoadingState`;
7. `CustomerHeader`, `CustomerFooter`, and `CustomerShell`;
8. `AdminShell`, `AdminSidebar`, and `AdminTopbar`;
9. `Modal` and `DataTable` when real screens require them;
10. Feature-specific components as slices are implemented.

---

## 8. Component acceptance checklist

- [ ] Uses approved design tokens; no arbitrary hex values.
- [ ] Has one clear responsibility.
- [ ] Reuses shared primitives rather than copying styles.
- [ ] Has accessible labels/names and visible focus.
- [ ] Supports disabled/loading/error/empty states where relevant.
- [ ] Works on mobile and desktop where relevant.
- [ ] Does not contain business rules, authorization decisions, or direct data access.
- [ ] Does not duplicate an existing shared component.
- [ ] Has been demonstrated in a real screen or component showcase.
- [ ] Has usage documented if its API is not self-evident.

**End of Component Catalog.**
