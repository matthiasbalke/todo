## Context

The backend already stores users in the `users` table, issues JWT/refresh-token sessions through `AuthSessionService`, exposes the current account shape through `AuthUserDto`, persists instance settings through `AppSettingsService`, and sends outbound messages through `EmailDeliveryService`. The frontend restores sessions in `frontend/src/lib/stores/auth.svelte.ts`, routes `/` and `/auth` from session state, and gates the authenticated route group in `frontend/src/routes/(app)/+layout.ts`.

Existing email support is intentionally explicit: delivery may be disabled, links are composed through `ApplicationLinkService`, and safe failure messages are returned without exposing SMTP internals. The verification flow should follow the same pattern.

## Goals / Non-Goals

**Goals:**
- Make verification status part of the authenticated user/session model so frontend routing can decide without an extra request on every route.
- Store only one active hashed verification token per user and replace it when the user requests another verification email.
- Use the configured public application base URL for verification links.
- Keep unverified users signed in but confined to the verification flow until success.
- Make the token lifetime configurable through instance settings with a 30 minute default.
- Allow setup-created first admin accounts to bootstrap the system without email verification.
- Disable public registration when email delivery is unavailable without exposing the underlying email-configuration reason.
- Verify account email changes as pending transitions before changing the active account contact identity.

**Non-Goals:**
- Email verification for OAuth provider-linked accounts unless they are created through the same local registration path.
- A public unauthenticated verification endpoint; token submission is tied to the signed-in account.
- Rate limiting beyond the existing auth/API rate-limit patterns.
- Stale-account deletion; this change creates the verification state needed by that future work.

## Decisions

### Add verification fields to `users`

Add nullable `validated_at`, `validation_token`, and `validation_started` columns via Flyway and map them on `User` as `Instant?` and `String?` values. Add nullable pending email change fields such as `pending_email`, `pending_email_token`, and `pending_email_started` for email-change verification.

`validation_token` stores a hash of the raw token, not the raw token itself. The raw token is generated once, sent in the email, accepted from user input or a tokenized link, hashed with the same algorithm, and compared to the stored hash.

Rationale: the issue scopes verification state to the user account and the flow only needs one active token per account. Keeping it on `users` avoids a separate token table until there is a need for token history or multiple concurrent verification channels. Hashing the token treats it like the bearer secret it is and avoids exposing usable verification tokens through database reads, debug inspection, backups, or accidental logging.

Alternative considered: a separate verification token table. That would make cleanup and history easier, but adds lifecycle complexity that is not needed for a single active registration token.

### Treat email changes as pending identity transitions

When a user changes their account email to a new identity, keep `users.email` as the current verified account contact identity and store the requested address in `pending_email` until verification succeeds. Send the verification token to the pending email address. After successful verification, promote `pending_email` into `email`, update `validated_at`, and clear the pending fields.

Rationale: login uses passkey credentials scoped to the relying party and mapped to the server-side user, not email entry. The email still matters as the verified contact/account identity used for display, notifications, and future trust workflows. Keeping the active email unchanged until the replacement is verified prevents typos or unverified addresses from becoming the visible/contact email.

Alternative considered: overwrite `users.email` immediately and track verification separately. That makes the primary account contact identity unverified and forces display, notification, and trust workflows to choose between verified and unverified email semantics.

Email identity uniqueness must check both active and pending email identities across other users so two accounts cannot race to claim the same new address.

Resending verification for registration or a pending email change replaces the existing token hash and timestamp. Previous tokens stop validating immediately. Expired pending email changes remain visible as expired until the user cancels or resends so the UI can explain what happened.

When an email change is requested, send a notice to the current verified email address if delivery is available. After the pending email is verified, show the success screen but do not send a separate success email.

### Expose verification state, not token values, in auth DTOs

Extend `AuthUserDto` with a verification indicator such as `emailVerified: Boolean` and enough non-secret state for the frontend to choose between "request email", "enter token", and "expired token" states. Do not return `validation_token` to the browser from session or state endpoints.

Rationale: route decisions must be fast and consistent after login/refresh, but raw tokens are secrets and should only travel through email links or user input.

Alternative considered: a dedicated verification-state endpoint only. That is still useful for refreshing state after requesting a token, but relying on it for every route would duplicate existing session restoration.

Use a small auth/session shape for routing and a richer dedicated verification-state response for UI decisions. The detailed state may include active email, whether registration verification is required, whether a token has been requested, started/expires timestamps, expired status, pending email address, and pending email verification status. It must never include raw tokens or token hashes.

### Add a focused verification service and controller

Create backend behavior for:
- Reading the current user's verification state.
- Requesting a new verification email for an authenticated unverified user.
- Submitting a token for the current authenticated user.

The service should generate cryptographically random opaque tokens, persist the token and start timestamp transactionally before delivery, validate the submitted token against the current user, enforce the configured timeout, and clear token fields after success.

Rationale: verification has account state, email delivery, and timeout rules that should not be spread across controllers.

Alternative considered: implement directly in `AuthController`. That would be quicker but would mix registration/passkey ceremony concerns with token lifecycle and email delivery.

### Bootstrap admin accounts are verified immediately

When the setup flow creates the first admin, set `validated_at` immediately and do not require email verification for that account.

Rationale: the first admin is responsible for configuring outbound email. Requiring that account to receive email before email delivery exists would deadlock setup.

Alternative considered: allow the first admin to remain unverified but permit admin settings. That adds a special partially verified state that would complicate routing and authorization more than simply marking the bootstrap account verified.

### Registration availability includes email delivery readiness

Treat public registration as available only when the existing registration setting is enabled and outbound email delivery has complete active configuration. When email delivery is unavailable, public auth configuration should simply report registration disabled and registration endpoints should return the normal disabled-registration response.

Rationale: users must not be able to create accounts that immediately become unusable because verification email cannot be sent, and unauthenticated users should not learn internal email-configuration status.

Alternative considered: allow registration and show a verification-email delivery failure after account creation. That preserves a narrower definition of registration availability, but creates stranded accounts and leaks too much operational state through user-facing errors.

Email delivery readiness for registration is based on complete active configuration with no validation errors. Do not live-probe SMTP from public auth configuration requests.

### Store `email_validation_timeout` as an app setting in minutes

Add a non-null app-setting default of `30` and expose it through `AppSettingsService` as a duration. Validate runtime/admin updates as a positive integer if the setting becomes editable through existing admin settings.

Rationale: the issue names an instance configuration field and default. Keeping it with existing app settings makes deployment and future admin UI support consistent.

Alternative considered: environment-only configuration. That would be simpler, but would not match the requested instance configuration model.

### Gate normal app routes by verification state

Introduce a shared frontend route constant or helper for the verified landing destination (`/lists`) and the verification flow path. Update root, auth, and app-layout loads to redirect authenticated unverified users to the verification route while preserving setup-required and backend-startup precedence.

Rationale: routing currently repeats `/lists` as the authenticated landing destination. This change is a good time to centralize that decision and prevent future drift.

Alternative considered: enforce only in backend APIs. API enforcement is useful defense in depth, but frontend routing still needs a clear flow for users immediately after registration and refresh.

### Enforce unverified-session backend allowlist

Add backend enforcement after JWT authentication so users with `validated_at == null` can only call:
- session maintenance endpoints such as refresh and logout
- `GET /api/users/me` for safe own-account state
- verification-state, request-email, and submit-token endpoints
- pending-email cancellation only if that endpoint is needed while otherwise gated

All normal application APIs are blocked for unverified users, including lists, list groups, list events, items, categories, today view, admin APIs, account mutation, preferences, passkey management, deletion preview, and account deletion. Return `403` with an `EMAIL_VERIFICATION_REQUIRED` error code.

A verified user with a pending email change remains verified for this gate because the active account email is still verified.

Rationale: a central allowlist avoids repeating checks in every controller and prevents unverified accounts from mutating account state or application data before proving email control.

Alternative considered: rely only on frontend routing. That would give a nicer happy path but would leave direct API calls available to unverified users.

### Reuse email delivery and application link generation

Add an email composition helper or template path for verification email messages and extend `ApplicationLinkService` with a verification route that produces `/verify-email?validation_token=...`.

Rationale: existing recovery email design already avoids deriving public links from request headers and returns safe delivery failures. Verification should use the same base URL and safety posture.

Alternative considered: build the link inside the controller from request data. That would be fragile behind proxies and conflict with the existing email-service specification.

## Risks / Trade-offs

- Existing users have no `validated_at` value after migration -> Mitigate by backfilling existing users to `now()` during migration so current accounts are not locked out unexpectedly, while new registrations remain unverified.
- Email delivery disabled blocks new public registration -> Mitigate by showing the normal registration-disabled state without revealing email configuration, while setup-created admins remain verified and able to configure email.
- Backend allowlist drift could accidentally expose APIs to unverified users -> Mitigate by centralizing the gate, testing representative allowed and blocked endpoints, and treating new authenticated endpoint groups as blocked until explicitly allowed.
- Token hash algorithm or normalization drift could reject valid links -> Mitigate by using one shared hashing function for generation and submission paths and by testing link/manual token submissions.
- Browser state may remain stale after verification or pending-email promotion -> Mitigate by refreshing the auth session or current user state immediately after successful verification before redirecting to the landing route.
- Pending email changes can confuse passkey display names in browser account pickers -> Mitigate by treating passkeys as bound to the relying party and stable user handle, then add `PublicKeyCredential.signalCurrentUserDetails()` after the core implementation so supporting browsers/password managers can update stored account labels.
- OAuth-created accounts may already represent verified email from the provider -> Mitigate by treating that as an implementation decision in the registration/auth path; the required behavior is that accounts needing local verification cannot enter the app unverified.

## Migration Plan

1. Add a Flyway migration for user verification columns, pending email verification columns, and the `email_validation_timeout` setting default.
2. Backfill existing users as verified to preserve current access and ensure setup-created first admins are verified immediately.
3. Deploy backend changes before frontend verification routing if possible; the frontend can treat missing verification flags from older responses as verified only during a short compatibility window, or the changes can ship together in the all-in-one image.
4. Rollback by reverting application code; the added nullable columns and app setting can remain harmlessly in place.
