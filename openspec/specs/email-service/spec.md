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

### Requirement: Email service sends through SMTP
The email service SHALL support SMTP as an outbound provider for application emails.

#### Scenario: SMTP delivery is configured
- **WHEN** an application feature requests an outbound email and SMTP delivery is enabled with complete configuration
- **THEN** the email service sends the message through the configured SMTP server
- **AND** the delivery result reports whether the message was accepted for delivery

#### Scenario: SMTP authentication is configured
- **WHEN** SMTP authentication is enabled and username and password are configured
- **THEN** the email service authenticates to the SMTP server with those credentials
- **AND** the credentials are not exposed in responses, logs, or delivery metadata

#### Scenario: SMTP authentication is omitted
- **WHEN** SMTP authentication is disabled
- **THEN** the email service attempts delivery without SMTP authentication

### Requirement: Email service supports SMTP encryption modes
The email service SHALL allow SMTP delivery to be configured with STARTTLS or SSL/TLS encryption.

#### Scenario: SSL/TLS encryption is configured
- **WHEN** email delivery is enabled with SSL/TLS encryption
- **THEN** the email service connects to the SMTP server using the configured secure transport mode

#### Scenario: STARTTLS encryption is configured
- **WHEN** email delivery is enabled with STARTTLS encryption
- **THEN** the email service connects to the SMTP server and upgrades the connection using STARTTLS before sending the message

#### Scenario: Unsupported encryption mode is submitted
- **WHEN** an administrator submits an unsupported email encryption mode
- **THEN** the configuration change is rejected
- **AND** the previously active email configuration remains unchanged

### Requirement: Email configuration can be tested safely
The email service SHALL support a safe test-delivery path for administrators without exposing provider secrets.

#### Scenario: Test email succeeds
- **WHEN** an administrator sends a test email to a recipient address using complete email configuration
- **THEN** the system attempts to send a test message
- **AND** the test message is addressed to the requested recipient address
- **AND** the administrator receives a success result when the provider accepts the message

#### Scenario: Test email fails
- **WHEN** the test email cannot be delivered
- **THEN** the administrator receives a safe failure message
- **AND** the response MAY include safe diagnostic detail and a remediation hint
- **AND** the response does not include SMTP credentials, raw provider responses that contain secrets, or full message body content

#### Scenario: Test email is requested while disabled
- **WHEN** an administrator requests a test email while email delivery is disabled or incomplete
- **THEN** the system reports that email delivery is unavailable
- **AND** no SMTP connection is attempted

### Requirement: Email configuration is explicit
The email service SHALL require explicit complete configuration before sending outbound email, and SHALL use either deployment configuration or a complete runtime configuration snapshot as the active source.

#### Scenario: Provider configuration is missing
- **WHEN** no complete email provider configuration is present
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

#### Scenario: Deployment defaults configure email
- **WHEN** complete email defaults are provided by deployment configuration and no runtime email settings exist
- **THEN** the email service uses those deployment defaults for outbound delivery

#### Scenario: Runtime settings are saved
- **WHEN** an administrator saves runtime email settings
- **THEN** the system persists a complete runtime email configuration snapshot
- **AND** subsequent email delivery uses the runtime snapshot without backend downtime
- **AND** deployment defaults are no longer mixed with runtime values

#### Scenario: Complete SMTP configuration is required
- **WHEN** email delivery is enabled
- **THEN** host, port, encryption mode, and sender identity are required
- **AND** SMTP authentication enabled state is required

#### Scenario: Authenticated SMTP configuration is required
- **WHEN** email delivery is enabled with SMTP authentication enabled
- **THEN** SMTP username and password are required

#### Scenario: Unauthenticated SMTP configuration is allowed
- **WHEN** email delivery is enabled with SMTP authentication disabled
- **THEN** SMTP username and password are not required

#### Scenario: Deployment password is kept on first runtime save
- **WHEN** deployment configuration includes an SMTP password and no runtime email settings exist
- **AND** an administrator saves runtime email settings without replacing or clearing the SMTP password
- **THEN** the system copies the deployment SMTP password into the runtime configuration snapshot
- **AND** the SMTP password is not exposed to the administrator

#### Scenario: Runtime settings are reset
- **WHEN** an administrator resets runtime email settings
- **THEN** the runtime email configuration snapshot is removed
- **AND** subsequent email delivery uses complete deployment defaults when available

#### Scenario: Runtime settings disable email
- **WHEN** an administrator disables email delivery at runtime
- **THEN** the email service remains unavailable for outbound delivery
- **AND** application features that can operate manually continue to do so
