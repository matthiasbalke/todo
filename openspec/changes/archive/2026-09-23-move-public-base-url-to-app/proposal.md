## Why

The backend still treats the public application base URL as part of email configuration, even though the value identifies the Todo instance itself. This blurs app settings, email provider settings, and application link generation, and it already causes recovery links to derive their public URL from CORS origins instead of a dedicated app URL setting.

## What Changes

- Move deployment binding for the public application base URL from `app.email.public-base-url` to an app-level `app.public-base-url`.
- Keep `APP_PUBLIC_BASE_URL` as the environment variable for deployment configuration.
- Move runtime ownership of `app.publicBaseUrl` into `AppSettingsService`; do not retain or read `email.publicBaseUrl`.
- Make `/settings/app` the admin API boundary for direct app settings, including `registrationEnabled` and `publicBaseUrl`.
- Remove public base URL fields from email settings update/response DTOs and from email configuration domain objects.
- Keep `EmailSettingsService` focused on SMTP/provider settings only.
- Add an application link service that builds absolute URLs from sealed app route types and the configured public base URL.
- Use the application link service for passkey recovery URL generation and future email-template links.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `admin-area`: Move direct app settings under `/settings/app`, including registration and public base URL, and require recovery links to use the configured public base URL.
- `email-service`: Remove public base URL ownership from email settings and keep email configuration limited to SMTP/provider settings.

## Impact

- Backend configuration: `application.yml` moves `public-base-url` from `app.email` to `app`.
- Backend services: `AppSettingsService` owns public base URL persistence/resolution; `EmailSettingsService` no longer reads, writes, validates, or returns it.
- Backend link generation: add an application link service with sealed route types and use it for passkey recovery URLs.
- Backend APIs: replace app-setting-specific update endpoints with `/settings/app`; keep `/settings/email` scoped to email provider settings.
- Frontend/admin API types: split app settings DTOs from email settings DTOs.
- Tests: update app settings, email settings, admin controller, recovery link, and link-generation coverage.
