## ADDED Requirements

### Requirement: Interactive Textarea examples
The development component showcase SHALL render the real Textarea component in examples for its principal values, states, validation, and multiline configuration.

#### Scenario: Developer reviews Textarea examples
- **WHEN** a developer opens the Textarea showcase section
- **THEN** the page displays basic, validated, required, and disabled Textareas
- **AND** the page demonstrates row and resize configuration
- **AND** the page displays the current bound value for an interactive example

#### Scenario: Developer edits an interactive example
- **WHEN** a developer enters multiline text in the basic example
- **THEN** the displayed bound value updates with the entered text

#### Scenario: Developer enters invalid text
- **WHEN** a developer enters a value rejected by the validation example
- **THEN** the example displays the Textarea component's validation error

### Requirement: Textarea usage guidance
The development component showcase SHALL document importing Textarea, binding values, configuring labels and descriptions, validating values, choosing rows and resize behavior, and forwarding native attributes.

#### Scenario: Developer reviews usage examples
- **WHEN** a developer opens the Textarea showcase section
- **THEN** the page shows representative basic and validated usage code
- **AND** it explains native attribute and event-handler forwarding

### Requirement: Textarea API reference
The development component showcase SHALL list the Textarea-specific properties with their types, defaults, and purposes.

#### Scenario: Developer reviews the API reference
- **WHEN** a developer inspects the Textarea props reference
- **THEN** it documents `value`, `label`, `description`, `placeholder`, `required`, `disabled`, `rows`, `resize`, `validate`, `ariaLabel`, and `class`
- **AND** it states that standard native textarea attributes and event handlers are forwarded

### Requirement: Development-only availability
The Textarea showcase SHALL preserve the existing development-only access control of the `/components` route.

#### Scenario: Production user requests the showcase
- **WHEN** the application is running in production mode and a user requests `/components`
- **THEN** the existing route guard redirects the user away from the showcase
