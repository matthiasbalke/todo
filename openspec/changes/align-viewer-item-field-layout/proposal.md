## Why

Viewer-only item details currently use a two-column metadata grid that differs from the normal editable item layout. This makes read-only access feel inconsistent and changes the field scanning order for users who can only inspect a list.

## What Changes

- Change the viewer read-only item detail layout from a two-column metadata grid to a single-column field layout.
- Present viewer read-only item fields with the same regular form components as the editable form, but disabled.
- Align `TextInput` and `Textarea` styling globally so text fields use the same white resting background, muted hover background, and disabled opacity treatment as the other controls.
- Place the starred indicator after the disabled title field in the same row.
- Present the remaining viewer read-only fields in the same order as the editable form: category, due date, recurrence, assigned users, then notes.
- Keep audit metadata below notes, matching the editable form placement.
- Keep the starred indicator and audit metadata read-only without adding any mutation controls.
- Do not display a completion/status indicator in viewer item details because the edit view does not display one.
- Keep owner and editor item details unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `viewer-read-only-list-ui`: Viewer item details must use the normal disabled item-detail controls, title-row starred indicator, normal field order, and editable-form audit metadata placement without a completion/status indicator.

## Impact

- Affects the frontend read-only item detail component, shared text field styling, and frontend tests.
- No backend API, authorization, database, dependency, or deployment changes are expected.
