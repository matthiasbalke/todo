## Context

Items currently load through one list-scoped endpoint and real-time updates use one SSE connection for the active list. Today must aggregate assigned due and overdue items across every readable list, preserve completed items, respect different source-list permissions, and calculate the date boundary in the user's timezone.

This change depends on `viewer-read-only-list-ui`, which adds current-user roles to list responses and makes item components capability-aware. The Today implementation must not begin until that prerequisite is implemented so a cross-list page cannot expose write controls for viewer-only items.

The account currently stores no timezone or feature preferences. Due dates are date-only values, so the relevant comparison is `dueDate <= LocalDate.now(userZone)`, not timestamp conversion.

## Goals / Non-Goals

**Goals:**

- Persist a reusable user timezone and Today-enabled setting.
- Add a reusable timezone picker composed from shared `Select`.
- Query all qualifying items without loading every accessible list on the client.
- Reuse capability-aware item interactions for mixed source-list roles.
- Match regular-list completion, sorting, filtering, and collapse behavior where applicable.
- Keep overview count and local Today actions responsive without adding global real-time infrastructure.

**Non-Goals:**

- Creating items from Today.
- Editing source lists or categories from Today.
- Manual cross-list item ordering.
- Live cross-list SSE updates or push notifications.
- Changing due dates from date-only values to timestamps.
- Defining notification schedules beyond making timezone data reusable.

## Decisions

### Implement capabilities in dependency order

Implementation order is:

```text
viewer-read-only-list-ui
          |
          v
timezone-picker-component
          |
          v
user-timezone-preference
          |
          v
today-view
```

The capability specs remain in one Today change because OpenSpec does not enforce dependencies between spec files. The task order and integration tests enforce the relationship.

### Persist explicit initialization state

The users table will gain:

- `time_zone`, non-null, default `UTC`
- `time_zone_initialized`, non-null, default `false`
- `today_view_enabled`, non-null, default `true`

The initialization flag distinguishes an existing or new account that still needs browser detection from a user who intentionally selected `UTC`. On first authenticated app load, the frontend reads profile preferences, detects `Intl.DateTimeFormat().resolvedOptions().timeZone`, and persists a valid value or `UTC`. Later loads never overwrite an initialized value.

Alternative considered: nullable timezone. This represents initialization but complicates every server-side consumer and does not provide a persisted fallback.

### Validate timezone identifiers on the backend

Preference updates validate identifiers with Java `ZoneId`. Invalid values return a client error and leave preferences unchanged. Today obtains the user's date with `LocalDate.now(ZoneId.of(user.timeZone))`.

Fixed offsets were rejected because they do not track daylight-saving transitions.

### Compose TimezonePicker from Select

`TimezonePicker` supplies string timezone options and friendly labels to shared `Select`. It uses `Intl.supportedValuesOf('timeZone')` when available, always adds `UTC`, and retains the current or browser-detected value. Friendly labels are derived from region identifiers while the selected value remains the exact IANA identifier.

If comprehensive enumeration is unavailable, the component falls back to `UTC`, the current value, and the detected browser value. No timezone-list dependency is added.

### Use a focused preference endpoint

`GET /api/users/me` will include the three preference fields. A focused authenticated preferences update endpoint will accept timezone and Today-enabled changes without requiring the caller to resubmit display name and email.

The app layout will load preferences after session restoration so it can initialize timezone and decide whether Today is enabled. The account page consumes the same preference state.

Alternative considered: extend the existing profile update request. A focused endpoint avoids unrelated profile fields becoming required for feature preference changes.

### Query Today on the server

A user-scoped Today service will query assignments joined to items and list memberships:

```text
assignment.user_id = current user
membership.user_id = current user
membership.list_id = item.list_id
item.due_date <= current date in persisted user timezone
```

Completion is not part of the predicate. An index beginning with `item_assignments.user_id` will support the user-scoped lookup.

The Today item response will be flat but enriched with source-list metadata, source-category metadata, assigned-user display data, and source-list role. This avoids one request per list for categories or members while letting the frontend group and reuse item components.

The overview uses a focused unfinished-count query rather than downloading all Today items. Both queries share the same qualification predicate to prevent drift.

### Group and order on the frontend

The frontend groups enriched entries by source list and source category. Source lists follow the user's list-group order, then list order within the group, with ungrouped lists last. Categories follow source category order. The selected sort applies only within each category.

Completed items remain in their category and use the regular checked subsection after incomplete items. Hide checked affects presentation only.

Manual sorting is unavailable because one Today page spans independently ordered source lists. Assignment and due-date filters that restate the fixed Today predicate are also unavailable. Applicable controls such as Starred only and non-manual sort fields reuse regular-list semantics.

### Store Today preferences separately

Today UI state uses a dedicated local-storage key scoped by user ID. It stores sort field, sort direction, applicable filters, Hide checked, and source-list/category collapse state. It does not reuse a real list ID or modify source-list preferences.

### Refresh on lifecycle events, reconcile local actions

The list overview fetches unfinished count on load and visibility regain. The Today route fetches its enriched items on load and visibility regain. No cross-list SSE connections are opened.

Completion, reopening, starring, and deletion reuse source-list mutation endpoints. Existing optimistic behavior updates the visible item; Today derives unfinished and checked counts from current state and reloads the affected result as needed for recurring replacements. Failed mutations restore prior state.

Recurring replacements are included only when they independently satisfy the predicate.

### Treat Today as a fixed virtual entry

When enabled, Today renders above all list groups and is not draggable. Disabling it removes the entry. Direct access to `/today` while disabled redirects to `/lists`.

Today has no add-item footer and no source-list or category management actions. Source-list labels link to regular list pages.

## Risks / Trade-offs

- [Timezone enumeration differs between browsers] -> Persist standard IANA identifiers, validate on the backend, and provide a minimal fallback option set.
- [Browser initialization adds an account request during app startup] -> Reuse the loaded preference state across layout and account UI; initialization runs only once per account.
- [Count and item queries drift] -> Implement one repository predicate or shared service criteria and test count/result consistency.
- [Enriched Today responses duplicate source metadata] -> Accept small duplication for a simple flat API and no per-list follow-up requests; optimize only if measured response sizes require it.
- [External changes are temporarily stale] -> Refresh on page load and visibility regain as explicitly accepted; local actions remain immediate.
- [Role or membership changes race with local actions] -> Backend authorization remains authoritative and the next fetch removes inaccessible items.
- [Timezone changes alter Today membership immediately] -> Refresh Today items and count after a successful timezone update.
- [Large timezone option lists are cumbersome in Select] -> Retain scrolling and keyboard navigation from shared Select; searchable selection can be a later shared-component enhancement.

## Migration Plan

1. Complete and archive `viewer-read-only-list-ui`.
2. Add user preference columns with defaults that enable Today and safely fall back to UTC.
3. Deploy profile preference APIs and frontend initialization.
4. Add and adopt `TimezonePicker` on the account page.
5. Add Today query/count APIs and supporting indexes.
6. Add Today store, route, overview entry, preferences, and lifecycle refresh.
7. Verify role-aware interactions, timezone boundaries, recurrence, count reconciliation, and disabled behavior.

Rollback removes the Today UI and endpoints first. Preference columns can remain harmlessly or be removed in a later migration; the application must not roll back frontend/API fields independently while clients still depend on them.

## Open Questions

None.
