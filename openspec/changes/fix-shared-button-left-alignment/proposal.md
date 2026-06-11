## Why

The shared Button migration introduced centered content in controls that previously relied on native button layout. Grocery item rows, standard list category headers, and full-width menu and submenu actions now appear centered even though their content is intended to read from the left edge.

## What Changes

- Restore left-aligned content for grocery category item rows.
- Restore left-aligned category names in standard list category headers while keeping disclosure indicators at the opposite edge.
- Restore left-aligned labels and nested content for full-width burger-menu actions and submenu choices.
- Define an explicit shared Button alignment API or presentation rule so consumers do not depend on conflicting Tailwind utility order.
- Add regression coverage for left, center, and space-between button layouts while preserving existing click, keyboard, and responsive behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shared-component-adoption`: Shared Button consumers must preserve the intended horizontal content alignment of migrated controls.

## Impact

- Affects `frontend/src/lib/components/Button.svelte`, grocery row controls, standard list category headers, and full-width application/list menu actions.
- Requires focused component and route tests for grocery rows, standard list category headers, and menu/submenu alignment.
- Does not change APIs, backend behavior, dependencies, navigation semantics, or business workflows.
