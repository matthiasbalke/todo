## Why

`EditableLabel` currently commits changes on Enter or blur, which is unsuitable for fields where users must explicitly confirm a potentially significant update. The account email editor already uses a visible Save action, so the shared component should support that interaction while preserving its current automatic-save behavior.

## What Changes

- Add an `EditableLabel` section to the development-only `/components` showcase.
- Provide interactive examples for basic editing, validation, disabled state, and saving state.
- Add an optional explicit-save mode that renders a Save button and commits only when that button is clicked.
- In explicit-save mode, make blur discard the draft, make Escape cancel, and prevent Enter from committing.
- Preserve automatic save on Enter and blur as the default mode for backward compatibility.
- Display the latest saved value so the component's `change` event behavior is visible.
- Add showcase examples and documentation for both save modes.

## Capabilities

### New Capabilities

- `editable-label-explicit-save`: Optional button-confirmed editing behavior for the shared `EditableLabel` component.
- `editable-label-showcase`: Interactive development showcase and API documentation for the shared `EditableLabel` component.

### Modified Capabilities

None.

## Impact

- Affects `frontend/src/lib/components/EditableLabel.svelte`, its unit tests, and the `/components` showcase.
- Adds a backward-compatible component prop; existing consumers retain automatic-save behavior without modification.
- Uses the `/account` email editor as the interaction reference but does not require changing account persistence APIs or backend behavior.
- Adds no external dependencies.
