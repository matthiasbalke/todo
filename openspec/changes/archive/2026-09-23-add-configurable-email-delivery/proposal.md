## Why

The app already has account administration flows that need user communication, but outbound email is still only a future capability. Issue #178 adds the missing foundation: a configurable SMTP email service that can be used by email verification, stale-user deletion warnings, account recovery, and later notification features.

## What Changes

- Add a backend email delivery service backed by Spring Mail and `JavaMailSender`.
- Support SMTP delivery with configurable host, port, username, password, and encryption mode (`STARTTLS` or `SSL/TLS`), while keeping the SMTP protocol fixed internally.
- Use `spring.mail.*` properties as deployment defaults that are shown in the admin area when no runtime email configuration exists.
- Persist a complete runtime email configuration snapshot in `app_settings` after an admin saves any email setting, including a sender identity and an enabled/disabled state.
- Expose admin-only APIs and UI controls for viewing and updating email delivery configuration without restarting the backend.
- Provide safe status/test behavior so admins can enable or disable email delivery and send a fixed test message to a recipient address they provide without exposing credentials.
- Keep email sending disabled when required configuration is missing, and require callers to handle unavailable delivery explicitly.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `email-service`: Define SMTP-backed delivery, runtime configuration source precedence, encryption behavior, sender identity, disabled mode, and safe delivery/status semantics.
- `admin-area`: Extend admin settings so admins can manage outbound email configuration at runtime.

## Impact

- Backend dependencies: add Spring Boot mail support.
- Backend configuration: extend `application.yml` with safe `spring.mail.*` defaults and app-level email defaults where needed.
- Backend persistence: store complete runtime email settings in `app_settings`; avoid leaking secrets in responses, logs, errors, or audit-ready metadata.
- Backend APIs: extend admin settings endpoints or add admin email-settings endpoints for retrieving status, saving configuration, and optionally sending a test email.
- Frontend: extend admin settings types, API client, admin page, validation, and feedback states for email configuration.
- Tests: add backend integration/unit coverage for configuration precedence, disabled mode, SMTP sender setup, admin authorization, secret redaction, and frontend component/API tests for the admin settings UI.
