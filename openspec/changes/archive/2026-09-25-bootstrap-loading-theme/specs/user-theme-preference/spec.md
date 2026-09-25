## MODIFIED Requirements

### Requirement: Frontend applies selected theme
The frontend SHALL apply the user's selected theme consistently across app surfaces before interactive authenticated content is presented.

#### Scenario: Profile is still loading
- **WHEN** authenticated app startup begins before `/api/users/me` has returned the user's persisted theme preference
- **THEN** the frontend uses a valid cached theme preference when one exists
- **AND** it falls back to the browser system color scheme when no valid cached preference exists

#### Scenario: Cached theme preference exists during startup
- **WHEN** authenticated app startup begins before `/api/users/me` has returned the user's persisted theme preference
- **AND** the browser has a valid cached theme preference from a previous frontend session
- **THEN** the frontend uses the cached preference as the temporary effective theme
- **AND** the startup loading state renders with that effective theme

#### Scenario: No valid cached theme preference exists during startup
- **WHEN** authenticated app startup begins before `/api/users/me` has returned the user's persisted theme preference
- **AND** the browser has no cached theme preference or the cached value is unsupported
- **THEN** the frontend uses the browser system color scheme as the temporary effective theme

#### Scenario: Persisted preference replaces cached startup preference
- **WHEN** the frontend used a cached theme preference during startup
- **AND** `/api/users/me` returns the user's persisted theme preference
- **THEN** the frontend applies the persisted preference as the authoritative theme preference
- **AND** the browser cache is updated to match the persisted preference

#### Scenario: Successful preference update refreshes startup cache
- **WHEN** the user saves a new theme preference
- **AND** the account preference API returns the updated persisted theme preference
- **THEN** the frontend applies the returned preference as the authoritative theme preference
- **AND** the browser cache is updated to match the returned preference

#### Scenario: Light theme selected
- **WHEN** the authenticated user's persisted theme preference is `LIGHT`
- **THEN** the frontend renders app surfaces using the light theme

#### Scenario: Dark theme selected
- **WHEN** the authenticated user's persisted theme preference is `DARK`
- **THEN** the frontend renders app surfaces using the dark theme

#### Scenario: System theme selected with light preference
- **WHEN** the authenticated user's persisted theme preference is `SYSTEM`
- **AND** the browser reports a light color scheme
- **THEN** the frontend renders app surfaces using the light theme

#### Scenario: System theme selected with dark preference
- **WHEN** the authenticated user's persisted theme preference is `SYSTEM`
- **AND** the browser reports a dark color scheme
- **THEN** the frontend renders app surfaces using the dark theme

#### Scenario: System color scheme changes
- **WHEN** the authenticated user's persisted theme preference is `SYSTEM`
- **AND** the browser color scheme changes while the app is open
- **THEN** the frontend updates app surfaces to match the new browser color scheme
