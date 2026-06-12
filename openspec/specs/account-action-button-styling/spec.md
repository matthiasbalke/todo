# account-action-button-styling Specification

## Purpose
TBD - created by archiving change fix-primary-button-default-colors. Update Purpose after archive.
## Requirements
### Requirement: Passkey actions use primary button styling
The frontend SHALL render the passkey sign-in and passkey registration actions with the shared Button primary variant, including a blue default background, white text, and a darker blue hover background.

#### Scenario: Passkey sign-in action is visible before hover
- **WHEN** the authentication page displays the passkey sign-in action
- **THEN** the action uses the primary blue background and white text without requiring pointer hover

#### Scenario: Passkey registration action is visible before hover
- **WHEN** the user opens the account registration form
- **THEN** the passkey registration action uses the primary blue background and white text without requiring pointer hover

#### Scenario: Passkey actions retain primary hover feedback
- **WHEN** the user hovers the passkey sign-in or passkey registration action
- **THEN** the action uses the darker blue primary hover background

### Requirement: Account deletion uses danger button styling
The frontend SHALL render the initial account deletion action with the shared Button danger variant, including a red default background, white text, and a darker red hover background.

#### Scenario: Account deletion action is visible before hover
- **WHEN** the account page displays the Delete my account action
- **THEN** the action uses the danger red background and white text without requiring pointer hover

#### Scenario: Account deletion action retains danger hover feedback
- **WHEN** the user hovers the Delete my account action
- **THEN** the action uses the darker red danger hover background

### Requirement: Semantic variants own action colors
Affected passkey and account deletion call sites MUST NOT combine the shared Button bare variant with custom filled background, foreground, or hover background utilities.

#### Scenario: Route-specific layout remains supported
- **WHEN** an affected action requires route-specific width, padding, or layout
- **THEN** the call site may provide those geometry utilities while the Button variant supplies its semantic colors

