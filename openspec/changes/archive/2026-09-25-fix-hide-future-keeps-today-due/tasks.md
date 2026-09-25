## 1. Frontend Date-Only Pattern

- [x] 1.1 Add or update shared frontend date-only helpers for local `YYYY-MM-DD` today, calendar comparison, due-date formatting, and due-date status checks, and verify helper behavior with deterministic Vitest coverage.
- [x] 1.2 Update `applyFilters` so Hide future compares due-date strings against the local date string, and verify it no longer constructs `Date` objects for date-only filter comparison.
- [x] 1.3 Update standard/grocery list due-date sorting and Today due-date sorting to use date-only comparison, and verify due-date sort tests or utility tests cover chronological ordering and undated placement.
- [x] 1.4 Update due-date chip formatting/status logic to use date-only helpers, and verify due-today and overdue labels/classes do not shift across timezone-sensitive dates.
- [x] 1.5 Update mock/demo and optimistic date-only generation to use local date-only helpers where those values represent due dates or date-only placeholders, and verify affected frontend tests still pass.

## 2. Backend User-Timezone Today

- [x] 2.1 Update recurring no-due-date completion so `today + interval` uses the acting user's configured timezone, and verify the generated replacement due date is based on the user's local date.
- [x] 2.2 Add backend integration coverage for recurring no-due-date completion near a timezone boundary, and verify the test fails under server-local `LocalDate.now()` behavior and passes with user-timezone behavior.

## 3. Coverage

- [x] 3.1 Add a Vitest case showing Hide future keeps undated, overdue, and due-today items while hiding tomorrow/future items, and verify it passes with `bun run test -- --run src/lib/utils.test.ts`.
- [x] 3.2 Add a timezone-sensitive Vitest case proving a date-only value equal to the user's local today remains visible and displays as Today, and verify it passes with `bun run test -- --run src/lib/utils.test.ts`.
- [x] 3.3 Add or update due-date sort/status tests for shared list utilities and Today sorting, and verify the relevant frontend tests pass.

## 4. Validation

- [x] 4.1 Run `bun run test -- --run src/lib/utils.test.ts` from `frontend/` and verify all utility tests pass.
- [x] 4.2 Run the targeted backend recurrence test from `backend/` with `./gradlew test --tests "<recurrence test class or method>"` and verify it passes.
- [x] 4.3 Run `bun run check` from `frontend/` and verify the Svelte/type-check suite passes.
