## Why

Shared frontend controls are widely adopted, but consumers still reconstruct their visual presentation with Tailwind classes. This produces conflicting styles, underuses primary, secondary, danger, and ghost treatments, and leaves visual consistency dependent on utility ordering instead of component contracts.

## What Changes

- Replace the Button's combined variant model with separate semantic tone and visual appearance props, plus named geometry and state props for standard actions, menus, icon buttons, and selectable rows.
- Migrate standard Button consumers away from custom color, background, border, radius, hover, focus, typography, and padding utilities while preserving layout-only classes.
- Replace visual override hooks on Select, EditableLabel, TextInput, EmailInput, Textarea, and DatePicker with named size, density, emphasis, and state APIs where current consumers require alternatives.
- Make composite shared components reuse existing primitives, especially Button and TextInput, whenever native semantics and interaction behavior can be preserved.
- Add an automated source guard that rejects visual utility overrides on shared-component consumers and requires documented, narrowly scoped exceptions.
- Document temporary exceptions for specialized dynamic controls such as calendar days, color swatches, completion toggles, starred toggles, and swipe-delete surfaces; a separate follow-up change will extract those controls.
- **BREAKING** Remove or deprecate consumer APIs that permit unrestricted visual styling after all production call sites have migrated.

## Capabilities

### New Capabilities

- `semantic-component-styling`: Shared controls expose semantic presentation APIs, compose existing primitives where practical, and prevent consumer-owned visual styling through automated enforcement.

### Modified Capabilities

None.

## Impact

- Affects shared controls and their tests under `frontend/src/lib/components/`.
- Affects production Svelte consumers under `frontend/src/lib/components/` and `frontend/src/routes/`, including authentication, account management, forms, dialogs, menus, lists, and grocery views.
- Adds frontend source-policy tests and updates component documentation and the development showcase.
- Requires coordinated migration of existing Button `variant` usage and visual class hooks but no backend, database, API, or dependency changes.
