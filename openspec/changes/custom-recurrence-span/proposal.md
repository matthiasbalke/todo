# Proposal

## Why

[GitHub issue #311](https://github.com/matthiasbalke/todo/issues/311) requests custom recurrence amounts and selected weekdays while reducing the preset list. The current form cannot create custom rules and silently maps existing non-preset rules to no recurrence, while the backend cannot schedule selected weekdays.

## What Changes

- Offer No recurrence, Daily, Weekly, Monthly, Yearly, Weekdays, and Custom; move two-week and three-month choices into custom configuration.
- Allow a positive whole-number interval with days, weeks, months, or years; allow selected days on weekly rules, including every N weeks.
- Make Weekdays a selectable set of days (for example Monday and Thursday), rather than a hard-coded Monday–Friday schedule.
- Preserve custom and weekday rules through editing, drafts, automatic saving, list/Today responses, SSE updates, and list duplication.
- Extend recurrence generation and validation while preserving original-due-date scheduling and existing interval-only data.

## Capabilities

### New Capabilities

- `item-recurrence`: Validated recurrence rule persistence and transport, calendar interval and selected-weekday scheduling, and readable recurrence summaries.

### Modified Capabilities

- `item-form-overhaul`: Keep multi-field recurrence dialogs open and apply weekday changes together when the editor closes.
- `item-form-recurrence-selection`: Simplified presets, custom configuration, weekday selection, faithful initialization, validation, reset, and form interaction behavior.

## Impact

- Frontend: QuickAddItemForm, quickAddItem helpers, ItemForm and their draft/automatic-save state, API and mock-data types, recurrence formatting and indicators, and relevant component/E2E tests.
- Backend: RecurrenceRule, ItemController, ItemService, TodayRepository/TodayService/TodayController, SSE payloads, and persistence/duplication integration tests.
- Existing JSONB recurrence records remain valid without a data rewrite; an optional weekday field extends the contract. Coordinate backend/frontend rollout so new rules are interpreted consistently.
- Update the recurrence section of docs/requirements.md. No new runtime dependency is planned.
