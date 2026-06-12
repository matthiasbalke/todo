## Context

`ItemForm` currently stores its due-date field as a string, renders a native `input[type="date"]`, and converts the empty string to `null` during submission. The shared `DatePicker` instead exposes a bindable `string | null` ISO date value and renders its trigger and calendar popover within one component container.

New-item forms cancel when focus leaves the form. Existing native picker fields use a blur workaround because browser picker interactions can report a null focus target. The custom DatePicker uses ordinary buttons inside the form, closes on outside interaction or Escape, and returns focus to its trigger after selecting or clearing a date.

## Goals / Non-Goals

**Goals:**

- Render the shared DatePicker for the `ItemForm` due-date field.
- Preserve the nullable `YYYY-MM-DD` contract from initial item state through submission.
- Keep create and edit behavior unchanged apart from the date control.
- Prevent internal calendar interactions from triggering new-item form cancellation.
- Cover integration behavior in `ItemForm` tests.

**Non-Goals:**

- Change DatePicker's public API, calendar behavior, or visual design.
- Add minimum or maximum due-date constraints.
- Change recurrence, API payloads, backend date handling, or database storage.
- Replace other native date controls outside `ItemForm`.

## Decisions

### Use nullable state throughout ItemForm

The local `dueDate` state will be initialized as `item?.dueDate ?? null`, bound directly to DatePicker, reset to `null` after adding an item, and submitted without empty-string conversion.

This matches the DatePicker and `TodoItem` contracts and avoids maintaining an adapter between `''` and `null`. Keeping the existing string state and translating through event handlers was rejected because it adds synchronization logic without preserving useful behavior.

### Use DatePicker's built-in label

`ItemForm` will pass `label="Due Date"` to DatePicker rather than wrapping it with the native input's external label. This preserves the component's accessible label association and keeps DatePicker usage consistent with its documented API.

Adding an `id` prop or manually duplicating label markup was rejected because DatePicker already creates unique internal identifiers and exposes the required labeling interface.

### Rely on DOM containment for calendar focus transitions

DatePicker's trigger, dialog, navigation controls, date cells, and actions render within `ItemForm`'s form element. The existing form-level `focusout` check therefore treats calendar focus movement as internal. Selection and clearing return focus to the trigger, while explicit outside interaction continues to cancel a new-item form as before.

The native input's `onblur={handlePickerBlur}` workaround will not be attached to DatePicker. Extending DatePicker with form-specific blur callbacks was rejected because its normal focus behavior already satisfies the form's containment rule and such a callback would couple a reusable component to one consumer.

### Test the integration through user-visible controls and submitted values

Tests will locate the due-date trigger by its accessible label, interact with the calendar dialog and actions, and assert submitted `TodoItem.dueDate` values. Focus tests will verify that opening and using the calendar does not call `oncancel`.

Tests will avoid depending on DatePicker's generated IDs or internal state so that component implementation details remain independently changeable.

## Risks / Trade-offs

- [The calendar popover may be clipped by a scrollable ItemForm container] → Verify the due-date control in the existing fixed-bottom form layout and retain DatePicker's current positioning unless an actual clipping issue is observed.
- [Form-level mousedown and focusout guards may interact with DatePicker's document-level outside handler] → Add integration tests for opening, selecting, clearing, dismissing, and outside focus transitions.
- [Changing from an input to a button invalidates tests or automation that query `#dueDate`] → Update tests to use the accessible `Due Date` label, which reflects the user-facing contract.
