## MODIFIED Requirements

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
