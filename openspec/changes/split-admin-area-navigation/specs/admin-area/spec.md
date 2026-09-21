## ADDED Requirements

### Requirement: Admin area provides section navigation
The admin area SHALL expose dedicated Settings and Users sections so administrators can move between instance configuration and user management without leaving the admin area.

#### Scenario: Admin opens admin entry point
- **WHEN** an authenticated admin opens `/admin`
- **THEN** the admin area navigates to the Settings section
- **AND** the administrator remains within the authenticated app shell

#### Scenario: Admin views admin navigation
- **WHEN** an authenticated admin opens an admin section
- **THEN** navigation entries for Settings and Users are displayed
- **AND** the active section is visually indicated

#### Scenario: Admin opens settings section
- **WHEN** an administrator opens the Settings section
- **THEN** registration settings are displayed
- **AND** application link settings are displayed
- **AND** email settings are displayed
- **AND** user-management controls are not displayed

#### Scenario: Admin opens users section
- **WHEN** an administrator opens the Users section
- **THEN** usage statistics are displayed
- **AND** user account management controls are displayed
- **AND** registration, application link, and email settings controls are not displayed

#### Scenario: Admin uses small-screen navigation
- **WHEN** an administrator opens the admin area on a small screen
- **THEN** Settings and Users navigation remains available without requiring a permanent sidebar

#### Scenario: Non-admin opens admin subsection
- **WHEN** an authenticated non-admin opens any admin subsection
- **THEN** the request is rejected

#### Scenario: Unauthenticated user opens admin subsection
- **WHEN** an unauthenticated user opens any admin subsection
- **THEN** the request is rejected
