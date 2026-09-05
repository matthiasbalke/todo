## Context

Regular and grocery list views already support checked-item display, checked-item hiding, and capability-based UI gating. They do not currently provide a consistent real-list action to remove all checked items from the selected list, including checked items hidden by active filters.

Items are list-scoped, mutations require at least `EDITOR`, and SSE broadcasts per-list item changes. The frontend keeps list items in a shared item store and derives item mutation capability from the current user's list role.

## Goals / Non-Goals

**Goals:**

- Add a list-scoped bulk deletion workflow for checked items in regular and grocery real-list views.
- Enforce the same backend authorization as individual item deletion.
- Keep regular list state, connected clients, and checked counts consistent after deletion.
- Make the UI action visible when the user can edit items, and disable it when the current real list has no checked items.
- Delete all checked items in the current real list, regardless of active filters or Hide checked state.

**Non-Goals:**

- Add a Today or Week cross-list cleanup action.
- Add soft-delete, undo, archive, or item recovery.
- Change recurrence generation rules or delete incomplete generated recurring follow-up items.
- Change hide-checked filtering semantics.

## Decisions

1. Add a list-scoped endpoint: `DELETE /api/lists/{id}/items/finished`.

   Rationale: the operation targets a collection filtered by completed state within one list. Keeping it under the existing list item resource preserves existing auth and client routing patterns.

   Alternative considered: invoke individual item deletion repeatedly from the frontend. That would cause many requests, weaker transactional behavior, and less predictable SSE/client refresh behavior.

2. Authorize through `requireMinRole(listId, userId, ListRole.EDITOR)`.

   Rationale: deleting checked items is still item mutation. This matches create, update, toggle, reorder, and individual delete behavior.

   Alternative considered: require `OWNER` because the action is destructive. That would be inconsistent with current item deletion, where editors can already delete each checked item individually.

3. Delete matching checked items in one transaction and publish per-item deletion events for removed item IDs.

   Rationale: the transaction makes the bulk operation atomic for the selected list, while per-item SSE events fit the existing frontend event model without introducing a new event type.

   Alternative considered: publish a new bulk-deleted SSE event. That would require every client to understand a second deletion shape for little benefit at the current scale.

4. Confirm in a frontend modal using the current loaded count of checked items from the full current-list item set, before filters are applied.

   Rationale: users should see the destructive scope before the request, and filters must not make the action look narrower than it is. The backend remains authoritative and deletes the current checked set at request time, so concurrent changes are handled by the server.

   Alternative considered: send item IDs from the frontend. That would make the operation less convenient under realtime changes and would duplicate the server's filtering responsibility.

5. Expose the action in both regular and grocery list menus, but not Today.

   Rationale: regular and grocery views both represent one real source list. Today aggregates items across lists and should not offer a cross-list destructive cleanup action in this change.

   Alternative considered: add the action only to regular list view. That would leave grocery workflows without the same cleanup path even though grocery lists are a primary source of checked-item buildup.

## Risks / Trade-offs

- Concurrent item changes can make the confirmed count differ from the deleted count -> the backend deletes the current checked set atomically, and the frontend removes checked items from the current list after success while SSE reconciles connected clients.
- Lists with many checked items can emit many SSE events -> acceptable for the app's expected list size; keep the endpoint transactional and reuse existing client deletion handling.
- Users may confuse hiding checked items with deleting them -> use destructive styling and an explicit confirmation modal with the count.
- Filters can hide items that will still be deleted -> modal copy must state that all checked items in the list will be deleted, including hidden checked items.
- Deleting checked recurring occurrences removes historical occurrences -> this matches the cleanup intent, while generated unchecked follow-up items remain because they are not checked.
