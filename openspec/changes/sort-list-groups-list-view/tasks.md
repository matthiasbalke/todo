## 1. Precondition

- [ ] 1.1 Confirm the `sort-list-groups` configure-dialog iteration has been implemented, validated, reviewed by the user, and explicitly approved for continuation.
- [ ] 1.2 Confirm the category reorder API and optimistic store operation from the first iteration are available to reuse.

## 2. List Drag-and-Drop UI

- [ ] 2.1 Build a list-page grouped-category model that separates sortable real category groups from the fixed-bottom uncategorized group.
- [ ] 2.2 Wrap the standard list page's real category groups in a group-level `svelte-dnd-action` zone.
- [ ] 2.3 Add a dedicated category group drag handle that is visible only when `canManageCategories` is true.
- [ ] 2.4 Persist finalized real category group order through the existing reorder store operation.
- [ ] 2.5 Keep the uncategorized group visible at the bottom and outside the sortable category group zone.

## 3. Preserve Existing Item Behavior

- [ ] 3.1 Ensure item drag-and-drop inside and between category groups continues to use existing item handles and behavior.
- [ ] 3.2 Preserve category collapsed and done-collapsed state across category group reordering.
- [ ] 3.3 Keep viewer UI read-only by hiding group handles and disabling group drop behavior.

## 4. Tests and Validation

- [ ] 4.1 Add list-page component coverage for editable category group drag handles and finalized group reorder persistence.
- [ ] 4.2 Add list-page component coverage proving viewers cannot access category group drag handles or group drop behavior.
- [ ] 4.3 Add tests proving uncategorized remains bottom and outside the sortable real-category group zone.
- [ ] 4.4 Add regression coverage showing item drag-and-drop still works independently from category group dragging.
- [ ] 4.5 Run `cd frontend && bun run test -- --run` and `cd frontend && bun run check`.
