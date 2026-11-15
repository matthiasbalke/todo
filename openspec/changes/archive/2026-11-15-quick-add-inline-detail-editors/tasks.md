# Tasks

## 1. Inline footer navigation

- [x] 1.1 Replace the quick-add Dialog wrapper with mutually exclusive compact and named detail footer views, including Back and viewport-bounded scrolling; update QuickAddItemForm component tests to verify replacement in the footer, absence of a detail modal, and retained title/chips after returning.
- [x] 1.2 Implement editor entry focus, selection return to title, title-input focus restoration on Back/Escape, nested popup Escape handling, and internal popup focus detection; verify keyboard and pointer component tests do not minimize the draft or accidentally submit an item. Remove unused modal imports and state.

## 2. Category, assignees, and due date

- [x] 2.1 Reuse category and assignee selectors with their inputs focused on entry, adding opt-in focus hooks only if necessary; verify category selection returns to the composer while multiple assignee changes remain editable, and retain category colors, Uncategorized, and user avatars in component tests.
- [x] 2.2 Add Today, Tomorrow, Next week, and Custom date choices using existing date-only/timezone conventions, with Custom closing the bottom editor and directly opening DatePicker in a screen-centered dialog; verify fixed-clock tests cover configured timezone, next Monday including when today is Monday, and calendar-day offsets across month/year and daylight-saving boundaries, custom selection, clear, dismissal without changes, and return to the composer.

## 3. Recurrence, notes, and draft lifecycle

- [x] 3.1 Embed RecurrenceEditor in the footer with all existing modes and one close/commit path for Back, Escape, and outside minimization; update CustomRecurrence tests to verify presets return, custom controls remain open, weekday changes apply once, and invalid input is retained and blocks creation.
- [x] 3.2 Embed the existing notes textarea with a local edit buffer and the item-details Cancel/back, centered Notes title, and Save header; verify tests cover initial focus, multiline Enter, save without item creation, discard on Cancel/back or Escape, focus restoration, and outside interaction keeping the editor open with unsaved text intact.
- [x] 3.3 Verify and adjust draft emission and creation across view transitions; component tests must cover all-field submission, chip clearing, active-draft visibility on outside interaction, empty-draft minimization, preservation of incomplete recurrence, failed creation preservation, successful reset, and unchanged default-category behavior.

## 4. Integration validation

- [x] 4.1 Update list-page Playwright quick-add coverage for inline editing and draft restoration; source scripts/load-local-domain.sh and check the shared HTTPS health endpoint with the repository CA before running affected specs with BASE_URL. Verify desktop and narrow viewport keyboard/touch flows, including scroll reachability; if the deployment is unavailable, report the environment blocker without starting a stack.
- [x] 4.2 Run frontend `bun run check`, `bun run test -- --run`, and `bun run build`; resolve failures and verify existing-item editing and shared selectors retain their prior behavior.

## Workflow follow-up

- After implementation and user review, sync the delta spec and archive the change as required by the repository workflow.
