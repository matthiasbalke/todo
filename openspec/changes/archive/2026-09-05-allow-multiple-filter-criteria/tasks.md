## 1. Filter State And Preferences

- [x] 1.1 Replace the single `assigneeFilter` frontend filter value with multi-select assignment criteria and verify TypeScript callers compile with the new `Filters` shape.
- [x] 1.2 Update list preference loading to normalize legacy `assigneeFilter` values into the new criteria array and verify malformed or missing values restore to the inactive assignment filter.
- [x] 1.3 Update list preference saving/default detection to persist combined assignment criteria and verify default list preferences are still removed when every filter and sort value is inactive/default.

## 2. Filter Logic

- [x] 2.1 Update `applyFilters` so selected assignment criteria are ORed within the assignment filter group and verify `none + me` includes unassigned and current-user-assigned items while excluding items assigned only to others.
- [x] 2.2 Preserve existing single-criterion assignment semantics for `none`, `me`, and `others` and verify the existing assignee filter unit tests still pass with the new state shape.
- [x] 2.3 Verify assignment criteria still combine with starred, due-date, and hide-checked filters using AND semantics across filter groups.

## 3. Regular List UI

- [x] 3.1 Update the regular list filter menu so assignment options behave as independent selectable criteria and verify `All items` clears selected assignment criteria.
- [x] 3.2 Update active filter counting and filter chip labeling so combined assignment criteria count as one active filter category and verify the summary exposes one reset control for the assignment filter group.
- [x] 3.3 Verify clearing the assignment chip restores all-assignee matching while preserving other active filters, sort field, and sort direction.
- [x] 3.4 Confirm grocery mode and Today remain behaviorally unchanged and verify their focused component tests still pass.

## 4. Tests And Validation

- [x] 4.1 Add or update frontend utility tests for combined assignment criteria, legacy preference normalization, and cross-filter narrowing; verify with `cd frontend && bun run test -- --run src/lib/utils.test.ts`.
- [x] 4.2 Add or update regular list component tests for selecting `Assigned to me` plus `Not assigned`, active chip reset, and preference restoration; verify with the focused list page Vitest test.
- [x] 4.3 Run `cd frontend && bun run check` and the affected frontend Vitest tests to verify type safety and UI behavior.
- [x] 4.4 Run `openspec validate allow-multiple-filter-criteria --strict` and verify the OpenSpec change is valid.
