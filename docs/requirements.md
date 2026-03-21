# Todo App — Requirements & Architecture Document

---

## Context

A personal/household todo app that covers three use cases in one place:
1. **Grocery shopping** — items organized by category (e.g. which market to buy from), shared with household members, checked off in real time while shopping, with a dedicated in-store view
2. **Regular todos** — personal and shared task tracking with due dates, priorities, notes, and attachments
3. **Recurring household tasks** — chores and routines that repeat on a configurable schedule and auto-regenerate when completed

Accessible from any browser and installable as a PWA on iPhone. Must be performant with >100 lists and lists containing hundreds of items.

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Backend | Kotlin + Spring Boot | User's domain expertise; Kotlin preferred; Java 25 (LTS) |
| Frontend | SvelteKit + TailwindCSS | Lightweight, minimal boilerplate, first-class PWA; Tailwind for modern look |
| Frontend build | Vite | SvelteKit's default build tool; fast HMR in dev, Rollup-based production bundles |
| Database | PostgreSQL | Relational model fits lists/items/users/sharing well |
| Auth | Spring Security + JWT | Stateless, works for PWA + API |
| Passkey | WebAuthn via Spring Security 6.3+ | FIDO2 passkey — primary login method; no external server required, fully self-hosted |
| OAuth | Google OAuth2 | Sign in with Google via Spring Security OAuth2 client |
| Real-time | SSE (Server-Sent Events) | Simpler than WebSocket; Spring Boot native support |
| Push notifications | Web Push API | Standard browser/PWA push; works on iOS 16.4+ |
| File storage | Local filesystem or S3-compatible | Item photo attachments |
| Packaging | Docker images | Backend and frontend each built as Docker images for portability |
| Orchestration | Docker Compose | Single `docker-compose.yml` runs all services; deployable to any VPS or cloud platform |

---

## Data Model

### User
- `id`, `email` (unique, required), `displayName`, `createdAt`
- Email is the primary identifier — required for account creation, passkey login (to locate the user before issuing the WebAuthn challenge), and Google OAuth linking
- No password stored; authentication via passkey or Google OAuth only
- Linked to Google OAuth identity and/or WebAuthn credentials via separate tables

### List
- `id`, `name`, `emoji` (icon), `description`, `createdAt`
- No single owner — membership roles define access
- `defaultSortField` (ALPHA | DUE_DATE | STARRED | CREATED | MANUAL), `defaultSortDirection` (ASC | DESC)

### ListMembership
- `listId`, `userId`, `role` (OWNER | EDITOR | VIEWER)
- Multiple users can hold the OWNER role simultaneously
- Invite by email; any OWNER can manage members

### Category
- `id`, `listId`, `name`, `color` (hex), `sortOrder`
- Scoped per list; user-defined (e.g. "Rewe", "Aldi", "Household")

### TodoItem
- `id`, `listId`, `title`, `notes` (nullable), `done` (bool), `starred` (bool)
- `dueDate` (nullable date)
- `priority` (nullable enum: URGENT | HIGH | NORMAL | LOW)
- `categoryId` (nullable FK → Category)
- `sortOrder` (int — for manual ordering within category)
- `recurrenceRule` (nullable JSON):
  ```json
  { "intervalUnit": "DAYS"|"WEEKS"|"MONTHS", "intervalValue": 5 }
  ```
  Examples: every 1 day, every 5 days, every 1 week, every 2 weeks, every 1 month, every 3 months
- `parentItemId` (nullable FK → self — links recurring instances to their template)
- `createdAt`, `updatedAt`

### ItemAssignment
- `itemId`, `userId`
- Many-to-many: an item can be assigned to zero, one, or multiple users simultaneously

### SavedItem
- `id`, `listId`, `title`, `notes` (nullable), `categoryId` (nullable FK → Category)
- `priority` (nullable enum: URGENT | HIGH | NORMAL | LOW)
- `createdAt`, `updatedAt`
- A reusable item template scoped per list (e.g. "Milk", "Vacuum living room")
- Managed independently from active todo items; does not have done/starred/recurrence state

### ItemAttachment
- `id`, `itemId`, `filename`, `mimeType`, `storagePath`, `uploadedAt`

### AuditLog
- `id`, `listId`, `userId`, `itemId` (nullable), `action` (ITEM_CREATED | ITEM_UPDATED | ITEM_DONE | ITEM_UNDONE | MEMBER_ADDED | etc.), `details` (JSON diff), `occurredAt`

### PushSubscription
- `id`, `userId`, `endpoint`, `p256dh`, `auth`, `createdAt`

---

## Feature Specification

### Authentication
- **No passwords stored.** Users authenticate via passkey or Google only.
- **Passkey (WebAuthn/FIDO2)** — fully self-hosted, no external auth server needed. The browser and device handle the cryptography; your backend is the Relying Party. User enters email to identify the account, then authenticates with device biometrics/hardware key. Implemented via Spring Security 6.3 built-in WebAuthn support (Spring Boot 3.3+). Requires HTTPS in production; browsers make an exception for `localhost` so local development works without TLS. The Relying Party ID is configured via env var (`WEBAUTHN_RP_ID=localhost` in dev, `WEBAUTHN_RP_ID=todo.example.com` in prod).
- **Google OAuth2** — "Sign in with Google"; links to existing account by matching email
- Both methods can coexist on a single account
- Account creation: user provides email + display name, then registers a passkey or links Google; email is always required
- **Account deletion** — users can delete their own account from account settings:
  1. A summary screen is shown first listing: all lists that will be **deleted** by name (user is sole OWNER), all lists the user will be **removed from** by name, and all other personal data removed
  2. User must explicitly confirm before deletion proceeds
  3. On confirmation: user is logged out, then all data is deleted — list memberships, push subscriptions, OAuth/passkey credentials, and any lists where the user was the sole OWNER (lists with other OWNERs are kept, user is just removed)

### Lists
- Emoji icon picker on create/edit
- Create, rename, delete (OWNER only; multiple OWNERs allowed)
- Invite member by email → ListMembership (OWNER | EDITOR | VIEWER)
- VIEWER: read only; EDITOR: create/edit/complete items; OWNER: all EDITOR permissions + manage members + delete list
- **Default sort** configurable per list:
  - Alphabetically (A→Z / Z→A)
  - Due date (earliest first / latest first)
  - Starred (starred first)
  - Created date
  - Manual (drag-and-drop within category groups)
- Sort is applied **within each category group** (items with no category form their own group)

### Filtering (per list view)
- Due date is set (has a due date)
- Starred only
- By specific category
- Assigned to a specific user
- Filters are combinable; applied before sort

### Categories
- CRUD per list (EDITOR+)
- Color picker for visual grouping
- Category groups are the primary organizational unit in both list view and grocery mode

### Priority
- Fixed levels: **Urgent, High, Normal, Low** (not configurable per list)
- Items can have no priority set
- Priority visible as color badge on item cards

### Saved Items (Item Templates)
- Each list has its own library of saved items (reusable templates)
- Managed by EDITOR+ via a dedicated list settings screen
- Fields per saved item: title, notes, category, priority
- When creating a new todo item, the title input shows autocomplete suggestions from the list's saved items (prefix search)
- Selecting a suggestion pre-fills all matching fields (title, notes, category, priority) on the new item
- Saving a suggestion does not affect the saved item itself — the created item is independent

### Todo Items
- **Fields:** title, notes, due date, assigned users (0..many from list members), starred, category, priority, recurrence, photo attachments
- Create, edit, delete (EDITOR+)
- Toggle done/undone
- Mark done → triggers recurrence logic if applicable
- Inline drag-and-drop reorder (updates `sortOrder`; only active when sort = MANUAL)

### Recurrence
- Rule: `intervalValue` + `intervalUnit` (DAYS / WEEKS / MONTHS)
- Supported examples: every 1 day, every 5 days, every 1 week, every 2 weeks, every 1 month, every 3 months
- On mark-done: backend creates next instance with `dueDate = originalDueDate + interval`
  - The original due date is always used as the base — completing late does not shift future dates
  - If the item had no due date: `dueDate = today + interval`
- Completed instances kept in history, linked via `parentItemId`
- Recurrence indicator shown on item cards

### Grocery Mode
- Dedicated view accessible per list
- Items grouped by category, categories displayed as collapsible sections
- Within each category: unchecked items first, then checked (grayed out)
- Optimized for one-handed mobile use (large tap targets)
- "Clear checked" action to bulk-remove done items from view

### Attachments
- Upload photos to items (EDITOR+)
- Stored on server filesystem or S3-compatible storage (configurable via env var)
- Displayed as thumbnail gallery on item detail view
- Max file size and accepted MIME types enforced server-side

### Audit Log
- Every significant action is logged: item created/edited/completed/uncompleted, member added/removed, list renamed
- Viewable per list by OWNER and EDITOR
- Shows: who, what, when; diffs for edits

### Real-time Sync
- SSE endpoint: `GET /api/lists/{listId}/events`
- Events on: item CRUD, done toggle, assignment change, member changes, category changes
- SvelteKit subscribes on list open; reconnects automatically
- Debounced re-fetch on reconnect to avoid thundering herd

### Push Notifications
- Service worker registers Web Push subscription
- Triggers: item due today (morning batch), item overdue (daily), item assigned to you
- Spring `@Scheduled` daily job dispatches via `java-webpush`

### PWA
- SvelteKit `@sveltejs/adapter-node` + `@vite-pwa/sveltekit`
- Service worker caches list data for offline reading; mutations queued and synced on reconnect
- Installable on iPhone via Safari "Add to Home Screen" (requires HTTPS)
- Mobile-first responsive UI with TailwindCSS

### Performance
- PostgreSQL indexes on `(listId, done)`, `(listId, categoryId)`, `(listId, dueDate)`, `(userId)` on memberships, `(itemId)` on assignments
- Pagination for item lists (cursor-based, page size ~50)
- List index uses lightweight projections (no items loaded until list is opened)
- SSE connections are per-list (not global), limiting fan-out scope

---

## API Shape (REST)

```
POST   /api/auth/webauthn/register-options
POST   /api/auth/webauthn/register
POST   /api/auth/webauthn/login-options
POST   /api/auth/webauthn/login
GET    /api/auth/oauth2/google           ← OAuth2 redirect
GET    /api/auth/oauth2/callback
POST   /api/auth/refresh
POST   /api/auth/logout

GET    /api/users/me                     ← current user profile
PUT    /api/users/me                     ← update display name / email
GET    /api/users/me/deletion-preview    ← returns summary of what will be deleted (for confirmation screen)
DELETE /api/users/me                     ← delete own account after user confirms summary

GET    /api/lists                        ← paginated, lightweight projection
POST   /api/lists
GET    /api/lists/{id}
PUT    /api/lists/{id}
DELETE /api/lists/{id}
GET    /api/lists/{id}/events            ← SSE stream
GET    /api/lists/{id}/audit             ← audit log

GET    /api/lists/{id}/members
POST   /api/lists/{id}/members           ← invite by email
PUT    /api/lists/{id}/members/{uid}     ← change role
DELETE /api/lists/{id}/members/{uid}

GET    /api/lists/{id}/categories
POST   /api/lists/{id}/categories
PUT    /api/lists/{id}/categories/{cid}
DELETE /api/lists/{id}/categories/{cid}

GET    /api/lists/{id}/items             ← ?category=&assignee=&starred=&hasDueDate=&cursor=&limit=
POST   /api/lists/{id}/items
GET    /api/lists/{id}/items/{iid}
PUT    /api/lists/{id}/items/{iid}
DELETE /api/lists/{id}/items/{iid}
PATCH  /api/lists/{id}/items/{iid}/done
PATCH  /api/lists/{id}/items/{iid}/order ← manual reorder

POST   /api/lists/{id}/items/{iid}/attachments
DELETE /api/lists/{id}/items/{iid}/attachments/{aid}

GET    /api/lists/{id}/saved-items           ← ?q= for autocomplete prefix search
POST   /api/lists/{id}/saved-items
PUT    /api/lists/{id}/saved-items/{sid}
DELETE /api/lists/{id}/saved-items/{sid}

POST   /api/push/subscribe
DELETE /api/push/subscribe
```

---

## Project Structure

```
todo/
├── backend/                        # Kotlin Spring Boot
│   ├── build.gradle.kts
│   ├── src/main/kotlin/
│   │   ├── auth/                   # WebAuthn, OAuth2, JWT, Spring Security config
│   │   ├── lists/                  # List, Membership, Category domain
│   │   ├── items/                  # TodoItem, assignments, recurrence logic, attachments
│   │   ├── audit/                  # AuditLog recording + query
│   │   ├── push/                   # Web Push scheduling + dispatch
│   │   └── sse/                    # SSE publisher per list
│   └── src/test/kotlin/
├── frontend/                       # SvelteKit PWA
│   ├── src/
│   │   ├── routes/
│   │   │   ├── (app)/lists/        # List index, list detail, grocery mode
│   │   │   ├── (app)/lists/[id]/   # List view + item detail
│   │   │   └── auth/               # Login, passkey, OAuth callback
│   │   ├── lib/
│   │   │   ├── api/                # Typed API client
│   │   │   ├── stores/             # Svelte stores (lists, items, user)
│   │   │   └── components/         # ItemCard, CategoryGroup, PriorityBadge, …
│   │   └── service-worker.ts
│   ├── tailwind.config.ts
│   └── vite.config.ts
├── backend/Dockerfile              # Multi-stage: Gradle build → JRE 25 runtime image
├── frontend/Dockerfile             # Multi-stage: Node build → Node runtime image
├── e2e/                            # End-to-end test suite (Playwright)
└── docker-compose.yml              # Orchestrates: PostgreSQL + backend + frontend + (optional) MinIO
```

---

## Testing Strategy

### Backend (Kotlin/Spring Boot)
- **Unit tests** for all service-layer logic (JUnit 5 + MockK)
- **Database integration tests** use [Testcontainers](https://testcontainers.com/) to spin up a real PostgreSQL instance — no mocks for DB access
- **API/slice tests** for controllers using `@SpringBootTest` with Testcontainers for full-stack integration
- Test configuration via a shared `AbstractIntegrationTest` base class that starts the PostgreSQL container once per test suite (reuse mode)

### Frontend (SvelteKit)
- **Component unit tests** with Vitest + `@testing-library/svelte`
- **End-to-end tests** in a separate `e2e/` directory using [Playwright](https://playwright.dev/)
  - Tests run against the full stack (backend + frontend + PostgreSQL via Docker Compose)
  - Covers key user flows: login, create list, add items, check off grocery items, share list, account deletion confirmation
  - Can be run in headless mode in CI
