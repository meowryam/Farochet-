# Starter Component Usage Examples

The snippets assume React and that the shared styles from `styles/global.css` are imported once at the app entry point.

## Button

```jsx
import Button from "../components/ui/Button";

<Button variant="primary" onClick={handleSubmit}>Submit Inquiry</Button>
<Button variant="outline" onClick={goBack}>Cancel</Button>
<Button variant="danger" onClick={removeItem}>Remove</Button>
```

## TextField

```jsx
import TextField from "../components/ui/TextField";

<TextField
  id="email"
  label="Email address"
  type="email"
  value={email}
  onChange={(event) => setEmail(event.target.value)}
  required
  error={emailError}
/>
```

## Card and StatusBadge

```jsx
import Card from "../components/ui/Card";
import StatusBadge from "../components/ui/StatusBadge";

<Card title="Inquiry details" description="Review the submitted information">
  <StatusBadge label={record.status} tone="pending" />
</Card>
```

The feature supplies the actual approved status label. The example `pending` tone is visual only; it must not be used to invent a business status.

## Crochet flower decoration

```jsx
import CrochetFlower from "../components/brand/CrochetFlower";

<section className="hero-section">
  <div className="hero-section__copy">...</div>
  <img src={productImage} alt="Crochet flower bouquet" />
  <CrochetFlower size={84} />
</section>
```

Ensure the section is positioned/styled so the decoration cannot cover text or controls. The illustration itself is decorative and has `aria-hidden="true"`.

## CustomerHeader

```jsx
import CustomerHeader from "../components/layout/CustomerHeader";

<CustomerHeader
  currentPath="/catalogue"
  links={[
    { label: "Catalogue", href: "/catalogue" },
    { label: "Custom Request", href: "/custom-request" },
  ]}
/>
```

Update route URLs to match the actual router. Do not add a cart link unless the PRD is changed.

## AdminSidebar

```jsx
import AdminSidebar from "../components/layout/AdminSidebar";

<AdminSidebar activeKey="orders" />
```

The starter navigation is only a proposed starting point. Ensure each destination exists and the menu contains only implemented/approved screens.

## Important

These are presentational React components. They do not call APIs, fetch data, calculate prices, enforce permissions, or persist records. Feature owners connect them to the approved presentation/controller boundary and keep business rules in the Business Logic Layer.

## CustomerShell and AdminShell

```jsx
import CustomerShell from "../components/layout/CustomerShell";

<CustomerShell>
  <main className="farochet-container">Your customer screen...</main>
</CustomerShell>
```

```jsx
import AdminShell from "../components/layout/AdminShell";

<AdminShell activeKey="orders">
  <h1>Orders</h1>
  {/* Your feature-owned order screen goes here. */}
</AdminShell>
```

`AdminShell` is a layout wrapper only. The feature screen remains responsible for displaying the correct data and calling the approved controller/API boundary.

## FloralSprig

```jsx
import FloralSprig from "../components/brand/FloralSprig";

<div className="section-decoration" aria-hidden="true">
  <FloralSprig width={100} />
</div>
```

Use only at a section edge/corner. Position it with CSS and ensure it does not overlap interactive or readable content.
