## Why

Deleting a list category already uncategorizes existing items, but the frontend can keep a locally remembered last-used category ID that no longer exists. When the next item is created, the category Select can show the stale UUID and submit it, causing the backend to reject item creation.

## What Changes

- Clear or ignore the locally remembered new-item default category when the referenced category is deleted or no longer exists in the current category list.
- Ensure the new-item category Select falls back to `Uncategorized` instead of displaying a missing category UUID.
- Keep backend category deletion behavior unchanged: existing items continue to become uncategorized through the current database/backend behavior.
- Add frontend coverage for the stale-default-category case.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `item-form-category-selection`: New-item category initialization and reset must treat stale default category IDs as uncategorized.

## Impact

- Affected issue: GitHub issue #113, "Deleting a list category".
- Frontend list page category default state and category delete/SSE handling.
- `ItemForm` category initialization/reset behavior.
- Frontend unit or page tests around category deletion and stale default category IDs.
