# Farochet UI Kit v1.1 — Lavender Garden

This package contains the updated shared UI design standard for the Farochet customer website and Raazia's admin portal.

**Design direction:** Lavender Garden — Warm Artisan Editorial  
**Brand:** Farochet  
**Admin workspace:** Farochet Admin  
**Package status:** Draft for team review and approval

## What changed in v1.1

- Replaced the raspberry-led palette with a lavender-led identity.
- Added Deep Plum as the high-contrast primary action and admin navigation colour.
- Added Lilac Mist, Petal Rose, Botanical Sage, Buttercream, Warm Cream, and Cocoa.
- Added a strict crochet-flower/botanical illustration standard, including approved placement, style, density, and accessibility rules.
- Expanded customer and admin screen specifications.
- Expanded the shared component catalogue and added a small optional React starter implementation.
- Added team workflow and an additive AGENTS.md instruction block.

## Package contents

```text
Farochet_UI_Kit_v1.1/
├── README.md
├── CHANGELOG.md
├── docs/
│   └── ui/
│       ├── UI_GUIDELINES.md
│       ├── UI_SCREEN_SPEC.md
│       ├── UI_COMPONENT_CATALOG.md
│       ├── UI_TEAM_WORKFLOW.md
│       ├── AGENTS_UI_INSTRUCTIONS.md
│       └── VISUAL_REFERENCE_NOTES.md
├── frontend-starter/
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── global.css
│   │   └── components.css
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── brand/
│   └── examples/
│       ├── ComponentShowcase.jsx
│       └── USAGE_EXAMPLES.md
└── visual-references/
    ├── Farochet_Lavender_Garden_Homepage.png
    ├── Earlier_Storefront_Admin_Layout_Reference_Not_Color_Standard.png
    └── Previous_Approved_Layout_and_Floral_Detail_Reference.png
```

## How to use this package in your team's repository

### Step 1 — Unzip and inspect

1. Download and extract this ZIP.
2. Open your existing group repository.
3. Inspect the current frontend folders, root `AGENTS.md`, and approved architecture before copying anything.
4. Do not overwrite existing source files blindly. Compare changes if the repository already has a design system or components.

### Step 2 — Add the design documents

Copy the contents of `docs/ui/` into your repository's UI documentation folder. Recommended destination:

```text
docs/ui/
```

The three core references are:

- `UI_GUIDELINES.md`: how the entire application must look and behave;
- `UI_SCREEN_SPEC.md`: what each customer/admin screen should contain and how it should be arranged;
- `UI_COMPONENT_CATALOG.md`: which components are shared, which are feature-specific, and how they should be reused.

`UI_TEAM_WORKFLOW.md` explains the team's implementation/review process. `AGENTS_UI_INSTRUCTIONS.md` contains an instruction block to merge into the existing root `AGENTS.md`.

### Step 3 — Add the design tokens

If the group has approved React + Vite (or another React setup):

1. Copy `frontend-starter/styles/tokens.css` into the actual frontend shared styles folder, for example `frontend/src/styles/tokens.css`.
2. Copy `global.css` and `components.css` into that styles folder, adjusting import paths if needed.
3. Import `global.css` once from the frontend entry point (for example, `main.jsx`).
4. Do not import `tokens.css` repeatedly from individual feature components.

The starter `global.css` loads DM Sans and DM Serif Display from Google Fonts. If the app is offline or the team does not want a remote font request, remove that URL and use approved local/system fallbacks. Font files are not included in this package.

### Step 4 — Add the starter components (React only)

The `frontend-starter/components/` directory contains starter examples for:

- Button, IconButton, TextField, TextArea, SelectField, Card, StatusBadge, Alert, EmptyState;
- FarochetLogo, CrochetFlower, FloralDecoration;
- CustomerHeader, CustomerFooter, AdminSidebar, PageHeader.

Copy them into the matching folders in your React frontend only after confirming the group's framework/stack. They are starter implementations, not a complete application. Update imports and route links to match your actual router. Add tests and refine accessibility as the components enter real screens.

### Step 5 — Create a temporary component showcase

Use `frontend-starter/examples/ComponentShowcase.jsx` as an internal development page. It lets the team compare button variants, fields, badges, cards, and floral detail side by side.

Do not treat the showcase as a required customer-facing route. Keep it internal or remove it before final submission if unnecessary.

### Step 6 — Update root AGENTS.md

Open `docs/ui/AGENTS_UI_INSTRUCTIONS.md` and merge its code block into the existing root `AGENTS.md`. Do not replace the current AGENTS.md with the snippet. Keep its existing PRD, architecture, ADR, and workflow instructions intact.

### Step 7 — Agree on ownership

Recommended division:

- UI coordinator (you): maintains the design guide, tokens, common component consistency, floral assets, and cross-screen review.
- Each feature/slice owner: implements their feature-specific UI and reuses common components.
- Shared component changes: propose, review, coordinate, update catalog/examples, then merge.

Do not make the UI coordinator responsible for coding everybody's screens. Each member owns the screens in their assigned slices.

### Step 8 — Require this before every AI coding task

Give your coding agent a prompt like this:

```text
Before changing frontend code, read:
- docs/ui/UI_GUIDELINES.md
- the relevant screen section in docs/ui/UI_SCREEN_SPEC.md
- docs/ui/UI_COMPONENT_CATALOG.md
- docs/ui/UI_TEAM_WORKFLOW.md
- the root AGENTS.md and the relevant PRD/architecture/ADR sections

Inspect the existing frontend and shared component library first.
Implement only my assigned screen/slice. Reuse existing shared components.
Follow the Lavender Garden palette, typography, spacing, button/input/card rules, and crochet-flower decoration rules.
Do not add features that are not in the PRD. Do not add cart, checkout, stock, ratings, free-shipping claims, payment gateway, courier API, or chat unless an approved requirement explicitly asks for them.
Do not put business logic or database access in React components. If a required design or business rule is unclear or conflicts with the PRD, report the issue before inventing a behavior.
At the end, list changed files, reused components, tests/checks run, and any unresolved questions.
```

## Which document should a member read?

- **Before coding any screen:** `UI_GUIDELINES.md` + `UI_COMPONENT_CATALOG.md` + the relevant screen section in `UI_SCREEN_SPEC.md`.
- **When creating or changing a shared component:** `UI_GUIDELINES.md` + `UI_COMPONENT_CATALOG.md` + `UI_TEAM_WORKFLOW.md`.
- **When building their own slice:** all of the above plus root `AGENTS.md`, relevant PRD requirements, architecture, and ADRs.

## Important limitations and review notes

1. The visual reference images are design direction, not final production screens or working prototypes. Read `VISUAL_REFERENCE_NOTES.md` before copying any element from them.
2. The React starter is optional and assumes React. It must not override the team's approved stack or existing conventions.
3. The current architecture/AGENTS materials found during preparation refer to PRD v1.3 and nine distinct business components. The exact PRD v1.3 source file was not present in the available Library results, so the team must check each screen's FR traceability against the exact PRD in its repository before approval.
4. The screen specifications intentionally avoid inventing unresolved details such as discount rounding/precedence, exact payment/delivery status enumerations, allowed status transitions, upload limits, or unsupported feature behavior.
5. No production authentication, API integration, database access, or real data is implemented in this starter.

## Recommended first implementation milestone

1. Team approves the Lavender Garden palette and flower-detail treatment.
2. Add tokens and global styles.
3. Implement Button, TextField, Card, StatusBadge, and CrochetFlower.
4. Build/review the component showcase.
5. Implement CustomerHeader/Footer and AdminSidebar.
6. Each member implements feature-specific components and screens from the screen specification.

**Do not build every component on day one. Add shared components when they are used by multiple screens or are clearly core UI primitives.**
