## 1. Planning Alignment

- [x] 1.1 Create proposal, design, and delta spec artifacts for the active `sort-list-groups` change.
- [x] 1.2 Update the change scope so list group sorting is distinct from category group sorting.
- [x] 1.3 Include the `keep-uncategorized-bottom` invariant in the list group sorting spec behavior.

## 2. Implementation State

- [x] 2.1 Confirm `/lists` only sorts persisted list group wrappers.
- [x] 2.2 Confirm the virtual `Ungrouped` list section stays outside the sortable list group zone and remains at the bottom.
- [x] 2.3 Confirm list group sorting does not change per-list category order or call category reorder behavior.
- [x] 2.4 Confirm existing list-card drag-and-drop remains independent from list group wrapper sorting.

## 3. Validation

- [x] 3.1 Confirm list page tests cover persisted list group sorting with `Ungrouped` outside the sortable zone.
- [x] 3.2 Run `cd frontend && bun run test -- --run` and `cd frontend && bun run check`.
- [x] 3.3 Run `openspec validate sort-list-groups --strict`.
