## Context

See `proposal.md` for motivation. The backend currently defines `app.email.public-base-url`, binds it through `EmailProperties.publicBaseUrl`, includes `publicBaseUrl` on email settings DTOs/domain objects, and lets `EmailSettingsService` read/write the runtime key `app.publicBaseUrl`. Separately, passkey recovery links are generated from `app.cors.allowed-origins`, creating a second source for public application URLs.

## Goals / Non-Goals

**Goals:**

- Make public base URL a direct app setting owned by `AppSettingsService`.
- Make `/settings/app` the admin API boundary for direct app settings such as `registrationEnabled` and `publicBaseUrl`.
- Remove public base URL from email settings update/response DTOs and email configuration objects.
- Keep `EmailSettingsService` scoped to SMTP/provider configuration only.
- Introduce a central application link service that builds absolute URLs from sealed route types and the configured public base URL.
- Use the application link service for passkey recovery URLs and future email-template links.

**Non-Goals:**

- Do not keep deployment or runtime compatibility for `app.email.public-base-url` or `email.publicBaseUrl`; the feature has not been deployed.
- Do not redesign unrelated admin user-management APIs.
- Do not build a frontend router abstraction; the link service only generates backend-owned absolute app links.

## Decisions

- Add app-level configuration binding for `app.public-base-url` and register it beside existing backend properties. This gives deployment defaults a clear app-level home. Alternative considered: keep the value under `EmailProperties` and inject it elsewhere; that preserves the wrong ownership.
- Move public base URL persistence into `AppSettingsService` with validation shared by admin settings updates and link generation. Alternative considered: create a separate `PublicBaseUrlService`; keeping it in app settings is simpler because registration is already an app-level runtime setting.
- Replace one-off app setting update endpoints with `/settings/app`, returning and accepting a cohesive app settings DTO containing `registrationEnabled` and `publicBaseUrl`. Alternative considered: leave `/settings/registration` and `/settings/public-base-url`; that keeps app settings scattered and makes future app settings harder to discover.
- Remove `publicBaseUrl` from `EmailSettingsUpdate`, `EmailConfiguration`, and email settings responses. Email settings should describe SMTP/provider state only. Application links belong at message composition or feature boundaries, not the provider configuration boundary.
- Add an `ApplicationLinkService` that depends on `AppSettingsService` and accepts sealed app route types, starting with a recovery route. A sealed route model keeps generated link usages searchable and forces route arguments to be encoded in one place. Alternative considered: accept raw path strings; that is easier initially but lets each caller invent path joining and encoding rules.
- Move passkey recovery URL generation from CORS-origin parsing to `ApplicationLinkService`. CORS controls browser access; it should not define public URLs embedded in user-facing links.

## Risks / Trade-offs

- Removing `publicBaseUrl` from email settings changes admin API/frontend payloads. Mitigation: update backend controller tests and frontend admin API tests together because this feature is not deployed.
- `/settings/app` broadens the current settings API shape. Mitigation: keep the DTO narrow and limited to direct app settings already supported by the backend.
- A sealed route model requires adding a type for each generated app link. Mitigation: start with only the recovery route and add routes when real callers need them.
- Public base URL validation now affects recovery link creation, not just email configuration. Mitigation: validate on settings save and provide a deployment default so link generation has a usable value in local development.

## Migration Plan

1. Deploy with `app.public-base-url` backed by the existing `APP_PUBLIC_BASE_URL` environment variable.
2. Remove reads and writes for `email.publicBaseUrl` and `app.email.public-base-url`; no persisted migration is required because the feature has not been deployed.
3. Update frontend/admin clients to use `/settings/app` for registration and public base URL, and `/settings/email` only for SMTP/provider settings.
4. Rollback is safe for deployments using `APP_PUBLIC_BASE_URL`; direct YAML users should use the new `app.public-base-url` key before rollout.
