## Context

The standard list page renders items grouped by category and delegates each group to `CategoryGroup.svelte`. Manual item ordering is currently handled with `svelte-dnd-action` inside a single category group; `handleFinalize` calls `reorderItemsOptimistic`, which updates `sortOrder` for the items reported by that group. Because each category is treated as an isolated drag zone, moving an item into a different category does not update the item's `categoryId`.

The backend already supports item category changes through the item update request and manual order changes through the reorder endpoint. This change should avoid new backend data model work and should keep backend authorization as the source of truth for item mutation.

## Goals / Non-Goals

**Goals:**

- Allow an editable user to drag an unchecked item from one category group to another category group in the list page.
- Persist both the destination `categoryId` and the destination group's manual order.
- Support moves into the uncategorized group by persisting `categoryId: null`.
- Keep drag controls and drop behavior unavailable to viewers through the existing item mutation capability.
- Preserve current drag-and-drop behavior for reordering items within the same category.

**Non-Goals:**

- Add cross-category drag-and-drop to grocery mode or the Today view.
- Change backend authorization, persistence schema, or category CRUD behavior.
- Reorder checked/completed items; current drag behavior only covers unchecked items.
- Introduce a new drag-and-drop library.

## Decisions

- Reuse `svelte-dnd-action` and configure compatible item zones for category groups.
  Rationale: the project already uses this library for item and list reordering. Extending the existing `CategoryGroup.svelte` behavior keeps interaction and test patterns local. Alternative considered: build pointer handlers manually, but that would duplicate library behavior and add avoidable touch handling risk.

- Treat the category group that receives the finalized drag as the source of truth for the destination category.
  Rationale: each `CategoryGroup` already knows its `categoryId`, including `null` for uncategorized. On finalize, any non-shadow item in that group's dnd list with a different `categoryId` should be updated to the group category before the final order is persisted.

- Persist category change and order as separate existing API operations.
  Rationale: `PUT /api/lists/{listId}/items/{itemId}` already changes `categoryId`, and `POST /api/lists/{listId}/items/reorder` already changes `sortOrder`. Combining them would require a backend contract change for a narrow UI fix. The frontend should optimistically update the moved item's category and destination ordering, call the item update for category changes, then call reorder for the destination group order.

- Keep permission gating at the component boundary.
  Rationale: the list page already passes `editable={capabilities.canEditItems}` and only enables manual drag mode through `isDraggable`. The implementation should keep handles/drop zones conditional on edit capability so viewers never get an interactive mutation path. Backend role checks still protect direct API calls.

## Risks / Trade-offs

- Partial persistence failure between category update and reorder can leave the server with a changed category but stale order. Mitigation: snapshot frontend item state before optimistic changes, revert on non-network errors, and reload list items after ambiguous failures where local state cannot be trusted.
- Cross-zone drag behavior depends on all category zones sharing compatible `svelte-dnd-action` configuration. Mitigation: centralize the item zone type/options in `CategoryGroup.svelte` and add component tests that simulate finalize payloads for cross-category moves.
- Existing offline reorder queue only stores ordered IDs and does not capture category changes. Mitigation: treat category-change persistence as a normal item update for now; if the category update fails due to offline/network conditions, revert or reload instead of queuing an incomplete reorder-only mutation.
