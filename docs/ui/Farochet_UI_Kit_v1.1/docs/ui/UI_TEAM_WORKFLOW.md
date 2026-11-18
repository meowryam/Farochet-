# Farochet UI Team Workflow

**Purpose:** Make four members produce one consistent application without forcing one person to implement every screen.

## 1. Before any member begins a screen

1. Read root `AGENTS.md`.
2. Read `docs/ui/UI_GUIDELINES.md`.
3. Read the assigned screen section in `docs/ui/UI_SCREEN_SPEC.md`.
4. Check `docs/ui/UI_COMPONENT_CATALOG.md` and inspect the existing frontend library.
5. Identify the shared components that can be reused.
6. Agree on the screen's required data/actions with the owning slice member.

## 2. Build the design foundation once

The UI coordinator and team should agree on:

- Lavender Garden palette;
- DM Serif Display + DM Sans typography;
- button/input/card/status styles;
- customer header/footer;
- admin sidebar/topbar;
- crochet-flower illustration style and placement rules.

Create the tokens and first shared primitives before four members start building their screens independently.

## 3. Slice implementation loop

For every vertical slice:

1. Select the slice and its PRD requirements.
2. Read the exact screen specification and business rules.
3. Reuse available shared components.
4. Identify missing components; keep them feature-specific unless multiple screens need them.
5. Implement the UI for the slice through the agreed Presentation Layer boundary.
6. Use agreed mock data/API contracts only while backend integration is pending; label temporary fixtures clearly.
7. Test responsive layout, keyboard interactions, form states, empty/loading/error states, and role-specific visibility.
8. Review against the visual reference and the UI Guidelines.
9. Record human accept/revise/reject decision and update workflow evidence as required by D4.
10. Integrate and resolve issues before declaring the slice complete.

## 4. Shared component change process

If a member needs a new shared component or a change to one:

1. Explain which screens need it and why.
2. Check whether an existing component can already satisfy the use case.
3. Propose the component API and visual change.
4. UI coordinator reviews it for consistency and unintended impact.
5. Implement with examples/tests.
6. Update the component catalogue and, if visual rules changed, update `UI_GUIDELINES.md` and `tokens.css` together.

Do not silently change global colours, button dimensions, shared navigation, or status mappings inside a feature branch.

## 5. Suggested Git coordination

- Keep the design documents in the shared repo.
- Use one shared integration branch or the team's agreed PR workflow.
- Avoid concurrent edits to `tokens.css`, `global.css`, `components/ui/`, and `components/layout/` without coordination.
- Each member should work primarily in their feature folder.
- Review screenshots of changed screens in the pull request where possible.
- Keep the visual reference images under `docs/ui/references/` or another agreed static documentation folder; do not bundle huge screenshots into the runtime frontend build unless needed.

## 6. Definition of UI done

A screen is not done merely because it looks attractive. It is done when:

- its content/actions match the PRD and screen specification;
- it reuses shared components;
- it follows the approved palette/type/layout rules;
- it handles required states;
- it is responsive and keyboard accessible;
- it communicates with the correct controller/API interface;
- it does not implement business logic or bypass authorization;
- its design has been reviewed with the team.
