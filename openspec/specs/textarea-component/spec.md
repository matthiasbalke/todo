# textarea-component Specification

## Purpose
TBD - created by archiving change components-textarea. Update Purpose after archive.
## Requirements
### Requirement: Native multiline text semantics
The Textarea component SHALL render a native textarea, SHALL expose a bindable string value, and SHALL forward standard textarea attributes and native event handlers.

#### Scenario: Consumer enters multiline text
- **WHEN** a user enters text containing line breaks
- **THEN** the bound value contains the complete multiline string

#### Scenario: Consumer provides native attributes
- **WHEN** a consumer configures attributes such as `name`, `maxlength`, `autocomplete`, or `data-*`
- **THEN** the rendered native textarea exposes those attributes

#### Scenario: Consumer handles native events
- **WHEN** the textarea receives input, focus, or blur events
- **THEN** the corresponding consumer-provided native handlers receive the original events

### Requirement: Textarea presentation
The Textarea component SHALL support placeholder text, required and disabled states, configurable rows, configurable resize behavior, and additive consumer classes.

#### Scenario: Consumer uses default sizing
- **WHEN** a consumer omits rows and resize configuration
- **THEN** the textarea renders with three rows and vertical resizing

#### Scenario: Consumer configures multiline sizing
- **WHEN** a consumer provides a row count and a supported resize mode
- **THEN** the textarea uses the requested row count and resize behavior

#### Scenario: Textarea is disabled
- **WHEN** `disabled` is true
- **THEN** the native textarea is disabled and uses the component's unavailable styling

#### Scenario: Consumer extends classes
- **WHEN** a consumer provides layout or sizing classes
- **THEN** those classes are present together with the component's base and state classes

### Requirement: Accessible labeling and description
The Textarea component SHALL support visible labels, screen-reader-only labels, required indication, descriptions, and unique accessible relationships for every instance.

#### Scenario: Visible label is provided
- **WHEN** a consumer provides a label
- **THEN** the label is associated with that component instance's textarea
- **AND** a required marker is displayed when `required` is true

#### Scenario: Accessible label override is provided
- **WHEN** a consumer omits a visible label and provides `ariaLabel`
- **THEN** the textarea exposes that accessible name

#### Scenario: Multiple instances are rendered
- **WHEN** a page renders more than one Textarea
- **THEN** each textarea and its supporting content use unique identifiers

#### Scenario: Description is provided
- **WHEN** a consumer provides description text
- **THEN** the description is rendered and associated with the textarea through `aria-describedby`

### Requirement: Synchronous validation
The Textarea component SHALL support an optional synchronous validator, SHALL validate on input and blur, and SHALL expose validation errors visually and accessibly.

#### Scenario: Entered value is invalid
- **WHEN** the validator returns an error message for the current value
- **THEN** the component displays the error message
- **AND** the textarea exposes `aria-invalid="true"`
- **AND** the error is associated through `aria-describedby`

#### Scenario: Entered value becomes valid
- **WHEN** a value with an existing validation error is changed to a value accepted by the validator
- **THEN** the error message is removed
- **AND** the textarea exposes `aria-invalid="false"`

#### Scenario: Validator throws an exception
- **WHEN** the validator throws while processing input or blur
- **THEN** the exception is logged
- **AND** text entry continues without throwing from the component

### Requirement: ItemForm notes adoption
`ItemForm` SHALL use the shared Textarea component for notes while preserving its existing data and focus behavior.

#### Scenario: User edits notes
- **WHEN** a user enters multiline notes in ItemForm and submits
- **THEN** the submitted item contains the entered notes string

#### Scenario: User submits empty notes
- **WHEN** ItemForm notes are empty at submission
- **THEN** the submitted item contains `notes` equal to `null`

#### Scenario: User interacts with notes in a new-item form
- **WHEN** focus moves between the Textarea and another control inside ItemForm
- **THEN** the form remains open
- **AND** `oncancel` is not called

