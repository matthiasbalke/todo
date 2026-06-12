## Context

The application stores due dates as nullable ISO calendar-date strings (`YYYY-MM-DD`) and currently edits them with a native date input in `ItemForm`. Native date controls differ substantially across browsers and operating systems. The component library already centralizes input, select, editable-label, and button behavior, and identifies DatePicker as a planned base primitive.

This change creates the standalone component and its showcase only. `ItemForm` migration is intentionally deferred.

## Goals / Non-Goals

**Goals:**

- Provide a consistent custom single-date calendar popover.
- Bind `string | null` ISO calendar dates without timezone shifts.
- Support pointer, touch, and complete keyboard operation.
- Provide accessible labeling, dialog/grid semantics, focus management, and dismissal behavior.
- Support disabled state, Today and Clear actions, and optional min/max dates.
- Use browser localization APIs without adding dependencies.
- Demonstrate and document the component in `/components`.

**Non-Goals:**

- Replace the due-date field in `ItemForm`.
- Support date ranges, date-time values, time zones, or time selection.
- Support free-form typed date parsing.
- Add presets beyond Today and Clear.
- Add an external calendar or positioning dependency.

## Decisions

### Keep the public value as a nullable ISO date

The component will expose a bindable `value: string | null`. Selection emits the exact `YYYY-MM-DD` calendar date, and Clear sets the value to `null`.

Date utilities will parse and create dates from numeric year, month, and day fields in local time instead of calling `new Date('YYYY-MM-DD')` or using `toISOString()`. This prevents the selected day from shifting in negative or positive UTC offsets.

### Use a trigger button and non-modal calendar popover

The closed component will render a labeled trigger button showing a localized date or placeholder. Activating it opens a positioned popover with `role="dialog"` and a calendar grid. The popover is non-modal so surrounding page content remains available.

The popover will close after a selection, on Escape, or on an outside pointer interaction. Focus returns to the trigger after Escape or selection.

### Use a Monday-first six-week grid

The calendar will always render 42 day cells, starting on Monday and including adjacent-month dates. A stable six-row grid avoids layout shifts while navigating months and matches the project's primary European usage context.

Adjacent-month dates remain selectable when within constraints and selecting one navigates implicitly by closing with that date selected.

### Implement roving keyboard focus

Only one date cell will have `tabindex="0"` while the remaining cells use `-1`. On open, focus targets the selected date when visible, otherwise today when visible and allowed, otherwise the first allowed date in the displayed month.

Keyboard behavior:

- Arrow Left/Right: previous/next day.
- Arrow Up/Down: previous/next week.
- Home/End: Monday/Sunday of the current week.
- Page Up/Page Down: previous/next month.
- Enter/Space: select the focused date.
- Escape: close and return focus to the trigger.

Movement that crosses a month updates the visible month. Disabled dates are not selectable; navigation advances to an allowed date where possible.

### Localize display and calendar labels with Intl

An optional `locale` prop will default to the user's runtime locale. `Intl.DateTimeFormat` will format:

- trigger value using a readable medium date;
- month/year heading;
- weekday labels;
- full accessible labels for date cells.

The ISO value remains locale-independent.

### Support min/max constraints and state props

Optional `min` and `max` ISO dates will disable dates outside the allowed range, including Today when unavailable. The `disabled` prop will disable the trigger and prevent opening. Label, placeholder, required marker, and accessible-label override will align with existing input component conventions.

### Build with existing project tools

The component will use Svelte state, native DOM events, Tailwind classes, and small internal date helpers. No external date or popover library will be added because the required behavior is bounded and date-only arithmetic can be implemented deterministically.

## Risks / Trade-offs

- [Calendar keyboard behavior is more complex than a native input] → Specify and test every supported key, focus transition, and dismissal path.
- [Local-time date arithmetic can encounter daylight-saving transitions] → Create dates at local noon for arithmetic and serialize only calendar fields.
- [A fixed Monday-first week may not match every locale] → Document the convention; locale controls labels and display formatting, not week start.
- [Simple absolute positioning can overflow narrow viewports] → Render the popover at trigger width with responsive max-width and horizontal containment; advanced collision positioning remains out of scope.
- [Custom calendar accessibility can regress] → Use native buttons for dates/actions, explicit dialog/grid labels, roving tabindex, and focused accessibility tests.
