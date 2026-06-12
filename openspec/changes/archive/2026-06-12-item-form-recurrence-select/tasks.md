## 1. Recurrence Select Integration

- [x] 1.1 Define the ordered encoded recurrence preset options and their existing display-label mapping in `ItemForm.svelte`.
- [x] 1.2 Replace the recurrence native select with the shared Select using `recurrencePreset` as the selected value and updating it through `onSelect`.
- [x] 1.3 Preserve existing supported-rule initialization, unsupported-rule fallback, nullable rule submission, and new-item reset behavior.
- [x] 1.4 Remove the now-unused recurrence native blur workaround while retaining the form's general internal-interaction and outside-focus cancellation logic.

## 2. ItemForm Recurrence Tests

- [x] 2.1 Test that ItemForm renders the shared Recurrence Select, displays all existing labels, and no longer renders the recurrence native select.
- [x] 2.2 Test initialization for supported recurrence rules, no recurrence, and unsupported rules.
- [x] 2.3 Test pointer selection and submission for each preset shape, `No recurrence` submission as `null`, and reset to `No recurrence`.
- [x] 2.4 Test keyboard navigation, selection, and Escape dismissal without invoking new-item cancellation.
- [x] 2.5 Remove the obsolete recurrence native-select blur test while retaining coverage for internal interaction and actual outside-focus cancellation.

## 3. Verification

- [x] 3.1 Run the focused ItemForm test suite.
- [x] 3.2 Run the frontend Svelte type check.
- [x] 3.3 Validate the `item-form-recurrence-select` OpenSpec change.
