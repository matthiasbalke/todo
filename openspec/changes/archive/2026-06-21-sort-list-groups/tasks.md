## 1. Backend Reorder Persistence

- [x] 1.1 Add a transactional category reorder service operation that validates category IDs and normalizes real category `sortOrder` values.
- [x] 1.2 Add a category reorder API endpoint under `/api/lists/{id}/categories/reorder` guarded by the existing minimum `EDITOR` role.
- [x] 1.3 Return reordered category data so the frontend can update real category orders without a full reload.
- [x] 1.4 Publish or reuse category SSE events so other clients converge on the new category order.

## 2. Frontend Store and API

- [x] 2.1 Extend frontend category API types and client functions for the reorder request and response.
- [x] 2.2 Add an optimistic store operation for real category reordering that snapshots previous order and reverts or reloads on persistence failure.
- [x] 2.3 Keep category create, update, delete, duplicate, and SSE handling consistent with normalized real category order.
- [x] 2.4 Keep `groupByCategory` ordering real category groups by `sortOrder` while leaving the uncategorized group fixed at the bottom.

## 3. Configure Categories Dialog

- [x] 3.1 Replace the configure categories dialog's up and down reorder buttons with one drag handle per category row.
- [x] 3.2 Wrap dialog category rows in a `svelte-dnd-action` zone that persists finalized real category order through the reorder store operation.
- [x] 3.3 Keep category rename, color selection, delete, and add flows working while category rows are draggable.
- [x] 3.4 Show reorder errors through the dialog's existing error message area and restore previous row order on failed persistence.

## 4. Tests and Validation

- [x] 4.1 Add backend integration tests for successful category reorder, invalid foreign category IDs, missing/deleted category IDs, and viewer rejection.
- [x] 4.2 Add frontend store tests for optimistic category reorder success and failed-persistence rollback.
- [x] 4.3 Add configure-dialog component coverage proving drag handles are present, up/down arrows are absent, and finalized drag order is persisted.
- [x] 4.4 Add utility coverage proving uncategorized remains bottom when real category order changes.
- [x] 4.5 Run `cd backend && ./gradlew test`, `cd frontend && bun run test -- --run`, and `cd frontend && bun run check`.

## 5. Stop for Review

- [x] 5.1 Stop after iteration 1 is implemented and validated; do not implement list-page category group drag-and-drop until the user explicitly approves the second iteration.
