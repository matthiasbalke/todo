## 1. Shared Summary UI

- [x] 1.1 Add a reusable list state summary component under `frontend/src/lib/components/` that renders an interactive sort control, optional visible item count, and wrapping resettable filter chips; verify it can render with no filter chips and with multiple chips without changing layout structure.
- [x] 1.2 Wire the summary sort control through an `onSortClick`-style callback and verify activating it opens or invokes sort selection with both sort criteria and ascending/descending controls.
- [x] 1.3 Add accessible reset controls for filter chips with labels like `Clear Starred only filter`; verify keyboard and role queries can activate each reset action in component or page tests.

## 2. Standard List Integration

- [x] 2.1 Build active filter descriptors in `frontend/src/routes/(app)/lists/[id]/+page.svelte` for starred-only, due-date mode, assignee mode, and hide checked; verify each descriptor resets only its own state.
- [x] 2.2 Move Hide checked into the standard list filter submenu and include it in the active filter count; verify the old separate Hide checked menu section is gone.
- [x] 2.3 Replace the existing standalone item count row with the shared summary component above category groups; verify the page still shows the filtered item count and an interactive sort field/direction control.
- [x] 2.4 Connect the standard list summary sort control to the existing sort selection flow; verify changing both sort criteria and ascending/descending order from that path updates item order and persisted preferences.
- [x] 2.5 Preserve existing preference persistence by updating the same `filters`, `sortField`, `sortDirection`, and `hideDone` state; verify resetting a chip updates the menu selected state and local preference behavior.

## 3. Grocery Mode Integration

- [x] 3.1 Build grocery-mode active filter descriptors for starred-only, due-date mode, and hide checked, excluding assignee chips unless grocery mode exposes assignee filtering; verify grocery filtering behavior is unchanged.
- [x] 3.2 Move Hide checked into the grocery mode filter submenu and include it in the active filter count; verify the old separate Hide checked menu section is gone.
- [x] 3.3 Render the shared summary component above grocery category sections; verify grocery mode shows an interactive active sort field/direction control outside the menu.
- [x] 3.4 Connect the grocery summary sort control to the existing sort selection flow; verify changing both sort criteria and ascending/descending order from that path updates item order and persisted preferences.
- [x] 3.5 Preserve existing grocery mode preference persistence by updating the same local state paths; verify resetting a chip updates the menu selected state and saved preferences.

## 4. Today Integration

- [x] 4.1 Build Today active filter descriptors in `frontend/src/routes/(app)/today/+page.svelte` for starred-only and hide checked; verify each descriptor resets only its own state.
- [x] 4.2 Move Hide checked into the Today filter submenu and include it in the active filter count; verify the old separate Hide checked menu section is gone.
- [x] 4.3 Ensure Today applies Today-specific sorting on initial render and after sort changes, independent of source-list item ordering; verify with test data where manual `sortOrder` conflicts with Today due-date or alphabetical sorting.
- [x] 4.4 Render the shared summary component above Today source-list sections; verify Today shows item count and an interactive active sort field/direction control outside the menu.
- [x] 4.5 Connect the Today summary sort control to the existing Today sort selection flow; verify changing both sort criteria and ascending/descending order from that path updates Today item order and persisted preferences.
- [x] 4.6 Preserve existing Today preference persistence by updating the same `starredOnly`, `hideDone`, `sortField`, and `sortDirection` state; verify resetting a chip updates the menu selected state and saved preferences.

## 5. Tests And Validation

- [x] 5.1 Extend standard list page tests to cover active filter chips, individual chip reset, Hide checked inside the filter submenu, sort criteria and direction changes from the summary control, and default no-filter-chip behavior; verify with `cd frontend && bun run test -- --run src/routes/(app)/lists/[id]/list-page.test.ts`.
- [x] 5.2 Extend grocery page tests to cover supported filter chips, individual chip reset, Hide checked inside the filter submenu, sort criteria and direction changes from the summary control, and absence of unsupported assignee chips; verify with `cd frontend && bun run test -- --run src/routes/(app)/lists/[id]/grocery/grocery-page.test.ts`.
- [x] 5.3 Extend Today page tests to cover supported filter chips, individual chip reset, Hide checked inside the filter submenu, Today-specific initial sorting, sort criteria and direction changes from the summary control, and absence of fixed-predicate filter chips; verify with `cd frontend && bun run test -- --run src/routes/(app)/today/today-page.test.ts`.
- [x] 5.4 Run frontend validation with `cd frontend && bun run check` and `cd frontend && bun run test -- --run`; verify both commands pass.
- [x] 5.5 Validate the OpenSpec change with `openspec validate sort-filter-ui --strict`; verify it passes before implementation is considered complete.
