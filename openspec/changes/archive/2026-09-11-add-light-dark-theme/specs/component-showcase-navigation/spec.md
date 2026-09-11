## ADDED Requirements

### Requirement: Components page exposes local theme modes
The development components page SHALL provide a local theme selector with `System`, `Light`, `Dark`, and `Diagnostic` options so shared components can be inspected across production themes and the diagnostic palette without changing account preferences.

#### Scenario: Developer views theme modes
- **WHEN** a developer opens the components page in development mode
- **THEN** the page presents a theme selector near the component showcase controls
- **AND** the selector includes `System`, `Light`, `Dark`, and `Diagnostic` options

#### Scenario: Developer selects explicit production themes
- **WHEN** a developer selects `Light` or `Dark` from the components page theme selector
- **THEN** the components page applies the selected production theme to the showcase
- **AND** the selection does not persist to the user's account theme preference

#### Scenario: Developer selects system theme
- **WHEN** a developer selects `System` from the components page theme selector
- **THEN** the components page resolves the showcase theme from the browser color-scheme preference
- **AND** the showcase updates when the browser color-scheme preference changes

#### Scenario: Developer selects diagnostic theme
- **WHEN** a developer selects `Diagnostic` from the components page theme selector
- **THEN** the components page applies the diagnostic palette to the showcase
- **AND** production account theme values remain limited to `System`, `Light`, and `Dark`
