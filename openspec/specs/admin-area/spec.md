# admin-area Specification

## Purpose

Define setup bootstrapping, admin-only account management, registration control, account blocking, and manual passkey recovery behavior for the Todo instance.

## Requirements

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

### Requirement: Admin users can access the admin area
The frontend SHALL expose the admin area only to authenticated admin users, and the backend SHALL authorize every admin operation server-side.

#### Scenario: Admin views user menu
- **WHEN** an authenticated admin opens the profile menu
- **THEN** an Admin menu item is displayed
- **AND** activating it navigates to the admin area

#### Scenario: Non-admin views user menu
- **WHEN** an authenticated non-admin opens the profile menu
- **THEN** no Admin menu item is displayed

#### Scenario: Non-admin calls admin API
- **WHEN** an authenticated non-admin requests an admin-only API
- **THEN** the request is rejected

#### Scenario: Unauthenticated user calls admin API
- **WHEN** an unauthenticated user requests an admin-only API
- **THEN** the request is rejected

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

### Requirement: Admin users can manage registration at runtime
The admin area SHALL allow admins to enable or disable new account registration without restarting the deployment.

#### Scenario: Admin views registration setting
- **WHEN** an admin opens admin settings
- **THEN** the current registration-enabled state is displayed

#### Scenario: Admin disables registration
- **WHEN** an admin disables registration
- **THEN** new account creation through normal registration is rejected
- **AND** existing users can still sign in
- **AND** account recovery remains available for eligible users

#### Scenario: Admin enables registration
- **WHEN** an admin enables registration
- **THEN** new account creation through normal registration is allowed

#### Scenario: Registration setting changes
- **WHEN** the registration-enabled setting is changed
- **THEN** subsequent authentication configuration and registration requests use the updated setting without backend downtime

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

### Requirement: Admin users can view basic usage statistics
The admin area SHALL display basic instance usage statistics.

#### Scenario: Admin opens stats dashboard
- **WHEN** an admin opens the admin dashboard
- **THEN** the system displays counts for users, admin users, blocked users, lists, and todo items

#### Scenario: Non-admin requests stats
- **WHEN** a non-admin requests usage statistics
- **THEN** the request is rejected

### Requirement: Admin users can manage user accounts
The admin area SHALL allow admins to list users and edit account-level user details.

#### Scenario: Admin lists users
- **WHEN** an admin opens user management
- **THEN** users are displayed with email, display name, admin state, blocked state, passkey count, and created timestamp

#### Scenario: Admin edits user profile
- **WHEN** an admin changes a user's email address or display name
- **THEN** the updated values are persisted
- **AND** future token issuance and profile responses use the updated values

#### Scenario: Admin changes email to an existing email
- **WHEN** an admin changes a user's email address to one already used by another account
- **THEN** the request is rejected
- **AND** the target account remains unchanged

#### Scenario: Admin changes email to an existing email with different formatting
- **WHEN** an admin changes a user's email address to one already used by another account after trimming and lower-case comparison
- **THEN** the request is rejected
- **AND** the target account remains unchanged

#### Scenario: Admin changes only formatting of target user's email
- **WHEN** an admin changes a user's email address and the new value differs from that user's current email only by surrounding whitespace or casing
- **THEN** the request is allowed
- **AND** future token issuance and profile responses use the updated casing after trimming

### Requirement: Admin users can manage admin status safely
The admin area SHALL allow admins to grant or revoke admin status without allowing zero-admin lockout.

#### Scenario: Admin grants admin status
- **WHEN** an admin grants admin status to another user
- **THEN** the target user becomes an admin

#### Scenario: Admin revokes admin status
- **WHEN** an admin revokes admin status from another admin
- **THEN** the target user is no longer an admin
- **AND** at least one unblocked admin remains

#### Scenario: Admin status change would leave no usable admins
- **WHEN** an admin status change would leave zero unblocked admins
- **THEN** the request is rejected
- **AND** the target account remains unchanged

### Requirement: Admin users can block and unblock accounts safely
The admin area SHALL allow admins to block and unblock user accounts while preventing self-block and zero-admin lockout.

#### Scenario: Admin blocks non-admin user
- **WHEN** an admin blocks a non-admin user
- **THEN** the target account becomes blocked
- **AND** the target user's active sessions are invalidated

#### Scenario: Admin blocks another admin
- **WHEN** an admin blocks another admin
- **THEN** the target admin account becomes blocked
- **AND** at least one unblocked admin remains
- **AND** the target admin's active sessions are invalidated

#### Scenario: Admin attempts to block self
- **WHEN** an admin attempts to block their own account
- **THEN** the request is rejected
- **AND** the admin remains unblocked

#### Scenario: Block would leave no usable admins
- **WHEN** blocking a user would leave zero unblocked admins
- **THEN** the request is rejected
- **AND** the target account remains unblocked

#### Scenario: Admin unblocks user
- **WHEN** an admin unblocks a blocked user
- **THEN** the target account becomes unblocked
- **AND** the target user can authenticate if they have a valid passkey

### Requirement: Blocked users are hard-kicked
The system SHALL reject blocked users at login, refresh, and authenticated request time.

#### Scenario: Blocked user attempts login
- **WHEN** a blocked user completes a valid passkey authentication ceremony
- **THEN** no access token or refresh token is issued
- **AND** the login is rejected

#### Scenario: Blocked user refreshes session
- **WHEN** a blocked user presents a refresh token
- **THEN** no new access token is issued
- **AND** the refresh token is invalidated

#### Scenario: Blocked user uses existing access token
- **WHEN** a blocked user sends an existing access token to an authenticated API
- **THEN** the request is rejected
- **AND** the frontend clears the local session and routes the user to authentication

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

### Requirement: Users complete passkey recovery without being signed in
The recovery flow SHALL let the target user register a passkey and then return them to normal sign-in.

#### Scenario: User opens valid recovery link
- **WHEN** a user opens a valid unused recovery link for an unblocked account
- **THEN** the recovery page allows the user to start passkey registration for the target account

#### Scenario: User completes recovery registration
- **WHEN** the user successfully completes passkey registration through the recovery link
- **THEN** the new passkey is attached to the target account
- **AND** the recovery token is consumed
- **AND** the user is not logged in
- **AND** the page displays a successful passkey registration message with a link to the login page

#### Scenario: Recovery link is invalid
- **WHEN** a user opens an invalid, expired, consumed, or revoked recovery link
- **THEN** recovery is rejected
- **AND** no passkey is registered

#### Scenario: Target user becomes blocked before recovery
- **WHEN** a user opens a recovery link after the target account has been blocked
- **THEN** recovery is rejected
- **AND** no passkey is registered

### Requirement: Admin users can manage email delivery settings at runtime
The admin area SHALL allow administrators to view and update outbound email delivery settings without restarting the deployment.

#### Scenario: Admin views email settings
- **WHEN** an administrator opens admin settings
- **THEN** the current email delivery enabled state is displayed
- **AND** the enabled state is editable through a toggle control
- **AND** the SMTP authentication enabled state is displayed and editable through a toggle control
- **AND** the active configuration source is displayed as deployment or runtime
- **AND** non-secret email configuration values are displayed
- **AND** transport protocol internals such as JavaMail protocol are not editable in the admin form
- **AND** stored SMTP passwords are never returned in plain text

#### Scenario: Admin saves email settings
- **WHEN** an administrator saves valid email delivery settings
- **THEN** a complete runtime email configuration snapshot is persisted
- **AND** subsequent outbound email attempts use the updated settings without backend downtime
- **AND** the save action is labeled `Save`

#### Scenario: Admin edits email settings before saving
- **WHEN** an administrator changes email settings in the admin UI
- **THEN** the changed values are treated as a draft
- **AND** outbound email continues to use the previously active configuration until the draft is saved

#### Scenario: Admin discards email settings draft
- **WHEN** an administrator discards draft email setting changes
- **THEN** the draft values are replaced with the active configuration values
- **AND** no runtime email configuration snapshot is changed
- **AND** the draft discard action is labeled `Cancel`

#### Scenario: Admin saves first runtime change from deployment settings
- **WHEN** deployment email settings are active
- **AND** an administrator changes or defines any email setting
- **AND** saves the draft
- **THEN** all active email settings are persisted as runtime settings
- **AND** subsequent admin views identify the email configuration source as runtime

#### Scenario: Admin enables SMTP authentication
- **WHEN** an administrator enables SMTP authentication
- **THEN** SMTP username and password become required before enabled email settings can be persisted

#### Scenario: Admin disables SMTP authentication
- **WHEN** an administrator disables SMTP authentication
- **THEN** SMTP username and password are no longer required for enabled email settings

#### Scenario: Admin changes encryption mode with empty port
- **WHEN** an administrator selects STARTTLS or SSL/TLS encryption
- **AND** the port field has not been filled or edited by the administrator
- **THEN** the port field is populated with the default port for the selected encryption mode

#### Scenario: Admin changes encryption mode after editing port
- **WHEN** an administrator selects STARTTLS or SSL/TLS encryption
- **AND** the port field has already been filled or edited by the administrator
- **THEN** the existing port field value is preserved

#### Scenario: Admin clears stored SMTP password
- **WHEN** an administrator edits the SMTP password field to empty while SMTP authentication is disabled
- **THEN** subsequent email delivery no longer uses the previous stored password
- **AND** the previous password is not recoverable through the admin API

#### Scenario: Admin leaves active SMTP password unchanged
- **WHEN** an administrator updates email settings without editing the SMTP password field
- **THEN** the active SMTP password remains active in the persisted runtime snapshot
- **AND** the API response still does not expose the password

#### Scenario: Admin replaces active SMTP password
- **WHEN** an administrator enters a new value in the SMTP password field and saves email settings
- **THEN** subsequent email delivery uses the replacement password
- **AND** the API response still does not expose the password

#### Scenario: Admin resets email settings to deployment source
- **WHEN** an administrator resets email settings to deployment configuration
- **THEN** runtime email settings are removed
- **AND** subsequent admin views display deployment settings when deployment configuration is present

#### Scenario: Non-admin requests email settings
- **WHEN** a non-admin requests email delivery settings
- **THEN** the request is rejected

#### Scenario: Unauthenticated user requests email settings
- **WHEN** an unauthenticated user requests email delivery settings
- **THEN** the request is rejected

### Requirement: Admin users can test email delivery
The admin area SHALL allow administrators to send a test email to a provided recipient address using the active email configuration.

#### Scenario: Admin views test email settings section
- **WHEN** an administrator opens admin email settings
- **THEN** test email controls are displayed in a dedicated section titled `Test email settings`
- **AND** the section explains that administrators can send a test email below to verify the active email configuration
- **AND** the send action is labeled `Test`

#### Scenario: Admin sends test email
- **WHEN** an administrator requests a test email to a recipient address
- **THEN** the system attempts delivery using the active email configuration
- **AND** the recipient is the requested address
- **AND** the administrator receives a delivery result

#### Scenario: Admin test email fails with diagnostics
- **WHEN** an administrator requests a test email and the delivery attempt fails
- **THEN** the admin area displays the safe failure message
- **AND** safe diagnostic detail and a remediation hint are displayed when provided by the backend
- **AND** SMTP credentials and raw secret-bearing provider responses are not displayed

#### Scenario: Non-admin sends test email
- **WHEN** a non-admin requests a test email
- **THEN** the request is rejected

#### Scenario: Unauthenticated user sends test email
- **WHEN** an unauthenticated user requests a test email
- **THEN** the request is rejected

### Requirement: Admin area preserves future audit and email integration points
The admin area SHALL provide behavior that can later integrate with audit logging and email delivery without changing the core recovery flow.

#### Scenario: Admin action completes
- **WHEN** an admin setup, settings, user-management, blocking, or recovery action completes
- **THEN** the backend has enough actor, target, action, result, and timestamp context for future audit logging

#### Scenario: Recovery link delivery is manual
- **WHEN** an admin creates a recovery link before email delivery is implemented
- **THEN** the admin area uses manual URL display as the delivery mechanism
- **AND** no email delivery is attempted

#### Scenario: Future email service is unavailable
- **WHEN** recovery email delivery is unavailable in a later implementation
- **THEN** the manual recovery URL display path remains available
