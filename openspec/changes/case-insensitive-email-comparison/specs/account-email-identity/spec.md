## Purpose

Defines how user account email addresses behave as stable account identifiers across registration, setup, authentication lookup, profile updates, and future identity-provider linking.

## ADDED Requirements

### Requirement: Account email identity is case-insensitive
The system SHALL store email addresses without leading or trailing whitespace and SHALL treat email addresses as the same account identifier when their trimmed lower-case forms are equal.

#### Scenario: Registration uses an existing email with different casing
- **WHEN** a user starts account registration with an email address that differs only by surrounding whitespace or casing from an existing account email
- **THEN** the system treats the email as already registered
- **AND** no second account is created for that email identity

#### Scenario: Setup uses an existing email with different casing
- **WHEN** first-admin setup starts with an email address that differs only by surrounding whitespace or casing from an existing account email
- **THEN** the system treats the email as already registered or reuses the eligible setup account according to the existing setup flow
- **AND** no second account is created for that email identity

#### Scenario: Profile changes email to existing email with different casing
- **WHEN** a user updates their profile email to an address already used by another account after trimming and lower-case comparison
- **THEN** the request is rejected as a duplicate email
- **AND** the user's existing account email remains unchanged

#### Scenario: Profile stores trimmed email while preserving casing
- **WHEN** a user updates their profile email with leading or trailing whitespace and specific letter casing
- **THEN** the request stores the email without leading or trailing whitespace
- **AND** the stored email preserves the submitted letter casing

#### Scenario: Profile changes only casing of own email
- **WHEN** a user updates their profile email and the new value differs from their current email only by surrounding whitespace or casing
- **THEN** the request is allowed
- **AND** the stored email is updated to the submitted casing after trimming

#### Scenario: Passkey account lookup uses different casing
- **WHEN** WebAuthn account lookup receives an email address that differs only by surrounding whitespace or casing from a stored account email
- **THEN** the lookup resolves the existing account

#### Scenario: Future identity provider linking uses email identity
- **WHEN** a future identity provider flow links by email address
- **THEN** the flow uses the same trimmed lower-case email identity comparison as account registration and profile updates
