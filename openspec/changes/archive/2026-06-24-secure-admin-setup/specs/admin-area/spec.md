## MODIFIED Requirements

### Requirement: Setup wizard bootstraps the first admin
The system SHALL expose a setup wizard whenever no admin users exist, and first-admin creation SHALL require the setup secret printed by the backend for the current setup window.

#### Scenario: No admin exists
- **WHEN** the instance has zero admin users
- **THEN** setup is required
- **AND** the setup wizard is available before regular application usage
- **AND** first-admin creation requires the current setup secret

#### Scenario: Existing users have no admin
- **WHEN** the instance has one or more users and zero admin users
- **THEN** setup is required
- **AND** the setup wizard allows the instance to establish an admin without direct database changes
- **AND** first-admin creation requires the current setup secret

#### Scenario: Admin exists
- **WHEN** the instance has at least one admin user
- **THEN** setup is not required
- **AND** setup-only endpoints are not available for creating another first admin

#### Scenario: Setup secret is logged
- **WHEN** the backend starts or enters setup-required mode with no current setup secret
- **THEN** the backend generates a high-entropy setup secret
- **AND** the backend logs the raw setup secret to the backend console with setup instructions
- **AND** the backend does not expose the raw setup secret through unauthenticated API responses

#### Scenario: Setup status is requested
- **WHEN** a client requests setup status
- **THEN** the response indicates whether setup is required
- **AND** the response does not include the setup secret or validation hints

#### Scenario: Setup starts without setup secret
- **WHEN** a client requests first-admin registration options without a setup secret
- **THEN** the request is rejected
- **AND** no setup user or WebAuthn registration options are created

#### Scenario: Setup starts with invalid setup secret
- **WHEN** a client requests first-admin registration options with an invalid setup secret
- **THEN** the request is rejected
- **AND** no setup user or WebAuthn registration options are created

#### Scenario: Setup starts with valid setup secret
- **WHEN** a client requests first-admin registration options with the current setup secret
- **THEN** the backend creates the setup WebAuthn registration options
- **AND** the setup flow can continue

#### Scenario: Setup completes without valid setup secret
- **WHEN** a client submits first-admin registration completion without the current setup secret
- **THEN** the request is rejected
- **AND** no admin account is created or promoted

#### Scenario: Backend restarts before setup completes
- **WHEN** setup is still required after a backend restart
- **THEN** the previous setup secret is no longer valid
- **AND** the backend logs a new setup secret

#### Scenario: First admin setup completes
- **WHEN** setup successfully creates or promotes the first admin user using the current setup secret
- **THEN** the instance leaves setup-required mode
- **AND** regular authenticated application usage becomes available
- **AND** the setup secret can no longer be used to create another admin
