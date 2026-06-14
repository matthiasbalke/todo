## ADDED Requirements

### Requirement: User preferences persist timezone and Today visibility
Each user account SHALL persist an IANA timezone and whether the Today view is enabled.

#### Scenario: New user is created
- **WHEN** a new user account is created
- **THEN** Today is enabled
- **AND** the persisted timezone fallback is `UTC`
- **AND** the timezone is marked as not yet initialized from the user's browser

#### Scenario: Existing user is migrated
- **WHEN** the preference migration is applied to an existing account
- **THEN** Today is enabled
- **AND** its persisted timezone fallback is `UTC`
- **AND** its timezone is marked as not yet initialized

### Requirement: Account APIs expose and update preferences
The authenticated user profile APIs SHALL expose the timezone, timezone-initialization state, and Today-enabled preference and SHALL provide an authenticated operation to update them.

#### Scenario: User loads account preferences
- **WHEN** an authenticated user requests their profile
- **THEN** the response contains the persisted timezone, initialization state, and Today-enabled value

#### Scenario: User changes timezone
- **WHEN** an authenticated user saves a valid IANA timezone
- **THEN** that timezone is persisted
- **AND** the timezone is marked initialized
- **AND** the updated preference is returned

#### Scenario: User changes Today visibility
- **WHEN** an authenticated user enables or disables Today
- **THEN** the preference is persisted for subsequent sessions and devices

#### Scenario: Invalid timezone is submitted
- **WHEN** an authenticated user submits an identifier unsupported by the backend timezone database
- **THEN** the request is rejected without changing the persisted timezone

### Requirement: Browser timezone initializes the account once
The frontend SHALL initialize an uninitialized account timezone from the authenticated user's browser and SHALL preserve later explicit choices.

#### Scenario: Browser timezone is detected
- **WHEN** an authenticated user has an uninitialized timezone and the browser reports a valid IANA identifier
- **THEN** the frontend persists the detected identifier
- **AND** the account is marked initialized

#### Scenario: Browser timezone is unavailable
- **WHEN** an authenticated user has an uninitialized timezone and no valid browser timezone can be detected
- **THEN** the frontend persists `UTC` as the initialized fallback

#### Scenario: User has an initialized timezone
- **WHEN** an authenticated user returns with an initialized timezone
- **THEN** browser detection does not overwrite the persisted value

### Requirement: Account page manages the preferences
The account page SHALL use the shared `TimezonePicker` for timezone selection and SHALL provide a control for enabling or disabling Today.

#### Scenario: User opens account settings
- **WHEN** the account page loads
- **THEN** the timezone picker displays the persisted timezone
- **AND** the Today setting displays the persisted enabled state

#### Scenario: User saves a timezone
- **WHEN** the user selects and saves a timezone through `TimezonePicker`
- **THEN** the account page persists the selected IANA identifier
- **AND** displays the saved value

#### Scenario: User disables Today
- **WHEN** the user disables Today in account settings
- **THEN** the setting is persisted
- **AND** Today is removed from the list overview

