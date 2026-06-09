## Why

The development component showcase documents `TextInput`, `EmailInput`, and `Select`, but omits the existing `EditableLabel`. Adding it makes the component's inline-edit behavior and API discoverable and manually testable alongside the other shared inputs.

## What Changes

- Add an `EditableLabel` section to the development-only `/components` showcase.
- Provide interactive examples for basic editing, validation, disabled state, and saving state.
- Display the latest saved value so the component's `change` event behavior is visible.
- Add usage examples, keyboard interaction guidance, and a complete props/events reference.

## Capabilities

### New Capabilities

- `editable-label-showcase`: Interactive development showcase and API documentation for the shared `EditableLabel` component.

### Modified Capabilities

None.

## Impact

- Affects `frontend/src/routes/components/+page.svelte`.
- Reuses the existing `frontend/src/lib/components/EditableLabel.svelte`; no component API, backend API, or dependency changes are expected.
- May add focused frontend tests for the showcase if the route currently has or gains a practical test harness.
