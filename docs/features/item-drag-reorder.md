# Item Drag-and-Drop Reorder

Allows users to manually reorder todo items within a category group by dragging them.

## Scope

- Only active when the list's sort mode is **MANUAL** and the user has **EDITOR** or **OWNER** role.
- Reordering is **within-category only** — items cannot be dragged across category groups.
- Only **undone items** are reorderable; the done/checked section is static.

## Library

**`svelte-dnd-action`** — chosen over native HTML5 DnD because iOS Safari does not fire `dragstart`/`drop` on touch. `svelte-dnd-action` uses Pointer Events and has built-in touch support. The `dragHandleZone` + `dragHandle` API restricts drag initiation to a handle element, avoiding conflict with the horizontal swipe-to-delete gesture in `ItemCard.svelte`.

## API

`POST /api/lists/{id}/items/reorder` — bulk reorder in a single atomic transaction.

```json
{ "items": [{ "id": "uuid", "sortOrder": 0 }, ...] }
```

Returns `204 No Content`. Item IDs that belong to a different list are silently skipped (security: the query uses `findAllByListIdAndIdIn`).

**sortOrder gap strategy:** consecutive integers `0, 1, 2, …` are assigned after each drop. Every reorder sends all positions for the category group, so there is no risk of collision or stale gaps.

## UX

- A 6-dot drag handle appears on the left of each undone item card when in MANUAL sort mode.
- `touch-none` (`touch-action: none`) on the handle prevents the card's swipe-to-delete from triggering when dragging from the handle.
- Optimistic UI: order updates immediately in the store; reverts on API error.
- One `POST /reorder` call per drag (not N individual `PATCH /order` calls).
