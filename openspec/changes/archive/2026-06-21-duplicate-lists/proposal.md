## Why

Users often need a new list that starts from an existing household template, such as a recurring grocery or chore list. Duplicating a list avoids repetitive manual recreation while preserving the source list's current item setup.

## What Changes

- Add a duplicate action to the list options menu, positioned directly above `Delete list`.
- Add a backend list duplication operation that creates a new list for the requesting user from an existing list.
- Copy the source list metadata and all list contents needed to preserve item fields, including categories, item fields, recurrence settings, sort order, and assignments where applicable.
- Name the duplicate by appending the next available numeric suffix, starting with ` (1)` and incrementing to ` (2)`, ` (3)`, and so on when matching names already exist for the user.
- Return the duplicated list so the frontend can add it to local state and navigate to it.

## Capabilities

### New Capabilities
- `list-duplication`: Defines backend and frontend behavior for duplicating an existing list and its items.

### Modified Capabilities
- `list-ui-capabilities`: Adds duplication to owner-level list management UI capabilities.

## Impact

- Backend list API: new duplicate endpoint and service logic.
- Backend persistence: list, membership, group assignment, category, item, and item assignment repositories/services.
- Frontend API and list store: duplicate list client call and local state update.
- Frontend list page: owner-visible duplicate menu item above delete, loading/error handling, and navigation to the new list.
- Tests: backend integration coverage for duplicate behavior and frontend unit/component coverage for menu/store behavior.
