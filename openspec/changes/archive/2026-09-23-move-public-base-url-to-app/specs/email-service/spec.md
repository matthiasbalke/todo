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
- **THEN** the message composition uses the application link generator to produce the link
- **AND** email provider settings do not accept, return, store, or validate the public application base URL
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
