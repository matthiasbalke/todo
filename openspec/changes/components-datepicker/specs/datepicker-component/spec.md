## ADDED Requirements

### Requirement: Nullable ISO date value
The DatePicker component SHALL expose a bindable value containing either `null` or a valid `YYYY-MM-DD` calendar date and SHALL preserve the selected calendar day across time zones.

#### Scenario: Consumer provides a selected date
- **WHEN** a consumer renders DatePicker with `value="2026-06-09"`
- **THEN** the trigger displays June 9, 2026 in the configured locale
- **AND** opening the calendar marks June 9, 2026 as selected

#### Scenario: User clears the selected date
- **WHEN** the user activates Clear
- **THEN** the value becomes `null`
- **AND** the trigger displays the placeholder

### Requirement: Calendar popover
The DatePicker component SHALL use a custom calendar popover opened from a native trigger button.

#### Scenario: User opens the calendar
- **WHEN** the user activates the enabled trigger
- **THEN** a calendar dialog opens for the selected date's month or the current month when no date is selected
- **AND** the trigger communicates that the popover is expanded

#### Scenario: User dismisses the calendar
- **WHEN** the user presses Escape or interacts outside the component
- **THEN** the calendar closes without changing the selected value

### Requirement: Calendar grid
The DatePicker component SHALL render a Monday-first six-week grid with localized weekday labels and date buttons for the displayed and adjacent months.

#### Scenario: Month is displayed
- **WHEN** the calendar opens
- **THEN** it renders seven weekday headings beginning with Monday
- **AND** it renders 42 date cells
- **AND** each date has a full accessible date label

#### Scenario: User selects an allowed date
- **WHEN** the user activates an enabled date cell
- **THEN** the value updates to that cell's ISO date
- **AND** the calendar closes
- **AND** focus returns to the trigger

### Requirement: Month navigation
The DatePicker component SHALL provide controls to navigate to the previous and next calendar months.

#### Scenario: User navigates months
- **WHEN** the user activates the next- or previous-month control
- **THEN** the calendar heading and grid update to the requested month
- **AND** the selected value remains unchanged

### Requirement: Keyboard operation
The DatePicker component SHALL support roving date focus and standard calendar keyboard navigation.

#### Scenario: User moves by day or week
- **WHEN** a focused date receives Arrow Left, Arrow Right, Arrow Up, or Arrow Down
- **THEN** focus moves by one day or one week in the requested direction
- **AND** the visible month updates when focus crosses a month boundary

#### Scenario: User moves within the week or month
- **WHEN** a focused date receives Home, End, Page Up, or Page Down
- **THEN** focus moves to the Monday or Sunday of its week or the corresponding date in the previous or next month

#### Scenario: User selects with the keyboard
- **WHEN** an enabled focused date receives Enter or Space
- **THEN** that date is selected using the same behavior as pointer activation

### Requirement: Date constraints
The DatePicker component SHALL support optional inclusive minimum and maximum ISO dates.

#### Scenario: Date is outside the allowed range
- **WHEN** a rendered date is earlier than `min` or later than `max`
- **THEN** its button is disabled
- **AND** it cannot update the selected value

#### Scenario: Today is outside the allowed range
- **WHEN** the current date violates the configured range
- **THEN** the Today action is disabled

### Requirement: Component states and labeling
The DatePicker component SHALL support label, placeholder, required, disabled, locale, and accessible-label properties consistent with the component library.

#### Scenario: Component is disabled
- **WHEN** `disabled` is true
- **THEN** the trigger is disabled and the calendar cannot be opened

#### Scenario: Label is provided
- **WHEN** a visible label is configured
- **THEN** it is associated with the trigger
- **AND** the required marker is displayed when `required` is true

#### Scenario: Locale is configured
- **WHEN** a supported locale is provided
- **THEN** the trigger date, month heading, weekday headings, and accessible date labels use that locale
