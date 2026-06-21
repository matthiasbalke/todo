## Context

`CategoryConfigDialog.svelte` is the current category-management surface. It orders categories by `sortOrder` and exposes up and down arrow buttons that swap two categories by saving both records. Categories already have a backend `sortOrder`, and the frontend list views already render real category groups from that order while keeping the uncategorized group virtual.

This iteration is intentionally limited to the configure categories dialog. The later list-view iteration will reuse the persistence path introduced here, but it should not be implemented in the same apply run.

## Goals / Non-Goals

**Goals:**

- Replace configure-dialog up/down reorder arrow buttons with drag handles.
- Allow owners and editors to reorder real categories in the configure categories dialog by drag and drop.
- Persist category order transactionally and normalize real category `sortOrder` values.
- Keep category rename, color selection, delete, and add flows working while rows are draggable.
- Leave list-page category group drag-and-drop for the second iteration.

**Non-Goals:**

- Add drag-and-drop category sorting to the standard list page in this iteration.
- Add group sorting to grocery mode or the Today view.
- Persist or reorder the virtual uncategorized group.
- Change item category assignment semantics.
- Add a new drag-and-drop dependency.

## Decisions

- Add a batch category reorder API during the dialog iteration.
  Rationale: Dragging categories produces a full real-category order, and persisting each category through separate `PUT /categories/{id}` calls risks partial order updates. A batch endpoint such as `POST /api/lists/{id}/categories/reorder` can validate membership, apply contiguous sort orders transactionally, and publish category update events after the order is committed. Alternative considered: reuse individual category updates from the dialog, but that keeps the brittle two-save swap model and does not scale well to arbitrary drag positions.

- Keep category `sortOrder` as the persisted order for real categories.
  Rationale: Existing APIs, duplication logic, mock data, and grouping utilities already understand category `sortOrder`. The reorder operation should normalize real categories to contiguous integer positions. Alternative considered: introduce a separate order table, but this adds complexity without a many-to-many ordering requirement.

- Keep the uncategorized group outside sortable category IDs.
  Rationale: Uncategorized items have `categoryId: null` and are not represented by category rows in the dialog. Category sorting should operate only on real category records. Alternative considered: create a synthetic category row for uncategorized, but that would change item semantics and conflicts with keeping uncategorized at the bottom.

- Use `svelte-dnd-action` for dialog row sorting.
  Rationale: The project already uses this dependency for drag-and-drop interactions. Reusing it keeps behavior and tests consistent. Alternative considered: custom pointer handling, but that adds avoidable input and accessibility risk.

- Make the implementation stop after dialog tests pass.
  Rationale: The user wants to inspect the dialog implementation before list-page sorting is applied. The list-page drag-and-drop work lives in the separate `sort-list-groups-list-view` change.

## Risks / Trade-offs

- Dialog editing and dragging can compete for row gestures. Mitigation: start drag only from a dedicated handle and keep name/color/delete/edit controls outside the handle.
- SSE may deliver several category update events after a reorder. Mitigation: update the local store optimistically from the batch response and make SSE upserts idempotent so repeated sort values converge.
- Concurrent category edits can race with a reorder. Mitigation: have the backend reject category IDs that do not belong to the list and normalize the current category set transactionally.
