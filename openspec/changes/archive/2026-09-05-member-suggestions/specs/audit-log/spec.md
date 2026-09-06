## MODIFIED Requirements

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
