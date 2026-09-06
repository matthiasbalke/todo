## MODIFIED Requirements

### Requirement: Member suggestions use the current user's shared-list contacts
The system SHALL provide invite suggestions for users who share at least one list with the authenticated user.

#### Scenario: Existing shared member is suggested on another list
- **WHEN** an owner opens member management for a list that does not include a user who shares a different list with that owner
- **THEN** that shared user is available as an invite suggestion

#### Scenario: Current-list members are excluded from suggestions
- **WHEN** a user already belongs to the list being managed
- **THEN** that user is not available as an invite suggestion for that list

#### Scenario: Current-list members are excluded when email formatting differs
- **WHEN** a suggestion email differs from a loaded current-list member email only by surrounding whitespace or casing
- **THEN** that user is not available as an invite suggestion for that list

#### Scenario: Indirect contacts are not suggested
- **WHEN** another member has contacts from lists that the authenticated user does not belong to
- **THEN** those contacts are not available as invite suggestions to the authenticated user

### Requirement: Invite email entry accepts suggestions and arbitrary account emails
The membership dialog SHALL let owners choose a suggested contact or type an email address that is not present in the suggestion list.
Suggestion-aware invite email entry implemented as a shared frontend component SHALL be included in the development component catalog.

#### Scenario: Owner selects a suggested contact
- **WHEN** an owner selects a suggested contact and submits the invite
- **THEN** the system invites the selected user's email with the chosen role

#### Scenario: Owner types an unsuggested email
- **WHEN** an owner types a valid email address that is not present in the suggestions and submits the invite
- **THEN** the system attempts to invite that email with the chosen role

#### Scenario: Owner types account email with different casing
- **WHEN** an owner types a valid account email whose trimmed lower-case form matches a stored account email
- **THEN** the system invites the matching account with the chosen role

#### Scenario: Owner types current member email with different formatting
- **WHEN** an owner types an email that differs only by surrounding whitespace or casing from a current list member's email
- **THEN** the system rejects the invite as an existing member

#### Scenario: Shared invite control appears in the component catalog
- **WHEN** a suggestion-aware member invite email control is implemented as a shared component
- **THEN** the components showcase includes an example with suggestions
- **AND** the showcase includes an example that accepts an arbitrary typed email
