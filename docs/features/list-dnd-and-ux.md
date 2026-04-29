# List Drag-and-Drop & Group UX

## Overview

Allows users to assign lists to groups and reorder lists within groups entirely by drag-and-drop, removing the previous select-box UI. The ungrouped section now also collapses. Empty groups show a drop-zone hint while a drag is in progress so users know they can drop into them.

## Design decisions

- **`dndzone` (full-card drag) rather than `dragHandleZone`** — list cards are larger and less dense than item cards; dragging the whole card feels natural and doesn't require a visible handle icon. Item cards continue to use `dragHandleZone`.
- **Module-level `isDraggingAny` state** — a single `$state` in `drag.svelte.ts` lets all `ListGroupSection` instances know when any drag is in progress, so they can show/hide empty drop zones without prop drilling or Svelte context.
- **Finalize-only API calls** — `consider` events only update local preview state; actual API calls (`assignListGroup`, `reorderListInGroup`) are made on `finalize` to avoid hammering the server during a drag.
- **Removed select boxes** — the `allGroups` prop and `<select>` dropdowns are gone; drag-and-drop is the only assignment mechanism.
- **Sort order update on every finalize** — after a drop, `reorderListInGroup` is called for any item whose `sortOrderInGroup` differs from its new array index. This keeps server state consistent without a dedicated bulk-reorder endpoint.

## Security considerations

All mutations go through the existing authenticated API client (`authedFetch`). No new endpoints are introduced; this is purely frontend re-plumbing of calls that already exist.

## Implementation plan

1. Create `frontend/src/lib/stores/drag.svelte.ts` — exports `isDraggingAny()` getter and `setDraggingAny(v)` setter backed by module-level `$state`.
2. Rewrite `ListGroupSection.svelte`:
   a. Make the ungrouped section collapsible (add button matching the grouped branch).
   b. Remove `allGroups` prop and `<select>` elements.
   c. Remove `onlistmove` / `onlistreorder` callbacks (component calls store directly).
   d. Add `dndItems` local state synced from `sortedLists` when not dragging.
   e. Wrap list cards in `use:dndzone` with `type: 'list-card'`.
   f. In `handleConsider`: set local `isDragging = true`, call `setDraggingAny(true)`, update `dndItems`.
   g. In `handleFinalize`: set `isDragging = false`, call `setDraggingAny(false)`, detect cross-group moves → `assignListGroup`, detect order changes → `reorderListInGroup`.
   h. Show "Drop here" placeholder when `draggingAny && dndItems.length === 0`.
3. Update `+page.svelte` — remove `allGroups` prop passing; remove unused `onlistmove`/`onlistreorder` handlers.
4. Update `ListGroupSection.test.ts` — remove select-related test and `allGroups` prop; add collapse test for ungrouped; add `reorderListInGroup` to store mock.
