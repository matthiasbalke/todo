## ADDED Requirements

### Requirement: Interactive DatePicker examples
The development component showcase SHALL render the real DatePicker component in examples for its principal values, states, and constraints.

#### Scenario: Developer reviews DatePicker examples
- **WHEN** a developer opens the DatePicker showcase section
- **THEN** the page displays empty and preselected DatePickers
- **AND** the page displays constrained and disabled DatePickers
- **AND** the page displays the current bound ISO value for interactive examples

#### Scenario: Developer selects and clears a date
- **WHEN** a developer selects or clears a date in an interactive example
- **THEN** the displayed bound value updates to the selected ISO date or `null`

### Requirement: DatePicker usage guidance
The development component showcase SHALL document binding nullable ISO values, localization, constraints, clearing, and keyboard operation.

#### Scenario: Developer reviews usage documentation
- **WHEN** a developer opens the DatePicker showcase section
- **THEN** the page shows representative basic and constrained usage code
- **AND** it lists the supported keyboard interactions

### Requirement: DatePicker API reference
The development component showcase SHALL list the DatePicker public properties with their types, defaults, and purposes.

#### Scenario: Developer reviews the API reference
- **WHEN** a developer inspects the DatePicker props reference
- **THEN** it documents `value`, `label`, `placeholder`, `required`, `disabled`, `min`, `max`, `locale`, and `ariaLabel`

### Requirement: Development-only availability
The DatePicker showcase SHALL preserve the existing development-only access control of the `/components` route.

#### Scenario: Production user requests the showcase
- **WHEN** the application is running in production mode and a user requests `/components`
- **THEN** the existing route guard redirects the user away from the showcase
