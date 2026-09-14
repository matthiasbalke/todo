## Why

GitHub issue 257 asks for the regular list add-item action to replace its literal `+` character with an icon. This aligns the list detail footer with the newer icon-based creation actions used elsewhere in the app and removes a remaining text-symbol control from the UI.

## What Changes

- Update the regular list fixed-footer add-item action to render a Lucide `Plus` icon before the `add item` label.
- Keep the action borderless, left-aligned, lowercase, and visually consistent with compact creation styling.
- Preserve the existing item form opening behavior and editable-user gating.
- Update frontend tests that currently query or assert the `+ add item` accessible label.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `list-ui-capabilities`: Change the regular list compact add-item action requirement from a literal `+ add item` text action to an icon-plus-label action.

## Impact

- Affected frontend route: `frontend/src/routes/(app)/lists/[id]/+page.svelte`.
- Affected frontend tests: `frontend/src/routes/(app)/lists/[id]/list-page.test.ts`.
- Affected spec: `openspec/specs/list-ui-capabilities/spec.md`.
- No backend, API, database, authentication, or dependency changes are expected.
