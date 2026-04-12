# Todo Items

## Overview

Todo items are the core of the app — the actual tasks and shopping entries that users create, track, and complete. Each item belongs to a list, optionally belongs to a category, may have a due date, notes, assigned users, and a recurrence rule. The backend exposes full CRUD plus dedicated `PATCH /done`, `PATCH /starred`, and `PATCH /order` toggles. On marking a recurring item done the backend automatically creates the next instance. The frontend replaces its current mock-data store with real API calls.

---

## Design decisions

- **`items/` package**: per the project structure in `requirements.md`, items are a separate package from `lists/`. They still depend on `ListAccessService` (in `lists/`) for membership checks.
- **`recurrenceRule` as JSONB**: stored as a PostgreSQL `JSONB` column. A JPA `AttributeConverter<RecurrenceRule?, String?>` uses Jackson to serialise/deserialise — explicit, testable, and framework-portable.
- **Many-to-many assignments via `item_assignments` table**: the backend exposes `assignedUserIds: List<UUID>` in all DTOs. The frontend `TodoItem` interface is updated from `assignedUserId: string | null` to `assignedUserIds: string[]`. The `ItemForm` keeps a single-user dropdown (picks first assignment); `ItemCard` renders all assignees.
- **Recurrence on done**: computed in `ItemService.toggleDone`. Uses the item's `dueDate` as base (not the completion date). If no `dueDate`, uses today. Creates a new `TodoItem` with the same title/notes/category/recurrence/assignments; `parentItemId` points to the just-completed item. Done items with no recurrence: toggled without side effects.
- **All items returned (no server-side filtering)**: `GET /api/lists/{id}/items` returns all items for the list (filtering is client-side per requirements). Cursor-based pagination params (`cursor`, `limit`) are accepted but unused in the initial implementation — the response always returns all items in one page.
- **`updatedAt` managed by the backend**: set on every save, not trusted from the client.
- **`createdByUserId` set on creation, never changed**: `SET NULL` via FK when the creator account is deleted (already specified in requirements).
- **Cross-list guard on item endpoints**: `itemId` is validated against `listId` via `findByIdAndListId` — mismatch returns 404.

---

## Security considerations

- All endpoints verify list membership (403 if not a member).
- `POST`, `PUT`, `DELETE`, `PATCH /done`, `PATCH /starred`, `PATCH /order` require EDITOR+ (403 for VIEWER).
- `GET` (list + single) requires any membership (VIEWER+).
- `itemId` in URL is validated to belong to the `listId` in the URL path — cross-list access returns 404.
- Assignments are validated: only UUIDs of current list members are accepted.
- Uses parameterised JPA queries throughout.

---

## Implementation plan

1. Create `V4__create_items.sql` — `todo_items` and `item_assignments` tables.
2. Create `RecurrenceRule.kt` data class and `RecurrenceRuleConverter.kt` JPA `AttributeConverter`.
3. Create `TodoItem.kt` JPA entity.
4. Create `ItemAssignment.kt` JPA entity with `@EmbeddedId`.
5. Create `ItemRepository.kt` and `ItemAssignmentRepository.kt`.
6. Create `ItemService.kt` — CRUD, `toggleDone` (with recurrence), `toggleStarred`, `updateOrder`.
7. Create `ItemController.kt` at `/api/lists/{id}/items` — all endpoints with inline DTOs.
8. Write `ItemIntegrationTest.kt`.
9. Add `lib/api/items.ts` to frontend.
10. Update `TodoItem` interface in `mock-data.ts` — `assignedUserIds: string[]`; update mock data entries.
11. Update `ItemCard.svelte` and `ItemForm.svelte` to use `assignedUserIds`.
12. Update `items.svelte.ts` store — replace mock data with real API calls.
13. Update `GroceryCategorySection.svelte` if it references `assignedUserId`.
14. Update `docs/tasks.md` — mark section 7 backend + frontend tasks complete.

---

## Tasks

### Database

- [x] Create `V4__create_items.sql`: `todo_items` table with all fields; `item_assignments` join table; indexes on `(list_id)`, `(list_id, done)`, `(list_id, category_id)`, `(list_id, due_date)`, `(item_id)` on assignments

### Backend: entities & repositories

- [x] Create `RecurrenceRule.kt` data class (`intervalUnit: IntervalUnit`, `intervalValue: Int`) and `IntervalUnit` enum
- [x] Create `RecurrenceRuleConverter.kt` — JPA `AttributeConverter<RecurrenceRule?, String?>` using Jackson
- [x] Create `TodoItem.kt` JPA entity (all fields; `recurrenceRule` via converter)
- [x] Create `ItemAssignmentId.kt` `@Embeddable` and `ItemAssignment.kt` JPA entity
- [x] Create `ItemRepository.kt` with `findAllByListId` and `findByIdAndListId`
- [x] Create `ItemAssignmentRepository.kt` with `findAllByItemId`, `deleteByItemId`, `deleteByItemIdAndUserId`

### Backend: service & controller

- [x] Create `ItemService.kt`:
  - [x] `getItems(listId, userId)` — VIEWER+
  - [x] `getItem(listId, itemId, userId)` — VIEWER+
  - [x] `createItem(listId, userId, req)` — EDITOR+; sets `createdByUserId`
  - [x] `updateItem(listId, itemId, userId, req)` — EDITOR+
  - [x] `deleteItem(listId, itemId, userId)` — EDITOR+
  - [x] `toggleDone(listId, itemId, userId)` — EDITOR+; creates next instance for recurring items
  - [x] `toggleStarred(listId, itemId, userId)` — EDITOR+
  - [x] `updateOrder(listId, itemId, userId, sortOrder)` — EDITOR+
- [x] Create `ItemController.kt` at `/api/lists/{id}/items` with all endpoints and inline DTOs

### Backend: tests

- [x] Write `ItemIntegrationTest.kt`:
  - [x] `GET /items` returns items; 403 for non-member
  - [x] `POST /items` creates item with category and assignments; 403 for VIEWER
  - [x] `PUT /items/{iid}` updates all fields; 403 for VIEWER; 404 for wrong list
  - [x] `DELETE /items/{iid}` removes item; 403 for VIEWER
  - [x] `PATCH /done` toggles done; creates next instance for recurring item with due date; creates next instance for recurring item without due date (today + interval)
  - [x] `PATCH /starred` toggles starred; 403 for VIEWER

### Frontend: API client

- [x] Create `frontend/src/lib/api/items.ts` — typed DTOs and all item API functions

### Frontend: types & components

- [x] Update `TodoItem` interface in `mock-data.ts`: replace `assignedUserId: string | null` with `assignedUserIds: string[]`
- [x] Update all `mockItems` entries to use `assignedUserIds: []` / `assignedUserIds: ['u1']`
- [x] Update `ItemCard.svelte`: use `assignedUserIds` — derive `assignedUsers` array, render avatar for each
- [x] Update `ItemForm.svelte`: use `assignedUserIds` — keep single-user dropdown, emit `assignedUserIds: [id]` or `[]`
- [x] Check `GroceryCategorySection.svelte` — update if it references `assignedUserId`

### Frontend: store

- [x] Rewrite `items.svelte.ts` — replace mock data with real API: `loadItemsForList`, `createItem`, `updateItem`, `deleteItem`, `toggleDone`, `toggleStarred`; keep optimistic UI for done/starred toggles
