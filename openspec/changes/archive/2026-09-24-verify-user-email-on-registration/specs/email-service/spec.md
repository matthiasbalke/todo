## ADDED Requirements

### Requirement: Email service sends account verification emails
The email service SHALL support sending account verification emails that allow a registered user to verify control of their email address.

#### Scenario: Verification email is sent
- **WHEN** an unverified account requests email verification and email delivery is enabled
- **THEN** the email service SHALL send a verification email to the account email address
- **AND** the message SHALL include explanatory text, the manual verification token, and an application verification link containing the token

#### Scenario: Verification email link is composed
- **WHEN** a verification email template includes an application verification link
- **THEN** the message composition SHALL use the application link generator to produce the link
- **AND** it SHALL NOT derive the public application URL from untrusted request headers

#### Scenario: Verification email cannot be sent
- **WHEN** email delivery is unavailable or fails while sending a verification email
- **THEN** the email service SHALL report the delivery failure to the verification flow
- **AND** the failure response SHALL NOT expose provider credentials or raw provider internals to end users

#### Scenario: Verification email delivery metadata is produced
- **WHEN** a verification email send is requested
- **THEN** the email service SHALL expose safe delivery metadata identifying the message purpose, target user, recipient address, and delivery result
- **AND** the metadata SHALL NOT include the raw verification token or full message body content

### Requirement: Email service sends email-change notices
The email service SHALL support notifying the current verified email address when an account email change is requested.

#### Scenario: Email change notice is sent
- **WHEN** a verified user requests an account email change and email delivery is enabled
- **THEN** the email service SHALL send a notice to the current verified email address
- **AND** the message SHALL explain that an email change was requested
- **AND** the message SHALL NOT include the raw verification token for the pending email address

#### Scenario: Pending email is verified
- **WHEN** a pending email address is successfully verified and promoted to the active account email
- **THEN** the email service SHALL NOT send a separate success email
- **AND** the application SHALL rely on the verification success screen for confirmation
