## MODIFIED Requirements

### Requirement: Account preferences use a Settings section
The account page SHALL retain its `Account` page title and `/account` route while presenting timezone, Today View, and theme preferences in a section titled `Settings`.

#### Scenario: User opens account preferences
- **WHEN** the user navigates to `/account`
- **THEN** the page heading is `Account`
- **AND** the preference section heading is `Settings`
- **AND** the timezone preference is available
- **AND** the Today View preference is available
- **AND** the theme preference is available
- **AND** the existing profile, security, and danger-zone sections remain available

### Requirement: Preference changes save immediately
The Settings section SHALL save timezone, Today View, and theme changes immediately through the existing preference operation without displaying a separate save button.

#### Scenario: User changes timezone
- **WHEN** the user selects a different timezone
- **THEN** prior success feedback is cleared
- **AND** all current preference values are submitted immediately through the existing preference API

#### Scenario: User changes theme
- **WHEN** the user selects a different theme preference
- **THEN** prior success feedback is cleared
- **AND** all current preference values are submitted immediately through the existing preference API

#### Scenario: No explicit save action is presented
- **WHEN** the user views the Settings section
- **THEN** no `Save Today preferences` button is displayed
- **AND** no separate theme save button is displayed

#### Scenario: Preference save succeeds
- **WHEN** an immediate preference save succeeds
- **THEN** all current values are submitted through the existing preference API
- **AND** the returned values replace local preference state
- **AND** Today data and count are refreshed
- **AND** the selected theme is applied
- **AND** `Preferences saved.` is displayed

#### Scenario: User modifies a setting after a successful save
- **WHEN** success feedback is visible
- **AND** the user changes timezone, Today View, or theme
- **THEN** the success feedback is cleared before the new save completes

#### Scenario: Preference save fails
- **WHEN** an immediate preference save fails
- **THEN** error feedback is displayed
- **AND** all controls return to the last successfully persisted values
- **AND** the last successfully persisted theme remains applied
- **AND** success feedback is not displayed

## ADDED Requirements

### Requirement: Theme preference uses account settings controls
The Settings section SHALL present the theme preference as an accessible control with options for system, light, and dark.

#### Scenario: Theme preference is displayed
- **WHEN** the user views account settings
- **THEN** the theme preference is labeled `Theme`
- **AND** options for `System`, `Light`, and `Dark` are available
- **AND** the persisted value is selected

#### Scenario: Theme selector is disabled during save
- **WHEN** preference saving is in progress
- **THEN** the theme selector is disabled
- **AND** the timezone selector and Today View toggle remain disabled
