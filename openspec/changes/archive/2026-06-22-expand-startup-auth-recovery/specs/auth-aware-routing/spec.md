## MODIFIED Requirements

### Requirement: Root navigation resolves the current session
The frontend SHALL attempt to restore the current session before choosing the destination for `/`, and SHALL own the neutral startup state when backend unavailability prevents a conclusive session decision.

#### Scenario: Authenticated user accesses the root route
- **WHEN** a user with a valid existing session accesses `/`
- **THEN** the frontend SHALL redirect the user to `/lists` without asking them to authenticate again

#### Scenario: Unauthenticated user accesses the root route
- **WHEN** a user without a valid existing session accesses `/`
- **THEN** the frontend SHALL redirect the user to `/auth`

#### Scenario: Session restoration fails at the root route
- **WHEN** the refresh session is absent, expired, invalid, or revoked while the user accesses `/`
- **THEN** the frontend SHALL treat the user as unauthenticated and redirect them to `/auth`

#### Scenario: Backend startup prevents root session restoration
- **WHEN** a user accesses `/` and session restoration cannot complete because the backend is temporarily unavailable
- **THEN** the frontend SHALL display the application startup state at `/`
- **AND** it SHALL retry session-aware routing after backend health recovers

#### Scenario: Authenticated launch starts before the backend
- **WHEN** a user with a valid refresh-token cookie launches `/` while the backend is temporarily unavailable
- **THEN** the frontend SHALL display the application startup state at `/`
- **AND** after the backend becomes healthy it SHALL restore the session and redirect the user to `/lists`
- **AND** it SHALL NOT display the authentication form before the session decision

#### Scenario: Unauthenticated launch starts before the backend
- **WHEN** a user without a valid refresh session launches `/` while the backend is temporarily unavailable
- **THEN** the frontend SHALL display the application startup state at `/`
- **AND** after the backend becomes healthy it SHALL retry session restoration and redirect the user to `/auth`

#### Scenario: Backend startup times out at root
- **WHEN** the backend does not become healthy within the configured startup retry limit
- **THEN** the frontend SHALL display the unavailable state
- **AND** it SHALL NOT assume the user is unauthenticated

### Requirement: Protected routes require authentication
The frontend SHALL protect every route in the authenticated application route group and SHALL decide access only after attempting session restoration.

#### Scenario: Authenticated user accesses a protected route
- **WHEN** a user with a valid existing session accesses a protected route
- **THEN** the frontend SHALL allow the requested route to load without redirecting to `/auth`

#### Scenario: Unauthenticated user accesses a protected route
- **WHEN** a user without a valid existing session accesses a protected route
- **THEN** the frontend SHALL redirect the user to `/auth`

#### Scenario: Protected route is opened after a full page reload
- **WHEN** the in-memory session is empty but a valid refresh-token cookie exists for a protected route
- **THEN** the frontend SHALL restore the session and allow the requested route to load

#### Scenario: Protected route encounters backend startup
- **WHEN** session restoration for a protected route cannot complete because the backend is temporarily unavailable
- **THEN** the frontend SHALL route the user through the startup state at `/`
- **AND** it SHALL decide the post-startup destination only after retrying session restoration

### Requirement: Authentication route excludes authenticated users
The frontend SHALL resolve the current session before displaying `/auth`, and SHALL route indeterminate startup state through `/` instead of displaying authentication controls.

#### Scenario: Authenticated user accesses the authentication route
- **WHEN** a user with a valid existing session accesses `/auth`
- **THEN** the frontend SHALL redirect the user to `/lists`

#### Scenario: Unauthenticated user accesses the authentication route
- **WHEN** a user without a valid existing session accesses `/auth`
- **THEN** the frontend SHALL display the authentication page

#### Scenario: Backend is unavailable during initial session restoration
- **WHEN** a user accesses `/auth` and the frontend cannot determine the session because the backend is temporarily unavailable
- **THEN** the frontend SHALL redirect the user to `/`
- **AND** it SHALL NOT display the authentication form before session restoration is retried

#### Scenario: Existing session is restored after backend startup
- **WHEN** the backend becomes ready after the initial session restoration was indeterminate and the refresh-token cookie is valid
- **THEN** the frontend SHALL restore the session and redirect the user to `/lists` without requiring a reload

#### Scenario: Missing or invalid session is confirmed after backend startup
- **WHEN** the backend becomes ready after the initial session restoration was indeterminate and the refresh-token cookie is absent, expired, invalid, or revoked
- **THEN** the frontend SHALL display the authentication page

#### Scenario: Session remains indeterminate during startup polling
- **WHEN** backend health or session restoration does not complete successfully within the startup retry limit
- **THEN** the frontend SHALL display the backend unavailable state instead of authentication controls
