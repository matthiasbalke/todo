## Context

The `/lists` overview groups lists by user-owned `ListGroup` records and renders each wrapper with `ListGroupSection.svelte`. Lists inside a section are already draggable with `svelte-dnd-action`, including moves between persisted groups and the virtual Ungrouped section. The page currently renders persisted groups as `groups.slice().sort((a, b) => a.sortOrder - b.sortOrder)`, and the backend exposes `/api/list-groups/{gid}/order` through `reorderListGroup`.

Issue 129 is about sorting the list group wrappers on `/lists`. It is not about list categories, category groups inside a list detail page, or the archived `sort-list-groups` category-ordering change.

## Goals / Non-Goals

**Goals:**

- Allow a signed-in user to reorder their persisted list group wrappers on `/lists`.
- Persist the resulting list group order so subsequent `/lists` loads render the new order.
- Keep lists inside each group assigned to the same group and in the same order when group wrappers move.
- Keep existing list-card drag-and-drop inside and between groups working.
- Keep the virtual Ungrouped section fixed after persisted list groups and out of group-wrapper sorting.
- Keep Today, new-list, and new-group affordances out of the sortable list group set.

**Non-Goals:**

- Change category ordering in the configure categories dialog or a list detail page.
- Add category group sorting to standard list detail, grocery mode, or the Today view.
- Persist or reorder the virtual Ungrouped section.
- Change list assignment semantics inside groups.
- Change item or item-category assignment semantics.
- Add a new drag-and-drop dependency.

## Decisions

- Reuse the existing list group ordering model.
  Rationale: `ListGroup.sortOrder` and `GET /api/list-groups` already define the persisted group order. The feature should build on those concepts instead of introducing a parallel ordering model.

- Add a batch list group reorder endpoint for final persistence.
  Rationale: Drag finalization produces a complete ordered set of persisted list group IDs. Persisting that set with a single endpoint lets the backend validate ownership, reject duplicate/missing/foreign IDs, and normalize `sortOrder` values to `0..n` transactionally. This follows the existing category reorder pattern more closely than sending repeated single-group `PATCH /api/list-groups/{gid}/order` calls, which can leave sparse or duplicate order values if a request fails midway.

- Sort only persisted list groups in the group-wrapper drag zone.
  Rationale: Ungrouped is virtual (`group === null`) and should remain after persisted groups. Today is a separate overview entry, not a list group. Including either in the sortable zone would create misleading persistence semantics.

- Add a dedicated group drag handle to avoid conflicts with list-card drag handles.
  Rationale: `ListGroupSection.svelte` already owns list-card drag behavior. Starting list group wrapper drag only from a section-level handle prevents accidental wrapper movement while users reorder or move lists. Alternative considered: make the entire section draggable, but that would conflict with collapse, rename/delete menu, and list-card drag handles.

- Keep group sorting scoped to the current user.
  Rationale: List groups are per-user wrappers, and `ListGroupService.requireOwnership` already enforces ownership for group writes. Reordering groups should affect only the signed-in user's `/lists` overview, including groups that contain shared lists.

## Risks / Trade-offs

- Nested drag zones can conflict between wrapper movement and list-card movement. Mitigation: make group drag start only from a dedicated section handle and keep existing list-card handles unchanged.
- Batch reordering requires a new API contract instead of only reusing the existing single-group order endpoint. Mitigation: mirror the existing category reorder endpoint shape and validation style so the contract remains predictable.
- Re-rendering grouped data after an optimistic reorder can disturb collapsed state. Mitigation: key collapsed state by list group ID and keep those keys unchanged during reordering.
- Users may expect the virtual Ungrouped section to be sortable too. Mitigation: keep this change scoped to persisted list groups and leave Ungrouped fixed at the bottom.
