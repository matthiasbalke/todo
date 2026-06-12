## ADDED Requirements

### Requirement: Interactive Button examples
The development component showcase SHALL render the real Button component in examples for each supported variant and state.

#### Scenario: Developer reviews Button examples
- **WHEN** a developer opens the Button showcase section
- **THEN** the page displays primary, secondary, and danger Buttons
- **AND** the page displays disabled and loading Buttons
- **AND** the page demonstrates consumer layout classes and native submit type

#### Scenario: Developer activates an interactive example
- **WHEN** a developer clicks an enabled showcase Button
- **THEN** the page displays local feedback identifying the activated example

### Requirement: Button usage guidance
The development component showcase SHALL document how to import Button, provide child content, select variants, handle clicks, configure loading, and use native button types.

#### Scenario: Developer reviews usage examples
- **WHEN** a developer opens the Button showcase section
- **THEN** the page shows representative primary, danger, loading, and submit usage code

### Requirement: Button API reference
The development component showcase SHALL list the Button-specific props and explain support for standard native button attributes and handlers.

#### Scenario: Developer reviews the API reference
- **WHEN** a developer inspects the Button API reference
- **THEN** it documents `variant`, `type`, `disabled`, `loading`, `loadingLabel`, child content, and class extension
- **AND** it states that native attributes and event handlers are forwarded

### Requirement: Development-only availability
The Button showcase SHALL preserve the existing development-only access control of the `/components` route.

#### Scenario: Production user requests the showcase
- **WHEN** the application is running in production mode and a user requests `/components`
- **THEN** the existing route guard redirects the user away from the showcase
