## Why

Field-adjacent buttons can look misaligned when consumers choose an action size that is meant for standalone or compact buttons. This became visually obvious in the admin SMTP settings test-email row, where the `Test` button sits beside a default `TextInput` but used the shorter `small` Button size.

## What Changes

- Clarify that field-adjacent Button actions should use the existing `field` size when placed beside default `TextInput` controls.
- Verify that `field` Button sizing aligns with default shared text input geometry without consumer padding or height overrides.
- Update component tests and representative admin email settings tests so field-adjacent Button/TextInput alignment is covered.
- Add a Button showcase example with a default text input and field-sized Button rendered next to each other.
- Keep compact/icon/menu/header button sizes intentionally distinct.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `button-component`: Button field sizing should be the semantic choice for field-adjacent actions beside default text inputs.
- `button-showcase`: Button showcase should demonstrate a field-adjacent Button beside a text input.
- `shared-style-foundation`: Shared control geometry should preserve consistent field heights across text inputs and field-adjacent buttons.

## Impact

- Frontend shared component usage and tests: admin email settings, Button tests, component showcase, and related documentation/spec coverage.
- Representative consumers: admin email settings test-email row and its tests.
- No backend API, data model, or dependency changes expected.
