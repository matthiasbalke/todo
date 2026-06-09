## ADDED Requirements

### Requirement: Interactive EditableLabel examples
The development component showcase SHALL render the actual `EditableLabel` component in examples that demonstrate basic editing, validation, disabled state, and saving state.

#### Scenario: Basic value is edited
- **WHEN** a developer activates the basic EditableLabel example, changes its value, and saves it
- **THEN** the showcase displays the saved value and identifies it as the latest value emitted by the component

#### Scenario: Invalid value is entered
- **WHEN** a developer enters a value rejected by the validation example
- **THEN** the example remains in edit mode and displays the component's validation error

#### Scenario: Editing is unavailable
- **WHEN** a developer activates an example configured as disabled or saving
- **THEN** the example does not enter edit mode and communicates its unavailable state

### Requirement: EditableLabel usage guidance
The development component showcase SHALL document how to import and configure `EditableLabel`, how edits are committed or cancelled, and how consumers receive saved values.

#### Scenario: Developer reviews usage documentation
- **WHEN** a developer opens the EditableLabel showcase section
- **THEN** the page shows a usage example with representative props and a `change` event handler
- **AND** the page explains Enter, Escape, blur, click, and keyboard activation behavior

### Requirement: EditableLabel API reference
The development component showcase SHALL list the public `EditableLabel` props and `change` event with their types, defaults where applicable, and purposes.

#### Scenario: Developer reviews the API reference
- **WHEN** a developer inspects the EditableLabel props and events reference
- **THEN** the reference includes `value`, `label`, `placeholder`, `type`, `disabled`, `required`, `validate`, `isSaving`, and `ariaLabel`
- **AND** the reference describes the `change` event value payload

### Requirement: Development-only availability
The EditableLabel showcase SHALL preserve the existing development-only access control of the `/components` route.

#### Scenario: Production user requests the showcase
- **WHEN** the application is running in production mode and a user requests `/components`
- **THEN** the existing route guard redirects the user away from the showcase
