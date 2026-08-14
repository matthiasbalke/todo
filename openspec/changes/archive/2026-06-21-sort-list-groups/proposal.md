## Why

Category order is currently managed in the configure categories dialog through small up and down arrow buttons. Replacing those controls with drag-and-drop handles gives users the same direct-manipulation ordering pattern already used elsewhere in the app while keeping the first implementation small enough to review before list-page drag sorting is added.

## What Changes

- Allow editable users to reorder categories in the configure categories dialog by drag and drop.
- Remove the configure categories dialog's up and down reorder arrow buttons and replace them with drag handles.
- Persist the reordered real category order so the list and dialog reload in the new order.
- Keep category rename, color selection, delete, and add flows working while rows are draggable.
- Keep the uncategorized group outside category sorting; it remains a virtual bottom group when visible.
- Stop implementation after this dialog iteration so the behavior can be reviewed before list-page group drag-and-drop is applied.

## Capabilities

### New Capabilities

### Modified Capabilities
- `list-ui-capabilities`: Adds configure-dialog drag-and-drop category sorting as a category management capability for editable users.

## Impact

- Backend category persistence and APIs: persist real category order transactionally.
- Frontend configure categories dialog: replace up/down controls with drag handles and a drag-and-drop reorder zone.
- Frontend list store/API client: optimistically persist reordered category order and recover on failure.
- Tests: backend integration coverage for persisted category order and frontend component/store coverage for dialog reordering.
