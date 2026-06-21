## 1. Existing Behavior

- [ ] 1.1 Confirm `/lists` renders persisted list groups from `ListGroup.sortOrder` and the virtual Ungrouped section after persisted groups.
- [ ] 1.2 Confirm existing list-card drag-and-drop inside and between `ListGroupSection` instances remains the behavior to preserve.
- [ ] 1.3 Confirm existing list group order persistence through `reorderListGroup` and `/api/list-groups/{gid}/order`.

## 2. List Group Drag-and-Drop UI

- [ ] 2.1 Build a `/lists` group-wrapper model that separates sortable persisted list groups from the fixed-bottom virtual Ungrouped section.
- [ ] 2.2 Wrap only persisted list group wrappers in a group-level `svelte-dnd-action` zone on `/lists`.
- [ ] 2.3 Add a dedicated list group drag handle that does not conflict with collapse, rename/delete, or list-card drag handles.
- [ ] 2.4 Persist finalized list group wrapper order through the list group order store/API path.
- [ ] 2.5 Normalize persisted list group `sortOrder` values after finalization so subsequent loads are stable.
- [ ] 2.6 Keep Today, New list, New group, and Ungrouped outside the sortable persisted list group zone.

## 3. Preserve Existing List Behavior

- [ ] 3.1 Ensure list-card drag-and-drop inside and between list groups continues to use existing list handles and behavior.
- [ ] 3.2 Preserve list group collapsed state across list group wrapper reordering.
- [ ] 3.3 Ensure reordering list group wrappers does not change list assignments or per-group list order.
- [ ] 3.4 Ensure reordering list group wrappers does not invoke category reorder code or change list category order.

## 4. Tests and Validation

- [ ] 4.1 Add `/lists` component coverage for list group wrapper drag handles and finalized group reorder persistence.
- [ ] 4.2 Add tests proving the virtual Ungrouped section remains bottom and outside the sortable persisted group zone.
- [ ] 4.3 Add regression coverage showing list-card drag-and-drop still works independently from list group wrapper dragging.
- [ ] 4.4 Add store/API or backend coverage for stable persisted list group order normalization if implementation changes persistence behavior.
- [ ] 4.5 Run `cd frontend && bun run test -- --run` and `cd frontend && bun run check`.
