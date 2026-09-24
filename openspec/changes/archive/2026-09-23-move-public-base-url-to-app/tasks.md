## 1. App Settings Boundary

- [x] 1.1 Add app-level backend properties for `app.public-base-url`, register them for configuration binding, move the YAML key from `app.email` to `app`, and verify a binding or service test resolves the default and a non-default `APP_PUBLIC_BASE_URL`.
- [x] 1.2 Move public base URL runtime ownership into `AppSettingsService` alongside registration state, and verify service tests cover deployment fallback, runtime save, validation, and unchanged settings after invalid updates.
- [x] 1.3 Remove `email.publicBaseUrl` legacy runtime fallback and verify tests confirm only `app.publicBaseUrl` is read or written for public base URL.
- [x] 1.4 Add admin app settings request/response DTOs for `registrationEnabled` and `publicBaseUrl`, expose them through `/settings/app`, and verify controller tests cover admin success plus non-admin and unauthenticated rejection.
- [x] 1.5 Replace existing registration/public-base-url-specific admin update usage with `/settings/app`, and verify registration checks still use the updated value without backend downtime.

## 2. Email Settings Separation

- [x] 2.1 Remove `publicBaseUrl` from `EmailProperties`, `EmailSettingsUpdate`, `EmailConfiguration`, and email settings response/update DTOs, and verify no backend production code references `emailProperties.publicBaseUrl` or email DTO public base URL fields.
- [x] 2.2 Update `EmailSettingsService` so it only resolves SMTP/provider settings, and verify email settings service tests cover deployment/runtime/reset behavior without public base URL assertions.
- [x] 2.3 Update email configuration validation so public base URL is not required for email provider configuration, and verify enabled email settings validation no longer reports public URL errors.
- [x] 2.4 Update frontend admin email settings types/forms to remove public base URL from email payloads, and verify frontend tests cover the new email settings payload shape.

## 3. Application Link Generation

- [x] 3.1 Add a sealed app route model starting with the recovery route, and verify route argument encoding with focused unit tests.
- [x] 3.2 Add an application link service that uses `AppSettingsService` public base URL plus sealed routes to return absolute URLs, and verify tests cover base URL joining without double slashes or unencoded route arguments.
- [x] 3.3 Update passkey recovery URL generation to use the application link service instead of `app.cors.allowed-origins`, and verify recovery service/controller tests assert generated URLs use `app.publicBaseUrl`.
- [x] 3.4 Remove public-link generation helpers based on CORS origins, and verify no backend production code derives app URLs from `app.cors.allowed-origins`.

## 4. Frontend Admin Settings

- [x] 4.1 Update the frontend admin API client/types so app settings are loaded and saved through `/settings/app`, and verify API tests cover request paths and payload shapes.
- [x] 4.2 Update the admin settings UI so registration and public base URL are app settings, while email settings only show provider fields, and verify component tests cover editing/saving both groups independently.

## 5. Verification

- [x] 5.1 Run `cd backend && ./gradlew test --tests "*AppSettingsServiceTest" --tests "*EmailSettingsServiceTest" --tests "*AdminControllerEmailTest" --tests "*PasskeyRecoveryServiceTest"` and verify all targeted backend tests pass.
- [x] 5.2 Run `cd backend && ./gradlew test` and verify the full backend test suite passes.
- [x] 5.3 Run `cd frontend && bun run check` and verify Svelte type-checking passes after the API shape change.
- [x] 5.4 Run `cd frontend && bun run test -- --run` and verify frontend unit tests pass.
- [x] 5.5 Run `openspec validate move-public-base-url-to-app --strict` and verify the change passes validation.
