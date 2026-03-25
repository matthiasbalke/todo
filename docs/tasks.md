# Implementation Tasks

Checkbox-based task list for tracking implementation progress. Tasks are small and independently verifiable (automated or manual). See `docs/requirements.md` for full specifications.

---

## 1. Infrastructure & Project Setup

- [ ] Create `backend/` directory with `build.gradle.kts`, `settings.gradle.kts`, and Gradle wrapper
- [ ] Configure `build.gradle.kts`: Kotlin, Spring Boot, Java 25 toolchain, dependencies (Spring Web, Security, Data JPA, Flyway, Testcontainers)
- [ ] Create Spring Boot main application class (`TodoApplication.kt`)
- [ ] Create `frontend/` directory and scaffold SvelteKit project (`bun create svelte`)
- [ ] Install frontend dependencies: TailwindCSS, `@vite-pwa/sveltekit`, `@sveltejs/adapter-node`
- [ ] Configure `tailwind.config.ts` and `vite.config.ts`
- [ ] Create `e2e/` directory, install Playwright (`bunx playwright install --with-deps chromium`)
- [ ] Create root `docker-compose.yml` with `postgres`, `backend`, `frontend` services
- [ ] Create `backend/Dockerfile` (multi-stage: Gradle build → JRE 25 runtime)
- [ ] Create `frontend/Dockerfile` (multi-stage: bun build → Node runtime)
- [ ] Verify `docker compose up --build` starts all services and each reaches its health check

---

## 2. Backend — Project Skeleton & Database

- [ ] Create Flyway migration `V1__create_users.sql`: `users`, `webauthn_credentials`, `oauth_identities` tables
- [ ] Create Flyway migration `V2__create_lists.sql`: `lists`, `list_memberships` tables with indexes
- [ ] Create Flyway migration `V2b__create_list_groups.sql`: `list_groups` table; add `group_id` (nullable FK) and `sort_order_in_group` columns to `lists`; index on `(user_id)` on `list_groups`
- [ ] Create Flyway migration `V3__create_categories.sql`: `categories` table
- [ ] Create Flyway migration `V4__create_items.sql`: `todo_items`, `item_assignments` tables with indexes (`(list_id, done)`, `(list_id, category_id)`, `(list_id, due_date)`)
- [ ] Create Flyway migration `V5__create_saved_items.sql`: `saved_items` table
- [ ] Create Flyway migration `V6__create_attachments.sql`: `item_attachments` table
- [ ] Create Flyway migration `V7__create_audit_log.sql`: `audit_log` table
- [ ] Create Flyway migration `V8__create_push_subscriptions.sql`: `push_subscriptions` table
- [ ] Create `AbstractIntegrationTest` base class that starts a shared Testcontainers PostgreSQL instance (reuse mode)
- [ ] Write a smoke test that runs all Flyway migrations against the Testcontainers PostgreSQL and confirms schema applies cleanly
- [ ] Configure `application.yml` with datasource, JPA, Flyway settings (dev profile uses `localhost:5432`)

---

## 3. Backend — Authentication (WebAuthn + OAuth2 + JWT)

- [ ] Create `User` JPA entity and `UserRepository`
- [ ] Create `WebAuthnCredential` JPA entity and repository
- [ ] Create `OAuthIdentity` JPA entity and repository
- [ ] Configure Spring Security `SecurityFilterChain`: permit `/api/auth/**`, `/actuator/health`; require JWT for all other `/api/**`
- [ ] Implement JWT `TokenService`: issue access token + refresh token (HS256, configurable secret + expiry)
- [ ] Implement `JwtAuthenticationFilter`: validates JWT, sets `SecurityContext`
- [ ] Implement `POST /api/auth/webauthn/register-options`: returns `PublicKeyCredentialCreationOptions` for given email; creates user if not exists
- [ ] Implement `POST /api/auth/webauthn/register`: verifies attestation, stores `WebAuthnCredential`, returns JWT pair
- [ ] Implement `POST /api/auth/webauthn/login-options`: looks up user by email, returns `PublicKeyCredentialRequestOptions`
- [ ] Implement `POST /api/auth/webauthn/login`: verifies assertion, returns JWT pair
- [ ] Implement Google OAuth2 login (`GET /api/auth/oauth2/google` redirect + `GET /api/auth/oauth2/callback`): links or creates account by email, returns JWT pair
- [ ] Implement `POST /api/auth/refresh`: validates refresh token, issues new access token
- [ ] Implement `POST /api/auth/logout`: invalidates refresh token (server-side blocklist or short expiry)
- [ ] Implement `GET /api/users/me`: returns current user's profile (id, email, displayName)
- [ ] Implement `PUT /api/users/me`: updates `displayName` (and email if not linked to OAuth)
- [ ] Implement `GET /api/users/me/deletion-preview`: returns lists to be deleted (sole OWNER) and lists to be removed from
- [ ] Implement `DELETE /api/users/me`: deletes account data per spec (memberships, subscriptions, credentials, sole-owned lists)
- [ ] Write unit tests for `TokenService` (issue, validate, expired, tampered)
- [ ] Write integration tests for WebAuthn register + login flows (using a test FIDO2 authenticator/stub)
- [ ] Write integration test for account deletion: sole-owned list deleted, shared list membership only removed

---

## 4. Backend — Lists & Memberships

- [ ] Create `List` JPA entity (name, emoji, description, defaultSortField, defaultSortDirection) and repository
- [ ] Create `ListMembership` JPA entity (listId, userId, role) and repository
- [ ] Implement `GET /api/lists`: returns lightweight projection (no items) of all lists the current user is a member of
- [ ] Implement `POST /api/lists`: creates list, adds creator as OWNER
- [ ] Implement `GET /api/lists/{id}`: returns full list details; 403 if not a member
- [ ] Implement `PUT /api/lists/{id}`: updates name/emoji/description/sort settings; OWNER only
- [ ] Implement `DELETE /api/lists/{id}`: deletes list and all related data; OWNER only
- [ ] Implement `GET /api/lists/{id}/members`: returns member list with roles
- [ ] Implement `POST /api/lists/{id}/members`: invite by email (creates membership); OWNER only
- [ ] Implement `PUT /api/lists/{id}/members/{uid}`: change role; OWNER only; cannot demote self if sole OWNER
- [ ] Implement `DELETE /api/lists/{id}/members/{uid}`: remove member; OWNER only
- [ ] Write integration tests for CRUD operations and role-based access (OWNER / EDITOR / VIEWER / non-member)

---

## 4a. Backend — List Groups

- [ ] Create `ListGroup` JPA entity (userId, name, sortOrder) and repository
- [ ] Implement `GET /api/list-groups`: returns current user's groups ordered by `sortOrder`
- [ ] Implement `POST /api/list-groups`: creates group for current user
- [ ] Implement `PUT /api/list-groups/{gid}`: renames group; owner only
- [ ] Implement `DELETE /api/list-groups/{gid}`: deletes group; sets `groupId = null` on all lists in it; owner only
- [ ] Implement `PATCH /api/list-groups/{gid}/order`: updates `sortOrder` for the group
- [ ] Implement `PATCH /api/lists/{id}/group`: assigns list to a group or ungrouped (`groupId = null`); user must be a list member
- [ ] Implement `PATCH /api/lists/{id}/group-order`: updates `sortOrderInGroup`; user must be a list member
- [ ] Write integration tests for group CRUD and assign/reorder operations

---

## 5. Backend — Categories

- [ ] Create `Category` JPA entity (listId, name, color, sortOrder) and repository
- [ ] Implement `GET /api/lists/{id}/categories`: returns categories for the list
- [ ] Implement `POST /api/lists/{id}/categories`: creates category; EDITOR+
- [ ] Implement `PUT /api/lists/{id}/categories/{cid}`: updates name/color/sortOrder; EDITOR+
- [ ] Implement `DELETE /api/lists/{id}/categories/{cid}`: deletes category (items become uncategorised); EDITOR+
- [ ] Write integration tests for category CRUD and permission enforcement

---

## 6. Backend — Todo Items & Assignments

- [ ] Create `TodoItem` JPA entity (all fields per data model) and repository
- [ ] Create `ItemAssignment` JPA entity and repository
- [ ] Implement `GET /api/lists/{id}/items`: returns all items with cursor-based pagination (page size 50); VIEWER+
- [ ] Implement `POST /api/lists/{id}/items`: creates item; EDITOR+
- [ ] Implement `GET /api/lists/{id}/items/{iid}`: returns single item with assignments and attachments
- [ ] Implement `PUT /api/lists/{id}/items/{iid}`: full update; EDITOR+
- [ ] Implement `DELETE /api/lists/{id}/items/{iid}`: deletes item; EDITOR+
- [ ] Implement `PATCH /api/lists/{id}/items/{iid}/done`: toggles done; EDITOR+; triggers recurrence logic; fires SSE event
- [ ] Implement `PATCH /api/lists/{id}/items/{iid}/order`: updates `sortOrder`; EDITOR+; only honoured when list sort = MANUAL
- [ ] Write integration tests for item CRUD, pagination, and permission enforcement
- [ ] Write unit tests for assignment changes (add/remove assignees)

---

## 7. Backend — Recurrence

- [ ] Implement recurrence service: given a completed item with a recurrence rule, compute `nextDueDate`:
  - If item has `dueDate`: `nextDueDate = dueDate + interval`
  - If item has no `dueDate`: `nextDueDate = today + interval`
- [ ] On mark-done of a recurring item: create new `TodoItem` with `parentItemId` pointing to the just-completed item; inherit title, notes, category, priority, recurrence rule, and assignments
- [ ] Write unit tests for `nextDueDate` computation (every N days/weeks/months, with and without due date, late completion does not shift future dates)
- [ ] Write integration test: mark recurring item done → new item created with correct due date and `parentItemId`
- [ ] Write integration test: mark recurring item done (no due date) → new item due `today + interval`

---

## 8. Backend — Saved Items

- [ ] Create `SavedItem` JPA entity (listId, title, notes, categoryId, priority) and repository
- [ ] Implement `GET /api/lists/{id}/saved-items`: returns all saved items; supports `?q=` prefix search for autocomplete; VIEWER+
- [ ] Implement `POST /api/lists/{id}/saved-items`: creates saved item; EDITOR+
- [ ] Implement `PUT /api/lists/{id}/saved-items/{sid}`: updates saved item; EDITOR+
- [ ] Implement `DELETE /api/lists/{id}/saved-items/{sid}`: deletes saved item; EDITOR+
- [ ] Write integration tests for CRUD and prefix search (`?q=`)

---

## 9. Backend — Attachments

- [ ] Create `ItemAttachment` JPA entity (itemId, filename, mimeType, storagePath, uploadedAt) and repository
- [ ] Implement `StorageService` interface with two implementations: `LocalStorageService` and `S3StorageService`; selected via `STORAGE_BACKEND` env var
- [ ] Implement `POST /api/lists/{id}/items/{iid}/attachments`: accepts multipart upload; enforces max file size and MIME type allowlist; stores file; EDITOR+
- [ ] Implement `DELETE /api/lists/{id}/items/{iid}/attachments/{aid}`: deletes attachment from storage and DB; EDITOR+
- [ ] Write integration tests for upload (happy path, oversized file rejected, bad MIME type rejected) and delete

---

## 10. Backend — Audit Log

- [ ] Create `AuditLog` JPA entity and repository
- [ ] Implement `AuditService.record(listId, userId, itemId?, action, details)` method
- [ ] Wire `AuditService` into item create/update/done/undone endpoints and list member add/remove/change-role endpoints
- [ ] Implement `GET /api/lists/{id}/audit`: returns paginated audit log; EDITOR+ only
- [ ] Write integration tests: confirm audit entries are created for each audited action; confirm VIEWER receives 403

---

## 11. Backend — Real-time (SSE)

- [ ] Implement `SsePublisher` service: maintains per-list `SseEmitter` registries
- [ ] Implement `GET /api/lists/{listId}/events`: opens SSE stream for authenticated user who is a member; VIEWER+
- [ ] Wire `SsePublisher.publish(listId, event)` calls into: item CRUD, done toggle, assignment change, category CRUD, member changes
- [ ] Implement automatic client reconnect with `Last-Event-ID` support (re-sends missed events from in-memory buffer or DB)
- [ ] Write integration test: connect SSE, create an item, verify event is received on the stream

---

## 12. Backend — Push Notifications

- [ ] Create `PushSubscription` JPA entity and repository
- [ ] Implement `POST /api/push/subscribe`: stores Web Push subscription (endpoint, p256dh, auth); replaces existing for same user+endpoint
- [ ] Implement `DELETE /api/push/subscribe`: removes subscription by endpoint
- [ ] Configure `java-webpush` with VAPID keys from env vars (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`)
- [ ] Implement `PushDispatchService.send(userId, title, body)` that sends to all subscriptions for the user
- [ ] Implement `@Scheduled` daily job (configurable cron): sends push for items due today and overdue items
- [ ] Wire `PushDispatchService` to fire on item assignment change (notify newly assigned user)
- [ ] Write unit tests for `PushDispatchService` (mock the `java-webpush` client)

---

## 13. Frontend — Project Setup & Routing

- [ ] Configure `@sveltejs/adapter-node` in `svelte.config.js`
- [ ] Configure `@vite-pwa/sveltekit` in `vite.config.ts` (manifest, service worker strategy)
- [ ] Set up root layout (`+layout.svelte`): global styles, auth guard, top-level Svelte stores
- [ ] Create typed API client in `src/lib/api/` (one file per resource: `lists.ts`, `items.ts`, `auth.ts`, etc.) wrapping `fetch` with JWT header injection and token refresh
- [ ] Create Svelte stores: `currentUser`, `lists`, `currentListItems`, `connectionStatus`
- [ ] Set up route structure: `(app)/lists/`, `(app)/lists/[id]/`, `(app)/lists/[id]/grocery/`, `auth/login`
- [ ] Verify `bun run check` passes with no type errors on the skeleton

---

## 14. Frontend — Auth Pages

- [ ] Create `auth/login/+page.svelte`: email input field, "Continue with passkey" button, "Sign in with Google" button
- [ ] Implement passkey registration flow: call `register-options` → `navigator.credentials.create()` → `register` → store JWT → redirect
- [ ] Implement passkey login flow: call `login-options` → `navigator.credentials.get()` → `login` → store JWT → redirect
- [ ] Implement Google OAuth2 button: redirects to `/api/auth/oauth2/google`; handle callback page that stores JWT
- [ ] Implement token refresh: intercept 401 responses in API client, call `/api/auth/refresh`, retry original request
- [ ] Implement logout: call `POST /api/auth/logout`, clear tokens, redirect to login
- [ ] Write Vitest component tests for the login page (renders correctly, form validation)

---

## 15. Frontend — List Index

- [ ] Create `(app)/lists/+page.svelte`: fetches and displays all lists as cards with emoji + name
- [ ] Implement "Create list" modal/drawer: emoji picker, name field, submit calls `POST /api/lists`
- [ ] Implement "Edit list" action: pre-filled modal for name/emoji/description/sort settings
- [ ] Implement "Delete list" action: confirmation dialog; OWNER only
- [ ] Implement "Members" panel: shows member list, invite by email input, role change dropdown, remove button; OWNER only
- [ ] Render list index grouped into named collapsible sections; ungrouped lists shown at bottom in a distinct "Ungrouped" section
- [ ] "Create group" action: name input, calls `POST /api/list-groups`
- [ ] "Rename group" / "Delete group" actions (per group header menu)
- [ ] Drag-and-drop to reorder groups (calls `PATCH /api/list-groups/{gid}/order`)
- [ ] Drag-and-drop to move a list into/out of a group and reorder within group (calls `PATCH /api/lists/{id}/group` and `PATCH /api/lists/{id}/group-order`)
- [ ] Write Vitest component test: list index renders list of lists from mock data

---

## 16. Frontend — List Detail View

- [ ] Create `(app)/lists/[id]/+page.svelte`: loads items for the list, renders grouped by category
- [ ] Implement category group component (`CategoryGroup.svelte`): collapsible, shows category color and name, contains item cards
- [ ] Implement "no category" group rendered alongside named categories
- [ ] Implement client-side filtering controls: hide future items toggle, hide undated items toggle, starred-only toggle, filter by category dropdown, filter by assignee dropdown
- [ ] Implement client-side sorting: apply current list sort setting within each category group
- [ ] Connect SSE: subscribe on mount to `GET /api/lists/{id}/events`; patch local store on incoming events; auto-reconnect
- [ ] Write Vitest component test: items are grouped correctly by category from mock data

---

## 17. Frontend — Todo Item CRUD

- [ ] Implement `ItemCard.svelte`: shows title, due date, priority badge, starred icon, recurrence indicator, assignee avatars, attachment thumbnail count; tap opens detail drawer
- [ ] Implement item detail drawer/modal: all fields (title, notes, due date, priority, category, assigned users, recurrence, attachments); edit mode
- [ ] Implement "Create item" inline form or FAB: title input with saved-item autocomplete, optional fields
- [ ] Implement `PriorityBadge.svelte`: color-coded chip for URGENT / HIGH / NORMAL / LOW
- [ ] Implement done toggle: optimistic UI update, calls `PATCH /done`
- [ ] Implement starred toggle: optimistic UI update, calls `PUT` on item
- [ ] Implement delete item: confirmation prompt, calls `DELETE`
- [ ] Implement drag-and-drop reorder (only shown/active when list sort = MANUAL): calls `PATCH /order`
- [ ] Implement attachment upload: file input in item detail, calls `POST /attachments`, shows thumbnail gallery
- [ ] Implement attachment delete: calls `DELETE /attachments/{aid}`, removes from gallery
- [ ] Write Vitest component tests for `ItemCard` (renders all field combinations) and `PriorityBadge`

---

## 18. Frontend — Grocery Mode

- [ ] Create `(app)/lists/[id]/grocery/+page.svelte`: items grouped by category, collapsible sections
- [ ] Within each category group: unchecked items first, checked items (grayed out) at the bottom
- [ ] Style for one-handed mobile use: large tap targets (min 48 px), generous spacing
- [ ] Implement "Clear checked" button: bulk-marks done items for removal from view (or deletes them)
- [ ] Add navigation link from list detail to grocery mode

---

## 19. Frontend — Saved Items (Autocomplete)

- [ ] Create saved items management screen (accessible from list settings): list, create, edit, delete saved items
- [ ] Implement autocomplete in "Create item" title input: on each keystroke, call `GET /saved-items?q={prefix}`, show dropdown of matching titles
- [ ] On suggestion select: pre-fill notes, category, priority from the saved item; title input keeps the selected title
- [ ] Write Vitest component test: autocomplete shows suggestions and pre-fills fields on selection

---

## 20. Frontend — Push Notifications & Service Worker

- [ ] Implement `service-worker.ts`: handles `push` event, shows notification via `self.registration.showNotification`
- [ ] Implement `PushManager` helper in frontend: checks permission, subscribes via `PushManager.subscribe`, calls `POST /api/push/subscribe`
- [ ] Add push permission prompt in account settings (not on page load)
- [ ] Handle notification click: `notificationclick` event opens or focuses the relevant list/item URL

---

## 21. Frontend — PWA & Offline

- [ ] Configure PWA manifest: `name`, `short_name`, `icons` (192 + 512 px), `display: standalone`, `theme_color`, `background_color`
- [ ] Configure service worker caching: cache list data responses for offline reading
- [ ] Implement offline mutation queue: detect `navigator.onLine === false`, queue write operations, flush on reconnect
- [ ] Add "install app" prompt in the UI (deferred `beforeinstallprompt` event)
- [ ] Verify app is installable via Chrome DevTools "Application" → "Manifest" (no errors)
- [ ] Verify list data is readable while offline (kill dev server, check cached data loads)

---

## 22. E2E Tests

- [ ] Configure Playwright: `playwright.config.ts` pointing to `http://localhost:3000` (frontend); set up `docker compose` global setup
- [ ] E2E: user registration via passkey (using Playwright's WebAuthn virtual authenticator)
- [ ] E2E: create a list, verify it appears on the list index
- [ ] E2E: add items to a list, verify they appear in the list detail view
- [ ] E2E: toggle an item done, verify it updates and recurrence creates next instance
- [ ] E2E: check off grocery items in grocery mode, verify "clear checked" removes them
- [ ] E2E: invite a second user to a list, verify the list appears in their index
- [ ] E2E: account deletion confirmation — verify preview screen lists correct lists before confirming
- [ ] E2E: account deletion — confirm, verify user is logged out and their sole-owned list is gone

---

## 23. CI/CD

- [ ] Create `.github/workflows/ci.yml`: two parallel jobs — `backend` (Gradle build + test) and `frontend` (bun type-check + Vitest); triggers on push/PR to `main`
- [ ] Create `.github/workflows/e2e.yml`: single job — `docker compose up`, wait for health checks, run Playwright (Chromium); triggers on push to `main` only
- [ ] Create `.github/workflows/release.yml`: two parallel jobs — build and push `backend` and `frontend` Docker images to `ghcr.io`; triggers on push to `main` or `v*` tag
- [ ] Configure Docker image tagging in `release.yml`: `main` → `main` + `sha-<short>` tags; `v*` tag → semver tags + `sha-<short>`
- [ ] Add GitHub Actions cache (`type=gha`) for Docker layer caching in `release.yml`
- [ ] Create `.github/dependabot.yml`: weekly updates for `gradle` (`/backend`), `npm` (`/frontend`, `/e2e`), `docker` (`/backend`, `/frontend`), `github-actions` (`/`)
- [ ] Verify CI passes on a push to `main` (green checkmarks on all three workflows)
