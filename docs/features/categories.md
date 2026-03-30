# Categories

## Overview

Categories are user-defined groupings scoped per list (e.g. "Rewe", "Aldi", "Produce"). Each category has a name, an optional hex color for visual distinction, and a sort order. Both the list detail view and grocery mode use categories as the primary organisational unit — items are grouped under their category header, with uncategorised items forming their own group. Category CRUD requires EDITOR or OWNER role; any member (including VIEWER) can read.

---

## Design decisions

- **EDITOR+ via `ListAccessService`**: The existing `requireRole` helper in `ListService` only checks for exact role match (OWNER). Rather than duplicating membership/auth logic in `CategoryService`, a new `ListAccessService` is extracted with a `requireMinRole` method that supports role hierarchy (using enum ordinals: OWNER=0, EDITOR=1, VIEWER=2 — lower ordinal = higher privilege). `ListService` is refactored to delegate to it. This aligns with the explicit mention of `ListAccessService` in `docs/security.md`.
- **Categories live in the `lists` package**: Per the project structure in `requirements.md`, the `lists/` package owns the List, Membership, and Category domain objects.
- **`sortOrder` is client-managed**: No dedicated reorder endpoint. Clients swap sortOrder values between two adjacent categories via two `PUT` calls. Simple and sufficient at the current scale.
- **Color is optional**: Stored as a nullable hex string (`#rrggbb`). The frontend uses a small set of preset color swatches — no third-party color picker library.
- **Cross-list access prevention**: PUT and DELETE validate the `categoryId` belongs to the given `listId` via `findByIdAndListId`. A mismatch returns 404, preventing one list's members from mutating another list's categories.

---

## Security considerations

- All 4 endpoints verify list membership before any data access (403 if not a member).
- POST / PUT / DELETE require EDITOR+ (OWNER or EDITOR) — VIEWER gets 403.
- `categoryId` path parameter is validated against the `listId` in the URL path (`findByIdAndListId`) — prevents cross-list access.
- Uses parameterized JPA queries throughout (no injection risk).
- UUID-based IDs for all resources (no sequential enumeration).

---

## Implementation plan

1. Create Flyway migration `V3__create_categories.sql` — `categories` table with FK to `lists(id) ON DELETE CASCADE` and index on `list_id`.
2. Create `Category` JPA entity (`id`, `listId`, `name`, `color`, `sortOrder`, `createdAt`).
3. Create `CategoryRepository` with `findAllByListIdOrderBySortOrder` and `findByIdAndListId`.
4. Create `ListAccessService` — extract `requireMembership` and add `requireMinRole` (hierarchy via ordinal); `ListRole` enum order must be `OWNER, EDITOR, VIEWER`.
5. Refactor `ListService` to use `ListAccessService`; no behavior change.
6. Create `CategoryService` — `getCategories` (VIEWER+), `createCategory` / `updateCategory` / `deleteCategory` (EDITOR+), with cross-list guard on PUT/DELETE.
7. Create `CategoryController` at `/api/lists/{id}/categories` — GET (200), POST (201), PUT `/{cid}` (200), DELETE `/{cid}` (204). DTOs defined inline.
8. Write `CategoryIntegrationTest` — CRUD happy paths, 403 for VIEWER, 404 for wrong listId on PUT/DELETE.
9. Add `color: string | null` to `Category` interface in `mock-data.ts`; update all 8 `mockCategories` entries.
10. Add category API functions to `frontend/src/lib/api/lists.ts` — `getCategories`, `createCategory`, `updateCategory`, `deleteCategory` with typed DTOs/requests.
11. Update the lists store — add `loadCategoriesForList(listId)`; make `saveCategory` and `deleteCategory` async (call API then update store); add `listId` parameter where needed.
12. Update `CategoryConfigDialog` — all handlers async, add color swatch row (8 preset colors), show error state on failure.
13. Update `CategoryGroup` — render a small colored circle in the category header when `category.color` is set.
14. Update `lists/[id]/+page.svelte` — call `loadCategoriesForList(data.id)` in a `$effect`.
15. Write `docs/features/categories.md` (this file).

---

## Tasks

### Backend: database & entities

- [x] Create `V3__create_categories.sql`: `categories` table with `id`, `list_id` (FK→lists CASCADE), `name`, `color`, `sort_order`, `created_at`; index on `list_id`
- [x] Create `Category.kt` JPA entity
- [x] Create `CategoryRepository.kt` with `findAllByListIdOrderBySortOrder` and `findByIdAndListId`

### Backend: access control

- [x] Verify `ListRole.kt` enum order is `OWNER, EDITOR, VIEWER`
- [x] Create `ListAccessService.kt` with `requireMembership(listId, userId)` and `requireMinRole(listId, userId, minimum)` (ordinal-based hierarchy)
- [x] Refactor `ListService.kt` to use `ListAccessService` — existing `ListIntegrationTest` must stay green

### Backend: category endpoints

- [x] Create `CategoryService.kt` — getCategories (any member), createCategory / updateCategory / deleteCategory (EDITOR+), cross-list 404 guard
- [x] Create `CategoryController.kt` at `/api/lists/{id}/categories` — GET, POST, PUT `/{cid}`, DELETE `/{cid}` with inline DTOs
- [x] Write `CategoryIntegrationTest.kt`:
  - [x] GET returns categories ordered by sortOrder; 403 for non-member
  - [x] POST creates category; 403 for VIEWER
  - [x] PUT updates name/color/sortOrder; 403 for VIEWER; 404 for categoryId from different list
  - [x] DELETE removes category; 403 for VIEWER; 404 for categoryId from different list

### Frontend: types & API

- [x] Add `color: string | null` to `Category` interface in `mock-data.ts`; update all `mockCategories` entries with `color: null`
- [x] Add `CategoryDto`, `CreateCategoryRequest`, `UpdateCategoryRequest` types to `lib/api/lists.ts`
- [x] Add `getCategories(listId)`, `createCategory(listId, req)`, `updateCategory(listId, catId, req)`, `deleteCategory(listId, catId)` to `lib/api/lists.ts`

### Frontend: store

- [x] Add `loadCategoriesForList(listId: string): Promise<void>` to the lists store — fetches from API, replaces all entries for that listId in the `categories` state array
- [x] Make `saveCategory` async: call `createCategory` or `updateCategory` API based on whether the category already exists in the store, then update store
- [x] Make `deleteCategory` async: call `deleteCategory` API, then splice from store

### Frontend: components & pages

- [x] Update `CategoryConfigDialog.svelte` — all handlers (`addCategory`, `commitEdit`, `moveUp`, `moveDown`, `deleteCategory`) become async; add 8 preset color swatches; show inline error on failure
- [x] Update `CategoryGroup.svelte` — render a `w-2.5 h-2.5 rounded-full` color dot before the category name when `category.color` is set
- [x] Update `lists/[id]/+page.svelte` — add `$effect(() => { loadCategoriesForList(data.id); })` to load categories on page open