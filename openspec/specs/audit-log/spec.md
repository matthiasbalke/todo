# audit-log Specification

## Purpose

Define the future audit logging capability for security-sensitive and user-visible account, administration, authentication, and list activity.

## Requirements

### Requirement: Audit logging records security-sensitive admin actions
The audit logging capability SHALL record security-sensitive admin actions with enough structured context to identify the actor, target, action, outcome, and time.

#### Scenario: Admin setup is completed
- **WHEN** the setup wizard creates the first admin user
- **THEN** an audit event is recorded for admin setup completion
- **AND** the event identifies the created admin account

#### Scenario: Admin role is changed
- **WHEN** an admin grants or revokes another user's admin privileges
- **THEN** an audit event is recorded
- **AND** the event identifies the acting admin, target user, previous admin state, and new admin state

#### Scenario: Registration setting is changed
- **WHEN** an admin enables or disables new account registration
- **THEN** an audit event is recorded
- **AND** the event identifies the acting admin, previous setting value, and new setting value

#### Scenario: User block state is changed
- **WHEN** an admin blocks or unblocks a user account
- **THEN** an audit event is recorded
- **AND** the event identifies the acting admin, target user, previous block state, and new block state

#### Scenario: User profile is edited by admin
- **WHEN** an admin changes a user's email address or display name
- **THEN** an audit event is recorded
- **AND** the event identifies the acting admin, target user, edited fields, and previous and new values where safe to retain

### Requirement: Audit logging records account recovery activity
The audit logging capability SHALL record account recovery actions without storing recovery secrets.

#### Scenario: Recovery link is created
- **WHEN** an admin creates a passkey recovery link for a user
- **THEN** an audit event is recorded
- **AND** the event identifies the acting admin, target user, recovery token identifier, expiration time, and delivery mode
- **AND** the event does not store the raw recovery URL or raw token

#### Scenario: Recovery passkey registration succeeds
- **WHEN** a user completes passkey registration through a recovery link
- **THEN** an audit event is recorded
- **AND** the event identifies the target user, recovery token identifier, and created credential identifier

#### Scenario: Recovery attempt fails
- **WHEN** a recovery link is expired, already used, revoked, invalid, or rejected
- **THEN** an audit event is recorded
- **AND** the event records the failure reason without storing raw secrets

### Requirement: Audit logging records email verification activity
The audit logging capability SHALL record email verification and email-change events without storing verification secrets.

#### Scenario: Verification email is requested
- **WHEN** a verification email is requested for registration verification or pending email change verification
- **THEN** an audit event is recorded
- **AND** the event identifies the target user, verification purpose, recipient address or safe recipient identifier, delivery outcome, and time
- **AND** it does not store raw verification tokens, token hashes, verification links, or full message body content

#### Scenario: Email verification succeeds
- **WHEN** a user successfully verifies an email address
- **THEN** an audit event is recorded
- **AND** the event identifies the target user, verification purpose, and verified email address or safe email identifier
- **AND** it does not store raw verification tokens, token hashes, or verification links

#### Scenario: Email verification fails
- **WHEN** a verification attempt fails because the token is missing, invalid, expired, or otherwise rejected
- **THEN** an audit event is recorded
- **AND** the event identifies the target user when known, verification purpose, safe failure reason, and time
- **AND** it does not store the submitted raw token

#### Scenario: Pending email change is requested
- **WHEN** a verified user requests an account email change
- **THEN** an audit event is recorded
- **AND** the event identifies the actor, previous active email address or safe email identifier, pending email address or safe email identifier, and time
- **AND** it does not store verification secrets

#### Scenario: Pending email change is promoted
- **WHEN** a pending email address is verified and promoted to the active account email
- **THEN** an audit event is recorded
- **AND** the event identifies the target user, previous active email address or safe email identifier, new active email address or safe email identifier, and time

#### Scenario: Pending email change is cancelled
- **WHEN** a pending email change is cancelled
- **THEN** an audit event is recorded
- **AND** the event identifies the actor, target user, pending email address or safe email identifier, and time

#### Scenario: Registration is unavailable because email delivery is unavailable
- **WHEN** public registration is treated as disabled because email delivery is unavailable
- **THEN** an audit event MAY be recorded for administrative review
- **AND** the event does not expose provider credentials or raw provider internals

### Requirement: Audit logging records authentication and access security events
The audit logging capability SHALL record authentication and authorization events that are useful for account compromise investigation.

#### Scenario: Login succeeds
- **WHEN** a user signs in successfully
- **THEN** an audit event is recorded
- **AND** the event identifies the user and authentication method

#### Scenario: Login fails
- **WHEN** an authentication attempt fails
- **THEN** an audit event is recorded
- **AND** the event identifies the attempted method and safe failure context

#### Scenario: Blocked user is rejected
- **WHEN** a blocked user attempts to authenticate, refresh a session, or access an authenticated API
- **THEN** an audit event is recorded
- **AND** the event identifies the blocked user when known

#### Scenario: Admin-only access is rejected
- **WHEN** a non-admin attempts to access an admin-only operation
- **THEN** an audit event is recorded
- **AND** the event identifies the user, operation, and rejection reason

### Requirement: Audit logging records list and account lifecycle activity
The audit logging capability SHALL support the existing planned list and account lifecycle audit use cases, including member suggestion access and invite attempts that can affect privacy or account-enumeration risk.

#### Scenario: List membership changes
- **WHEN** a list member is invited, removed, or has their role changed
- **THEN** an audit event is recorded
- **AND** the event identifies the actor, target user, list, previous role, and new role where applicable

#### Scenario: Member suggestions are requested
- **WHEN** a user requests member suggestions for a list
- **THEN** an audit event is recorded
- **AND** the event identifies the actor, list, outcome, and number of suggestions returned
- **AND** the event does not store unrelated suggested-user personal data beyond what is needed for security review

#### Scenario: Unknown invite attempt is rejected
- **WHEN** a member invite is rejected because the submitted email does not match an account
- **THEN** an audit event is recorded
- **AND** the event identifies the actor, list, normalized or hashed submitted email, outcome, and rejection reason

#### Scenario: Invite rate limit is exceeded
- **WHEN** a member invite is rejected because the requester exceeded the allowed invite attempt rate
- **THEN** an audit event is recorded
- **AND** the event identifies the actor, list, rate-limit scope, outcome, and rejection reason

#### Scenario: Passkey is added or removed
- **WHEN** a user adds or removes a passkey from their account
- **THEN** an audit event is recorded
- **AND** the event identifies the user and credential identifier

#### Scenario: Account is deleted
- **WHEN** a user account is deleted by the user or through an admin operation
- **THEN** an audit event is recorded
- **AND** the event identifies the actor, deleted account, and deletion mode

### Requirement: Audit events avoid sensitive data
Audit events SHALL avoid storing secrets and unnecessary personal data while retaining enough context for security review.

#### Scenario: Event contains credential-related data
- **WHEN** an audit event concerns JWTs, refresh tokens, recovery links, passkeys, OAuth codes, or other credentials
- **THEN** the event stores only safe identifiers or hashes
- **AND** it does not store raw tokens, raw recovery URLs, raw authorization codes, or private credential material

#### Scenario: Event contains user-provided content
- **WHEN** an audit event concerns list, item, note, attachment, or profile content
- **THEN** the event stores only the minimum metadata required to understand the action
- **AND** it avoids storing full user-authored content unless explicitly required by a future requirement

### Requirement: Audit records are queryable by authorized users
The audit logging capability SHALL expose audit records only to users authorized to review them.

#### Scenario: Admin views instance audit records
- **WHEN** an admin requests instance-level audit records
- **THEN** the system returns paginated audit events visible to admins

#### Scenario: List member views list audit records
- **WHEN** a list member with sufficient list capability requests audit records for a list
- **THEN** the system returns paginated audit events for that list

#### Scenario: Unauthorized user requests audit records
- **WHEN** a user without sufficient permission requests audit records
- **THEN** the request is rejected
