# Design

## Context

See `proposal.md` for motivation and `specs/agile-planning/spec.md` for behavior. The user confirmed personal selection and ordering. `TodayController`, `TodayRepository`, the Today store, and `/today` provide a precedent for authenticated cross-list aggregation with source capabilities and visibility refresh. `ItemService.reorderItems` changes shared item `sortOrder` and audit fields, so it cannot serve personal planning. `ItemCard` couples its drag handle to editable item behavior; viewers must not gain source-item mutation controls through this feature.

## Goals / Non-Goals

**Goals:** isolate personal planning from shared data; enforce membership on every query/write; persist cross-list order; reuse current UI and authentication patterns.

**Non-Goals:** sprints, estimates, automatic prioritization, shared backlog ordering, new assignment/date predicates, bulk selection, new-item composer integration, and cross-list SSE subscriptions.

## Decisions

### Store personal selection separately from items

Add `agile_item_selections(user_id, item_id, position)` with a composite primary key, cascading foreign keys to users and items, and an index on `(user_id, position, item_id)`. A row means selected; absence means unselected. Dense positions are application-managed and ties use item ID as a deterministic fallback. Avoid a global item Boolean, which conflicts with personal selection, and browser-only order, which cannot survive device changes.

Existing item DTOs and SSE payloads do not need planning fields. Recurrence creation must additionally copy personal selection rows transactionally; ordinary source updates and list duplication do not copy planning data. Item/list deletion relies on cascading item foreign keys. Membership loss leaves rows stored but every query joins current membership. No source-item event is published for personal operations.

### Use dedicated authenticated APIs

- `GET /api/agile`: selected accessible entries in saved order, including source-list name, role, category context, assigned-user display data, and existing item fields. Model the projection on Today without Today predicates or grouping metadata.
- `GET /api/agile/count`: unfinished accessible selection count.
- `PUT /api/agile/items/{itemId}` with `{ selected: boolean }`: idempotent selection set/unset after checking current membership; selecting an existing row does not move it. Return confirmed selection state and unfinished count.
- `PUT /api/agile/order` with `{ itemIds: [...] }`: complete accessible unfinished selection sequence. Require unique IDs exactly matching the current accessible selected unfinished set; completed and inaccessible entries retain their slots. Return confirmed entries or refetch them after success.

Resolve user ID only from the session. Missing/inaccessible item references return the same not-found response; duplicate IDs are bad requests; mismatched selection sets return conflict. Reuse existing API error handling. No request-supplied owner is accepted.

### Serialize per-user planning writes

Within a transaction, lock the authenticated user row before selection or reorder changes. This provides a lock even for an empty backlog. Append at maximum stored position plus one. With unfinished-first rendering, a newly flagged unfinished item appears after all existing unfinished items and above the checked section. Validate the whole reorder before changing rows. For completed or retained inaccessible selections, keep their existing slots and replace accessible unfinished slots in submitted order, then normalize the full stored sequence. Validate current completion states as part of the reorder set check. That retains inaccessible relative order and avoids returning their IDs.

Locking serializes changes without a new plan revision model. An outdated selection set produces conflict; concurrent reorders of an unchanged set use last successful write. Optimistic version conflict detection for same-set reorders is deferred. Verify access again during the transaction; all reads always enforce current membership.

### Build a flat Agile page with an independent planning wrapper

Add an Agile API/store and `/routes/(app)/agile` page. Render each entry with source-list context and an item detail link carrying `returnTo=/agile`. Reuse item actions and capability resolution, with an outer planning wrapper owning its drag handle. Keep `ItemCard` source-editable checks intact; do not enable its existing source reorder handle for viewers. Reuse `svelte-dnd-action`, existing drag auto-scroll options, and semantic Button/Icon controls. Ensure keyboard movement, accessible labels, announcements, focus restoration, and touch scrolling work.

Expose an immediate, labeled personal selection toggle on standard item cards and a separate personal planning section on the existing item-detail page outside the editable source form. No quick-add draft or general item update request should carry selection state. Load selection IDs once per list/page from the Agile store, rather than issuing one request per card. Include selection controls on reusable cards shown by Today where practical through the same shared integration.

The overview places Agile after Today and before user groups, outside drag zones. Show it only when the persisted `agileViewEnabled` preference is true. Follow the existing Today account-setting pattern (this checkout calls the view Today): add a user Boolean and database default of false, expose it in profile/preference DTOs, and add an account toggle with existing autosave/rollback behavior. Existing preference clients that omit the new field must preserve its stored value. Hide Agile selection controls and skip Agile fetches while disabled; direct `/agile` navigation redirects to `/lists`. Disabling preserves selection rows, sequence, and Hide checked preference; re-enabling restores the backlog. This is a presentation preference rather than an authorization boundary; existing authenticated membership checks still govern the APIs. Add `/agile` to any existing return-route allowlist after inspecting item-detail routing.

### Preserve one sequence through completion

Render unfinished entries first and a separate checked section below, preserving saved order within each section. Completion changes presentation without changing the stored planning slot. Reorder only unfinished entries by filling the slots currently occupied by accessible unfinished entries; completed and inaccessible slots remain fixed. Reopening restores the retained slot among the current unfinished entries. For example, A/B/C becomes C/B/A after checking B and reversing A/C, then reopening B. Hide checked is the only initial display filter, saved under a user-scoped local preference key, and does not disable unfinished-item reordering. Default view shows both sections. New recurring occurrences inherit selection rows only from their immediate parent at completion, never from earlier ancestors for all selecting users, including users with Agile disabled; append each new selection rather than replacing the completed parent's slot, placing the successor at the end of unfinished work above checked items. Explicit removal on the new occurrence stops inheritance for that user on its next completion. Duplicated items remain unselected.

Create the successor and inherited selections in the same transaction as completion. Acquire affected user locks in deterministic user-ID order before reading/copying selections, using the same locking protocol as personal writes; avoid locking the acting user ahead of this ordered set. This serializes concurrent selection removal and append operations and avoids partial inheritance. Keep visibility membership-filtered, including retained selections for members whose access was removed. Reconcile Agile entries/count after completion so the generated selected occurrence appears immediately.

### Refresh through existing cross-list patterns

Fetch on navigation and visibility regain, and reconcile after successful local selection, completion, reopen, deletion, or edit. Optimistic changes retain a confirmed snapshot for rollback; a conflict refreshes the sequence and asks the user to retry. Prevent overlapping reorder requests in one page. Clear store state on logout/account changes and ignore stale responses from the previous account. Reuse Today refresh conventions without subscribing to every source list's SSE stream.

## Risks / Trade-offs

- Flat ordering is an exception to ordinary category grouping → keep it confined to the personal Agile page; source lists retain normal grouping.
- Viewer planning could accidentally expose editing → keep planning controls independent of `canEditItems`; verify denied source mutation APIs and UI separately.
- Reusing Today projection code could introduce drift or excess queries → share small DTO/mapping helpers only where useful; batch assigned-user loading for the new query.
- Visible pages can lag external changes → reload on visibility and local operations; document that live synchronization is outside this issue.
- Per-user user-row locking serializes planning and briefly contends with account updates → keep transactions short and query membership/order with indexed columns.
- Reopening after other items move restores a slot rather than original neighbors → cover the A/B/C example in tests; reject stale reorder sets when completion changes concurrently.

## Migration Plan

1. Add an additive Flyway migration with an initially empty selection table and a non-null `agile_view_enabled` user column defaulting to false. Existing users and all account-creation paths start disabled. No item backfill is needed.
2. Deploy backend APIs before or together with the frontend; existing clients and source-item contracts remain compatible.
3. Validate on the Compose stack with fresh and existing accounts, mixed roles, and multiple lists.
4. Roll back application code while leaving the unused additive table intact to preserve plans. Do not drop planning data as part of routine rollback.
