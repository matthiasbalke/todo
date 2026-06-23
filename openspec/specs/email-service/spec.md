# email-service Specification

## Purpose

Define the future outbound email capability used by account administration, recovery, notifications, and other user communication flows.

## Requirements

### Requirement: Email service sends templated application emails
The email service SHALL send application emails from server-side templates using structured recipient, subject, and template data.

#### Scenario: Application sends an email
- **WHEN** an application feature requests an outbound email
- **THEN** the email service sends the message using a configured provider
- **AND** the message uses a named template and structured template variables

#### Scenario: Email provider is not configured
- **WHEN** an application feature requests an outbound email and no provider is configured
- **THEN** the email service reports delivery as unavailable
- **AND** the calling feature handles the unavailable delivery path without failing unrelated application behavior

#### Scenario: Email delivery fails
- **WHEN** the configured provider rejects or fails an email send request
- **THEN** the email service reports the failure to the calling feature
- **AND** the failure response does not expose provider credentials or raw provider internals to end users

### Requirement: Email service supports admin-initiated account recovery
The email service SHALL support sending passkey recovery links created by the admin area.

#### Scenario: Admin sends a recovery link by email
- **WHEN** an admin creates a passkey recovery link for a user and email delivery is enabled
- **THEN** the admin area can request delivery of the recovery link to the target user's email address
- **AND** the email explains that the link starts account recovery and expires after the configured lifetime

#### Scenario: Recovery email cannot be sent
- **WHEN** an admin creates a passkey recovery link and email delivery is unavailable or fails
- **THEN** the admin area preserves the manual recovery-link delivery path
- **AND** the admin can still copy the generated recovery URL for out-of-band delivery

#### Scenario: Recovery link is sent
- **WHEN** the email service accepts a recovery email for delivery
- **THEN** the admin area shows delivery status to the admin
- **AND** the system does not expose the recovery token in logs or audit events as a raw secret

### Requirement: Email service does not replace manual recovery link display
The email service SHALL supplement manual recovery-link delivery rather than making it the only recovery path.

#### Scenario: Email service is enabled
- **WHEN** an admin creates a recovery link
- **THEN** the admin area offers email delivery where allowed
- **AND** the admin area may still display or allow copying the recovery URL for manual delivery

#### Scenario: Email service is disabled
- **WHEN** an admin creates a recovery link
- **THEN** the admin area displays the recovery URL to the admin
- **AND** the system does not attempt to send email

### Requirement: Email delivery is auditable without storing secrets
Email delivery activity SHALL provide safe metadata for the future audit logging capability.

#### Scenario: Recovery email is requested
- **WHEN** an admin requests recovery-link email delivery
- **THEN** the email service exposes safe delivery metadata for audit logging
- **AND** the metadata identifies the message purpose, target user, recipient address, and delivery result
- **AND** it does not include the raw recovery URL or raw recovery token

#### Scenario: Email send fails
- **WHEN** email delivery fails
- **THEN** the email service exposes a safe failure category for audit logging
- **AND** it does not expose provider credentials, raw SMTP/API responses containing secrets, or full message body content

### Requirement: Email configuration is explicit
The email service SHALL require explicit configuration before sending outbound email.

#### Scenario: Provider configuration is missing
- **WHEN** no email provider configuration is present
- **THEN** the service remains in disabled mode
- **AND** application features that can operate manually continue to do so

#### Scenario: Sender identity is configured
- **WHEN** email sending is enabled
- **THEN** the service uses a configured sender identity
- **AND** the sender identity is not derived from user-controlled request data

#### Scenario: Application base URL is configured
- **WHEN** an email template includes an application link
- **THEN** the link uses a configured public application base URL
- **AND** the service does not derive public links from untrusted request headers
