# list-member-management Specification

## Purpose

Defines how list memberships are shown and managed, including suggestion privacy, invite email entry, invitation errors, and human-readable role presentation.

## Requirements

### Requirement: Member suggestions use the current user's shared-list contacts
The system SHALL provide invite suggestions for users who share at least one list with the authenticated user.

#### Scenario: Existing shared member is suggested on another list
- **WHEN** an owner opens member management for a list that does not include a user who shares a different list with that owner
- **THEN** that shared user is available as an invite suggestion

#### Scenario: Current-list members are excluded from suggestions
- **WHEN** a user already belongs to the list being managed
- **THEN** that user is not available as an invite suggestion for that list

#### Scenario: Indirect contacts are not suggested
- **WHEN** another member has contacts from lists that the authenticated user does not belong to
- **THEN** those contacts are not available as invite suggestions to the authenticated user

### Requirement: Member suggestions protect membership access rules
The system SHALL only expose member suggestions to authenticated owners of the target list.

#### Scenario: Non-owner member requests suggestions
- **WHEN** an authenticated editor or viewer requests invite suggestions for a list
- **THEN** the request is rejected as forbidden

#### Scenario: Non-member requests suggestions
- **WHEN** an authenticated user who is not a member of the target list requests invite suggestions
- **THEN** the request is rejected as forbidden or not found according to the existing list access behavior

### Requirement: Invite email entry accepts suggestions and arbitrary account emails
The membership dialog SHALL let owners choose a suggested contact or type an email address that is not present in the suggestion list.
Suggestion-aware invite email entry implemented as a shared frontend component SHALL be included in the development component catalog.

#### Scenario: Owner selects a suggested contact
- **WHEN** an owner selects a suggested contact and submits the invite
- **THEN** the system invites the selected user's email with the chosen role

#### Scenario: Owner types an unsuggested email
- **WHEN** an owner types a valid email address that is not present in the suggestions and submits the invite
- **THEN** the system attempts to invite that email with the chosen role

#### Scenario: Shared invite control appears in the component catalog
- **WHEN** a suggestion-aware member invite email control is implemented as a shared component
- **THEN** the components showcase includes an example with suggestions
- **AND** the showcase includes an example that accepts an arbitrary typed email

### Requirement: Invite attempts avoid account enumeration
The system SHALL protect arbitrary invite-by-email attempts from being used to efficiently determine whether an email address belongs to an existing account.

#### Scenario: Owner invites a missing account
- **WHEN** an owner submits an invite for an email address with no matching user account
- **THEN** the dialog shows a clear invite failure message that does not confirm whether the email is registered
- **AND** the dialog does not show a generic permission error for this case

#### Scenario: Owner repeatedly submits arbitrary invite emails
- **WHEN** an owner exceeds the allowed rate of invite attempts
- **THEN** additional invite attempts are rejected with a rate-limit response
- **AND** the dialog tells the owner to wait before trying again

### Requirement: Membership roles are displayed as regular text
The membership dialog SHALL display role labels using sentence-style role text rather than all-uppercase enum values.

#### Scenario: Existing member role label
- **WHEN** the dialog displays a member with role `OWNER`, `EDITOR`, or `VIEWER`
- **THEN** the displayed role text is `Owner`, `Editor`, or `Viewer`

#### Scenario: Role selection labels
- **WHEN** the dialog displays role choices for adding or changing a member
- **THEN** each role choice is displayed as `Owner`, `Editor`, or `Viewer`
