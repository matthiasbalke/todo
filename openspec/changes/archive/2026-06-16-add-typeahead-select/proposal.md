## Why

Shared select controls currently require users to open the list and navigate visually or with arrow keys. This is inefficient for longer option sets such as timezones and category lists, and it does not match the expected editable search affordance requested in GitHub issue #106.

## What Changes

- Make the shared `Select` trigger's selected-value area editable/searchable while preserving single-select semantics.
- Let users type into the control to filter predefined options and select one of those existing values.
- Preserve pointer selection, current keyboard navigation, validation, disabled behavior, value binding, and `onSelect` contracts.
- Show an empty-result state when no predefined option matches the typed query.
- Update the component showcase and tests to document and verify the searchable behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `shared-component-adoption`: extend shared select requirements so adopted select controls support type-to-find behavior without changing their typed value contracts.

## Impact

- Frontend shared component: `frontend/src/lib/components/Select.svelte`
- Frontend consumers that inherit the shared select behavior: item form category/recurrence fields, filters, sort selector, timezone picker, account timezone settings, and the component showcase.
- Tests and documentation: `frontend/src/lib/components/Select.test.ts`, `frontend/src/routes/components/components-page.test.ts`, `frontend/src/routes/components/+page.svelte`, and related feature docs.
- No backend, persistence, API, or dependency changes are expected.
