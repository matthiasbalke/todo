## Context

The backend already persists runtime instance settings in `app_settings` through `AppSettingsService`, currently for `registration.enabled`. Admin APIs are grouped under `/api/admin`, and the frontend admin page already loads settings, usage stats, and users together.

The existing `email-service` spec defines future templated delivery behavior, recovery-link delivery, disabled mode, safe metadata, and explicit configuration. This change fills in the first concrete provider: SMTP. Spring Boot mail documentation for version 4 shows `spring.mail.*` properties for host, port, username, password, protocol, default encoding, SSL settings, and provider-specific JavaMail properties; Boot creates a `JavaMailSender` when the starter and `spring.mail.host` are available. The implementation should keep those deployment defaults visible and useful until an admin saves a runtime configuration snapshot.

## Goals / Non-Goals

**Goals:**

- Add SMTP email delivery without making any existing authentication, recovery, or admin flow depend on email availability.
- Preserve deployment-managed defaults through `spring.mail.*` while no runtime email configuration exists.
- Persist a complete runtime configuration snapshot after the first admin save so active values come from exactly one source.
- Keep secrets write-only from the admin API: clients can replace or clear credentials, but never read them back.
- Provide a small, stable backend email service interface for current and future callers such as email verification and stale-user deletion notices.
- Add admin UI controls that match the existing settings page style and save behavior, including shared toggles for enabling/disabling email delivery and SMTP authentication.

**Non-Goals:**

- Implement email verification, stale-user deletion notifications, or passkey-recovery email sending in this change.
- Add non-SMTP providers or provider-specific APIs.
- Add a full template editor or user-editable message content.
- Add background queueing/retry infrastructure beyond reporting the immediate delivery outcome.

## Decisions

### Use Spring Mail for SMTP transport

Add the Spring Boot mail starter and send through `JavaMailSender`/MIME messages. This keeps transport behavior aligned with Spring Boot 4 and avoids custom SMTP protocol code.

Alternative considered: direct Jakarta Mail setup. That would duplicate Boot configuration semantics and make default `spring.mail.*` support harder to reason about.

### Use a single active email configuration source

Represent deployment defaults from `spring.mail.*` plus app-specific defaults such as enabled state, authentication enabled state, sender identity, and public app base URL. If no runtime email configuration exists, expose and use those deployment values. Once an admin changes any email setting, persist a complete runtime configuration snapshot in `app_settings` and use only that snapshot for subsequent sends and admin reads. A reset-to-deployment action removes the runtime snapshot and returns the active source to deployment settings.

Alternative considered: per-field overlay where individual runtime keys override deployment defaults. That is flexible, but it creates confusing mixed-source states. Another alternative was copying deployment defaults into `app_settings` on startup; that makes environment changes surprising before any admin has intentionally changed email settings.

### Store runtime settings as individual keys

Use namespaced keys such as `email.enabled`, `email.auth.enabled`, `email.host`, `email.port`, `email.username`, `email.password`, `email.protocol`, `email.encryption`, `email.from`, `email.fromName`, and a marker such as `email.runtimeConfigured`. This follows the current `registration.enabled` shape and avoids adding a table that would only hold one row. Runtime settings should be treated as a complete group: save all runtime keys together and clear all runtime keys together when resetting to deployment.

Alternative considered: add a JSON blob setting. That reduces key count but makes validation, partial updates, migration, and future admin diffs less clear.

### Treat the SMTP password as write-only API state

Admin settings responses return whether an active password is set, not the password value. Updates should distinguish three password intents: keep existing, replace with a new value, or clear. If deployment settings are active and the admin keeps the existing password during the first save, the backend copies the deployment password into the new runtime snapshot without exposing it to the client. Test failures and delivery metadata must redact credentials and raw provider details that could contain secrets.

The admin UI should not expose the password intent enum directly. When a password is configured, the password field shows a masked placeholder. Leaving the field untouched keeps the active password; typing a value replaces it; editing it empty clears it when authentication is disabled and otherwise reports that a password is required. The client still sends the explicit backend password action derived from that interaction.

### Make authentication explicit and infer password actions

Use an explicit SMTP authentication toggle. When authentication is enabled, username and password are required before enabled email delivery can be persisted. When authentication is disabled, username and password are optional and the sender attempts SMTP without authentication.

Use an explicit password action in backend update requests, such as `KEEP`, `REPLACE`, or `CLEAR`, so an empty password value never has ambiguous meaning at the API boundary. `KEEP` preserves the active password, including copying a deployment password into the first runtime snapshot when deployment settings are active. `REPLACE` stores the submitted replacement password. `CLEAR` removes the stored password and is only valid for enabled delivery when SMTP authentication is disabled.

Alternative considered: show a password action dropdown in the admin UI. That mirrors the API exactly, but it feels awkward for administrators compared with the familiar masked-password-field interaction.

### Use Save and Discard for SMTP settings

Use an explicit Save/Discard workflow for SMTP settings. Admin edits should remain as a draft until the admin saves. Saving a valid draft persists a complete runtime snapshot; discarding reloads the active configuration and clears validation and dirty state.

If the draft is invalid, show validation feedback and do not persist a new snapshot. The previous active configuration remains in use until a valid draft is saved.

The email service enabled toggle and SMTP authentication toggle are part of this draft workflow rather than immediate-save controls. This avoids unclear partial-save behavior when toggles affect which fields are required.

Alternative considered: autosave settings as soon as each field becomes valid. That matches the existing registration toggle style, but SMTP configuration has too many cross-field dependencies and unclear edge cases for users.

### Reset to deployment is a confirmed secondary action

When the active source is runtime, show a secondary "Reset to deployment settings" action. Triggering it should ask for confirmation because it deletes the runtime snapshot, including any runtime SMTP password. After confirmation, remove the runtime settings as a group and reload the active deployment configuration.

If no deployment configuration is present, reset leaves email unavailable and the admin UI should make that clear. When the active source is already deployment, the reset action should be hidden or disabled.

Alternative considered: silently clear runtime settings when fields are blanked. That is too subtle for an operation that can discard a working SMTP configuration.

### Propagate default ports only before user port edits

When an admin selects STARTTLS and the port field has not been filled or edited, populate port `587`. When an admin selects SSL/TLS and the port field has not been filled or edited, populate port `465`. Once the admin has filled or edited the port field, changing encryption mode must preserve the explicit port value.

Alternative considered: always changing the port when encryption changes. That helps common cases but can erase intentional provider-specific ports.

### Support STARTTLS and implicit SSL/TLS only

Use STARTTLS for normal SMTP submission where the connection is upgraded before authentication or message transfer, and SSL/TLS for implicit TLS endpoints. Do not support an unencrypted mode for application-managed email delivery.

Keep the JavaMail protocol fixed to `smtp` in the admin-managed configuration. Do not expose protocol as an admin-editable field, because the supported outbound transport is SMTP-only and encryption mode already represents the meaningful administrator choice.

Alternative considered: allow no transport encryption. That matches the original issue text, but it is a poor default shape for credential-bearing SMTP and less useful for common providers that expect STARTTLS.

### Create a runtime-configured mail sender for sends

Keep Boot's auto-configured `JavaMailSender` useful for deployment-default-only setups, but construct or configure the sender from the resolved active settings when a runtime snapshot exists. Required timeouts should be set through JavaMail properties so failed providers do not block request threads indefinitely.

Alternative considered: mutating the singleton Boot sender after admin changes. That risks cross-request races and makes rollback to defaults brittle.

### Keep outbound email optional for callers

Expose results such as accepted, unavailable, and failed with safe failure categories. Callers must decide whether to fall back to manual behavior. That matches the current recovery-link spec and prevents this infrastructure change from breaking existing flows when no SMTP server is configured.

Alternative considered: throw transport exceptions directly. That would leak provider behavior across feature code and increases the chance of exposing raw SMTP details.

For admin-triggered test emails, include additional safe diagnostics with failed delivery results: a short failure category, an admin-facing message, optional sanitized detail, and an optional remediation hint. These diagnostics should be derived from known exception classes and configured non-secret fields such as host, port, and encryption mode. They must not include SMTP credentials, raw provider responses that may contain secrets, or message body content.

### Use Mailpit for E2E email capture

Add Mailpit to the E2E Docker Compose path as a test-only SMTP server and message capture API. E2E tests should configure the backend to send test email through Mailpit, drive the admin email settings UI in Playwright, then assert the captured message through Mailpit's HTTP API.

Use self-signed certificates in the E2E SMTP services so both STARTTLS and SSL/TLS paths are exercised. Generate or include an E2E-only root CA certificate, sign the Mailpit server certificates with it, and add that root CA to the backend container or JVM trust store for E2E runs. This keeps backend TLS validation production-like instead of adding a trust-all or test-only mail setting.

Since STARTTLS and implicit SSL/TLS cannot share the same Mailpit SMTP mode on a single port, run separate Mailpit endpoints or instances for each mode in the E2E stack and configure the backend/admin UI against each mode in dedicated test flows.

Mailpit is not a production dependency. It should be used only by local/CI E2E runs and any test-specific Docker Compose service should stay out of production deployment expectations.

Alternative considered: mock the backend email API in Playwright. That would verify frontend behavior but would not prove that the backend SMTP configuration, send path, and admin UI work together end to end.

## Risks / Trade-offs

- [Secrets stored in `app_settings`] -> Store only the necessary SMTP password, never return it through APIs, redact logs/errors, and document deployment-level database protection as the security boundary.
- [Request thread waits on a slow SMTP server] -> Configure connection, read, and write timeouts by default and allow deployment overrides through mail properties where appropriate.
- [Runtime settings and deployment defaults become confusing] -> Use exactly one active source and show source/status in admin settings: disabled, using deployment defaults, or using runtime snapshot.
- [Test email can be abused by admins to send arbitrary content] -> Use a fixed test template, require an authenticated admin, and allow only the recipient address to be supplied.
- [E2E SMTP tests become flaky or environment-dependent] -> Use Mailpit as a local captured-mail service in Docker Compose with self-signed certificates and poll its API with bounded retries rather than relying on any external provider.
- [Self-signed E2E certificates weaken production behavior] -> Trust an E2E-only root CA in the E2E runtime instead of adding backend trust-all behavior or production-visible test settings.
- [Immediate send failures vary by provider] -> Normalize failures into safe categories and keep detailed provider responses out of user-facing responses.

## Migration Plan

1. Add the mail dependency and default application configuration with email disabled unless complete settings are present.
2. Add runtime email settings keys without a destructive database migration; the existing `app_settings` table can store them.
3. Deploying the change leaves email disabled for existing instances unless `spring.mail.*` plus required app email defaults are configured or an admin saves a complete runtime settings snapshot.
4. Rollback is safe because ignored `app_settings` keys can remain in the database.
