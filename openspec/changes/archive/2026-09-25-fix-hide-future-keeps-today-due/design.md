## Context

List filtering is performed client-side in the shared frontend utilities so lists still filter while offline. Due dates are stored and exchanged as date-only `YYYY-MM-DD` values, but several frontend paths parse them with JavaScript `Date`, which interprets those strings as UTC instants and can move the date relative to the user's local day.

The standard list view and grocery list view already call shared filtering and sorting utilities. Today view has a local due-date sorter, and due-date chips rely on shared formatting/status helpers. The backend uses `LocalDate` for stored due dates, but recurrence generation for items without due dates currently uses server-local `LocalDate.now()` instead of the acting user's timezone.

## Goals / Non-Goals

**Goals:**

- Make Hide future compare date-only values against the user's current local date.
- Make due-date sorting, formatting, and overdue/today classification use one date-only pattern.
- Keep timestamp formatting based on instants.
- Use the acting user's timezone when backend recurrence logic needs "today" for a due date.
- Add coverage around timezone-sensitive due-date filtering, display, sorting, and recurrence generation.

**Non-Goals:**

- Change the filter UI, saved preference shape, active filter summary, or user-facing sort options.
- Change backend item DTOs, database storage, or API response shapes.
- Rework timestamp display or audit metadata beyond keeping timestamp fields distinct from date-only fields.
- Add a date/time dependency for this cleanup.

## Decisions

### Treat date-only values as calendar values, never instants

Represent "today" as a local `YYYY-MM-DD` string or an existing `CalendarDate` value, and compare due-date strings lexicographically when only ordering or boundary checks are needed. ISO calendar dates in `YYYY-MM-DD` order sort chronologically, avoiding timezone conversion entirely.

Alternative considered: parse due dates as local `Date(year, monthIndex, day)` objects. That also works, but it is more code and still invites time arithmetic for a problem that only needs calendar-date ordering.

### Centralize frontend due-date helpers

Update or introduce shared helpers for:

- local current date as `YYYY-MM-DD`
- date-only comparison
- due-date formatting (`Today`, `Tomorrow`, `Yesterday`, otherwise localized calendar date)
- due-date status checks (`is today`, `is overdue`)

List filtering, list due-date sorting, Today due-date sorting, due-date chips, optimistic/mock date generation, and quick-add due-date chip display should use these helpers or the existing `CalendarDate` helpers from the DatePicker module.

Alternative considered: patch each individual call site. That would leave the codebase with multiple patterns and make this bug class easy to reintroduce.

### Keep timestamps as instants

Fields such as `createdAt`, `updatedAt`, account dates, recovery-link expiry, and audit metadata are timestamps. Continue parsing and formatting those with `Date`/`Intl` because timezone conversion is appropriate for instants.

Alternative considered: ban `new Date(...)` broadly. That would blur two different data types and make timestamp rendering awkward.

### Use user timezone for backend due-date "today"

When backend logic creates a date-only due date from "today", use the acting user's configured timezone. For the recurrence path, that means the base for a recurring item without a due date should be `LocalDate.now(ZoneId.of(actor.timeZone))`.

Alternative considered: continue using server-local `LocalDate.now()`. That is simpler but creates surprising results for users whose local date differs from the server's date.

### Test at boundaries and shared helpers

Add focused Vitest coverage to the shared frontend date/filter utilities. The tests should control the current date with fake timers and include due dates for yesterday, today, tomorrow, and null due date. Add backend integration coverage for recurring no-due-date completion under a user timezone that differs from the server boundary.

Alternative considered: only add page-level tests. Utility and backend service/integration tests give a smaller, deterministic signal for the timezone bug; page-level coverage can remain reserved for UI integration behavior.

## Risks / Trade-offs

- Current-date comparisons depend on the browser clock -> Use fake timers in unit tests so the boundary is deterministic.
- Existing helpers may duplicate DatePicker calendar logic -> Prefer reuse where imports remain reasonable, but avoid coupling UI-only component concerns into backend/API modules.
- Recurrence tests around timezone boundaries can be brittle -> Use an explicit user timezone and controlled clock or assertion pattern that proves the actor timezone is used.
- Lexicographic comparison assumes normalized `YYYY-MM-DD` due dates -> This matches the frontend API type and existing DTO contract.
