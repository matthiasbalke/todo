## ADDED Requirements

### Requirement: Admin users can manage email delivery settings at runtime
The admin area SHALL allow administrators to view and update outbound email delivery settings without restarting the deployment.

#### Scenario: Admin views email settings
- **WHEN** an administrator opens admin settings
- **THEN** the current email delivery enabled state is displayed
- **AND** the enabled state is editable through a toggle control
- **AND** the SMTP authentication enabled state is displayed and editable through a toggle control
- **AND** the active configuration source is displayed as deployment or runtime
- **AND** non-secret email configuration values are displayed
- **AND** transport protocol internals such as JavaMail protocol are not editable in the admin form
- **AND** stored SMTP passwords are never returned in plain text

#### Scenario: Admin saves email settings
- **WHEN** an administrator saves valid email delivery settings
- **THEN** a complete runtime email configuration snapshot is persisted
- **AND** subsequent outbound email attempts use the updated settings without backend downtime

#### Scenario: Admin edits email settings before saving
- **WHEN** an administrator changes email settings in the admin UI
- **THEN** the changed values are treated as a draft
- **AND** outbound email continues to use the previously active configuration until the draft is saved

#### Scenario: Admin discards email settings draft
- **WHEN** an administrator discards draft email setting changes
- **THEN** the draft values are replaced with the active configuration values
- **AND** no runtime email configuration snapshot is changed

#### Scenario: Admin saves first runtime change from deployment settings
- **WHEN** deployment email settings are active
- **AND** an administrator changes or defines any email setting
- **AND** saves the draft
- **THEN** all active email settings are persisted as runtime settings
- **AND** subsequent admin views identify the email configuration source as runtime

#### Scenario: Admin enables SMTP authentication
- **WHEN** an administrator enables SMTP authentication
- **THEN** SMTP username and password become required before enabled email settings can be persisted

#### Scenario: Admin disables SMTP authentication
- **WHEN** an administrator disables SMTP authentication
- **THEN** SMTP username and password are no longer required for enabled email settings

#### Scenario: Admin changes encryption mode with empty port
- **WHEN** an administrator selects STARTTLS or SSL/TLS encryption
- **AND** the port field has not been filled or edited by the administrator
- **THEN** the port field is populated with the default port for the selected encryption mode

#### Scenario: Admin changes encryption mode after editing port
- **WHEN** an administrator selects STARTTLS or SSL/TLS encryption
- **AND** the port field has already been filled or edited by the administrator
- **THEN** the existing port field value is preserved

#### Scenario: Admin clears stored SMTP password
- **WHEN** an administrator edits the SMTP password field to empty while SMTP authentication is disabled
- **THEN** subsequent email delivery no longer uses the previous stored password
- **AND** the previous password is not recoverable through the admin API

#### Scenario: Admin leaves active SMTP password unchanged
- **WHEN** an administrator updates email settings without editing the SMTP password field
- **THEN** the active SMTP password remains active in the persisted runtime snapshot
- **AND** the API response still does not expose the password

#### Scenario: Admin replaces active SMTP password
- **WHEN** an administrator enters a new value in the SMTP password field and saves email settings
- **THEN** subsequent email delivery uses the replacement password
- **AND** the API response still does not expose the password

#### Scenario: Admin resets email settings to deployment source
- **WHEN** an administrator resets email settings to deployment configuration
- **THEN** runtime email settings are removed
- **AND** subsequent admin views display deployment settings when deployment configuration is present

#### Scenario: Non-admin requests email settings
- **WHEN** a non-admin requests email delivery settings
- **THEN** the request is rejected

#### Scenario: Unauthenticated user requests email settings
- **WHEN** an unauthenticated user requests email delivery settings
- **THEN** the request is rejected

### Requirement: Admin users can test email delivery
The admin area SHALL allow administrators to send a test email to a provided recipient address using the active email configuration.

#### Scenario: Admin sends test email
- **WHEN** an administrator requests a test email to a recipient address
- **THEN** the system attempts delivery using the active email configuration
- **AND** the recipient is the requested address
- **AND** the administrator receives a delivery result

#### Scenario: Admin test email fails with diagnostics
- **WHEN** an administrator requests a test email and the delivery attempt fails
- **THEN** the admin area displays the safe failure message
- **AND** safe diagnostic detail and a remediation hint are displayed when provided by the backend
- **AND** SMTP credentials and raw secret-bearing provider responses are not displayed

#### Scenario: Non-admin sends test email
- **WHEN** a non-admin requests a test email
- **THEN** the request is rejected

#### Scenario: Unauthenticated user sends test email
- **WHEN** an unauthenticated user requests a test email
- **THEN** the request is rejected
