## Context

`ItemForm` stores recurrence selection as an encoded preset string such as `1_DAYS` or `2_WEEKS`. Existing item rules are mapped to those strings by `getInitialRecurrencePreset`, and submission maps them back to `RecurrenceRule` through `parseRecurrencePreset`. The empty string represents no recurrence.

The recurrence field is the remaining browser-native select in the form. It uses `handlePickerBlur` to prevent native picker focus behavior from triggering new-item cancellation. The shared `Select` is already used for category entry and supports distinct option values and display labels.

## Goals / Non-Goals

**Goals:**
- Replace only the recurrence native select in `ItemForm` with the shared Select.
- Preserve the current recurrence presets, labels, initialization, parsing, submission, and new-item reset behavior.
- Preserve keyboard-accessible selection and the new-item form's focus-loss cancellation behavior.
- Remove the native-picker blur workaround when it is no longer used.
- Add focused integration coverage for recurrence behavior.

**Non-Goals:**
- Add custom recurrence rules or change the available preset list.
- Change `RecurrenceRule`, API payloads, backend recurrence handling, or recurrence scheduling.
- Change the shared Select API.
- Replace other form controls or redesign ItemForm.

## Decisions

### Keep encoded recurrence presets as Select option values

`ItemForm` will provide the shared Select with the same ordered preset values currently used by the native option elements: the empty string followed by `1_DAYS`, `1_WEEKS`, `2_WEEKS`, `1_MONTHS`, `3_MONTHS`, and `1_YEARS`.

The Select's label resolver will map those values to `No recurrence`, `Every day`, `Every week`, `Every 2 weeks`, `Every month`, `Every 3 months`, and `Every year`. Keeping the encoded values preserves the existing conversion helpers and avoids introducing a second recurrence representation.

Using display labels as values was rejected because it would couple parsing to user-facing text. Passing `RecurrenceRule` objects was rejected because it would add object-identity concerns and duplicate conversion logic already handled by the preset strings.

### Preserve current initialization and reset semantics

The Select's `selected` value will receive `recurrencePreset`, and `onSelect` will assign the selected preset back to that state. Existing supported rules will therefore display their current labels, no rule and unsupported rules will retain the current empty-string behavior, and successful new-item submission will reset the Select to `No recurrence`.

### Remove the obsolete native blur workaround

The shared Select trigger and listbox are rendered as part of the form interaction. Once recurrence no longer uses a native select, `handlePickerBlur` has no callers and will be removed. The form's existing internal-pointer guard remains responsible for pointer transitions, while the Select's keyboard handling closes the listbox and restores trigger focus on Escape.

Focused tests will verify pointer selection, keyboard selection, Escape dismissal, and actual focus movement outside the form.

### Keep coverage in ItemForm integration tests

The shared Select's value/label and keyboard behavior already has component-level coverage. New tests will focus on the recurrence contract: rendering, initialization, preset-to-rule submission, no-recurrence submission, reset, and cancellation behavior.

## Risks / Trade-offs

- [Encoded preset and label lists can drift] → Define the options and label mapping together in `ItemForm` and cover every visible option in tests.
- [Dropdown interaction could cancel a new-item form] → Test pointer and keyboard workflows plus Escape dismissal with `oncancel` assertions.
- [Removing `handlePickerBlur` could expose an untested focus path] → Retain the form-level internal-pointer guard and existing outside-focus cancellation coverage.
- [Unsupported existing recurrence rules display as no recurrence] → Preserve current behavior; custom recurrence support remains out of scope.
