## MODIFIED Requirements

### Requirement: Invite email entry accepts suggestions and arbitrary account emails
The membership dialog SHALL let owners choose a suggested contact or type an email address that is not present in the suggestion list.
Suggestion-aware invite email entry implemented as a shared frontend component SHALL be included in the development component catalog.
The suggestion-aware invite email entry SHALL expose matching suggestions while the owner types, through controls that can be operated by touch/mobile browsers without relying on native datalist suggestion UI.

#### Scenario: Owner selects a suggested contact
- **WHEN** an owner selects a suggested contact and submits the invite
- **THEN** the system invites the selected user's email with the chosen role

#### Scenario: Owner selects a suggested contact on mobile
- **WHEN** an owner opens the membership dialog on a mobile browser and starts typing an email or display-name fragment that matches a suggested contact
- **THEN** the dialog shows a selectable suggestion for that contact
- **AND** activating the suggestion fills the invite email field with that suggested contact's email
- **AND** submitting the invite invites the selected user's email with the chosen role

#### Scenario: Mobile behavior is not only viewport dependent
- **WHEN** an owner uses a real mobile browser rather than only a desktop browser resized to a mobile-width viewport
- **THEN** matching member invite suggestions remain visible and selectable while typing
- **AND** the owner can still ignore suggestions and submit a typed valid email

#### Scenario: Owner selects a suggested contact by pointer activation
- **WHEN** an owner activates a suggested contact with pointer or touch input
- **THEN** the invite email field is filled with that suggested contact's email
- **AND** submitting the invite invites the selected user's email with the chosen role

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
