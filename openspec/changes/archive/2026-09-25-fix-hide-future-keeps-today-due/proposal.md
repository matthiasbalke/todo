## Why

The Hide future filter currently hides items due today for some users, even though list filtering is defined to hide only items whose due date is after today. This exposed a broader inconsistency: date-only due dates are sometimes treated as JavaScript instants or server-local dates, which can shift behavior across timezones.

## What Changes

- Preserve due-today and overdue items when Hide future is enabled in standard and grocery list views.
- Compare, sort, format, and classify due dates using date-only semantics so `YYYY-MM-DD` values are not shifted by browser timezone.
- Use the relevant user's timezone when backend logic needs "today" for date-only due-date generation.
- Keep timestamp fields as instants and continue formatting them as timestamps.
- Add focused coverage for due-date boundary cases: undated, overdue, due today, future-dated, timezone-sensitive display/classification, and recurring no-due-date generation.
- Keep existing filter controls, active filter chips, persistence, sorting, and backend APIs unchanged.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `list-ui-capabilities`: Clarify and verify that list due-date filtering, sorting, display labels, and status indicators use date-only semantics.
- `today-view`: Clarify and verify that recurring replacement due dates generated from items without due dates use the acting user's current date.

## Impact

- Affected code is expected to include shared frontend date utilities, list filtering/sorting, due-date chip formatting/status, Today sorting, mock/demo due-date generation, backend recurrence date generation, and focused tests.
- No API, database, authentication, or dependency changes are expected.
- Standard, grocery, and Today list surfaces should share the same date-only comparison pattern where possible.
