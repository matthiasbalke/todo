## Why

Users need one place to review every task assigned to them that is due today or overdue, regardless of which accessible list contains it. A persisted user timezone and reusable timezone control are required so "today" has stable calendar semantics and can support future time-sensitive features such as notifications.

## What Changes

- Add an optional Today view that is enabled by default for new and existing users and can be disabled in account settings.
- Show Today first on the list overview, above all user-defined list groups, with a count of unfinished qualifying items.
- Include items from every list the current user can read when the item is assigned to that user and its due date is today or earlier in the user's configured timezone.
- Keep completed qualifying items in Today and present them below unfinished category sections so accidental completion can be reversed in place.
- Group Today items first by source list and then by source-list category, while supporting Today-specific sorting, filtering, collapse state, and hide-checked preferences.
- Permit item actions according to each source list's capabilities, but do not permit item creation or source-list/category management from Today.
- Refresh Today data and its overview count on load and when the app regains visibility; do not add cross-list live SSE updates.
- Persist an IANA timezone on each user account and use it for Today date calculations.
- Add a shared `TimezonePicker` component built on the existing shared `Select` and use it in the account profile.
- Initialize timezone from the browser on first authenticated use, with `UTC` as the persisted fallback.

## Capabilities

### New Capabilities

- `timezone-picker-component`: Reusable shared timezone selection based on the existing `Select`, using IANA timezone identifiers and user-friendly labels.
- `user-timezone-preference`: Persist and manage the user's timezone and Today-view enabled preference through account APIs and settings.
- `today-view`: Query, count, group, display, and interact with assigned due or overdue items across readable source lists.

### Modified Capabilities

None.

## Impact

- Requires the `viewer-read-only-list-ui` change to be implemented first so Today can safely render mixed source-list permissions.
- Adds user preference columns and a database migration.
- Extends account profile APIs, frontend account types, and account settings UI.
- Adds backend cross-list Today query/count behavior using assignments, memberships, due dates, completion state, and the user's timezone.
- Adds a Today route, list-overview entry, dedicated local preferences, source-list/category grouping, and visibility-based refresh.
- Reuses existing item mutation endpoints and capability-aware item presentation; no item creation, list management, category management, or cross-list SSE endpoint is added.
