## ADDED Requirements

### Requirement: Account page is titled Settings
The account preference page SHALL use `Settings` as its page title while retaining the existing account route and profile, security, and deletion features.

#### Scenario: User opens account preferences
- **WHEN** the user navigates to `/account`
- **THEN** the page heading is `Settings`
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
- **AND** the change is persisted only when the existing preferences save action succeeds

#### Scenario: Preference save is in progress
- **WHEN** the Settings page is saving preferences
- **THEN** the Today View toggle is disabled

### Requirement: Existing preference save behavior is preserved
The Settings page SHALL continue to save timezone and Today View together through the existing preference operation and SHALL retain current success, error, persisted-state, and Today-refresh behavior.

#### Scenario: Preference save succeeds
- **WHEN** the user saves changed timezone or Today View values
- **THEN** both current values are submitted through the existing preference API
- **AND** the returned values replace local preference state
- **AND** Today data and count are refreshed
- **AND** success feedback is displayed

#### Scenario: Preference save fails
- **WHEN** saving preferences fails
- **THEN** error feedback is displayed
- **AND** persisted account preferences are not represented as successfully saved
