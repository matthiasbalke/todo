# Real-time Sync (SSE)

## Overview

When multiple users (or browser tabs) have the same list open, changes made by one session are pushed to all other open sessions in real time via [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events). No page reload is required.

## Architecture

### Backend

**`sse/SsePublisher`** — Spring `@Service` that maintains:
- `ConcurrentHashMap<UUID, CopyOnWriteArrayList<SseEmitter>>` — per-list emitter registry
- `ConcurrentHashMap<UUID, ArrayDeque<BufferedEvent>>` — per-list in-memory ring buffer (last 100 events, globally sequenced via `AtomicLong`)

`publish(ListEvent)` sequences, buffers, and fans out the event to all registered emitters for the list. Stale emitters (closed/timed-out connections) are removed on error.

`subscribe(listId, lastEventId?)` creates an `SseEmitter(0L)` (no timeout), replays buffered events since `lastEventId`, registers cleanup callbacks, and returns the emitter.

**`sse/SseController`** — single endpoint:
```
GET /api/lists/{listId}/events   → text/event-stream
```
Requires VIEWER+ membership. Reads the optional `Last-Event-ID` header and delegates to `SsePublisher.subscribe()`.

**`sse/ListEvent`** — sealed class with subtypes:

| Subtype | SSE event name | Payload |
|---|---|---|
| `ItemCreated` | `item.created` | `ItemPayload` |
| `ItemUpdated` | `item.updated` | `ItemPayload` |
| `ItemDeleted` | `item.deleted` | `{"itemId": "..."}` |
| `CategoryCreated` | `category.created` | `CategoryPayload` |
| `CategoryUpdated` | `category.updated` | `CategoryPayload` |
| `CategoryDeleted` | `category.deleted` | `{"categoryId": "..."}` |
| `MemberAdded` | `member.added` | `MemberPayload` |
| `MemberUpdated` | `member.updated` | `MemberPayload` |
| `MemberRemoved` | `member.removed` | `{"userId": "..."}` |

**JWT filter** — extended to accept a `token` query parameter as a fallback when there is no `Authorization` header (required because `EventSource` cannot set custom headers). The header takes precedence.

**Service wiring** — `SsePublisher.publish()` is called after every mutation in:
- `ItemService` — createItem, updateItem, deleteItem, toggleDone (+ recurrence item), toggleStarred, updateOrder, reorderItems
- `CategoryService` — createCategory, updateCategory, deleteCategory
- `ListService` — addMember, changeMemberRole, removeMember

### Frontend

**`src/lib/api/sse.ts`** — thin wrapper around `EventSource`:
```typescript
openSseConnection(listId, token) → EventSource
```
The token is passed via query parameter (`?token=...`).

**`src/lib/stores/sse.svelte.ts`** — reactive store:
- `connectToList(listId)` — opens `EventSource`, registers event handlers
- `disconnectFromList()` — closes connection, cancels pending refetch timer

Event handlers patch existing stores:
- `item.created` / `item.updated` → `saveItem(dtoToItem(payload))`
- `item.deleted` → `removeItemFromStore(id)`
- `category.created` / `category.updated` → `upsertCategoryInStore(payload)`
- `category.deleted` → `removeCategoryFromStore(id)`
- `member.*` — no local patch; MembersDialog fetches on open

On `onerror`: `EventSource` reconnects automatically (browser sends `Last-Event-ID`). After reconnect a 500 ms debounced full item refetch covers any gaps.

**List detail page** (`+page.svelte`) — `$effect` that calls `connectToList(data.id)` on mount and `disconnectFromList()` on cleanup.

## Wire format

```
id: 42
event: item.created
data: {"id":"...","listId":"...","title":"Milk",...}

id: 43
event: category.updated
data: {"id":"...","name":"Produce","color":"#22c55e",...}
```

## Testing

- **Integration test** (`sse/SseIntegrationTest.kt`) — `@SpringBootTest(webEnvironment = RANDOM_PORT)`, real HTTP. Connects via `HttpURLConnection`, creates an item, asserts `item.created` event arrives within 1 s.
- **E2E test** (`e2e/tests/sse.spec.ts`) — two Playwright browser tabs on the same list; item added in tab 2 appears in tab 1 without reload.
