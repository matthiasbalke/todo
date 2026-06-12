## Why

`ItemForm` still uses a browser-native recurrence select while category and date entry use shared components. Replacing it with the shared `Select` makes the form consistent and removes the final native-picker blur workaround without changing recurrence behavior.

## What Changes

- Replace the native recurrence `<select>` in `ItemForm` with the shared `Select` component.
- Display the existing recurrence labels while retaining the encoded preset strings used by the form's parsing and initialization logic.
- Preserve no-recurrence initialization, existing recurrence-rule mapping, submission, and new-item reset behavior.
- Ensure pointer and keyboard interactions with the recurrence dropdown do not accidentally cancel a new-item form.
- Remove the recurrence-specific native blur workaround once no native picker uses it.
- Add focused `ItemForm` tests for recurrence rendering, initialization, selection, submission, reset, keyboard interaction, and focus/cancel behavior.

## Capabilities

### New Capabilities
- `item-form-recurrence-selection`: Recurrence selection in `ItemForm` through the shared Select component, including preset labels, rule conversion, initialization, reset, and form focus behavior.

### Modified Capabilities

None.

## Impact

- Affects `frontend/src/lib/components/ItemForm.svelte` and its colocated tests.
- Reuses the existing shared `Select`; no new dependency is required.
- Does not change the `RecurrenceRule` model, frontend API payloads, backend recurrence handling, or database schema.
