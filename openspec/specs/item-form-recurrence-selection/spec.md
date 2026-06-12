# item-form-recurrence-selection Specification

## Purpose
TBD - created by archiving change item-form-recurrence-select. Update Purpose after archive.
## Requirements
### Requirement: Shared recurrence selector
`ItemForm` SHALL render the shared Select component for recurrence entry instead of a browser-native recurrence select.

#### Scenario: User views the item form
- **WHEN** the item form is rendered
- **THEN** it exposes a Select trigger labeled `Recurrence`
- **AND** it does not render a native select for the recurrence field

### Requirement: Recurrence preset values and labels
The recurrence Select SHALL retain encoded preset strings as option values while displaying the existing user-facing recurrence labels.

#### Scenario: User opens recurrence options
- **WHEN** the user opens the recurrence Select
- **THEN** the first option is labeled `No recurrence`
- **AND** the available daily, weekly, monthly, and yearly presets are displayed with their existing labels
- **AND** selecting a preset retains its encoded preset value for rule conversion

### Requirement: Initial recurrence selection
`ItemForm` SHALL initialize the recurrence Select from the existing item's recurrence rule.

#### Scenario: User edits an item with a supported recurrence rule
- **WHEN** the form is rendered for an item whose recurrence rule matches a supported preset
- **THEN** the Select trigger displays the matching recurrence label
- **AND** the matching option is marked selected

#### Scenario: User edits an item without recurrence
- **WHEN** the form is rendered for an item whose recurrence rule is `null`
- **THEN** the Select trigger displays `No recurrence`

#### Scenario: User edits an item with an unsupported recurrence rule
- **WHEN** the form is rendered for an item whose recurrence rule does not match a supported preset
- **THEN** the Select preserves the current fallback behavior and displays `No recurrence`

### Requirement: Recurrence submission and reset
`ItemForm` SHALL submit and reset recurrence selection using its existing nullable `RecurrenceRule` contract.

#### Scenario: User submits a recurrence preset
- **WHEN** the user selects a supported recurrence preset and submits the form
- **THEN** the submitted item has the matching `intervalValue` and `intervalUnit`

#### Scenario: User submits no recurrence
- **WHEN** the user selects `No recurrence` and submits the form
- **THEN** the submitted item has `recurrenceRule` equal to `null`

#### Scenario: New item form resets after submission
- **WHEN** a new recurring item is submitted successfully
- **THEN** the recurrence Select resets to `No recurrence`

### Requirement: Recurrence interactions preserve the new-item form
`ItemForm` SHALL treat pointer and keyboard interactions within the recurrence Select as internal form interactions.

#### Scenario: User selects recurrence with a pointer
- **WHEN** the user opens the recurrence Select and clicks an option
- **THEN** the selected recurrence is updated
- **AND** the new-item form remains open
- **AND** `oncancel` is not called

#### Scenario: User selects recurrence with the keyboard
- **WHEN** the user opens the recurrence Select, navigates its options, and selects one with the keyboard
- **THEN** the selected recurrence is updated
- **AND** the new-item form remains open
- **AND** `oncancel` is not called

#### Scenario: User dismisses recurrence options
- **WHEN** the user presses Escape while the recurrence Select is open
- **THEN** the options close without changing the selected recurrence
- **AND** focus returns to the recurrence trigger
- **AND** the new-item form remains open
- **AND** `oncancel` is not called

