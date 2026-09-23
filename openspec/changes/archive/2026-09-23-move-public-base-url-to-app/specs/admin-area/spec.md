## ADDED Requirements

### Requirement: Admin users can manage app settings at runtime
The admin area SHALL expose direct app settings through an admin-only app settings API and SHALL keep those settings separate from email provider settings.

#### Scenario: Admin views app settings
- **WHEN** an administrator opens admin settings
- **THEN** the current registration-enabled state is displayed
- **AND** the current public application base URL is displayed
- **AND** the app settings are loaded from the app settings API
- **AND** email provider settings are not required to read app settings

#### Scenario: Admin saves app settings
- **WHEN** an administrator saves valid app settings
- **THEN** the registration-enabled state is persisted
- **AND** the public application base URL is persisted
- **AND** persisted app setting keys use the `app.` prefix and stay aligned with the corresponding `application.yml` app property paths
- **AND** subsequent registration checks and application link generation use the updated values without backend downtime

#### Scenario: Admin saves invalid public base URL
- **WHEN** an administrator saves app settings with a missing, malformed, or trailing-slash public application base URL
- **THEN** the request is rejected
- **AND** the previously active app settings remain unchanged

#### Scenario: Non-admin requests app settings
- **WHEN** a non-admin requests app settings
- **THEN** the request is rejected

#### Scenario: Unauthenticated user requests app settings
- **WHEN** an unauthenticated user requests app settings
- **THEN** the request is rejected

## MODIFIED Requirements

### Requirement: Admin users can create manual passkey recovery links
The admin area SHALL allow admins to create one-time recovery links that let eligible users add a new passkey to their existing account.

#### Scenario: Admin creates recovery link
- **WHEN** an admin creates a passkey recovery link for an unblocked user
- **THEN** the backend creates a one-time expiring recovery token for the target account
- **AND** the recovery URL is generated from the configured public application base URL and recovery route
- **AND** the admin area displays the recovery URL for manual delivery

#### Scenario: Admin creates recovery link for blocked user
- **WHEN** an admin attempts to create a recovery link for a blocked user
- **THEN** the request is rejected
- **AND** no recovery URL is created

#### Scenario: Registration is disabled
- **WHEN** registration is disabled and an admin creates a recovery link for an eligible user
- **THEN** the recovery link is created
- **AND** normal new account creation remains disabled

#### Scenario: Recovery link is displayed
- **WHEN** a recovery link is created
- **THEN** the admin area displays the full URL to the admin
- **AND** the UI indicates that the link is secret, one-time use, and expires
