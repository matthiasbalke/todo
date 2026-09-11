# user-theme-preference Specification

## Purpose

Defines how each account stores, exposes, updates, and applies the user's preferred visual theme across sessions and devices.

## Requirements

### Requirement: User preferences persist theme selection
Each user account SHALL persist a theme preference with supported values `SYSTEM`, `LIGHT`, and `DARK`.

#### Scenario: New user is created
- **WHEN** a new user account is created
- **THEN** the persisted theme preference is `SYSTEM`

#### Scenario: Existing user is migrated
- **WHEN** the theme preference migration is applied to an existing account
- **THEN** its persisted theme preference is `SYSTEM`

### Requirement: Account APIs expose and update theme preference
The authenticated user profile APIs SHALL expose the theme preference and SHALL allow authenticated users to update it with the rest of their account preferences.

#### Scenario: User loads account preferences
- **WHEN** an authenticated user requests their profile
- **THEN** the response contains the persisted theme preference

#### Scenario: User changes theme preference
- **WHEN** an authenticated user saves `SYSTEM`, `LIGHT`, or `DARK` as their theme preference
- **THEN** that theme preference is persisted
- **AND** the updated preference is returned

#### Scenario: Invalid theme preference is submitted
- **WHEN** an authenticated user submits an unsupported theme preference value
- **THEN** the request is rejected without changing the persisted theme preference

### Requirement: Frontend applies selected theme
The frontend SHALL apply the user's selected theme consistently across app surfaces before interactive authenticated content is presented.

#### Scenario: Profile is still loading
- **WHEN** authenticated app startup begins before `/api/users/me` has returned the user's persisted theme preference
- **THEN** the frontend uses the browser system color scheme as the temporary effective theme
- **AND** no local per-device theme cache is used as a substitute for the persisted account preference

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

### Requirement: Browser chrome reflects active theme
The frontend SHALL keep browser and PWA shell theme metadata aligned with the active rendered theme.

#### Scenario: Active theme changes
- **WHEN** the effective rendered theme changes between light and dark
- **THEN** the document theme-color metadata is updated to match the active theme
