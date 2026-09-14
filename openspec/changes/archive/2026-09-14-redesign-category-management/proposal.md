## Why

The configure categories dialog still feels heavier than the rest of the inline editing UI: colorless categories shift left, category edits require explicit save/discard controls, and new category colors are limited to a fixed swatch list. Redesigning it now makes category management faster and more consistent with the app's established editable-label behavior.

## What Changes

- Align category rows so names occupy the same horizontal position whether or not a category has a configured color.
- Replace explicit save and cancel controls for existing category name/color edits with automatic inline editing behavior matching `EditableLabel`.
- Make the category color affordance itself the entry point for editing an existing category color.
- Expand new category color selection to include basic preset colors plus a custom hex-code entry path.
- Preserve existing category creation, deletion, reordering, persistence, and authorization behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `list-ui-capabilities`: Configure categories dialog editing, alignment, and color selection behavior changes.
- `category-select-component`: Category selection no-color indicators now use dashed circular markers instead of invisible reserved space.

## Impact

- Frontend: `CategoryConfigDialog.svelte`, likely shared color input/swatch helpers, and focused component tests.
- Specs: update `list-ui-capabilities` with configure categories dialog behavior.
- Backend/API/database: no expected changes; existing category `color` persistence remains `string | null`.
