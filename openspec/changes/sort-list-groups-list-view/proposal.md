## Why

After category drag-and-drop works in the configure categories dialog, users should be able to make the same ordering adjustment directly from the grouped list view. This second iteration adds list-page category group sorting after the dialog implementation has been reviewed.

## What Changes

- Allow editable users to reorder real category groups in the standard list view by drag and drop.
- Reuse the category reorder API/store behavior introduced by the dialog iteration.
- Keep item ordering inside each group unchanged when groups are reordered.
- Keep item drag-and-drop inside and between category groups working as it does today.
- Keep the uncategorized group fixed at the bottom when it is visible.
- Apply only after the `sort-list-groups` dialog iteration has been implemented, validated, and approved by the user.

## Capabilities

### New Capabilities

### Modified Capabilities
- `list-ui-capabilities`: Adds standard list-view drag-and-drop real category group sorting as a category management capability for editable users.

## Impact

- Frontend list view and category group rendering: support group-level drag-and-drop for real categories while preserving existing item drag-and-drop.
- Frontend list store/API client: reuse the category reorder operation from the dialog iteration.
- Tests: component coverage for editable list-page group reordering, viewer restrictions, uncategorized-bottom behavior, and item drag regression coverage.
