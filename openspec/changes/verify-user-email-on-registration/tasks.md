## 1. Persistence and Configuration

- [x] 1.1 Add a Flyway migration for `users.validated_at`, hashed `users.validation_token`, `users.validation_started`, pending email verification fields, and the `email_validation_timeout` app setting default; verify migration tests or backend startup apply the migration successfully and existing users are backfilled as verified.
- [x] 1.2 Update the `User` entity and repository queries for nullable verification and pending-email fields, including duplicate checks across active and pending email identities; verify backend compilation succeeds.
- [x] 1.3 Extend `AppSettingsService` with a positive-duration accessor for the email validation timeout defaulting to 30 minutes; verify unit or integration tests cover missing, valid, and invalid stored values.

## 2. Backend Verification Flow

- [x] 2.1 Extend authenticated user DTO/session responses with minimal non-secret email verification state and add a dedicated detailed verification-state response for UI decisions; verify auth/session and verification-state tests assert no raw tokens or token hashes are exposed.
- [x] 2.2 Implement an email verification service that creates random tokens, stores only token hashes and start timestamps, replaces existing tokens on resend, detects active/expired state while keeping expired pending email visible, validates submitted tokens by hashing them, and clears token fields after success; verify service or integration tests cover success, missing token, invalid token, expired token, already verified accounts, token replacement, expired pending visibility, and no raw-token persistence.
- [ ] 2.3 Add authenticated API endpoints for reading verification state, requesting a verification email, and submitting a verification token; verify controller integration tests cover response codes and safe error messages.
- [ ] 2.4 Add centralized backend enforcement for unverified authenticated sessions that allows only refresh, logout, safe own-profile read, verification-state, request-email, submit-token, and necessary pending-email cancellation endpoints; verify representative integration tests show allowed endpoints pass and lists, list groups, SSE/list events, items, categories, today, admin, account mutation, preferences, passkey management, deletion preview, and account deletion return `403 EMAIL_VERIFICATION_REQUIRED`.
- [ ] 2.5 Mark setup-created first admin accounts as verified immediately and make public registration unavailable when email delivery is unavailable without exposing the reason; verify setup/auth tests cover bootstrap admin access, generic disabled-registration responses, and no user creation when email is unavailable.
- [ ] 2.6 Change profile email updates so new email identities create pending email verification instead of immediately replacing the active account email; verify tests cover active email preservation before verification, pending email not used for display/notifications before verification, promotion after verification, duplicate active email rejection, duplicate pending email rejection, cancellation, and expiration.

## 3. Verification Email Delivery

- [x] 3.1 Extend `ApplicationLinkService` with an email verification route using `/verify-email?validation_token=...`; verify link-generation tests cover token encoding and configured public base URL usage.
- [x] 3.2 Add verification email composition through the existing email delivery service with explanatory text, manual token, and verification link for registration and pending-email-change flows, plus an email-change notice to the current verified email and no success email after promotion; verify email tests assert subject/body essentials, correct recipient selection, no success email, and no logging or returning of the token from API responses.
- [x] 3.3 Map unavailable or failed email delivery into safe verification-flow errors; verify tests cover disabled email and provider failure without exposing SMTP internals.

## 4. Frontend Routing and Verification UI

- [x] 4.1 Add shared frontend route constants or helpers for the verified landing route and email verification route; verify existing route-load tests use the shared destinations.
- [x] 4.2 Update root, auth, and authenticated app layout loads to route unverified users to the verification flow while preserving setup-required and backend-startup precedence; verify route-load tests cover verified, unverified, unauthenticated, startup, and setup-required outcomes.
- [x] 4.3 Add frontend API client functions and types for verification state, request-email, and submit-token operations; verify API client tests cover success and error parsing.
- [x] 4.4 Build the `/verify-email` page for request-email, manual token entry, tokenized-link auto-submit, expired-token, invalid-token, delivery-failure, pending-email-change success, and registration verification success states; verify component/page tests cover each state and that no normal app content is shown for unverified users.
- [x] 4.5 Refresh frontend auth state after successful verification and redirect to the verified landing route; verify tests show the user reaches `/lists` only after refreshed verified state.
- [x] 4.6 Update the account profile UI to show current verified email, pending email status, resend, and cancel controls for email changes; verify tests cover pending email display and that active email remains unchanged until verification.

## 5. End-to-End and Regression Coverage

- [ ] 5.1 Add backend integration coverage for registration creating unverified users while preserving access for migrated existing users and setup-created admins; verify `cd backend && ./gradlew test` passes for the affected auth tests.
- [x] 5.2 Add frontend unit coverage for registration/login returning unverified users and verification routing; verify `cd frontend && bun run check` and the affected Vitest tests pass.
- [ ] 5.3 Add or update Playwright coverage for register -> blocked from app -> request verification -> read token/link from Mailpit or test SMTP -> submit token/link -> reach app; verify the targeted e2e spec passes against the configured HTTPS deployment.
- [ ] 5.4 Update E2E fixture/admin storage-state workflows so non-verification tests create or select verified users directly; verify existing lists/items/categories/account E2E helpers remain fast and do not depend on email verification.
- [ ] 5.5 Add or update E2E coverage for email change -> active email remains displayed/contactable -> pending email receives verification -> verify pending email -> new email becomes active account email while existing passkey login still works; verify the targeted e2e spec passes against the configured HTTPS deployment.
- [ ] 5.6 After the core verification and pending-email flows are implemented, add browser-side `PublicKeyCredential.signalCurrentUserDetails()` where supported after email/display-name changes; verify unsupported browsers continue without errors and supporting browser tests or mocks receive the updated account details.
- [ ] 5.7 Add future audit-event integration points for verification requested, verification succeeded, verification failed, pending email requested, pending email promoted, pending email cancelled, and registration unavailable due to email delivery configuration; verify emitted metadata excludes raw tokens, token hashes, links, provider credentials, and full email bodies when audit logging is implemented.
- [x] 5.8 Run OpenSpec validation for `verify-user-email-on-registration`; verify the change validates successfully before implementation is considered ready.
