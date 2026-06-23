## ADDED Requirements

### Requirement: Setup-required state takes precedence over normal routing
The frontend SHALL route users to setup when the backend reports that setup is required.

#### Scenario: Root route detects setup required
- **WHEN** a user opens `/` and the backend reports that no admin users exist
- **THEN** the frontend SHALL route the user to the setup wizard
- **AND** it SHALL NOT route to `/auth` or `/lists` before setup is completed

#### Scenario: Protected route detects setup required
- **WHEN** a user opens a protected route and the backend reports that no admin users exist
- **THEN** the frontend SHALL route the user to the setup wizard
- **AND** it SHALL defer normal protected-route loading until setup is completed

#### Scenario: Authentication route detects setup required
- **WHEN** a user opens `/auth` and the backend reports that no admin users exist
- **THEN** the frontend SHALL route the user to the setup wizard
- **AND** it SHALL NOT display normal sign-in or account creation controls before setup is completed

#### Scenario: Setup completes
- **WHEN** setup completes and at least one admin user exists
- **THEN** normal session-aware routing resumes

### Requirement: Blocked-session rejection clears frontend authentication state
The frontend SHALL treat blocked-session responses as terminal authentication failures.

#### Scenario: Session restore is rejected because user is blocked
- **WHEN** session restoration fails because the current account is blocked
- **THEN** the frontend SHALL clear local authentication state
- **AND** it SHALL route the user to `/auth`

#### Scenario: Authenticated API is rejected because user is blocked
- **WHEN** an authenticated API request fails because the current account is blocked
- **THEN** the frontend SHALL clear local authentication state
- **AND** it SHALL route the user to `/auth`
