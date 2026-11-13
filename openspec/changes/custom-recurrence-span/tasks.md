# Tasks

## 1. Rule contract and persistence

- [ ] 1.1 Extend RecurrenceRule and create/update DTO conversion with optional weekday names and canonical ordering; verify PostgreSQL JSONB integration tests round-trip both legacy interval-only JSON and new weekday rules.
- [ ] 1.2 Validate positive integer amounts, recognized units/days, nonempty unique weekday arrays, and weekly-only constraints; add create/update API integration cases proving HTTP 400, unchanged data, and no item events for invalid input, including fractional JSON amounts.
- [ ] 1.3 Extend ItemController, TodayRepository projections, TodayService reconstruction, TodayController, and SSE payload mappings; verify response/event assertions preserve complete weekday rules and title-only updates retain them.
- [ ] 1.4 Verify list duplication retains custom intervals and weekday rules with a PostgreSQL integration regression; update docs/requirements.md with the extended contract and validation rules.

## 2. Recurrence calculation

- [ ] 2.1 Extract the interval/weekday calendar calculator and integrate it into toggleDone; add date-table tests covering same-week selection, N-week rollover, one selected day, Sunday/Monday and year boundaries, and a due day outside the selection.
- [ ] 2.2 Preserve interval-only month-end/leap-day handling, original-due-date scheduling, and timezone-aware undated fallback; add regression cases for late completion and undated rules, and document active-week examples in docs/requirements.md.
- [ ] 2.3 Handle date overflow atomically with HTTP 400; verify integration assertions cover rollback of completion, no successor, and no emitted item events.
- [ ] 2.4 Verify completion creates a correctly linked incomplete successor with the full rule and existing copied details/assignees; add an integration case covering both stored data and item-created SSE payload.

## 3. Shared frontend model and editor

- [ ] 3.1 Extend frontend API and mock-data recurrence types and replace preset-only conversions with shared rule/editor-state helpers; verify unit cases initialize every supported rule faithfully, including old two-week/three-month rules and legacy preset drafts.
- [ ] 3.2 Implement the shared recurrence editor with the seven simplified options, raw custom amount, unit selection, accessible weekday controls, and inline validation; verify component tests exercise pointer/keyboard use and valid/invalid transitions without producing incomplete rules and stage weekday edits until close.
- [ ] 3.3 Extend shared recurrence summaries for custom intervals and sorted weekday names; verify formatter tests cover single/multiple weekdays, plural intervals, and equivalent input ordering.

## 4. Quick-add and existing-item integration

- [ ] 4.1 Integrate the editor into QuickAddItemForm and quickAddItem helpers; verify component tests show basic presets close the dialog, Custom/Weekdays remain open, interval-only changes apply automatically, weekday changes apply once on close/Escape/outside dismissal, and Enter creation includes the complete applied rule.
- [ ] 4.2 Extend quick-add drafts to preserve mode, raw amount, unit, and weekdays; verify minimize/reopen, failed add, successful reset, No recurrence, chip removal, and explicit discard, including invalid input blocking creation after dialog dismissal.
- [ ] 4.3 Integrate the shared editor into ItemForm automatic-save state and canonical rule keys; verify component tests preserve non-preset rules on unrelated edits, save valid weekday changes once on close, suppress intermediate and unchanged-rule writes, preserve invalid input on dismissal, retain focus, and recover input after failed saves or unrelated SSE echoes.
- [ ] 4.4 Use the shared formatter for quick-add chips, edit triggers, and recurrence indicators; verify visible summaries and field-linked validation messages in component assertions for both forms.

## 5. Integrated validation

- [ ] 5.1 Add focused Playwright coverage creating a custom interval and a Monday/Thursday rule, reloading/editing them, and completing a rule to inspect its successor; include a Monday → Friday → next Monday sequence asserting one incomplete occurrence after each completion, plus a Today edit regression, and verify weekday values survive persistence.
- [ ] 5.2 Run frontend Svelte checks and Vitest (`bun run check` and `bun run test -- --run` in frontend); verify all checks pass and remove unused imports from changed implementation/test files.
- [ ] 5.3 Request backend validation only through the AGENTS.md host-watcher handshake: wait for existing request/running files, clear only prior transient status, touch .run-backend-tests, and inspect returned status/logs/reports; verify the full backend run passes without starting Gradle tests locally.
- [ ] 5.4 Source scripts/load-local-domain.sh using zsh, confirm the shared HTTPS health endpoint with the local certificate, and run the targeted Playwright suite with its BASE_URL; verify it passes or report the environment blocker without starting a local stack.
- [ ] 5.5 Run strict OpenSpec validation and inspect the finished change against issue #311; verify the proposal, design, specs, tasks, and docs agree on custom weekly semantics and preservation of existing rules.
