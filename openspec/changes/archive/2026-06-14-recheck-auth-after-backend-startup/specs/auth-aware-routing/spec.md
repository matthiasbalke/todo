## ADDED Requirements

### Requirement: Backend startup recovery preserves authentication decisions
The frontend SHALL treat temporary backend unavailability during session restoration as a pending startup state and SHALL retry session restoration after backend health recovers before choosing an authenticated or unauthenticated destination.

#### Scenario: Authenticated launch starts before the backend
- **WHEN** a user with a valid refresh-token cookie launches `/` while the backend is unavailable
- **THEN** the frontend SHALL display the application startup state at `/`
- **AND** after the backend becomes healthy it SHALL restore the session and redirect the user to `/lists`
- **AND** it SHALL NOT display the authentication form

#### Scenario: Unauthenticated launch starts before the backend
- **WHEN** a user without a valid session launches `/` while the backend is unavailable
- **THEN** the frontend SHALL display the application startup state at `/`
- **AND** after the backend becomes healthy it SHALL retry session restoration and redirect the user to `/auth`

#### Scenario: Protected route encounters backend startup
- **WHEN** session restoration for a protected route cannot complete because the backend is unavailable
- **THEN** the frontend SHALL route the user through the startup state at `/`
- **AND** it SHALL decide the post-startup destination only after retrying session restoration

#### Scenario: Authentication route encounters backend startup
- **WHEN** session restoration for `/auth` cannot complete because the backend is unavailable
- **THEN** the frontend SHALL route the user through the startup state at `/`
- **AND** it SHALL NOT display the authentication form before session restoration is retried

#### Scenario: Backend startup times out
- **WHEN** the backend does not become healthy within the configured startup retry limit
- **THEN** the frontend SHALL display the unavailable state
- **AND** it SHALL NOT assume the user is unauthenticated

#### Scenario: Refresh session is conclusively invalid
- **WHEN** the backend is available and rejects an absent, expired, invalid, or revoked refresh session
- **THEN** the frontend SHALL treat the user as unauthenticated
- **AND** it SHALL redirect the user to `/auth` without entering the backend startup state
