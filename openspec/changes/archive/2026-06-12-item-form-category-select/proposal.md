## Why

`ItemForm` still uses a browser-native category select even though the frontend now provides a shared `Select` component. Adopting the shared control makes category selection consistent with the component library while preserving the form's ID-based category contract and focus-loss cancellation behavior.

## What Changes

- Replace the native category `<select>` in `ItemForm` with the shared `Select` component.
- Present `Uncategorized` alongside the available category names while retaining category IDs as the underlying selected values.
- Extend the shared `Select` API as needed to display labels that differ from option values, so category names do not need to be used as identifiers.
- Preserve existing-category initialization, `defaultCategoryId`, nullable submission, and new-item reset behavior.
- Ensure opening, navigating, selecting from, and dismissing the category dropdown does not accidentally cancel a new-item form.
- Update focused `Select` and `ItemForm` tests for category rendering, selection, submission, reset, keyboard interaction, and focus/cancel behavior.

## Capabilities

### New Capabilities
- `item-form-category-selection`: Category selection in `ItemForm` through the shared Select component, including ID/label mapping, uncategorized state, defaults, submission, reset, and form focus behavior.

### Modified Capabilities

None.

## Impact

- Affects `frontend/src/lib/components/ItemForm.svelte`, `frontend/src/lib/components/Select.svelte`, and their colocated tests.
- Reuses the existing category model and shared Select component; no new dependency is required.
- Does not change the `TodoItem` model, frontend API payloads, backend category handling, or database schema.
