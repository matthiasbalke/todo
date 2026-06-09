## ADDED Requirements

### Requirement: Shared due-date picker
`ItemForm` SHALL render the shared DatePicker component for due-date entry instead of a browser-native date input.

#### Scenario: User views the item form
- **WHEN** the item form is rendered
- **THEN** it exposes a DatePicker trigger labeled `Due Date`
- **AND** it does not render a native date input for the due-date field

### Requirement: Existing due-date value
`ItemForm` SHALL initialize the DatePicker with the item's nullable ISO due-date value.

#### Scenario: User edits a dated item
- **WHEN** the form is rendered for an item whose due date is `2026-06-09`
- **THEN** the DatePicker displays June 9, 2026 in its configured locale
- **AND** opening the calendar marks that date as selected

#### Scenario: User edits an undated item
- **WHEN** the form is rendered for an item whose due date is `null`
- **THEN** the DatePicker displays its empty-state placeholder

### Requirement: Due-date submission
`ItemForm` SHALL submit the DatePicker value as the item's nullable `YYYY-MM-DD` due date.

#### Scenario: User submits a selected date
- **WHEN** the user selects June 15, 2026 and submits the form
- **THEN** the submitted item has `dueDate` equal to `2026-06-15`

#### Scenario: User clears a due date
- **WHEN** the user clears the DatePicker and submits the form
- **THEN** the submitted item has `dueDate` equal to `null`

#### Scenario: New item form resets after submission
- **WHEN** a new item with a selected due date is submitted successfully
- **THEN** the DatePicker value resets to `null`
- **AND** the DatePicker displays its empty-state placeholder

### Requirement: Calendar interactions preserve the new-item form
`ItemForm` SHALL treat focus movement and pointer interactions within the DatePicker as internal form interactions.

#### Scenario: User opens and navigates the calendar
- **WHEN** the user opens the DatePicker and moves among its calendar controls
- **THEN** the new-item form remains open
- **AND** `oncancel` is not called

#### Scenario: User selects or clears a date
- **WHEN** the user selects a date or activates Clear
- **THEN** the new-item form remains open
- **AND** focus returns to the DatePicker trigger
- **AND** `oncancel` is not called

#### Scenario: User dismisses the calendar with Escape
- **WHEN** the user presses Escape while the calendar is open
- **THEN** the calendar closes without changing the due date
- **AND** the new-item form remains open
- **AND** `oncancel` is not called
