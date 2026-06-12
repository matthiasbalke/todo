## Why

`ItemForm` still uses a browser-native date input even though the component library now provides a consistent, accessible `DatePicker`. Migrating the due-date field completes the component adoption while preserving the form's nullable ISO date contract and focus-loss cancellation behavior.

## What Changes

- Replace the native `input[type="date"]` in `ItemForm` with the shared `DatePicker` component.
- Bind the form's due-date state directly to the component's nullable `YYYY-MM-DD` value.
- Preserve due dates when editing, submit selected dates unchanged, and submit `null` when the date is empty or cleared.
- Ensure opening, navigating, selecting from, clearing, and dismissing the calendar does not accidentally cancel a new-item form.
- Update `ItemForm` tests for DatePicker rendering, date selection and clearing, submission, and focus/cancel behavior.

## Capabilities

### New Capabilities
- `item-form-date-selection`: Due-date selection in `ItemForm` through the shared DatePicker, including value persistence, clearing, submission, and form focus behavior.

### Modified Capabilities

None.

## Impact

- Affects `frontend/src/lib/components/ItemForm.svelte` and its colocated tests.
- Reuses the existing `frontend/src/lib/components/DatePicker.svelte`; no new dependency is required.
- Does not change the `TodoItem` model, frontend API payloads, backend date handling, or database schema.
