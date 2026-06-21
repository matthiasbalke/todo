## 1. Existing Behavior

- [ ] 1.1 Confirm `/lists` renders persisted list groups from `ListGroup.sortOrder` and the virtual Ungrouped section after persisted groups.
- [ ] 1.2 Confirm existing list-card drag-and-drop inside and between `ListGroupSection` instances remains the behavior to preserve.
- [ ] 1.3 Confirm existing list group order persistence through `reorderListGroup` and `/api/list-groups/{gid}/order`.
- [ ] 1.4 Confirm category batch reorder endpoint/service tests as the local validation and normalization pattern to mirror.

## 2. Batch List Group Reorder API

- [ ] 2.1 Add `POST /api/list-groups/reorder` accepting the complete ordered set of persisted list group IDs for the signed-in user.
- [ ] 2.2 Validate submitted IDs are unique and match the signed-in user's persisted list groups exactly.
- [ ] 2.3 Reject missing, duplicate, unknown, or foreign list group IDs with `400` or `403` according to existing backend conventions.
- [ ] 2.4 Persist normalized `sortOrder` values as `0..n` in submitted order inside one transaction.
- [ ] 2.5 Return reordered `ListGroupDto[]` sorted by normalized `sortOrder`.

## 3. List Group Drag-and-Drop UI

- [ ] 3.1 Build a `/lists` group-wrapper model that separates sortable persisted list groups from the fixed-bottom virtual Ungrouped section.
- [ ] 3.2 Wrap only persisted list group wrappers in a group-level `svelte-dnd-action` zone on `/lists`.
- [ ] 3.3 Add a dedicated list group drag handle that does not conflict with collapse, rename/delete, or list-card drag handles.
- [ ] 3.4 Persist finalized list group wrapper order through the batch list group reorder store/API path.
- [ ] 3.5 Replace local group order with the normalized API response so subsequent renders are stable.
- [ ] 3.6 Keep Today, New list, New group, and Ungrouped outside the sortable persisted list group zone.

## 4. Preserve Existing List Behavior

- [ ] 4.1 Ensure list-card drag-and-drop inside and between list groups continues to use existing list handles and behavior.
- [ ] 4.2 Preserve list group collapsed state across list group wrapper reordering.
- [ ] 4.3 Ensure reordering list group wrappers does not change list assignments or per-group list order.
- [ ] 4.4 Ensure reordering list group wrappers does not invoke category reorder code or change list category order.

## 5. Tests and Validation

- [ ] 5.1 Add backend integration coverage for successful batch group reorder and normalized `sortOrder` values.
- [ ] 5.2 Add backend integration coverage for duplicate, missing, unknown, and foreign list group IDs.
- [ ] 5.3 Add `/lists` component coverage for list group wrapper drag handles and finalized group reorder persistence.
- [ ] 5.4 Add tests proving the virtual Ungrouped section remains bottom and outside the sortable persisted group zone.
- [ ] 5.5 Add regression coverage showing list-card drag-and-drop still works independently from list group wrapper dragging.
- [ ] 5.6 Add store/API coverage for the batch reorder method and normalized response handling.
- [ ] 5.7 Run `cd frontend && bun run test -- --run` and `cd frontend && bun run check`.
