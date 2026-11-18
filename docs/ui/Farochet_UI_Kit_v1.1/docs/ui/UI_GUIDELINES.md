# Farochet UI Guidelines

**Version:** 1.1  
**Design direction:** Lavender Garden — Warm Artisan Editorial  
**Status:** Draft for team review and approval  
**Applies to:** Farochet customer-facing website and Raazia's private administration portal  
**Visual references:** `visual-references/Farochet_Lavender_Garden_Homepage.png`, `visual-references/Earlier_Storefront_Admin_Layout_Reference_Not_Color_Standard.png`, and `visual-references/Previous_Approved_Layout_and_Floral_Detail_Reference.png`

> This is the shared visual and interaction standard. All team members and AI coding agents must follow it when implementing frontend work. It does not replace the PRD, architecture, ADRs, or root `AGENTS.md`.

---

## 1. Authority, terminology, and scope

### 1.1 Document authority

Use the project documents in this order:

1. **PRD v1.3** controls product scope, functional and non-functional requirements, terminology, business rules, permissions, and acceptance criteria.
2. **The current group-approved architecture and accepted ADRs** control layers, component boundaries, data ownership, and system interactions.
3. **Root `AGENTS.md`** controls AI-agent and repository implementation procedure.
4. **`UI_GUIDELINES.md`** controls shared visual styling and common interaction patterns.
5. **`UI_SCREEN_SPEC.md`** describes screen-level information architecture, content, states, and actions.
6. **`UI_COMPONENT_CATALOG.md`** defines reusable UI components, their responsibilities, and their ownership.
7. Visual references show the intended aesthetic; they are not functional requirements.

If these documents conflict, do not silently choose. Follow the higher-authority source and raise the conflict with the team.

### 1.2 Brand naming

- Customer-facing brand and wordmark: **Farochet**.
- Admin application label: **Farochet Admin**.
- **Raazia** is the business administrator/owner role. Do not use Raazia as the customer-facing storefront brand.
- Use the approved Farochet wordmark/logo asset when one is available. Until then, use the word “Farochet” in the specified display typeface. Do not use emoji as a logo.

### 1.3 Scope guardrail

The interface must support the approved product catalogue, pricing/discount display, Raazia's manually maintained business availability, customer inquiries, custom-order requests, wishlist, customer-specific records, confirmed orders, independent order/payment/delivery status recording, and sales summary.

Do not turn the application into a conventional online shop unless the PRD is formally changed. The reference images may contain visual examples of carts, checkout, free-shipping banners, stock indicators, ratings, reviews, marketing subscriptions, or sample sales figures. Those are **not automatically approved features**.

Unless explicitly required by the PRD, do not implement:

- add-to-cart, shopping cart, checkout, or customer self-service payment;
- payment gateway, courier booking/API, shipping-price automation, or external calendar integration;
- inventory quantity, stock counters, low-stock alerts, or product-stock availability;
- product ratings, reviews, customer review submission, or testimonials;
- promotional claims such as “free shipping” or delivery promises;
- customer/admin chat or in-app messaging;
- automatic feasibility decisions, automatic request acceptance/rejection, or automatic refund decisions;
- extra dashboards, reports, workflow states, filters, or account features that are not in the approved requirements.

A static informational section or navigation link may only be added where the team has agreed its content and it does not imply unsupported functionality.

---

## 2. Visual identity: Lavender Garden

### 2.1 Design personality

Farochet should feel:

- handcrafted, floral, and warm;
- gentle and colourful, not childish;
- elegant and editorial, not overly formal;
- visually distinctive, but easy to read and navigate;
- consistent across the customer and admin experiences.

Lavender is the defining brand colour. Deep plum supplies readable contrast and structure. Warm cream prevents the interface from feeling cold. Petal rose, sage, and buttercream bring the botanical/crochet character.

### 2.2 What to preserve from the reference

- Large, expressive serif display headings.
- Clean sans-serif navigation, body copy, controls, and tables.
- Warm cream page backgrounds and soft white content surfaces.
- Deep-plum rounded/pill primary buttons.
- Large, high-quality crochet product photographs.
- Detailed crochet-flower and botanical illustrations.
- Softly rounded cards and restrained shadows.
- A deep-plum admin sidebar with a calm cream workspace.
- Clear separation between customer shopping/browsing and admin operations.

### 2.3 Visual restraint

- Keep whitespace generous. Do not fill every blank area with colour or decoration.
- Use one main accent colour per section and no more than two supporting accents in the same section.
- Customer pages may be more expressive than admin pages.
- Admin data-entry and data-review screens must be calm, compact, and information-first.
- Do not use gradients, glassmorphism, neon colours, heavy textures, or multiple competing typefaces.
- Avoid decorative elements that reduce contrast, cover content, or distract from a task.

---

## 3. Exact colour system

**These are the v1.1 brand tokens. Do not locally substitute different hex values.** If a new shade is needed, propose it to the UI coordinator and update this file and `tokens.css` together.

### 3.1 Core brand palette

| Token | Hex | Role | Where it belongs |
|---|---|---|---|
| `--color-lavender` | `#A88FBE` | Main brand colour | Brand accents, selected decorative panels, illustration petals, small highlights |
| `--color-plum` | `#594064` | Primary dark brand colour | Primary buttons, logo text, links, active navigation, admin sidebar |
| `--color-lilac-mist` | `#EEE7F3` | Pale lavender surface | Soft section backgrounds, selected panels, subtle emphasis |
| `--color-cream` | `#FBF8F2` | Main page background | Customer and admin page canvas |
| `--color-petal-rose` | `#DDA6A6` | Floral accent | Flower petals, small decorative areas, soft highlights |
| `--color-sage` | `#91A58F` | Botanical accent | Floral leaves, calm accent panels, secondary decoration |
| `--color-buttercream` | `#E8CB84` | Warm highlight | Flower centres, small callouts, gentle emphasis |
| `--color-cocoa` | `#342E35` | Main text | Body copy, labels, headings on light surfaces |

### 3.2 Supporting neutrals and interaction colours

| Token | Hex | Role |
|---|---|---|
| `--color-surface` | `#FFFCF8` | White-warm surface for cards, forms, modals |
| `--color-surface-muted` | `#F4EFF4` | Very subtle tinted surface where needed |
| `--color-text-secondary` | `#665D68` | Secondary copy and helper text |
| `--color-border` | `#DED6E2` | Card and divider border |
| `--color-control-border` | `#85798A` | Visible input/select boundary |
| `--color-plum-hover` | `#473252` | Primary button hover/pressed state |
| `--color-danger` | `#A4473C` | Error and destructive action emphasis |
| `--color-white` | `#FFFFFF` | Text on Deep Plum and selected dark surfaces |

### 3.3 Semantic status colours

Semantic colours communicate the state of a record. They do **not** define or add business statuses. The visible status text must be the exact value returned by the approved business model/PRD.

| Semantic tone | Background | Text | Intended use |
|---|---|---|---|
| Pending / waiting | `#F4E7C4` | `#342E35` | A PRD-defined pending state |
| In progress / negotiating | `#EEE7F3` | `#594064` | A PRD-defined active or negotiation state |
| Accepted / completed | `#E5EDE3` | `#365846` | A PRD-defined positive state |
| Rejected / cancelled | `#F3DFDD` | `#823F3B` | A PRD-defined negative/closed state |
| On hold | `#E4DCEB` | `#594064` | The PRD-defined On Hold state |
| Informational | `#E8EAF0` | `#39445A` | Neutral informational messages only |

Do not create an `In Stock`, `Shipped`, `Delivered`, `Paid`, or other label just because the reference artwork contains it. Only display statuses and values supported by the PRD and implementation.

### 3.4 Strict colour usage rules

1. Warm Cream is the default page background.
2. Soft Surface is used for cards, forms, modals, data panels, and dropdown menus.
3. Deep Plum is the primary action colour. It is also the dark logo/brand text colour.
4. Lavender is the signature brand colour, but it is not the default primary-button fill. Use Deep Plum for primary actions to maintain clear contrast.
5. Lilac Mist is the preferred pale lavender section/background colour.
6. Petal Rose, Sage, and Buttercream are supporting accent colours. Use them selectively.
7. Cocoa is the default text colour. Do not use pale accent colours as body text.
8. Never use white text on Lavender, Petal Rose, Sage, Buttercream, or Lilac Mist for normal-sized text.
9. Never use pale Lavender or Rose as the only indication of a control boundary or focus state.
10. Never add arbitrary hex values to feature CSS. Use tokens.
11. Do not use different brand palettes for customer and admin portals.
12. Use semantic status tokens only with visible text labels; colour alone is insufficient.

### 3.5 Approved text contrast pairings

Ratios below are calculated from the specified hex values. WCAG 2.2 AA requires 4.5:1 for normal text and 3:1 for large text. Check actual components after implementation, including borders, focus indicators, disabled states, and text over photographs.

| Foreground | Background | Approx. ratio | Approved use |
|---|---|---:|---|
| White `#FFFFFF` | Deep Plum `#594064` | 8.97:1 | Primary buttons, admin sidebar text |
| Cocoa `#342E35` | Warm Cream `#FBF8F2` | 12.47:1 | Body text and headings |
| Cocoa `#342E35` | Lilac Mist `#EEE7F3` | 10.93:1 | Text on pale lavender panels |
| Cocoa `#342E35` | Lavender `#A88FBE` | 4.62:1 | Text on lavender; use normal text cautiously and validate actual rendering |
| Deep Plum `#594064` | Lilac Mist `#EEE7F3` | 7.41:1 | Links and labels on lilac |
| Cocoa `#342E35` | Petal Rose `#DDA6A6` | 6.35:1 | Text on rose panels |
| Cocoa `#342E35` | Sage `#91A58F` | 5.03:1 | Text on sage panels |
| Cocoa `#342E35` | Buttercream `#E8CB84` | 8.38:1 | Text on honey/cream panels |
| White `#FFFFFF` | Danger `#A4473C` | 5.92:1 | Destructive action button |

### 3.6 Approximate colour balance

Use as a visual guide rather than a rigid measurement:

- 55–65% Warm Cream and Soft Surface;
- 15–20% Deep Plum and Cocoa for readable structure;
- 8–12% Lilac Mist and Lavender;
- 5–8% Petal Rose and Sage;
- 2–5% Buttercream.

Customer pages may use more decorative accent areas. Admin pages should use more neutral surfaces and less colour.

---

## 4. Typography

### 4.1 Font pairing

- Display and headings: `DM Serif Display`, fallback `Georgia`, then serif.
- Body, navigation, labels, forms, tables, and buttons: `DM Sans`, fallback `Arial`, then sans-serif.
- Logo: approved Farochet wordmark asset; until then use DM Serif Display text.

The screenshot cannot identify exact font files. These families are the implementation choice to reproduce its appearance. Load them locally or from an approved source according to the team's dependency policy; do not distribute font files in this package.

### 4.2 Type scale

| Role | Desktop | Mobile | Style |
|---|---:|---:|---|
| Hero heading | 48–58 px | 34–40 px | DM Serif Display, regular, line-height 1.05–1.12 |
| Page heading | 34–38 px | 27–32 px | DM Serif Display, regular |
| Section heading | 26–30 px | 22–26 px | DM Serif Display, regular |
| Card heading | 18–21 px | 17–19 px | DM Serif Display or DM Sans semibold according to context |
| Body | 16 px | 16 px | DM Sans, line-height 1.5 |
| Form/table text | 14–15 px | 14–15 px | DM Sans, line-height 1.4–1.5 |
| Helper/caption | 12–13 px | 12–13 px | DM Sans; never essential information only |
| Button | 14 px | 14 px | DM Sans, semibold |

### 4.3 Typography rules

- Use sentence case for navigation, buttons, labels, and headings.
- Use italic serif for a short phrase in a hero heading only; do not italicize long blocks, form labels, or table content.
- Do not use all caps for paragraphs or long navigation labels. Short eyebrow labels may be uppercase with letter spacing.
- Keep body text readable and limit line length on wide screens.
- Align prices, dates, references, and numeric metrics consistently.
- Never shrink critical status or form text to fit a card; resize the layout instead.

---

## 5. Layout and spacing

### 5.1 Spacing scale

Use these values consistently:

| Token | Value |
|---|---:|
| `space-1` | 4 px |
| `space-2` | 8 px |
| `space-3` | 12 px |
| `space-4` | 16 px |
| `space-5` | 20 px |
| `space-6` | 24 px |
| `space-8` | 32 px |
| `space-10` | 40 px |
| `space-12` | 48 px |
| `space-16` | 64 px |

### 5.2 Main layout

- Maximum content width: 1200–1280 px.
- Desktop page gutters: 36–48 px.
- Tablet page gutters: 24 px.
- Mobile page gutters: 16 px.
- Customer pages should use generous vertical section spacing (48–72 px on desktop, 32–48 px on mobile).
- Admin pages may use denser spacing (24–32 px between sections) while preserving readable cards and tables.
- Use a consistent responsive grid. Do not set fixed widths that cause overflow.

### 5.3 Corners and shadows

| Element | Radius |
|---|---:|
| Small controls | 10–12 px |
| Buttons | Pill radius for primary/secondary CTA; 12 px for compact admin actions |
| Cards | 16 px |
| Large panels/hero containers | 20–24 px |
| Badges | 999 px pill |

Use soft, subtle shadows only: `0 4px 18px rgba(52, 46, 53, 0.07)`. Prefer a thin border over a stronger shadow. Do not stack multiple shadows.

---

## 6. Crochet-flower and botanical detailing (mandatory brand detail)

The crochet-flower detailing is a defining part of the chosen visual identity. Keep it visible and intentional across the customer-facing experience, not as a one-off homepage decoration.

### 6.1 Visual character

Decorative artwork should look like fine crochet or hand-drawn botanical embroidery:

- layered, rounded petals with visible stitched/ribbed texture;
- small flower centres in Buttercream or a contrasting warm tone;
- soft leaves and stems in Sage;
- occasional small lavender sprigs, yarn balls, thread trails, hearts, or tiny rosettes;
- a gentle hand-crafted line quality, not generic flat clip-art;
- colours drawn from the approved Lavender Garden palette only.

Use custom SVG illustrations or optimized transparent PNG/WebP assets. Prefer a small reusable set of original motifs over unrelated images collected from different styles. Do not use emoji as floral decoration.

### 6.2 Approved placement

Customer storefront:

- one larger floral/crochet illustration or product photograph in the hero area;
- small floral corner details around selected section headings;
- occasional small motifs near category panels, without covering category images or labels;
- one or two yarn/flower illustrations in the custom-request promotional banner;
- small botanical accents at the footer corners;
- a compact crochet-flower illustration in an empty state where it helps the page feel welcoming.

Customer forms and records:

- use only a tiny motif near the page heading or empty state;
- never place flowers behind input fields, error messages, prices, tables, or important record information.

Admin portal:

- keep operational pages mostly free of decoration;
- allow a small Farochet floral mark in the logo, login page, sidebar brand area, or an empty state;
- do not add floral backgrounds behind dashboard metrics, tables, forms, charts, or status controls.

### 6.3 Density limits

- Maximum one large decorative floral illustration per major customer section.
- Up to two small motifs around a customer section heading or edge.
- Avoid placing decorative artwork in every card.
- Decorations must not compete with real product photographs.
- On mobile, reduce or hide edge decorations if they cause clutter or cover content.

### 6.4 Accessibility and implementation

- Purely decorative SVGs/images must be `aria-hidden="true"` or have empty alt text.
- Product photographs must have meaningful alt text describing the product, not generic text such as “flower image”.
- If an illustration communicates information, provide an adjacent text equivalent.
- Keep illustrations out of keyboard navigation.
- Use the shared `FloralDecoration` / `CrochetFlower` component or an approved asset; do not recreate a different flower style inside each feature.

---

## 7. Customer website shell

### 7.1 Announcement strip

- Do not display unsupported promotional claims (for example, free shipping, delivery guarantees, discounts, or turnaround promises).
- If an announcement strip is needed, use only accurate, team-approved content, such as a current availability message supplied by the system.
- If no approved announcement exists, omit the strip; do not leave a fake placeholder.

### 7.2 Customer header

Desktop:

- Warm Cream or Soft Surface background.
- Farochet wordmark aligned left.
- Primary navigation centered or immediately beside the logo: `Catalogue`, `Custom Request`, `Availability` (only where the approved business-availability display is exposed), and any team-approved static brand page.
- Utility actions aligned right: account/sign-in and wishlist. Use simple accessible outline icons with text labels or accessible names.
- No cart icon unless a cart feature is formally added to scope.
- Thin subtle bottom border; no heavy shadow.
- Header height target: 72–84 px.

Mobile:

- Wordmark left; menu and necessary account/wishlist actions right.
- Collapse navigation into an accessible menu/drawer.
- Keep the menu keyboard accessible and provide a visible close action.

### 7.3 Customer footer

- Use a Lilac Mist or a subtle Lavender-tinted panel, not a saturated purple block.
- Include Farochet wordmark/tagline, approved navigation shortcuts, and any team-approved static contact/policy content.
- A newsletter subscription field is not included unless it becomes an approved requirement.
- Do not add shipping/returns claims, social integrations, payment logos, or service promises without verified content and team approval.
- Add small floral/yarn illustrations at the outer corners only; keep footer links readable.
- Mobile footer stacks into clear groups; no tiny side-by-side columns.

### 7.4 Customer page canvas

- Use Warm Cream behind the page.
- Cards and form panels use Soft Surface.
- Maintain consistent content max width and page gutters.
- Avoid full-screen popups on first visit.

---

## 8. Admin portal shell

### 8.1 Admin sidebar

- Background: Deep Plum `#594064`.
- Text/icons: White `#FFFFFF` or a sufficiently light neutral.
- Active item: a lighter lavender/plum surface with a clear active marker; ensure label contrast remains strong.
- Sidebar width target: 240–264 px on desktop.
- Brand wordmark at top, navigation grouped logically, logout at bottom.
- Use concise labels and one consistent outline icon family.
- No decorative floral wallpaper; a small logo mark is enough.

### 8.2 Admin topbar

- Background: Soft Surface.
- Search field only if it is implemented and useful to the project; do not add a decorative non-functional search box.
- Show page/user context and any approved account action.
- Keep height around 64–72 px.
- Use clear focus and hover states.

### 8.3 Admin workspace

- Main background: Warm Cream.
- Cards, tables, and forms: Soft Surface.
- Headings: Cocoa or Deep Plum.
- Primary actions: Deep Plum button.
- Accent charts/visuals: muted Lavender, Sage, Petal Rose, and Buttercream; never use colour alone to distinguish data series.
- Keep operational pages denser than customer pages, but not cramped.
- Data-heavy screens have no large marketing hero or decorative crochet background.

---

## 9. Buttons and interactive controls

### 9.1 Button variants

| Variant | Background | Text/border | Use |
|---|---|---|---|
| Primary | Deep Plum `#594064` | White | Main action on a screen or form |
| Secondary | Lilac Mist `#EEE7F3` | Deep Plum | Supporting action |
| Outline | Transparent/Soft Surface | 1 px Deep Plum border and Deep Plum text | Lower-emphasis action |
| Tertiary/Ghost | Transparent | Deep Plum text | Inline or low-emphasis navigation action |
| Danger | Danger `#A4473C` | White | Destructive action, such as remove/cancel where permitted |
| Disabled | Neutral muted surface | Muted text | Unavailable action; never imply it can be clicked |

### 9.2 Button dimensions

| Size | Minimum height | Horizontal padding | Text size |
|---|---:|---:|---:|
| Small | 36 px | 12–14 px | 13 px |
| Medium (default) | 44 px | 18–22 px | 14 px |
| Large | 48–52 px | 22–26 px | 15–16 px |

- Customer primary CTAs should be pill-shaped.
- Admin buttons may use a 10–12 px radius for compact data workflows.
- Icon-only buttons must have an accessible label and a 40–44 px target.
- Use sentence case; avoid all-caps button labels.
- Do not put multiple primary buttons beside one another. One primary action per decision area is preferred.

### 9.3 Button states

Every interactive button must include:

- default;
- hover (Deep Plum darkens to `#473252` for primary);
- active/pressed;
- visible keyboard focus;
- disabled;
- loading where an asynchronous operation exists.

A loading button must not trigger duplicate submissions. Do not display a false success state before the backend confirms success.

### 9.4 Links and icon buttons

- Text links use Deep Plum on light surfaces and must be visibly distinguishable from surrounding copy.
- Icon buttons use one icon family and consistent stroke weight.
- Every icon-only control has an accessible name (for example, `aria-label="Open wishlist"`).
- Never use a symbol or emoji as the only label for a critical action.

---

## 10. Forms and inputs

### 10.1 Field structure

Every field must have:

- a visible label;
- an associated control;
- required/optional indication where relevant;
- helper text where necessary;
- an inline error message associated with that field;
- correct keyboard and screen-reader semantics.

### 10.2 Input appearance

- Height: 44–48 px for single-line fields.
- Background: Soft Surface.
- Text: Cocoa.
- Border: Control Border, 1 px.
- Radius: 10–12 px.
- Horizontal padding: 12–14 px.
- Placeholder: muted but readable; never use placeholder instead of a label.
- Focus: Deep Plum outline/ring; never remove focus indication.
- Error: Danger border plus written explanation; colour alone is insufficient.
- Disabled: muted surface and clear disabled state.

### 10.3 Text areas, selects, and file inputs

- Text areas use the same border, radius, focus and error language; default minimum height 120 px for longer descriptions.
- Selects must show a clear affordance and have a visible label.
- File input for request reference images must show accepted file types/size only where the actual implementation has a defined limit. Do not invent limits.
- Show the selected file name and provide a clear remove/replace action where allowed.
- Never imply an uploaded image has been saved until the operation succeeds.

### 10.4 Form layout

- Group related fields under short section headings.
- Use one column on mobile.
- Use two columns on wide screens only when the fields are naturally related and labels remain clear.
- Keep the primary submit action visible at the end of the form.
- Confirm destructive or irreversible actions with an accessible dialog where necessary.

---

## 11. Cards, product tiles, badges, tables, and alerts

### 11.1 Generic cards

- Background: Soft Surface.
- Border: subtle `--color-border`.
- Radius: 16 px.
- Padding: 16–24 px depending on density.
- Shadow: soft and restrained.
- Cards must not have decorative content that obscures their primary information.

### 11.2 Customer product card

- Product image at the top, consistent aspect ratio within the grid.
- Use actual product imagery where available; use a neutral placeholder only when the catalogue record has no image.
- Product name, standard catalogue price, applicable public discount information, and relevant availability information must be clearly separated.
- Wishlist action only when the feature is available to the current user.
- Card opens product details through a semantic link/action.
- Do not show ratings/reviews, stock quantity, cart, or checkout controls unless approved by the PRD.

### 11.3 Status badges

- Pill shape, compact horizontal padding, readable label, and optional icon.
- The business layer supplies the actual status value; the UI maps it to a visual tone.
- Never merge manufacturing/order, payment, and delivery status into one badge.
- A status badge is read-only unless the screen explicitly provides a separate update control.

### 11.4 Admin tables

- White/Soft Surface background, subtle horizontal dividers, readable row spacing.
- Column headings must be explicit and concise.
- Numeric values and dates align consistently.
- Provide loading, empty, and error states.
- Keep actions visible and keyboard accessible; do not rely on hover-only actions.
- On small screens, use a deliberate stacked row/card presentation or contained horizontal scrolling only when necessary.

### 11.5 Alerts and empty states

- Alerts have an icon, title/message, and semantic tone.
- Empty states explain why the list is empty and offer a relevant next action when one exists.
- Customer empty states may use a small crochet-flower illustration.
- Admin empty states should be restrained, with no large floral artwork.
- Error states must explain what happened and what the user can do next; avoid exposing stack traces or internal technical details.

---

## 12. Modals, confirmations, and notifications

- Modal background: Soft Surface; overlay: neutral dark overlay with sufficient opacity.
- Radius: 16–20 px; width must fit the content and viewport.
- Include a clear title, concise explanation, and explicit actions.
- Escape closes non-destructive dialogs where appropriate; focus is trapped/restored correctly.
- Destructive confirmation must name the specific action (for example, “Remove this wishlist item?”), not a vague “Are you sure?”.
- Success and error notifications must reflect actual server results.
- Do not show a toast as a substitute for keeping important business state visible on the page.

---

## 13. Customer versus admin visual rules

### Customer experience

- More expressive hero and section layouts.
- Prominent crochet flower photography and selected botanical illustrations.
- Warm editorial headings and larger product imagery.
- Clear paths to catalogue, inquiry submission, custom-order request, wishlist, and customer history.
- Keep forms calm and legible; decoration must not cover content.

### Admin experience

- Same colour palette, fonts, controls, cards, and badge system.
- Deep Plum sidebar and neutral workspace.
- Compact page headings and practical data layouts.
- Prioritize information hierarchy, status separation, and efficient forms.
- Avoid customer-storefront marketing layouts inside operational screens.
- Use floral decoration only in the logo, login screen, or carefully chosen empty states.

---

## 14. Responsive design

Use these breakpoints as a shared starting point unless the approved CSS framework already has equivalent breakpoints:

- mobile: below 576 px;
- tablet: 576–991 px;
- desktop: 992–1199 px;
- wide desktop: 1200 px and above.

Rules:

- Customer navigation collapses into a usable menu on mobile.
- Product grids use 2 columns on common mobile widths where cards remain readable; 3 columns on tablet; 3–4 columns on desktop as space permits.
- Hero content stacks cleanly on small screens; do not squeeze image and text into unreadable columns.
- Admin sidebar becomes a drawer on mobile/tablet.
- Admin metric/summary cards wrap to 1–2 columns.
- Forms become single-column on mobile.
- Interactive targets should be at least 44 × 44 px where practical.
- No unintended horizontal page scrolling.
- Tables may use a purpose-built mobile row/card layout or a contained scroller if essential.
- Decorative flower art may scale down or disappear on mobile when it competes with content.

---

## 15. Accessibility and usability

Target WCAG 2.2 Level AA for implemented screens.

- Normal text contrast: at least 4.5:1.
- Large text contrast: at least 3:1.
- Meaningful component boundaries and visual state indicators: at least 3:1 where required.
- Every input has a visible, programmatic label.
- Product images have meaningful alt text; decorative art is hidden from assistive technology.
- All actions are keyboard reachable and have visible focus.
- Do not remove focus outlines without a clearly visible replacement.
- Icon-only actions require accessible names.
- Do not use colour as the only indicator of status, error, or selection.
- Use semantic headings in logical order.
- Respect browser zoom and text resizing.
- Associate error messages with the relevant field.
- Ensure overlays, drawers, and dialogs are keyboard accessible.

---

## 16. Frontend and architecture boundaries

- All UI components belong to the Presentation Layer.
- Views display information and collect user input; they do not implement substantive business rules.
- Frontend components must not connect directly to PostgreSQL, an ORM, or the Repository.
- The frontend communicates through the approved controller/API boundary.
- Price calculations, request acceptance/rejection, feasibility decisions, status rules, delivery-fee rules, payment/refund decisions, and permission decisions belong to the appropriate backend business/security components.
- Hiding an admin button or route is not authorization. Backend middleware enforces role-level authorization; relevant Business Logic enforces customer record ownership.
- Keep generic components presentational and reusable. Do not place feature-specific API calls or business rules inside Button, Card, TextField, Modal, or StatusBadge.
- Use the shared design tokens. Avoid arbitrary inline colours.
- Follow the actual approved stack and existing repository conventions. This package's React starter is an example, not permission to override a team technology decision.

---

## 17. Change control

- The UI coordinator maintains this document and the shared design tokens.
- Members may propose new shared components or visual variants with a reason and the screens that need them.
- Changes to brand colours, typography, shared layout, or core controls require review by the UI coordinator and team.
- Update this file, `tokens.css`, the component catalogue, and affected screen specifications together when a shared rule changes.
- Record meaningful changes in Git history or the project's document version history.

**End of UI Guidelines v1.1.**
