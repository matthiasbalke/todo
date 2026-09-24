## MODIFIED Requirements

### Requirement: Account email identity is case-insensitive
The system SHALL store active and pending email addresses without leading or trailing whitespace and SHALL treat email addresses as the same account identifier when their trimmed lower-case forms are equal.

#### Scenario: Registration uses an existing email with different casing
- **WHEN** a user starts account registration with an email address that differs only by surrounding whitespace or casing from an existing account email
- **THEN** the system treats the email as already registered
- **AND** no second account is created for that email identity

#### Scenario: Registration uses another account's pending email with different casing
- **WHEN** a user starts account registration with an email address that differs only by surrounding whitespace or casing from another account's pending email address
- **THEN** the system treats the email as unavailable
- **AND** no second account is created for that email identity

#### Scenario: Setup uses an existing email with different casing
- **WHEN** first-admin setup starts with an email address that differs only by surrounding whitespace or casing from an existing account email
- **THEN** the system treats the email as already registered or reuses the eligible setup account according to the existing setup flow
- **AND** no second account is created for that email identity

#### Scenario: Profile changes email to existing email with different casing
- **WHEN** a user updates their profile email to an address already used by another account after trimming and lower-case comparison
- **THEN** the request is rejected as a duplicate email
- **AND** the user's existing account email remains unchanged
- **AND** no pending email change is created

#### Scenario: Profile changes email to another pending email with different casing
- **WHEN** a user updates their profile email to an address already pending verification for another account after trimming and lower-case comparison
- **THEN** the request is rejected as a duplicate email
- **AND** the user's existing account email remains unchanged
- **AND** no pending email change is created

#### Scenario: Profile stores trimmed email while preserving casing
- **WHEN** a user updates their profile email with leading or trailing whitespace and specific letter casing
- **THEN** the system stores the active or pending email without leading or trailing whitespace
- **AND** the stored active or pending email preserves the submitted letter casing

#### Scenario: Profile changes only casing of own email
- **WHEN** a user updates their profile email and the new value differs from their current email only by surrounding whitespace or casing
- **THEN** the request is allowed
- **AND** the stored email is updated to the submitted casing after trimming
- **AND** the email remains verified
- **AND** no pending email change is created

#### Scenario: Profile changes email to a new identity
- **WHEN** a verified user updates their profile email to an address that is a new email identity after trimming and lower-case comparison
- **THEN** the system keeps the current verified email as the active account email
- **AND** it stores the new email address as pending verification
- **AND** it starts the pending email verification flow for the new address

#### Scenario: Pending email is verified
- **WHEN** a user successfully verifies a pending email address
- **THEN** the system promotes the pending email address to the active account email
- **AND** it clears the pending email verification state
- **AND** the previous email address is no longer the active account contact identity

#### Scenario: Passkey account lookup uses different casing
- **WHEN** WebAuthn account lookup receives an email address that differs only by surrounding whitespace or casing from a stored active account email
- **THEN** the lookup resolves the existing account

#### Scenario: Passkey authentication occurs during pending email change
- **WHEN** a user authenticates with an existing passkey while an email change is pending
- **THEN** the passkey SHALL remain associated with the same account
- **AND** the pending email address SHALL NOT replace the active account email until verification succeeds

#### Scenario: Future identity provider linking uses email identity
- **WHEN** a future identity provider flow links by email address
- **THEN** the flow uses the same trimmed lower-case email identity comparison as account registration and profile updates
