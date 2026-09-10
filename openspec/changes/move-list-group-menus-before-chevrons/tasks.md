## 1. Header Layout

- [x] 1.1 Update `ListGroupSection.svelte` so persisted list group headers render the group options menu to the left of the collapse/expand chevron, and verify manually that the title, menu, and chevron remain visible for a normal group.
- [x] 1.2 Preserve Ungrouped header alignment without rendering a group options menu for Ungrouped, and verify manually that Ungrouped still collapses and expands.

## 2. Tests

- [x] 2.1 Add or update `ListGroupSection` component tests to assert the group options button precedes the collapse/expand control and does not toggle collapse, then verify with the relevant frontend test command.
- [x] 2.2 Run the frontend validation covering the changed component, such as `cd frontend && bun run test -- --run ListGroupSection`, and verify all targeted tests pass.

## 3. New List Action Alignment

- [x] 3.1 Update the `/lists` compact fixed-footer actions so the `new list` button content is left-aligned while the group creation icon action remains beside it, and verify manually that both actions remain visible.
- [x] 3.2 Add or update `/lists` overview tests to assert the `new list` action is left-aligned and still opens the list creation form, then verify with the relevant frontend test command.
