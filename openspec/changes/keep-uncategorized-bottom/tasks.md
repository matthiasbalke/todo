## 1. Planning Alignment

- [ ] 1.1 Update or supersede the active `sort-list-groups` artifacts so uncategorized group sorting is removed from that change.
- [ ] 1.2 Confirm category group sorting, if implemented, only reorders real categories and leaves the uncategorized group fixed at the bottom.

## 2. Group Ordering Implementation

- [ ] 2.1 Review `groupByCategory` and list page grouping call sites to confirm uncategorized is appended after all real category groups.
- [ ] 2.2 Adjust any group-sorting implementation so the uncategorized group is excluded from sortable group IDs.
- [ ] 2.3 Preserve item drag-and-drop into the uncategorized group without changing the uncategorized group's bottom display position.
- [ ] 2.4 Ensure grocery mode or other shared `groupByCategory` consumers continue to receive uncategorized-last ordering.

## 3. Tests and Validation

- [ ] 3.1 Add `groupByCategory` tests for mixed real categories plus uncategorized items, asserting uncategorized is last.
- [ ] 3.2 Add `groupByCategory` tests for uncategorized-only visible items.
- [ ] 3.3 Add or update category group sorting tests, if that feature is present, to prove uncategorized cannot be moved above real categories.
- [ ] 3.4 Run `cd frontend && bun run test -- --run` and `cd frontend && bun run check`.
