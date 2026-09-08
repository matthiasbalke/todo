## Context

See proposal.md for motivation. The viewer item detail route already switches from the editable `ItemForm` to a read-only `ItemDetails` component when the current list capabilities do not allow item mutation. `ItemDetails` currently groups status, starred state, category, due date, recurrence, and assignment in a two-column grid, while `ItemForm` presents the editable controls in a single vertical sequence and places audit metadata below notes.

## Goals / Non-Goals

**Goals:**

- Make `ItemDetails` present the viewer's item fields with the regular form components in disabled state.
- Place title and starred state in one row with starred after title.
- Make the remaining read-only fields follow the editable form order and audit metadata placement.
- Keep the read-only route free of save/delete and other item mutation controls.
- Cover the layout/order behavior with focused frontend tests.

**Non-Goals:**

- Change backend authorization, list role capability derivation, or item API contracts.
- Redesign owner/editor item editing.
- Change how due dates, recurrence rules, assignments, or audit metadata are formatted.

## Decisions

- Reuse the regular form controls in disabled state for read-only item details.
  - Rationale: It makes viewer rendering visually identical to the editable form while preserving the read-only capability boundary.
  - Alternative considered: Keep custom read-only labels and values. That would still leave a separate viewer-only rendering path with visual drift risk.

- Align disabled text field styling globally rather than overriding it only in `ItemDetails`.
  - Rationale: `TextInput` and `Textarea` are the shared controls whose disabled gray fill, direct muted text styling, and missing hover background currently make viewer details visually inconsistent with the other controls. Fixing them at the component level keeps form field styling consistent everywhere.
  - Alternative considered: Pass custom classes from `ItemDetails`. That would solve one screen while leaving the shared components internally inconsistent.

- Put the disabled title and starred state in one title row, and omit completion/status from viewer details.
  - Rationale: Starred is already part of item identity and can sit beside the title without creating a separate metadata field. Completion/status is not currently shown in the edit view, so omitting it makes viewer rendering match edit mode more closely.
  - Alternative considered: Keep a disabled completion toggle before the title. That preserved state visibility but made the read-only view look unlike the edit view.

- Use a single vertical field stack after the title row.
  - Rationale: It matches the editable form order and removes the viewer-only two-column scan pattern reported in the issue.
  - Alternative considered: Keep two columns and only reorder cells. This would still leave viewer mode visually inconsistent with the editable view.

- Test through the route/component behavior instead of snapshotting CSS.
  - Rationale: The durable contract is that viewers see read-only fields in order with no mutation controls. CSS class snapshots would be brittle for a small layout adjustment.
  - Alternative considered: Add visual or screenshot coverage. That is heavier than needed for this size of UI change.

## Risks / Trade-offs

- Field order regression -> Add a frontend test that checks the title row order and the relative order of the disabled read-only controls for a viewer item.
- Completion/status visibility regression -> Add a frontend test assertion that viewer item details do not display the completion/status control.
- Disabled control behavior drift -> Use existing component disabled props and add tests that mutation actions are unavailable.
- Shared field styling regression -> Add shared `TextInput` and `Textarea` tests asserting fields keep a white resting background, use a muted hover background, and use opacity-based disabled muting.
- Mobile layout differences -> Use one-column responsive structure by default so small screens and desktop share the same reading order.
