# Plan: Push Notifications

## Context

Add Web Push notifications so users receive alerts when: (a) an item is assigned to them, (b) an item assigned to them is due today, (c) an item assigned to them is overdue. The feature uses the Web Push API (VAPID), a Spring `@Scheduled` daily job, and a custom PWA service worker.

No push notification code exists anywhere. SSE is fully implemented and is the best architectural pattern to follow. `@EnableScheduling` is already active in `TodoApplication.kt`.

---

## Key Decisions

1. **VAPID public key delivery**: `GET /api/push/vapid-public-key` (no auth required) — avoids baking a build-time env var into SvelteKit while keeping key rotation decoupled from deploys.
2. **Service worker strategy**: Switch `vite.config.ts` from `generateSW` to `injectManifest`, create `frontend/src/service-worker.ts` as the custom entry point. This is the only way to add custom `push` and `notificationclick` event handlers while keeping Workbox precaching/runtime caching.
3. **Push payload**: `{ "title": "…", "body": "…", "url": "/lists/<listId>" }` — title shown in notification, body is the context line ("Due today", "Overdue", "Assigned to you"), url opened on click.
4. **Expired subscriptions**: Detect HTTP 410/404 from the push gateway in `PushDispatchService`, delete the row immediately. Other failures are logged but not removed.
5. **Migration number**: V6 (V5 is taken by `V5__add_passkey_label.sql`).
6. **Assignment wiring**: Notify on both `createItem` and `updateItem` when assignees are added.

---

## Implementation Plan

### 1. Feature branch
```bash
git checkout -b feat/push-notifications
```

### 2. Backend — Dependency (`build.gradle.kts`)
Add to `dependencies`:
```kotlin
implementation("nl.martijndwars:web-push:5.1.1")
```
Bouncy Castle is pulled in transitively. Verify `./gradlew dependencies` shows it.

### 3. Backend — Migration
**File:** `backend/src/main/resources/db/migration/V6__create_push_subscriptions.sql`
```sql
CREATE TABLE push_subscriptions (
    id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint   TEXT        NOT NULL,
    p256dh     TEXT        NOT NULL,
    auth       TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_push_subscriptions_user_endpoint ON push_subscriptions(user_id, endpoint);
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
```
(Unique per user+endpoint, not globally unique — different users may technically share an endpoint in edge cases.)

### 4. Backend — `push/` package

**Files to create** (package `com.github.matthiasbalke.todo.push`):

- **`PushSubscription.kt`** — JPA entity: `id: UUID`, `userId: UUID`, `endpoint: String`, `p256dh: String`, `auth: String`, `createdAt: Instant`. Follow `TodoItem.kt` convention.
- **`PushSubscriptionRepository.kt`** — Spring Data JPA: `findAllByUserId(userId: UUID)`, `deleteByUserIdAndEndpoint(userId: UUID, endpoint: String)`, `existsByUserIdAndEndpoint(userId: UUID, endpoint: String): Boolean`.
- **`VapidConfig.kt`** — `@Configuration` bean factory for `PushService(publicKey, privateKey, subject)`. Read `${vapid.public-key}`, `${vapid.private-key}`, `${vapid.subject}` via `@Value`.
- **`PushController.kt`** — REST layer:
    - `GET /api/push/vapid-public-key` (no auth) → `{ publicKey: String }`
    - `POST /api/push/subscribe` → upsert subscription (idempotent); 201
    - `DELETE /api/push/subscribe` → remove own subscription by endpoint; 204
    - Access control: `DELETE` only removes rows where `userId` matches authenticated user (no IDOR).
- **`PushDispatchService.kt`** — `send(userId: UUID, title: String, body: String, url: String)`: fetch all subscriptions for user, call `pushService.send(Notification(...))`, catch `WebPushException` with status 410/404 → delete subscription, log other failures as WARN/ERROR.
- **`PushScheduler.kt`** — `@Scheduled(cron = "${push.schedule.daily-cron:0 0 8 * * *}")`: query items due today (not done) + overdue items (not done), notify assigned users (fall back to all list members if no assignments).

### 5. Backend — Configuration (`application.yml`)
```yaml
vapid:
  public-key: ${VAPID_PUBLIC_KEY}
  private-key: ${VAPID_PRIVATE_KEY}
  subject: ${VAPID_SUBJECT:mailto:admin@example.com}
push:
  schedule:
    daily-cron: "0 0 8 * * *"
```

### 6. Backend — SecurityConfig
Add `permitAll` for the VAPID key endpoint:
```kotlin
.requestMatchers(HttpMethod.GET, "/api/push/vapid-public-key").permitAll()
```

### 7. Backend — `ItemRepository.kt`
Add derived queries:
```kotlin
fun findByDueDateAndDoneFalse(dueDate: LocalDate): List<TodoItem>
fun findByDueDateBeforeAndDoneFalse(dueDate: LocalDate): List<TodoItem>
```

### 8. Backend — `ItemService.kt`
Inject `PushDispatchService`. In `createItem()` and `updateItem()`:
- On create: notify all assigned users (`assignedUserIds`) — title = item title, body = "You've been assigned to \"${item.title}\""
- On update: compute `newAssignees - previousAssignees`; notify only the delta (avoid re-notifying already-assigned users)
- URL = `/lists/${item.listId}`

### 9. Frontend — `vite.config.ts`
Change `SvelteKitPWA` config:
```ts
SvelteKitPWA({
  strategies: 'injectManifest',
  srcDir: 'src',
  filename: 'service-worker.ts',
  registerType: 'autoUpdate',
  manifest: { /* unchanged */ },
  devOptions: { enabled: true, type: 'module' },
})
```
Remove `workbox:` key — runtime caching rules move into `service-worker.ts`.

### 10. Frontend — `src/service-worker.ts`
Custom service worker entry:
- `precacheAndRoute(self.__WB_MANIFEST)` + `cleanupOutdatedCaches()` (replaces removed Workbox block)
- Migrate existing `NetworkFirst` rules for `/api/lists` and `/api/users/me` using `registerRoute`
- `push` event: parse `event.data.json()`, call `self.registration.showNotification(title, { body, icon, data: { url } })`
- `notificationclick` event: close notification, `clients.matchAll` → focus existing window or `clients.openWindow(url)`

### 11. Frontend — `src/lib/api/push.ts`
API client following `users.ts` pattern:
- `getVapidPublicKey()` — plain `fetch` (public endpoint)
- `subscribePush({ endpoint, p256dh, auth })` — `authedFetch POST`
- `unsubscribePush({ endpoint, p256dh, auth })` — `authedFetch DELETE`

### 12. Frontend — `src/lib/stores/push.svelte.ts`
Svelte 5 `$state` store:
- `PushState = 'unsupported' | 'prompt' | 'denied' | 'subscribed'`
- `initPushState()`: check `'PushManager' in window`, `Notification.permission`, existing subscription
- `requestPushSubscription()`: fetch VAPID key → `pushManager.subscribe` → call API → set state `'subscribed'`
- `revokePushSubscription()`: call API → `sub.unsubscribe()` → set state `'prompt'`
- `urlBase64ToUint8Array()` helper for converting VAPID public key

### 13. Frontend — Account settings page
Add "Notifications" `<section>` between Security and Danger Zone in `routes/(app)/account/+page.svelte`:
- On mount (`$effect`): call `initPushState()`
- Render per state: unsupported → info text; denied → browser-settings guidance; prompt → "Enable notifications" button; subscribed → status + "Disable" button
- Error variable for subscribe/revoke failures

---

## Tests

### Backend
- **`PushControllerTest.kt`** (integration, extends `AbstractIntegrationTest`):
    - POST subscribe → 201, row in DB
    - POST subscribe twice (same endpoint) → idempotent, one row
    - DELETE subscribe → 204, row gone
    - DELETE another user's subscription → no-op (204, row still exists)
    - GET vapid-public-key → 200 without auth
    - POST subscribe without auth → 401
- **`PushDispatchServiceTest.kt`** (unit, MockK):
    - `send()` with subscriptions calls `pushService.send()` for each
    - HTTP 410 → `deleteById` called
    - HTTP 404 → `deleteById` called
    - Other exception → `deleteById` NOT called
- **`PushSchedulerTest.kt`** (integration with mocked `PushDispatchService`):
    - Items due today → `send()` called for assigned users
    - Overdue items → `send()` called
    - Done items → NOT notified

### Frontend
- **`push.svelte.test.ts`** (Vitest, mock `navigator.serviceWorker`, `window.PushManager`, `Notification`):
    - `initPushState()` for each state variant
    - `requestPushSubscription()` happy path: fetch key → subscribe → API call
    - `revokePushSubscription()` happy path: API call → unsubscribe
- **`account-page.test.ts`** (add test): renders "Notifications" section

### E2E
- Account page shows notifications section
- "Enable notifications" button click → mock permission grant + mock `pushManager.subscribe` → verify `POST /api/push/subscribe` called (via `page.route` intercept)

---

## Verification

1. `cd backend && ./gradlew test` — all push tests pass
2. `cd frontend && bun run check` — no type errors
3. `cd frontend && bun run test --run` — push store tests pass
4. `docker compose up --build -d` → subscribe from browser dev tools → check `push_subscriptions` table row exists
5. Manually trigger scheduler: `POST /actuator/scheduledtasks` or temporarily change cron to near-now

---

## Critical Files

| File | Role |
|---|---|
| `backend/build.gradle.kts` | Add `nl.martijndwars:web-push` |
| `backend/.../auth/SecurityConfig.kt` | Permit `GET /api/push/vapid-public-key` |
| `backend/.../items/ItemService.kt` | Wire assignment push notifications |
| `backend/.../items/ItemRepository.kt` | Add dueDate query methods |
| `frontend/vite.config.ts` | Switch to `injectManifest` strategy |
| `frontend/src/routes/(app)/account/+page.svelte` | Add Notifications section |
| `frontend/src/service-worker.ts` | New — push + notificationclick handlers |
