## 1. DnD Option Tuning

- [x] 1.1 Add shared frontend `svelte-dnd-action` option helpers/constants for drag auto-scroll tuning and verify affected tests can assert the shared options are applied.
- [x] 1.2 Configure cursor-based detection for affected zones and verify unit/component tests assert `useCursorForDetection: true` is passed without enabling `centreDraggedOnCursor`.
- [x] 1.3 Investigate whether `delayTouchStart` is needed for drag handles on touch devices and verify the decision with either a focused test or a documented note in the implementation.

## 2. Drag Surface Integration

- [x] 2.1 Apply the shared tuned options to `/lists` list group wrapper dragging and verify a list-page component test sees the expected `dragHandleZone` options.
- [x] 2.2 Apply the shared tuned options to `ListGroupSection.svelte` list-card dragging and verify component tests confirm reorder persistence calls remain unchanged.
- [x] 2.3 Apply the shared tuned options to `CategoryGroup.svelte` item dragging and verify tests confirm existing move/reorder behavior still calls `moveItemsToCategoryOptimistic`.
- [x] 2.4 Apply the shared tuned options to `CategoryConfigDialog.svelte` category-row dragging and verify tests confirm the dialog zone keeps its existing type/items/drop styling while adding the tuned options.

## 3. Behavior and Validation

- [x] 3.1 Add tests confirming users without existing drag capability do not gain new drag zones or handles from the option tuning.
- [x] 3.2 Add or update browser-level coverage for dragging near the viewport bottom/top on a long list surface and verify the page scroll position changes while dragging with the tuned library options.
- [x] 3.3 Add or update browser-level coverage for category row dragging near the category dialog boundary and verify the dialog body scrolls instead of the background page.
- [x] 3.4 If tuned `svelte-dnd-action` behavior still fails the edge-scroll scenarios, document the failed condition in `design.md` and add follow-up tasks for an app-owned auto-scroll fallback before implementing custom scrolling.
- [x] 3.5 Run `cd frontend && bun run test -- --run` and verify all frontend unit/component tests pass.
- [x] 3.6 Run `cd frontend && bun run check` and verify Svelte/TypeScript validation passes.

## 4. App Shell Scroll Container

- [x] 4.1 Make the `(app)` shell height-bound with `<main>` as the primary vertical scroll container, preserving normal and admin route width classes; verify app layout tests assert the main pane has scroll ownership.
- [x] 4.2 Adjust `FixedActionFooter` and route bottom spacing so list overview and list detail content are not hidden while the footer behaves as stable app chrome; verify existing footer tests and page reserve tests are updated.
- [x] 4.3 Add a shared way for frontend helpers to locate the app content scroller and update existing document-scroll helpers such as list-group rename and item-form focus scrolling; verify focused unit/component tests cover scrolling the main pane.
- [x] 4.4 Verify `svelte-dnd-action` zones live inside the main scroll pane and keep the shared drag tuning; verify component tests still assert tuned options for list groups, list cards, items, and category rows.
- [x] 4.5 Update browser coverage so dragging near the bottom/top of the visible app content pane scrolls `<main>` while header and footer remain stable; verify the test checks the main pane's `scrollTop`, not `window.scrollY`.
- [x] 4.6 Keep dialog-contained auto-scroll isolated from the app content pane; verify category dialog drag scrolling changes the dialog body `scrollTop` without changing the main pane `scrollTop`.
- [x] 4.7 Run `cd frontend && bun run test -- --run` and verify all frontend unit/component tests pass.
- [x] 4.8 Run `cd frontend && bun run check` and verify Svelte/TypeScript validation passes.
- [x] 4.9 Run the focused Playwright drag auto-scroll spec against the reachable HTTPS target and verify main-pane and dialog-pane auto-scroll behavior.
