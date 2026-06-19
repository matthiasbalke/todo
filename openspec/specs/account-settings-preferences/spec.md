# account-settings-preferences Specification

## Purpose

Define the presentation and immediate persistence behavior of account-level timezone and Today View preferences.

## Requirements

### Requirement: Account preferences use a Settings section
The account page SHALL retain its `Account` page title and `/account` route while presenting timezone and Today View preferences in a section titled `Settings`.

#### Scenario: User opens account preferences
- **WHEN** the user navigates to `/account`
- **THEN** the page heading is `Account`
- **AND** the preference section heading is `Settings`
- **AND** the existing profile, security, and danger-zone sections remain available

### Requirement: Timezone preference explains its purpose
The Settings page SHALL display concise supporting text directly below the timezone selector explaining that the timezone is used for date-sensitive behavior, including Today.

#### Scenario: Timezone selector is displayed
- **WHEN** the user views the timezone preference
- **THEN** explanatory text appears below the selector
- **AND** the text explains that the selected timezone determines which calendar date is considered today

#### Scenario: Timezone selector is disabled during save
- **WHEN** preference saving is in progress
- **THEN** the timezone selector remains disabled
- **AND** its explanatory text remains visible

### Requirement: Today View uses the shared Toggle
The Settings page SHALL present the Today visibility preference as a row labeled `Today View` using the shared Toggle component.

#### Scenario: Today View is enabled
- **WHEN** the persisted Today preference is enabled
- **THEN** the `Today View` toggle is on
- **AND** no `Enabled` or `Disabled` suffix is included in the visible preference label

#### Scenario: Today View is disabled
- **WHEN** the persisted Today preference is disabled
- **THEN** the `Today View` toggle is off

#### Scenario: User changes Today View
- **WHEN** the user activates the `Today View` toggle
- **THEN** the local preference value changes
- **AND** prior success feedback is cleared
- **AND** both current preference values are submitted immediately through the existing preference API

#### Scenario: Preference save is in progress
- **WHEN** the Settings section is saving preferences
- **THEN** the Today View toggle is disabled
- **AND** the timezone selector is disabled

### Requirement: Preference changes save immediately
The Settings section SHALL save timezone and Today View changes immediately through the existing preference operation without displaying a separate save button.

#### Scenario: User changes timezone
- **WHEN** the user selects a different timezone
- **THEN** prior success feedback is cleared
- **AND** both current preference values are submitted immediately through the existing preference API

#### Scenario: No explicit save action is presented
- **WHEN** the user views the Settings section
- **THEN** no `Save Today preferences` button is displayed

#### Scenario: Preference save succeeds
- **WHEN** an immediate preference save succeeds
- **THEN** both current values are submitted through the existing preference API
- **AND** the returned values replace local preference state
- **AND** Today data and count are refreshed
- **AND** `Preferences saved.` is displayed

#### Scenario: User modifies a setting after a successful save
- **WHEN** success feedback is visible
- **AND** the user changes timezone or Today View
- **THEN** the success feedback is cleared before the new save completes

#### Scenario: Preference save fails
- **WHEN** an immediate preference save fails
- **THEN** error feedback is displayed
- **AND** both controls return to the last successfully persisted values
- **AND** success feedback is not displayed
