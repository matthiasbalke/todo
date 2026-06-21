## Context

The standard list page groups items by category through `groupByCategory` and renders each group with `CategoryGroup.svelte`. Item drag-and-drop is already implemented with `svelte-dnd-action`, including cross-category item moves. The first `sort-list-groups` iteration introduces transactional category reorder persistence and configure-dialog row drag-and-drop.

This second iteration must start only after the dialog iteration has been reviewed and approved. It should reuse the category reorder API and store operation from that first iteration instead of adding a second persistence path.

## Goals / Non-Goals

**Goals:**

- Allow owners and editors to reorder real category groups from the standard list page.
- Reuse the dialog iteration's category reorder API and optimistic store operation.
- Keep the uncategorized group fixed after all real category groups.
- Preserve item membership and per-group item order when category groups move.
- Keep existing item drag-and-drop behavior working.
- Keep group reordering unavailable to viewers.

**Non-Goals:**

- Change the configure categories dialog; that belongs to the first iteration.
- Add group sorting to grocery mode or the Today view.
- Persist or reorder the virtual uncategorized group.
- Change item category assignment semantics.
- Add a new drag-and-drop dependency.

## Decisions

- Reuse the category reorder API and store operation from `sort-list-groups`.
  Rationale: The list page is another UI surface for the same real category order. Reusing the dialog iteration's persistence path avoids duplicate reorder contracts and keeps category ordering consistent. Alternative considered: implement a list-page-specific reorder endpoint, but that would fragment the category order model.

- Wrap only real category groups in the list-page sortable zone.
  Rationale: The uncategorized group is virtual and must remain at the bottom. Real category groups can be reordered while the uncategorized group is rendered separately after the sortable zone. Alternative considered: include uncategorized in the zone and force it back to the bottom, but that creates misleading drag affordances.

- Add a dedicated group drag handle to avoid conflicts with item drag handles.
  Rationale: `CategoryGroup.svelte` already owns item-level drag behavior. Starting category group drag only from a group handle prevents accidental group movement while users reorder or move items. Alternative considered: make the entire group draggable, but that would conflict with item interactions and collapse controls.

- Gate list-page group sorting with `canManageCategories`.
  Rationale: Category ordering is category management, while item dragging is item mutation. Owners and editors can manage categories; viewers should see the resulting order without mutation affordances. Backend role checks remain authoritative through the existing reorder endpoint.

## Risks / Trade-offs

- Nested drag zones can conflict between group movement and item movement. Mitigation: make group drag start only from a dedicated handle and keep existing item handles unchanged.
- Re-rendering grouped data after an optimistic reorder can disturb collapsed state. Mitigation: key collapse state by category ID and keep those keys unchanged during reordering.
- Users may expect grocery mode sorting too. Mitigation: keep this iteration scoped to the standard list page and leave grocery mode out of the requirements.
