## Why

Checked items can accumulate in real lists, especially grocery and household lists, and users currently have to delete them one by one from list views. A list-level cleanup action gives editors a fast way to remove checked work while preserving the existing checked-item display and hide-checked workflows.

## What Changes

- Add a real-list options-menu action for deleting all checked items in the current list from both regular view and grocery view.
- Require a confirmation modal before deleting checked items, including the number of items that will be removed.
- Show the action for users who can edit items in the source list, and enable it only when the list has checked items.
- Delete every checked item in the selected list, including checked items hidden by active filters or Hide checked, and including checked recurring occurrences, without deleting unchecked generated follow-up items.
- Refresh local list state and notify connected list clients after the bulk deletion.
- Do not add a Today or Week cross-list cleanup action in this change; this feature is only for real lists.

## Capabilities

### New Capabilities

- `bulk-delete-finished-items`: Bulk removal of checked todo items from a single editable real list.

### Modified Capabilities

- `list-ui-capabilities`: Item mutation capability includes access to the list-level checked-item cleanup action in real list views.

## Impact

- Backend item API: new list-scoped bulk delete endpoint for checked items.
- Backend item service/repository: authorization, deletion, and event publication for all removed checked items.
- Frontend item API/store: bulk delete client call and local state update.
- Regular and grocery list page menus: new destructive action, confirmation modal, loading/error handling, and capability gating.
- Tests: backend integration coverage, frontend unit/component coverage, and focused E2E coverage for the real-list menu workflow.
