# Design

## Context

See proposal.md for motivation. ItemService.updateItem currently replaces title, notes, category, due date, starred, assignments, and order; only recurrence distinguishes omission. Looping over that endpoint risks partial success and overwriting unrelated edits. ItemRepository already supports list-scoped ID loading. SsePublisher publishes immediately, so transaction rollback alone cannot retract events. The standard list route derives filters, category groups, membership capabilities, and SSE-backed item state. ItemForm already composes the required specialized controls.

## Goals / Non-Goals

**Goals:** Explicit partial changes, one transaction per list, preservation of unrelated fields, and accessible selection with existing controls.

**Non-Goals:** Cross-list editing, batch deletion/completion/starring, recurrence-chain rewrites, offline batch replay, and selection in Today or grocery mode.

## Decisions

### Dedicated partial batch endpoint

Use `PATCH /api/lists/{id}/items/batch`, returning `ItemDto[]`. Request contains a client-generated UUID `batchId`, `itemIds` plus optional `dueDate`, `category`, `recurrence`, and `assignments` operations. Scalar operations are `{operation: "set", value: ...}` or `{operation: "clear"}`; omission means unchanged. Assignments are `{operation: "modify", addUserIds: [], removeUserIds: []}` or `{operation: "replace", userIds: [...]}` or `{operation: "clear"}`. Replace sets exactly the chosen nonempty member set; clear is the explicit empty-set action. Reject null operation objects, unsupported operations, missing set values, duplicate IDs, empty changes, and contradictory payloads with 400. Use existing authorization errors; missing or foreign-list targets return 404 without revealing another list's item. A valid operation that changes no values succeeds without rewriting audit fields or sending events.

Explicit operations avoid nullable DTO ambiguity and stale full-item snapshots. Sequential PUT requests were rejected because they cannot provide atomicity or preserve concurrent unrelated edits.

### Validate before mutation and publish after commit

Require EDITOR, load all targets scoped to the requested list, compare exact requested IDs, and validate category ownership, current-list member IDs, dates, and recurrence before writing. Reuse existing recurrence validation. Apply only requested columns and assignment deltas, deduplicating additions and tolerating already-absent removals. Preserve sortOrder and all occurrence links. Serialize concurrent batches with list-scoped item row locking in stable ID order; verify repository/query approach during implementation.

Build immutable response/event payloads after save/flush and schedule batch events with transaction synchronization after commit, without changing unrelated publication paths. An SSE failure after commit must not imply database rollback. Integration coverage must establish that flush failure/rollback sends no events. Broadly refactoring all existing SSE publication is unnecessary for this issue.

### Explicit list selection and a dedicated batch editor

Expose a Batch edit action gated by canEditItems. Keep selection state local to the list route, pass selection mode and callbacks through CategoryGroup to ItemCard, and use separate accessible selection controls. Suspend conflicting row mutations and drag behavior during selection. Derive eligible IDs from currently rendered rows after filters and expansion state; preserve explicit selections across visibility changes. Remove deleted IDs and clear selection on loss of edit capability, exit, or route changes. Show total selected and hidden counts. Select-visible adds rendered IDs to existing selection; it never clears previous selections.

Use a dedicated BatchEditItemsDialog rather than ItemForm, whose mandatory title and full-item submission are incompatible. Reuse CategorySelect, DatePicker, MultiSelect, RecurrenceEditor, buttons, and dialog/focus patterns. Scalar operation selectors initially show Leave unchanged; set reveals the value control. Assignment action choices are Leave unchanged, Add people, Remove people, Replace assignees, and Clear all. Add/remove/replace reveal a member picker. Replacement explains that existing assignees will be removed; other actions explain which assignees remain. Show selected count and a human-readable change summary before Apply. Use a scrollable mobile layout, keyboard labels, focus containment, Escape cancellation, and focus restoration. Inline category creation is outside this editor's initial scope.

### Server-confirmed item store updates

Add typed API/store functions; merge successful ItemDto results through dtoToItem/saveItem, retaining complete weekdays. SSE and HTTP responses use the same version-aware upsert path. Do not mutate optimistically or enqueue batch work in offlineQueue. Keep errors/draft in the dialog, and prune deleted selected IDs via live state. After an uncertain network outcome, query the batch status by its original ID; do not infer success from item values or refresh the page. Retry only with the original ID and payload. Existing grouping/filtering decides where changed items appear.

### Selected occurrences only

Every property change applies only to selected item IDs, including completed items. Editing a completed recurring occurrence never changes its existing successor or other occurrences. Editing the open occurrence affects successors generated on later completion through the existing recurrence rules.

### Durable batch identity and status

Persist a batch-operation record keyed by a client-generated UUID and bound to requesting user, list, and canonical request fingerprint. Add `GET /api/lists/{id}/items/batches/{batchId}` for the initiating user with current list authorization. Expose pending, succeeded, and failed states; succeeded includes the original versioned result. Unknown IDs return not found without implying failure or permitting a new-ID retry.

Reserve the ID durably before execution. Atomically commit item changes and successful outcome; record definitive execution failure separately after rollback. A uniqueness constraint and execution ownership prevent duplicate workers or requests from applying the same batch twice. Same ID and same request returns the existing state/result; a different payload or scope conflicts. A server crash must not leave a pending batch permanently stranded: recover persisted pending requests under exclusive ownership, reconciling transaction outcome before execution. Preserve outcomes for the supported retry lifetime; do not silently expire IDs into reusable IDs. Document the retention/recovery policy during implementation.

On lost response or configured request timeout, display Checking batch status, retain the original ID/draft, and query with bounded backoff. Offline status checks pause until connectivity returns. Pending remains pending; failed shows a definitive error; succeeded merges versioned results and exits selection. A not-found lookup permits resubmission of the exact request with the same ID, never assuming it failed. No page refresh is needed. This recovery is separate from offline queuing of new batch edits.

### Item versions across all item paths

Add a monotonically increasing per-item version, advanced atomically for every real change, including assignments, completion, starring, reordering, category cleanup, and ordinary/batch editing. Creation and duplicated/generated items receive their own initial versions. No-op batches do not increment versions. Carry versions in list/Today/detail reads, every write response, batch results, and SSE item payloads; retain them in all frontend item models and caches. Lists, categories, memberships, and batch status do not gain entity versions in this change.

Use a database-managed concurrency mechanism consistently across all mutation paths, not just batch writes. If optimistic locking is used, translate conflicts into actionable responses and construct immutable response/event payloads after flushing the new version. Verify actual bulk/native update paths as well as entity writes. A version number identifies committed state; it does not silently resolve conflicting writes.

Client ingestion rejects lower versions and accepts equal versions idempotently across HTTP, SSE, and full-list loads. Deletions carry a terminal item version; retain a tombstone so delayed responses cannot recreate the item. During authoritative reconciliation, retain enough request/event ordering information to avoid dropping newer items or resurrecting removed IDs. Test create/delete and load/SSE races as well as update races. Batch status results describe the original operation; merge them only if their item versions are still current.

## Risks / Trade-offs

- Large selections increase validation and per-item event work → use one scoped item load, bulk assignment loading where practical, and verify representative multi-item behavior without adding an arbitrary product limit.
- Concurrent changes to the same requested property → last committed write wins, consistent with ordinary edits; unrelated fields are never copied from the client.
- Membership/category changes during submission → server revalidates and returns an actionable error; authorization remains authoritative.
- SSE order versus HTTP responses → compare item versions on every ingestion path and retain deletion tombstones; test delayed responses.
- Hidden selection surprises → preserve intentional selections and show total/hidden counts before submission.

## Migration Plan

Deploy additive migrations for non-null item versions and batch-operation records, then backend APIs/events, then the frontend. Existing items start at an initial version. Rollback application behavior while retaining additive columns/tables and recorded outcomes; do not delete tracking records as part of rollback.
