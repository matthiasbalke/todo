## 1. Store and Persistence

- [x] 1.1 Add an item-store operation that optimistically moves an item to a destination category and applies destination-group sort order.
- [x] 1.2 Persist category changes through the existing item update API while preserving the item's existing editable fields.
- [x] 1.3 Persist destination-group manual order through the existing reorder API after category changes are applied.
- [x] 1.4 Revert or reload item state on non-network persistence failures so failed cross-category moves do not leave stale local state.

## 2. List Drag-and-Drop UI

- [x] 2.1 Configure category item drag zones so unchecked items can be dragged between category groups in the standard list view.
- [x] 2.2 Update `CategoryGroup.svelte` finalize handling to detect when a dropped item belongs to a different category than the receiving group.
- [x] 2.3 Keep intra-category manual reordering behavior unchanged for items dropped within their current group.
- [x] 2.4 Ensure the uncategorized group accepts categorized items and persists the moved item with `categoryId: null`.
- [x] 2.5 Keep drag handles and category drop targets gated by the existing item mutation capability.

## 3. Tests and Validation

- [x] 3.1 Add item-store tests for moving an item between categories, moving to uncategorized, and reverting on failed persistence.
- [x] 3.2 Add `CategoryGroup` component tests for cross-category finalize payloads and same-category reorder payloads.
- [x] 3.3 Add or update list-page tests verifying viewers cannot access item drag handles or drop behavior.
- [x] 3.4 Run `cd frontend && bun run test -- --run` and `cd frontend && bun run check`.
