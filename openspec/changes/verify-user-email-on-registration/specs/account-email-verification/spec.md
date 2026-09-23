## Purpose

Define how registered accounts prove control of their email address before receiving normal authenticated application access.

## ADDED Requirements

### Requirement: Accounts track email verification state
The system SHALL persist whether a user account email address has been verified, the current verification token hash when one is active, and when the active token was created.

#### Scenario: New account is created
- **WHEN** a user account is created through registration
- **THEN** the account SHALL have no verified timestamp
- **AND** it SHALL have no active verification token
- **AND** it SHALL have no verification token start timestamp

#### Scenario: First admin is created through setup
- **WHEN** the first admin account is created through the setup flow
- **THEN** the account SHALL have a verified timestamp
- **AND** it SHALL NOT require email verification before accessing setup or admin functionality

#### Scenario: Verification succeeds
- **WHEN** an account email is successfully verified
- **THEN** the system SHALL store the current timestamp as the account's verified timestamp
- **AND** it SHALL clear the active verification token
- **AND** it SHALL clear the verification token start timestamp

#### Scenario: Already verified account requests verification state
- **WHEN** an authenticated account already has a verified timestamp
- **THEN** the verification state SHALL report the account as verified
- **AND** it SHALL NOT expose any historical verification token value

### Requirement: Email verification timeout is configurable
The system SHALL provide an instance configuration value that controls how long email verification tokens remain valid, defaulting to 30 minutes.

#### Scenario: Instance configuration is initialized
- **WHEN** the application initializes instance configuration without an explicit email verification timeout
- **THEN** the timeout SHALL be set to 30 minutes
- **AND** the timeout value SHALL be present and non-null

#### Scenario: Active token is within timeout
- **WHEN** an account has an active verification token whose start timestamp is newer than the configured timeout window
- **THEN** the token SHALL be considered active

#### Scenario: Active token is older than timeout
- **WHEN** an account has an active verification token whose start timestamp is older than the configured timeout window
- **THEN** the token SHALL be considered expired

### Requirement: Users can request a verification email
The system SHALL allow an authenticated, unverified user to request an email verification token and delivery message.

#### Scenario: Unverified user requests verification email
- **WHEN** an authenticated user without a verified timestamp requests verification email delivery
- **THEN** the system SHALL generate a new random verification token
- **AND** it SHALL store only a hash of the token on the user's account
- **AND** it SHALL store the current timestamp as the verification token start timestamp
- **AND** it SHALL request delivery of a verification email to the user's email address

#### Scenario: Unverified user requests verification email again
- **WHEN** an authenticated user without a verified timestamp requests verification email delivery while another verification token is active or expired
- **THEN** the system SHALL generate a new random verification token
- **AND** it SHALL replace the previous verification token hash and start timestamp
- **AND** any previous verification token SHALL no longer validate

#### Scenario: Verification email delivery succeeds
- **WHEN** a verification email request is accepted for delivery
- **THEN** the user SHALL receive confirmation that verification email delivery was requested
- **AND** the response SHALL NOT include the raw verification token

#### Scenario: Verification email delivery is unavailable
- **WHEN** a verification email cannot be sent because email delivery is unavailable or fails
- **THEN** the system SHALL report a safe delivery failure to the user
- **AND** it SHALL NOT expose provider credentials, raw provider internals, or the raw verification token

#### Scenario: Verified user requests verification email
- **WHEN** an authenticated user with a verified timestamp requests verification email delivery
- **THEN** the system SHALL report that the account is already verified
- **AND** it SHALL NOT generate a new verification token

### Requirement: Users can verify pending email changes
The system SHALL require a newly requested account email address to be verified before it becomes the active account contact identity.

#### Scenario: Verified user requests email change
- **WHEN** a verified user requests an account email change to a new email identity
- **THEN** the system SHALL keep the current verified email as the active account email
- **AND** it SHALL store the requested email as pending verification
- **AND** it SHALL generate a new random verification token
- **AND** it SHALL store only a hash of the token for the pending email change
- **AND** it SHALL send the verification email to the pending email address
- **AND** it SHALL send an email-change notice to the current verified email address when delivery is available

#### Scenario: Pending email is not yet verified
- **WHEN** a user has a pending email change
- **THEN** the current verified email address SHALL remain the active account email for account display and notifications
- **AND** the pending email address SHALL NOT replace the active account email

#### Scenario: User verifies pending email
- **WHEN** a user submits a valid active token for a pending email change
- **THEN** the system SHALL promote the pending email address to the active account email
- **AND** it SHALL store the current timestamp as the verified timestamp for the active account email
- **AND** it SHALL clear the pending email, pending token hash, and pending token start timestamp

#### Scenario: Pending email verification expires
- **WHEN** a pending email verification token is older than the configured timeout window
- **THEN** the pending email SHALL NOT become the active account email
- **AND** the current verified email address SHALL remain the active account email for account display and notifications
- **AND** the pending email SHALL remain visible as expired until the user cancels the change or requests a new pending email verification email
- **AND** the user SHALL be able to request a new pending email verification email

#### Scenario: Pending email verification is requested again
- **WHEN** a user requests another verification email for the same pending email change
- **THEN** the system SHALL generate a new random verification token
- **AND** it SHALL replace the previous pending token hash and start timestamp
- **AND** any previous pending email verification token SHALL no longer validate

#### Scenario: User cancels pending email change
- **WHEN** a user cancels a pending email change
- **THEN** the system SHALL clear the pending email, pending token hash, and pending token start timestamp
- **AND** the current verified email address SHALL remain the active account email

### Requirement: Users can submit a verification token
The system SHALL allow an authenticated, unverified user to verify their account by submitting the active verification token.

#### Scenario: User submits matching active token
- **WHEN** an authenticated unverified user submits a verification token whose hash matches the account's active token hash
- **AND** the token is within the configured timeout window
- **THEN** the system SHALL mark the account email as verified
- **AND** it SHALL report verification success

#### Scenario: User follows verification link
- **WHEN** an authenticated unverified user opens the verification page with a verification token parameter
- **THEN** the frontend SHALL submit that token for validation without requiring the user to paste it manually

#### Scenario: User opens verification page without token
- **WHEN** an authenticated unverified user opens the verification page without a verification token parameter
- **THEN** the frontend SHALL display a verification form for manually entering the token
- **AND** it SHALL provide a way to submit the entered token

#### Scenario: User submits missing token
- **WHEN** an authenticated unverified user submits no verification token
- **THEN** the system SHALL reject the request
- **AND** it SHALL tell the user that a verification token is required

#### Scenario: User submits invalid token
- **WHEN** an authenticated unverified user submits a verification token that does not match the account's active token
- **THEN** the system SHALL reject the request
- **AND** it SHALL tell the user that the verification token is invalid
- **AND** the account SHALL remain unverified

#### Scenario: User submits expired token
- **WHEN** an authenticated unverified user submits a verification token whose start timestamp is older than the configured timeout window
- **THEN** the system SHALL reject the request
- **AND** it SHALL tell the user that the verification token is no longer valid
- **AND** the account SHALL remain unverified

#### Scenario: Verified user submits verification token
- **WHEN** an authenticated user with a verified timestamp submits a verification token
- **THEN** the system SHALL report that the account is already verified
- **AND** it SHALL NOT alter the verified timestamp

### Requirement: Unverified users complete verification before normal app access
The system SHALL prevent authenticated users whose account has no verified timestamp from accessing normal authenticated application functionality until email verification succeeds.

#### Scenario: Unverified user has no active token
- **WHEN** an authenticated unverified user has no active verification token
- **THEN** the frontend SHALL show a verification email request state
- **AND** it SHALL NOT show normal authenticated application content

#### Scenario: Unverified user has active token
- **WHEN** an authenticated unverified user has an active verification token
- **THEN** the frontend SHALL show the verification token form
- **AND** it SHALL NOT show normal authenticated application content

#### Scenario: Unverified user has expired token
- **WHEN** an authenticated unverified user has an expired verification token
- **THEN** the frontend SHALL tell the user that the verification token is no longer valid
- **AND** it SHALL offer a way to request a new verification email
- **AND** it SHALL NOT show normal authenticated application content

#### Scenario: Verification succeeds while signed in
- **WHEN** an authenticated unverified user successfully verifies their email address
- **THEN** the frontend SHALL refresh the current account state
- **AND** it SHALL allow the normal authenticated landing route to load

### Requirement: Backend restricts unverified authenticated sessions
The backend SHALL allow authenticated but unverified users to access only the endpoints required to maintain the session, inspect safe account state, and complete email verification.

#### Scenario: Unverified user refreshes or ends the session
- **WHEN** an authenticated user's account has no verified timestamp
- **THEN** the backend SHALL allow session refresh and logout endpoints

#### Scenario: Unverified user reads own safe account state
- **WHEN** an authenticated user's account has no verified timestamp
- **THEN** the backend SHALL allow reading the user's own account profile and non-secret verification state
- **AND** the response SHALL NOT include raw verification tokens or token hashes

#### Scenario: Unverified user completes verification
- **WHEN** an authenticated user's account has no verified timestamp
- **THEN** the backend SHALL allow requesting a verification email and submitting a verification token

#### Scenario: Unverified user accesses normal application API
- **WHEN** an authenticated user's account has no verified timestamp
- **AND** the request targets lists, list groups, list events, items, categories, today view, admin, account mutation, preferences, passkey management, deletion preview, or account deletion APIs
- **THEN** the backend SHALL reject the request with a forbidden response
- **AND** the response SHALL identify that email verification is required

#### Scenario: Verified user has a pending email change
- **WHEN** an authenticated user's active account email is verified and the user has a pending email change
- **THEN** the backend SHALL treat the user as verified for normal application API access

### Requirement: Public registration requires email delivery availability
The system SHALL disable public account registration when email delivery is unavailable, without revealing email-configuration status to unauthenticated users.

#### Scenario: Email delivery is unavailable
- **WHEN** public registration is otherwise enabled but email delivery is unavailable
- **THEN** the public authentication configuration SHALL report registration as disabled
- **AND** it SHALL NOT reveal that registration is disabled because email delivery is unavailable

#### Scenario: Registration is attempted while email delivery is unavailable
- **WHEN** a user attempts public account registration while email delivery is unavailable
- **THEN** the system SHALL reject the registration as disabled
- **AND** it SHALL NOT create an unverified user account
- **AND** it SHALL NOT reveal that registration is disabled because email delivery is unavailable

#### Scenario: Email delivery is available
- **WHEN** public registration is enabled and email delivery is available
- **THEN** users SHALL be able to start registration
- **AND** newly registered public accounts SHALL require email verification before normal application access
