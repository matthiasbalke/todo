# Push Notifications

Web Push notifications using VAPID + a Spring `@Scheduled` daily job + a custom PWA service worker.

## How It Works

1. **VAPID key pair** is configured via `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` env vars (defaults ship for dev/test).
2. **Frontend** fetches the public key, subscribes via `PushManager.subscribe`, and POSTs the subscription (endpoint + p256dh + auth) to `POST /api/push/subscribe`.
3. **Backend** stores subscriptions in `push_subscriptions` (per user, unique on `user_id + endpoint`).
4. **PushDispatchService** serialises a JSON payload `{title, body, url}` and calls `PushService.send()` for every subscription a user has. On HTTP 410/404 it removes the stale row; other errors are logged and swallowed.
5. **PushScheduler** runs daily at 08:00 (configurable) and notifies assigned users of items due today and overdue items that are not done.
6. **ItemService** notifies on assignment: all assignees on `createItem`, newly-added assignees (delta) on `updateItem`.
7. **Service worker** (`src/service-worker.ts`) handles the `push` event (shows a notification) and `notificationclick` (opens/focuses the relevant list URL).

## Configuration

| Env var | Default | Notes |
|---|---|---|
| `VAPID_PUBLIC_KEY` | dev key | Base64url-encoded P-256 public key |
| `VAPID_PRIVATE_KEY` | dev key | Base64url-encoded P-256 private key |
| `VAPID_SUBJECT` | `mailto:admin@example.com` | Contact email or URL |
| `push.schedule.daily-cron` | `0 0 8 * * *` | Spring cron expression |

## Generating VAPID Keys

```bash
# Using the web-push CLI (Node.js)
npx web-push generate-vapid-keys
```

## Frontend UX

The Notifications section in **Account settings** shows:
- `unsupported` — browser does not support Push API
- `denied` — user blocked notifications; shows browser settings instruction
- `prompt` — ready to subscribe; "Enable notifications" button
- `subscribed` — active subscription; "Disable notifications for this device" link

## Files

| File | Purpose |
|---|---|
| `V7__create_push_subscriptions.sql` | DB schema |
| `push/PushSubscription.kt` | JPA entity |
| `push/PushSubscriptionRepository.kt` | Spring Data repo |
| `push/VapidConfig.kt` | `PushService` bean + `@EnableScheduling` |
| `push/PushController.kt` | REST endpoints |
| `push/PushDispatchService.kt` | Send logic |
| `push/PushScheduler.kt` | Daily cron |
| `frontend/src/service-worker.ts` | PWA service worker |
| `frontend/src/lib/api/push.ts` | API client |
| `frontend/src/lib/stores/push.svelte.ts` | Svelte 5 store |
