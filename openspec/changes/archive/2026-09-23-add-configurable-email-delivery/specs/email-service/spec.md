## ADDED Requirements

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

## MODIFIED Requirements

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
