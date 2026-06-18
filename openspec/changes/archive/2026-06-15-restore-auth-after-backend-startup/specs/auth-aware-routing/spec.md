## MODIFIED Requirements

### Requirement: Authentication route excludes authenticated users
The frontend SHALL resolve the current session before displaying `/auth`, and SHALL retry an indeterminate session after temporary backend unavailability before displaying authentication controls.

#### Scenario: Authenticated user accesses the authentication route
- **WHEN** a user with a valid existing session accesses `/auth` while the backend is available
- **THEN** the frontend SHALL redirect the user to `/lists`

#### Scenario: Unauthenticated user accesses the authentication route
- **WHEN** a user without a valid existing session accesses `/auth` while the backend is available
- **THEN** the frontend SHALL display the authentication page

#### Scenario: Backend is unavailable during initial session restoration
- **WHEN** a user accesses `/auth` and the frontend cannot determine the session because the backend is unavailable
- **THEN** the frontend SHALL keep the authentication controls hidden while it waits for backend readiness

#### Scenario: Existing session is restored after backend startup
- **WHEN** the backend becomes ready after the initial `/auth` session restoration was indeterminate and the refresh-token cookie is valid
- **THEN** the frontend SHALL restore the session and redirect the user to `/lists` without requiring a reload

#### Scenario: Missing or invalid session is confirmed after backend startup
- **WHEN** the backend becomes ready after the initial `/auth` session restoration was indeterminate and the refresh-token cookie is absent, expired, invalid, or revoked
- **THEN** the frontend SHALL display the authentication page

#### Scenario: Session remains indeterminate during startup polling
- **WHEN** backend health or session restoration does not complete successfully within the startup retry limit
- **THEN** the frontend SHALL display the existing backend unavailable state instead of authentication controls
