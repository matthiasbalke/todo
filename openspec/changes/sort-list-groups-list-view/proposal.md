## Why

The `/lists` overview lets users organize lists into list groups, but the group wrappers themselves are only displayed by their stored creation/order value and cannot be reordered directly. Users can already drag lists within and between those groups, so the group wrappers should support the same direct ordering pattern.

## What Changes

- Allow users to reorder their list group wrappers on `/lists` by drag and drop.
- Persist the reordered list group order through the existing list-group order API/store behavior.
- Keep the lists inside each group unchanged when groups are reordered.
- Keep existing drag-and-drop for lists within and between groups working as it does today.
- Keep the virtual Ungrouped section outside list group sorting and displayed after persisted groups when it is visible.
- Do not change list categories or category ordering inside individual lists.

## Capabilities

### New Capabilities

### Modified Capabilities
- `list-ui-capabilities`: Adds `/lists` overview drag-and-drop sorting for persisted list group wrappers.

## Impact

- Frontend `/lists` overview and `ListGroupSection` rendering: support group-wrapper drag-and-drop while preserving existing list-card drag-and-drop.
- Frontend list store/API client: add a batch list-group reorder path for persisted group order updates.
- Backend list group ordering: add a batch reorder endpoint that validates the signed-in user's complete persisted group set and normalizes `sortOrder` transactionally.
- Tests: component coverage for list group wrapper reordering, Ungrouped-section behavior, and existing list drag regression coverage.
