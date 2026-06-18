## ADDED Requirements

### Requirement: Configurable save mode
The `EditableLabel` component SHALL support `automatic` and `explicit` save modes and SHALL use automatic mode when no mode is provided.

#### Scenario: Existing consumer omits save mode
- **WHEN** a consumer renders `EditableLabel` without configuring a save mode
- **THEN** Enter and blur continue to validate and save changed values

#### Scenario: Consumer selects explicit mode
- **WHEN** a consumer configures `EditableLabel` for explicit saving and enters edit mode
- **THEN** the editor displays an enabled Save button alongside the input

### Requirement: Explicit confirmation
In explicit-save mode, the component SHALL commit a changed value only when the user clicks the Save button.

#### Scenario: User clicks Save with a valid changed value
- **WHEN** the user changes the draft to a valid value and clicks Save
- **THEN** the component updates its value, emits `change` with `{ value: string }`, and exits edit mode

#### Scenario: User presses Enter
- **WHEN** the user changes the draft and presses Enter in explicit-save mode
- **THEN** the component does not update its value or emit `change`
- **AND** the editor remains open

#### Scenario: Editor loses focus
- **WHEN** focus leaves the explicit editor without a Save button click
- **THEN** the component discards the draft and exits edit mode without emitting `change`

#### Scenario: User clicks Save across a focus transition
- **WHEN** pointer interaction with the Save button causes the input to lose focus before the click event
- **THEN** the editor remains active long enough to process the Save click

### Requirement: Explicit-mode cancellation
The component SHALL allow an explicit edit to be cancelled without changing the committed value.

#### Scenario: User presses Escape
- **WHEN** the user presses Escape after changing the explicit-mode draft
- **THEN** the component restores the committed value, exits edit mode, and does not emit `change`

### Requirement: Explicit-mode validation and saving state
The component SHALL apply its existing validation and saving-state behavior to explicit mode.

#### Scenario: User clicks Save with an invalid value
- **WHEN** the explicit-mode draft fails validation and the user clicks Save
- **THEN** the component displays the validation error, remains in edit mode, and does not emit `change`

#### Scenario: Save is in progress
- **WHEN** `isSaving` is true while the explicit editor is visible
- **THEN** the input and Save button are disabled
- **AND** the Save button communicates that saving is in progress
