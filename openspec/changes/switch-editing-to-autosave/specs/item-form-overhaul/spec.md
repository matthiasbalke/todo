## MODIFIED Requirements

### Requirement: Item form controls use borderless inline presentation
The item form SHALL present title, category, date, recurrence, assignee, and notes controls with a borderless inline treatment while preserving accessible names and validation affordances.

#### Scenario: Editable form is rendered
- **WHEN** an editable user opens the item form
- **THEN** the editable controls are visually presented as inline rows rather than boxed fields
- **AND** each control remains discoverable by its accessible name
- **AND** required title validation remains available before persistence

#### Scenario: Existing workflows are preserved
- **WHEN** the user changes focus inside the form, receives a persistence failure, or interacts with field-specific editors
- **THEN** the existing item data, draft preservation, focus-out minimization rules, and error recovery behavior are preserved

## ADDED Requirements

### Requirement: Item field edits autosave
The item form SHALL persist add-item and edit-item value changes automatically without showing save or cancel buttons for ordinary field editing, while preserving the existing fullscreen notes editor workflow.

#### Scenario: Existing item text edit is committed automatically
- **WHEN** an editable user changes an existing item's title and completes the edit using the implementation-defined commit event
- **THEN** the changed value is persisted for that item
- **AND** the editor does not require or display separate save or cancel controls

#### Scenario: Fullscreen notes editor workflow is preserved
- **WHEN** an editable user opens the fullscreen notes editor from an item form
- **THEN** the notes editor continues to provide its field-specific Save and Cancel controls
- **AND** canceling the notes editor leaves the item notes unchanged
- **AND** saving the notes editor applies the notes value to the item form

#### Scenario: Existing item selection edit is committed automatically
- **WHEN** an editable user changes an existing item's category, due date, recurrence, assignees, completion state, or starred state
- **THEN** the changed value is persisted for that item without requiring a separate save action

#### Scenario: New item is created from entered values
- **WHEN** an editable user enters the required new-item title and completes the add-item creation using the implementation-defined creation event
- **THEN** a new item is created with the current form values
- **AND** the add-item form does not require or display separate save or cancel controls

#### Scenario: New item optional edits are included
- **WHEN** an editable user changes optional values before the new item is created
- **THEN** the created item includes the current optional values for category, due date, recurrence, assignees, completion state, starred state, and notes

#### Scenario: Invalid item values are not persisted
- **WHEN** an editable user enters invalid item values
- **THEN** the invalid values are not persisted
- **AND** the UI communicates the validation problem without requiring a cancel action to restore the last valid saved value

#### Scenario: Autosave failure keeps user input recoverable
- **WHEN** an automatic item save or creation attempt fails
- **THEN** the user's current input remains available for correction or retry
- **AND** the UI communicates that the value was not persisted
