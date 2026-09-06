## 1. Backend API

- [x] 1.1 Add repository support to find checked item IDs by list and delete checked items by list.
- [x] 1.2 Add `ItemService.deleteFinishedItems(listId, userId)` with `EDITOR` authorization, transactional deletion, and per-deleted-item SSE publication.
- [x] 1.3 Add `DELETE /api/lists/{id}/items/finished` to `ItemController`, returning `204 No Content`.
- [x] 1.4 Ensure the bulk delete removes assignment rows through existing item delete cascades or explicit assignment cleanup before item deletion.

## 2. Frontend Data Flow

- [x] 2.1 Add `deleteFinishedItems(listId)` to the frontend item API client.
- [x] 2.2 Add an item-store action that calls the API and removes checked items for the target list only after success.
- [x] 2.3 Keep failed cleanup requests from changing local item state and surface errors through the caller.

## 3. Real List UI

- [x] 3.1 Compute the current list's checked-item count from the full loaded item set before active filters and Hide checked are applied.
- [x] 3.2 Add a destructive list-options menu item for deleting checked items in the regular list view when `capabilities.canEditItems` is true, disabled when the count is zero.
- [x] 3.3 Add the same destructive list-options menu item in grocery view for real lists with the same capability and disabled-state gating.
- [x] 3.4 Add a reusable confirmation modal that states how many checked items will be deleted from the current list, including hidden checked items.
- [x] 3.5 Add loading/disabled handling so the action cannot be submitted twice while cleanup is running.
- [x] 3.6 Leave Today and any future Week cross-list cleanup actions out of this implementation.

## 4. Tests

- [x] 4.1 Add backend integration tests for owner/editor success, viewer or non-member rejection, unchecked item preservation, and checked recurring occurrence cleanup.
- [x] 4.2 Add frontend API/store tests for the bulk delete call, success state update, and failed-request state preservation.
- [x] 4.3 Add regular list page tests for capability gating, disabled no-op state, filter-independent count, confirmation modal cancel, confirmation modal success, and error display.
- [x] 4.4 Add grocery view tests for the same action, count, modal, and capability gating.
- [x] 4.5 Add Today view tests proving the cleanup action is absent.
- [x] 4.6 Add focused Playwright coverage for deleting checked items from a real list menu when the shared HTTPS test deployment is available.

## 5. Verification

- [x] 5.1 Run backend tests for the item/list integration coverage.
- [x] 5.2 Run `bun run check` and focused Vitest coverage in `frontend/`.
- [x] 5.3 Run the focused e2e spec using the repository local-domain workflow when reachable.
- [x] 5.4 Run `openspec status --change delete-finished-list-items` and confirm the change is apply-ready.
