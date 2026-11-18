# Add this section to the root AGENTS.md

The following is an additive UI instruction block. Merge it into the existing root `AGENTS.md`; do not replace the whole file with this snippet.

```md
## Shared UI Development Rules

Before implementing or modifying frontend work, read:

1. `docs/ui/UI_GUIDELINES.md`
2. The relevant screen section in `docs/ui/UI_SCREEN_SPEC.md`
3. `docs/ui/UI_COMPONENT_CATALOG.md`
4. `docs/ui/UI_TEAM_WORKFLOW.md`

Rules:

- Follow the Lavender Garden design tokens and visual/interaction rules.
- Use the Farochet brand on customer-facing screens; identify the private workspace as Farochet Admin. Raazia is the administrator role, not the storefront brand.
- Reuse existing shared components before creating new ones.
- Do not duplicate or locally restyle shared Button, TextField, Card, StatusBadge, header, sidebar, or footer components.
- Implement feature-specific components inside their owning feature folder.
- Do not change global tokens or shared component behavior without coordination and review.
- Preserve the crochet-flower illustration style and approved placement/density rules. Decorative artwork must never obscure content or controls.
- Do not add cart, checkout, stock, ratings, reviews, free-shipping claims, payment-gateway, courier-API, chat, or other unapproved features.
- Do not invent business status values, price calculations, acceptance decisions, or availability logic in the frontend.
- Keep Inquiry, Pending Order Request, and confirmed Order distinct.
- Keep Standard Catalogue Price, public discount, Negotiated Price, and Approved Price distinct.
- Show manufacturing/order, payment, and delivery statuses separately.
- Do not access the database, ORM, or Repository from frontend components.
- Do not treat hidden UI controls as authorization; backend middleware and Business Logic enforce access rules.
- Before adding a dependency or selecting a new UI library, check the approved stack and repository conventions.
- If the UI specification conflicts with the PRD or architecture, stop the affected work and raise the conflict instead of inventing a rule.
```
