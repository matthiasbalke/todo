## Why

The frontend has shared controls for buttons, text and email inputs, editable labels, selects, textareas, and dates, but production screens still duplicate native control markup and styling. Adopting the shared controls consistently reduces accessibility and interaction drift while making future UI changes centralized.

## What Changes

- Harden the shared `Button`, `TextInput`, `EmailInput`, and `EditableLabel` APIs where current production usages require forwarded attributes, events, focus access, compact presentation, or explicit cancel behavior.
- Replace 5 native selects in `FilterBar`, `SortSelector`, and `MembersDialog` with the shared `Select`.
- Replace or consolidate 14 native text/email inputs across authentication, account, list, item, category, member, and group flows with `TextInput`, `EmailInput`, or `EditableLabel` according to interaction semantics.
- Replace 82 consumer-level native buttons across 16 production files with the shared `Button`, preserving icon, chip, menu, submit, destructive, loading, backdrop, and compact-action behavior.
- Add focused regression coverage for affected component and route workflows and an inventory check preventing new replaceable native controls.
- Leave native elements without shared counterparts in place, including links, forms, field grouping, and semantic content/layout elements.
- Exclude native elements that implement the internals of shared components and the development component showcase.

## Capabilities

### New Capabilities
- `shared-component-adoption`: Production UI controls consistently use the shared component library while preserving native semantics, accessibility, styling intent, and feature behavior.

### Modified Capabilities

None.

## Impact

- Affects shared control APIs in `frontend/src/lib/components/` and production Svelte consumers under `frontend/src/lib/components/` and `frontend/src/routes/`.
- Touches authentication, account management, list and group management, item forms and cards, filtering and sorting, category configuration, member management, grocery views, and application navigation.
- Requires broad frontend component and route regression testing but no backend, API, database, or dependency changes.
