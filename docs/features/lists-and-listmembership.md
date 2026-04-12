# Lists & List Memberships

## Overview

Lists are the top-level organisational unit of the app. Each list has an emoji, a name, optional description, and default sort settings. Access is governed by a membership model: every user who can see or interact with a list holds an explicit membership record with one of three roles — `OWNER`, `EDITOR`, or `VIEWER`. There are no "public" lists.

The creator of a list automatically becomes its `OWNER`. Lists can have multiple owners, but the last owner cannot demote or remove themselves.

---

## Database schema

### `lists`

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | Primary key, generated |
| `name` | `VARCHAR(255)` | Required |
| `emoji` | `VARCHAR(10)` | Nullable |
| `description` | `TEXT` | Nullable |
| `default_sort_field` | `VARCHAR(20)` | Default `CREATED` |
| `default_sort_direction` | `VARCHAR(4)` | Default `ASC` |
| `created_at` | `TIMESTAMPTZ` | Set on insert, immutable |

### `list_memberships`

| Column | Type | Notes |
|---|---|---|
| `list_id` | `UUID` | FK → `lists(id)` ON DELETE CASCADE |
| `user_id` | `UUID` | FK → `users(id)` ON DELETE CASCADE |
| `role` | `VARCHAR(10)` | `OWNER` / `EDITOR` / `VIEWER` |
| `created_at` | `TIMESTAMPTZ` | Set on insert, immutable |

Compound primary key `(list_id, user_id)` enforces at most one membership per user per list at the database level.

Indexes: `idx_list_memberships_user_id`, `idx_list_memberships_list_id`.

Migration: `V2__create_lists.sql`

---

## Design decisions

- **Membership model, not ownership column** — Instead of a single `owner_id` on `lists`, every user relationship is expressed as a `list_memberships` row. This makes sharing, role changes, and removal uniform operations without schema changes.

- **CASCADE deletes** — Both foreign keys use `ON DELETE CASCADE`. Deleting a list removes all its memberships automatically. Deleting a user removes all their memberships; the list itself survives unless they were the sole owner (the application enforces the sole-owner guard before deletion reaches the DB).

- **Sole-owner protection in the service layer** — The backend counts `OWNER`-role memberships before allowing a demotion or self-removal. This is a business-logic invariant, not a DB constraint, to allow future admin overrides.

- **Lightweight summary vs. full DTO** — `GET /api/lists` returns `ListSummaryDto` (id, name, emoji, createdAt) because the index view needs nothing more. The full `ListDto` (adds description, defaultSortField, defaultSortDirection) is returned on individual list endpoints.

- **Invite by email** — Members are added by looking up an existing user account by email. The invite fails with `404` if no account exists. There is no pending-invite queue yet.

---

## API endpoints

All endpoints require a valid JWT (`Authorization: Bearer <token>`). The authenticated user's UUID is resolved from the token on every request.

| Method | Path | Required role | Response |
|---|---|---|---|
| `GET` | `/api/lists` | any member | `200` `ListSummaryDto[]` |
| `POST` | `/api/lists` | authenticated | `201` `ListDto` |
| `GET` | `/api/lists/{id}` | any member | `200` `ListDto` / `403` |
| `PUT` | `/api/lists/{id}` | `OWNER` | `200` `ListDto` / `403` |
| `DELETE` | `/api/lists/{id}` | `OWNER` | `204` / `403` |
| `GET` | `/api/lists/{id}/members` | any member | `200` `MemberDto[]` / `403` |
| `POST` | `/api/lists/{id}/members` | `OWNER` | `201` `MemberDto` / `403` / `404` / `409` |
| `PUT` | `/api/lists/{id}/members/{uid}` | `OWNER` | `200` `MemberDto` / `400` / `403` |
| `DELETE` | `/api/lists/{id}/members/{uid}` | `OWNER` | `204` / `400` / `403` |

**Error conditions:**
- `403` — caller is not a member, or does not hold the required role
- `404` — list not found, or (on invite) no user with that email
- `409` — user is already a member of the list
- `400` — operation would leave the list with no owner (sole-owner guard)

---

## Backend implementation

**Files:**
- `backend/src/main/kotlin/…/lists/List.kt` — JPA entity
- `backend/src/main/kotlin/…/lists/ListMembership.kt` — JPA entity with composite key
- `backend/src/main/kotlin/…/lists/ListMembershipId.kt` — Serializable composite key class
- `backend/src/main/kotlin/…/lists/ListRole.kt` — Enum (`OWNER`, `EDITOR`, `VIEWER`)
- `backend/src/main/kotlin/…/lists/ListRepository.kt` — custom JPQL query for member-scoped list fetch
- `backend/src/main/kotlin/…/lists/ListMembershipRepository.kt` — membership lookups and role counts
- `backend/src/main/kotlin/…/lists/ListService.kt` — all business logic, `@Transactional` on mutating operations
- `backend/src/main/kotlin/…/lists/ListController.kt` — REST controller, DTOs defined inline
- `backend/src/main/resources/db/migration/V2__create_lists.sql`
- `backend/src/test/kotlin/…/lists/ListIntegrationTest.kt` — Testcontainers-backed integration tests

**Integration test coverage:**
- Create list → creator is OWNER, list appears in `GET /api/lists`
- `GET /api/lists` returns only lists the caller is a member of
- `GET /api/lists/{id}` returns `403` for non-member
- `PUT /api/lists/{id}` succeeds for OWNER, `403` for EDITOR and VIEWER
- `DELETE /api/lists/{id}` succeeds for OWNER and cascades memberships, `403` for EDITOR and VIEWER
- Invite by unknown email → `404`
- Invite existing member → `409`
- Invite as non-OWNER → `403`
- Demote sole OWNER → `400`
- Role change as non-OWNER → `403`
- Remove sole OWNER self → `400`
- Remove as non-OWNER → `403`

---

## Frontend implementation

### API client

**`frontend/src/lib/api/client.ts`** — shared HTTP helper extracted from `auth.ts`:
- `ApiError` — typed error class (status, message, optional code)
- `fetchJson<T>` — fetch wrapper with `credentials: 'include'`, JSON headers, error parsing, and 204 handling

**`frontend/src/lib/api/lists.ts`** — typed API module:
- Types: `ListRole`, `ListSummaryDto`, `ListDto`, `MemberDto`, `CreateListRequest`, `UpdateListRequest`, `AddMemberRequest`, `ChangeMemberRoleRequest`
- `authedFetch()` — injects `Authorization: Bearer <token>` from the auth store
- One exported function per endpoint: `getLists`, `createList`, `getList`, `updateList`, `deleteList`, `getMembers`, `addMember`, `changeMemberRole`, `removeMember`

### Store

**`frontend/src/lib/stores/lists.svelte.ts`** — Svelte 5 `$state`-based store:
- `loadLists()` — called once on app bootstrap from `(app)/+layout.ts`; populates the store from `GET /api/lists`
- `createList(req)` — POSTs to API, pushes result into store
- `updateList(id, req)` — PUTs to API, replaces entry in store
- `deleteList(id)` — DELETEs via API, removes from store
- `isLoading()` — boolean for skeleton UI
- Categories remain mock-data-driven (backend not yet implemented)

### Components and pages

**`ListForm.svelte`** — simplified: `onsubmit` emits `{ name, emoji }` only (no id, ownerId, or sort fields).

**`MembersDialog.svelte`** — modal dialog (`listId`, `onclose` props):
- Loads members on mount via `getMembers()`
- Determines caller's role from the members list
- OWNER view: role dropdown + Remove button per member; invite form (email + role select)
- Non-OWNER view: read-only list with role badges
- Error handling: `409` → "already a member", `404` → "no account found", `400` → "sole owner" guard message

**`(app)/+layout.ts`** — calls `loadLists()` after `restoreSession()`, before any child page renders.

**`(app)/lists/+page.svelte`** — loading skeleton while `isLoading()`; async create via `createList()`; navigates to new list on success.

**`(app)/lists/[id]/+page.svelte`** — updated field names (`defaultSortField`, `defaultSortDirection`); async edit via `updateList()`; OWNER-only "Delete list" menu item; "Members" menu item opens `MembersDialog`.

**`(app)/lists/[id]/grocery/+page.svelte`** — same field-name fixes; edit handler uses `updateList()`.

---

## Status

### Done

- [x] `V2__create_lists.sql` — lists and list_memberships tables
- [x] `List`, `ListMembership`, `ListMembershipId`, `ListRole` entities
- [x] `ListRepository`, `ListMembershipRepository`
- [x] `ListService` — full CRUD + member management + sole-owner guard
- [x] `ListController` — all 9 endpoints
- [x] Integration tests — full coverage of CRUD and role-based access
- [x] `lib/api/client.ts` — shared fetch helper
- [x] `lib/api/lists.ts` — typed API module
- [x] `lib/stores/lists.svelte.ts` — real API replacing mock init
- [x] `ListForm.svelte` — simplified submit type
- [x] `MembersDialog.svelte` — member management dialog
- [x] `(app)/+layout.ts` — bootstrap `loadLists()`
- [x] `(app)/lists/+page.svelte` — async create, loading skeleton
- [x] `(app)/lists/[id]/+page.svelte` — renamed fields, delete, members dialog
- [x] `(app)/lists/[id]/grocery/+page.svelte` — renamed field fixes

### Not yet done

- [ ] Frontend "Delete list" confirmation dialog (currently uses `window.confirm`)
- [ ] Cascade delete cleanup for sole-owned lists on user account deletion (tracked in auth task section)
- [ ] SSE real-time sync for list and membership changes
- [ ] Audit logging for list mutations
- [ ] E2E tests: create list, invite second user
