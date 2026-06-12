## Why

The standard list burger menu renders "Grocery mode" as an anchor while adjacent menu actions use the shared Button component. The different primitive produces subtle typography and alignment differences in an otherwise uniform action menu.

## What Changes

- Render the "Grocery mode" menu item through the shared Button component.
- Preserve navigation to the current list's grocery-mode route through SvelteKit client-side navigation.
- Preserve menu dismissal, accessible naming, regular typography, left alignment, spacing, and hover treatment.
- Add regression coverage for Button semantics, consistent styling, and the navigation destination.

## Capabilities

### New Capabilities

- `list-mode-menu-navigation`: Defines consistent shared-button presentation and navigation behavior for the Grocery mode action in the standard list burger menu.

### Modified Capabilities

None.

## Impact

- Affects the standard list route and its focused menu tests.
- Reuses the existing shared Button component and `$app/navigation`; no new dependencies are required.
- Does not change the grocery route, list data, backend APIs, permissions, or other burger-menu actions.
