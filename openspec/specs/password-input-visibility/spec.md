# password-input-visibility Specification

## Purpose

Allow people entering sensitive configuration values to verify password text locally without changing the value sent to the application.

## Requirements

### Requirement: Password inputs expose an inline visibility control
The frontend SHALL render an icon-only visibility control inside each shared input operating in password mode. The control SHALL be aligned at the right side of the input editing area and SHALL leave password text readable and editable without being obscured.

#### Scenario: Password input is initially masked
- **WHEN** a shared input is rendered in password mode
- **THEN** its value is masked initially
- **AND** it displays an in-field control named "Show password" with a pressed state of false

#### Scenario: Non-password input is rendered
- **WHEN** a shared input is rendered with a type other than password
- **THEN** it does not display a password-visibility control
- **AND** its existing input behavior and layout remain unchanged

### Requirement: Password visibility can be toggled accessibly
The frontend SHALL let users toggle a password-mode input between masked and plain-text display without changing its value, validation state, focus behavior, or consumer input events. The control SHALL expose an accessible name and pressed state that reflect whether the password is currently visible.

#### Scenario: User shows a password
- **WHEN** a user activates the visibility control while a password is masked
- **THEN** the same input value is displayed as plain text
- **AND** the control is named "Hide password" with a pressed state of true

#### Scenario: User hides a password
- **WHEN** a user activates the visibility control while a password is visible
- **THEN** the same input value is masked
- **AND** the control is named "Show password" with a pressed state of false

#### Scenario: Disabled password input is rendered
- **WHEN** a password-mode input is disabled
- **THEN** its visibility control is disabled
- **AND** the password display state cannot be changed through that control
