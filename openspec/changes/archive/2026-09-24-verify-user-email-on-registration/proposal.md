## Why

Newly registered accounts can currently use the application before proving that they control the submitted email address. Requiring email verification before normal app access improves account quality, supports future stale-account cleanup, and gives outbound email a concrete user-facing registration flow.

## What Changes

- Add email verification state to user accounts: `validated_at`, `validation_token`, and `validation_started`.
- Add an instance configuration value for the verification token lifetime, defaulting to 30 minutes and always present.
- Generate a random verification token when a user requests verification, persist only a hash of that token, then send a verification email containing explanatory text, the manual token, and a verification link.
- Treat setup-created first admin accounts as already verified so the bootstrap admin can configure email delivery.
- Disable public registration when email delivery is unavailable, without exposing email-configuration status to unauthenticated users.
- Verify email address changes before making the new email address the active account contact identity; the current verified email remains active for account display and notifications until the new email is verified.
- Notify the current verified email address when an email change is requested, but do not send a separate success email after the new address is verified.
- Require unverified authenticated users to complete email verification before reaching the normal landing destination.
- Add frontend verification states for requesting a token, entering a token, following a tokenized link, handling expired tokens, and showing success or error feedback.
- Clear verification token state after successful validation so raw tokens are not retained longer than necessary.

## Capabilities

### New Capabilities
- `account-email-verification`: Defines account verification state, verification token lifecycle, verification endpoints, timeout behavior, and unverified-user access rules.

### Modified Capabilities
- `account-email-identity`: Change profile email updates so new email identities become pending and are only promoted after verification.
- `audit-log`: Add future audit-event requirements for email verification and email-change activity.
- `auth-aware-routing`: Route authenticated but unverified users to the verification flow instead of the normal authenticated landing destination.
- `email-service`: Add the registration email verification template and delivery behavior.

## Impact

- Backend user persistence, Flyway migrations, repositories, account/auth services, JWT/session user shape, and registration/login flows.
- Instance configuration persistence and defaults for `email_validation_timeout`.
- New backend API endpoints for requesting and submitting email verification.
- Account profile email updates now create pending email changes instead of immediately changing the active verified account email when the identity changes.
- Registration availability logic now depends on both the existing registration setting and outbound email availability.
- Frontend session-aware routing, auth state handling, verification page/form/link handling, and user-facing feedback.
- Email template composition and safe delivery failure handling for verification messages.
- Future audit logging event contracts for verification and email-change activity.
- Backend integration tests, frontend tests, and E2E coverage for registration-to-verification access control.
