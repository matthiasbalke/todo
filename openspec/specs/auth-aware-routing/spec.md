# auth-aware-routing Specification

## Purpose

Define authentication-aware frontend route access, redirects, and installed application launch behavior.

## Requirements

### Requirement: Root navigation resolves the current session
The frontend SHALL attempt to restore the current session before choosing the destination for `/`.

#### Scenario: Authenticated user accesses the root route
- **WHEN** a user with a valid existing session accesses `/`
- **THEN** the frontend SHALL redirect the user to `/lists` without asking them to authenticate again

#### Scenario: Unauthenticated user accesses the root route
- **WHEN** a user without a valid existing session accesses `/`
- **THEN** the frontend SHALL redirect the user to `/auth`

#### Scenario: Session restoration fails at the root route
- **WHEN** the refresh session is absent, expired, invalid, or revoked while the user accesses `/`
- **THEN** the frontend SHALL treat the user as unauthenticated and redirect them to `/auth`

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

### Requirement: Authentication route excludes authenticated users
The frontend SHALL resolve the current session before displaying `/auth`, and SHALL retry an indeterminate session after temporary backend unavailability before displaying authentication controls.

#### Scenario: Authenticated user accesses the authentication route
- **WHEN** a user with a valid existing session accesses `/auth`
- **THEN** the frontend SHALL redirect the user to `/lists`

#### Scenario: Unauthenticated user accesses the authentication route
- **WHEN** a user without a valid existing session accesses `/auth`
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

### Requirement: PWA launch uses session-aware routing
The installed PWA SHALL launch at `/` so the root route can choose the correct destination from the restored authentication state.

#### Scenario: Installed application is launched
- **WHEN** a user launches the installed PWA
- **THEN** the application SHALL open `/` and apply the root route's authenticated or unauthenticated redirect behavior
