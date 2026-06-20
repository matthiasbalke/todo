## Context

Lists already have owner-only management operations in `ListController` and `ListService`, with role checks centralized through `ListAccessService`. Items, categories, memberships, and per-user group assignments are stored separately, and the frontend derives list UI permissions from the current user's role before showing owner-only controls.

Issue 126 asks for duplicating an existing list from the list burger menu, copying all item fields exactly, and naming the new list with the next ` (n)` suffix.

## Goals / Non-Goals

**Goals:**
- Provide an owner-only backend operation that duplicates a list in one transaction.
- Preserve source list metadata, categories, memberships, items, recurrence rules, item completion/starred state, ordering, parent item links, and assigned users.
- Generate new identifiers for the duplicated list, categories, and items.
- Add a frontend menu action directly above delete, call the duplicate API, update local list state, and navigate to the new list.
- Cover suffix generation and deep-copy behavior with backend integration tests, and cover the frontend store/menu behavior with focused tests.

**Non-Goals:**
- Bulk duplication across multiple lists.
- A confirmation dialog or edit-before-create workflow.
- File attachment duplication, unless attachment entities already belong directly to copied item fields when this change is implemented.
- Changing existing list, category, item, recurrence, member, SSE, or group behavior outside the duplicate operation.

## Decisions

1. Add `POST /api/lists/{id}/duplicate`.

   Rationale: duplication is a command on an existing list and produces a new list resource. Keeping it under the existing list controller matches the current API shape for owner-only list operations.

   Alternative considered: `POST /api/lists` with a `sourceListId` request body. That would overload normal list creation and make authorization and response semantics less explicit.

2. Implement duplication in `ListService` as one transaction.

   Rationale: the duplicate should either contain the complete copied graph or not exist. The service already owns list lifecycle and has access to list membership and group assignment behavior.

   Alternative considered: chaining existing create-category and create-item service methods. That would publish many source-list style SSE events and would stamp `createdByUserId` with the requester instead of preserving item fields exactly.

3. Copy memberships to preserve item assignment semantics.

   Rationale: assigned users are item fields in the API. If memberships were not copied, the duplicate could contain assignments to users who are not visible as members on the duplicate list, producing inconsistent UI behavior. Copying memberships keeps assignments and member display coherent. The endpoint remains owner-only to avoid editors or viewers creating shared duplicates.

   Alternative considered: duplicate only for the requester and drop assignments to other users. That conflicts with the issue requirement to copy all item fields exactly.

4. Generate the suffix from the requesting user's accessible list names after normalizing the source name.

   Rationale: users reason about duplicate names within the list set they can see. This matches the issue examples and avoids unexpected conflicts from inaccessible lists. Normalizing a trailing numeric copy suffix prevents copying `Groceries (1)` into `Groceries (1) (1)` and instead continues the base-name sequence as `Groceries (2)`.

   Alternative considered: enforce uniqueness globally across all lists. The data model does not currently require global list-name uniqueness, and global checks would expose implementation complexity without user value.

5. Do not publish source-list SSE events for the duplicated contents.

   Rationale: the duplicate is a new list with no active subscribers until the user opens it. Returning the new list detail and updating the list store is enough for the initiating client.

   Alternative considered: publishing list/item/category created events for the new list. That adds noise and may not reach clients until they connect to the new list stream.

## Risks / Trade-offs

- Copying memberships may make the duplicate immediately visible to every source member -> keep the operation owner-only and document/cover this as expected behavior in tests.
- Deep-copy ordering can break parent item references if copied in a single pass -> first create item copies and an old-to-new item ID map, then patch parent references and save again.
- Category references can point to the source list if IDs are copied blindly -> generate an old-to-new category ID map before creating item copies.
- Suffix generation can race when duplicate requests run concurrently -> compute the suffix transactionally and accept the current model's lack of list-name uniqueness; if duplicates collide, both names are still valid because names are not unique constraints.
- Large lists require multiple inserts -> use repository `saveAll` where practical and keep the operation transactional.
