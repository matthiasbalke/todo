# Design

## Context

See proposal.md for motivation and the delta specs for behavior. Recurrence is currently JSONB containing intervalUnit and intervalValue. ItemService.toggleDone computes the next date directly. The list and Today controllers and SSE each map recurrence separately; TodayRepository extracts individual JSON fields, so extending only the entity would lose weekdays in Today.

QuickAddItemForm uses shared quickAddItem helpers, while ItemForm duplicates preset conversion and encodes recurrence in automatic-save comparison keys. Both currently carry a preset string in drafts. The quick-add dialog closes on selection, and ItemForm releases focus on recurrence changes, neither of which fits a multi-control editor.

## Goals / Non-Goals

**Goals:** One recurrence contract and editor state model across create and edit flows; backward-compatible storage; deterministic calendar calculation; complete rule propagation; no writes for incomplete inputs.

**Non-Goals:** A general RRULE engine, nth-weekday-of-month rules, weekday constraints on daily/monthly/yearly intervals, recurrence end dates, bulk editing of a series, or changes to existing reopen/recomplete behavior and attachment copying. No new scheduler is needed: completion continues to generate the next instance.

## Decisions

### 1. Extend weekly interval rules with optional weekdays

Keep intervalUnit and intervalValue; add nullable weekdays using ISO enum names MONDAY through SUNDAY. Absence/null means existing interval-only behavior. A nonempty list is permitted only for WEEKS; normalize its order after rejecting duplicates. Use the existing integer range (1 through 2147483647) and reject noninteger JSON amounts rather than allowing coercion.

Examples: every 3 months remains MONTHS/3; every Monday and Thursday becomes WEEKS/1 with those weekdays; every 2 weeks on those days becomes WEEKS/2 with the same set. Weekdays mode maps to WEEKS/1. In Custom, weekly intervals can optionally constrain weekdays. Switching to another unit clears those constraints. No weekday selection is the old weekly interval behavior in Custom; an explicitly empty weekday list is invalid on the wire, and an empty selection in Weekdays mode is incomplete.

This interprets the issue's custom weekdays as every N weeks on selected days. Daily/monthly/yearly weekday intersections are excluded because their scheduling semantics are not defined by the issue. A new WEEKDAYS unit was considered but would blur the distinction between week frequency and selected days. A general rule string adds parsing and migration cost without helping this scope.

### 2. Calculate a strictly later calendar occurrence from the base date

Extract date calculation from ItemService into a focused recurrence calculator. Keep interval-only calendar arithmetic, including month-end/leap-day clamping. For weekday rules, derive Monday of the base date's week. Return the first selected day later in that same week, otherwise return the first selected day in the week intervalValue weeks later. Thus every 2 weeks on Monday/Thursday progresses Nov 2 → Nov 5 → Nov 16 → Nov 19 in 2026. For a weekly Monday/Friday rule, keep one incomplete occurrence: checking Monday creates Friday, and checking Friday creates the next Monday. Do not pre-create an item for each selected day; completed occurrences remain in history under the existing Hide checked behavior. A single selected day advances N weeks. No additional anchor field is necessary because generated dates remain in active weeks.

The base is the item's original due date; if absent, use the completing user's persisted timezone as today. A manually changed due date becomes the new base. Do not jump past missed occurrences on late completion. Calendar overflow from an extreme interval must return a controlled HTTP 400 and roll back completion and successor creation rather than return a partial result or HTTP 500.

A scan through calendar days was considered but would make large intervals expensive. Week arithmetic has bounded work over at most seven selected days.

### 3. Preserve the complete contract at every boundary

Extend the domain, request/response DTOs, frontend API and mock-data types, and SSE payloads together. Validate on both create and update before mutation/event publication. Read weekday data in the Today SQL projection and reconstruct the same rule. Exercise list duplication and Hibernate JSON mapping against PostgreSQL, including old JSON without the new field. Retain existing access checks and recurrence detail copying.

No column change or historical backfill is expected: JSONB accepts the optional property. Shared conversion helpers can prevent drift where current DTO mappings repeat the same fields. Merely extending the storage object was rejected because Today and SSE would otherwise silently drop part of the schedule.

### 4. Share editor state and conversion between quick-add and edit

Introduce one recurrence editor/model used by QuickAddItemForm and ItemForm. Reuse the shared Select and existing accessible field primitives. Store mode, raw amount text, unit, and selected weekdays separately from the last valid rule. Keep mode selection itself local. Stage weekday edits while open and apply the complete valid configuration once when the editor closes. New Custom starts with amount 1 and days but does not write merely because the editor opens; new Weekdays starts without selected days and requires a selection.

Basic presets apply immediately and quick-add closes their dialog. Custom and Weekdays keep the dialog open with its existing close/dismiss affordances and no Save/Cancel controls. Use normal commit events for numeric text entry, not writes on each keystroke; unit changes for interval-only rules apply valid whole rules immediately. Weekday edits stage the whole configuration until close. Closing via the close control, Escape, or outside dismissal applies a valid configuration once; unchanged rules cause no write. Invalid dismissal retains the last applied rule and the incomplete editor draft for correction on reopening. Retain focus during configuration and return it to the trigger when closing. Invalid input displays a field-linked message, blocks creation and invalid updates, and leaves the last saved recurrence intact. Other unrelated valid item edits can retain that saved recurrence while the recurrence draft is invalid.

Extend the current draft contract to include full editor state, including incomplete amount text; decode old preset strings when restoring a legacy in-memory draft. Use canonical rule keys including sorted weekdays for automatic-save comparisons and response reconciliation. Do not overwrite dirty editor input with an unrelated SSE echo. Reset every recurrence field on successful add, explicit discard, chip removal, or No recurrence selection. Failed saves retain the recoverable input and error state.

The existing preset-string-only approach was rejected because it cannot represent weekday sets or incomplete input. Maintain one readable formatter for chips, edit triggers, and RecurrenceIndicator; it lists weekday names in Monday–Sunday order.

## Risks / Trade-offs

- Multi-control editing can trigger blur-based minimization or intermediate writes → treat all editor controls/portals as internal, compare canonical complete rules on close for weekday edits, and cover focus and automatic-save requests in component tests.
- Today, SSE, or duplication can lose optional fields → cover each path with round-trip integration assertions, rather than only testing initial creation.
- Older frontends can ignore weekdays and overwrite schedules → release backend and frontend together and refresh deployed PWA clients; avoid mixed-version editing during rollout.
- Very large intervals can exceed LocalDate → detect calculation overflow and roll back completion with a controlled validation response.
- Selected weekday behavior for multiple weeks can be ambiguous → use the explicit active-week semantics and examples in the specs and regression tests.

## Migration Plan

1. Implement backward-compatible backend reading, validation, calculation, and propagation with legacy JSON fixtures.
2. Implement shared frontend editor and draft model, then both create/edit integrations and summaries.
3. Validate backend via the host watcher, frontend checks/unit tests, and targeted Playwright against the shared HTTPS deployment following AGENTS.md.
4. Deploy compatible backend/frontend images together; verify an old interval rule and a new weekday rule across list and Today views.
5. If rollback is needed after weekday rules exist, retain the compatible backend and roll forward a frontend fix. Do not run an older backend against new rules without first exporting and deliberately converting them, since it cannot preserve their meaning.
