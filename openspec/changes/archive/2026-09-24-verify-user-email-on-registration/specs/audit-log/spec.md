## ADDED Requirements

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
