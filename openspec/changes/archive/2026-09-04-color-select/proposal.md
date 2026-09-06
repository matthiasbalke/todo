## Why

The category selector currently displays category names without the color context users configured for those categories. Showing the category color in the selector makes category choice faster and more consistent with the rest of the list UI.

## What Changes

- Display a category color circle before each real category name in the item form category Select.
- Display the same color circle for the currently selected category in the Select trigger.
- Add a reusable `CategorySelect` component that wraps the shared Select behavior with category-specific display.
- Update the development component showcase to demonstrate `CategorySelect`.
- Keep `Uncategorized` without a visible color dot while reserving the same leading swatch space as category values.
- Preserve the existing category ID value contract, filtering, keyboard behavior, and form submission behavior.

## Capabilities

### New Capabilities
- `category-select-component`: Reusable category selector component and development showcase coverage.

### Modified Capabilities
- `item-form-category-selection`: ItemForm category entry shall use the shared `CategorySelect` behavior with category color indicators for selected and unselected real category values.

## Impact

- Frontend shared Select rendering API may need optional Svelte snippet hooks while retaining label-based search and typed option values.
- New `CategorySelect` component will own category ID/null mapping, category labels, color indicators, and reserved swatch spacing.
- `ItemForm` will compose `CategorySelect` for category entry.
- Development component showcase and showcase tests will include `CategorySelect`.
- Frontend component tests should cover color indicator rendering for selected and dropdown category values.
- No backend, database, API, or dependency changes are expected.
