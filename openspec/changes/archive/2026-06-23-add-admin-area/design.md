## Context

The application has passkey authentication, JWT access tokens, refresh-token cookies, user profile management, runtime route guards, and an environment-backed registration toggle. It does not yet have instance admins, account block state, database-backed application settings, usage statistics, admin APIs, setup bootstrapping, or recovery links.

Issue 137 requires an admin area for deployment management. The critical security constraint is recoverability: existing deployments may already have users, so setup must be available whenever no admin exists, and admin operations must not allow an admin to lock themselves or the instance out.

Audit logging and outbound email are separate future capabilities. This change should leave clear extension points and safe metadata, but it should not implement audit storage or email delivery.

## Goals / Non-Goals

**Goals:**

- Add durable admin and blocked-account state.
- Add a setup wizard when no admin exists, including migrated instances.
- Add admin-only APIs and UI for settings, stats, and user management.
- Allow admins to toggle registration without downtime.
- Hard-kick blocked users by rejecting login, refresh, and active authenticated requests.
- Add admin-initiated, user-completed passkey recovery links.
- Display recovery URLs to admins for manual delivery until email delivery exists.
- Prevent self-blocking and zero-admin lockout.

**Non-Goals:**

- Implementing audit-log persistence or audit query APIs.
- Implementing outbound email delivery.
- Implementing OAuth administration beyond preserving existing account behavior.
- Adding password-based recovery or passwords.
- Building fine-grained admin roles beyond admin/non-admin.

## Decisions

### Store admin and block state on users

Add user-level fields for admin authorization and block state, such as `admin`, `blockedAt`, and `blockedByUserId`. Admin authorization is instance-wide, not list-scoped, so it belongs on the account identity rather than list membership.

Alternative considered: a separate admin-membership table. That would be more extensible for future role hierarchies, but the requested model is binary and the existing `users` entity is the central identity record.

### Setup is required when no admins exist

The backend exposes setup state based on `admin_count = 0`. Setup endpoints are public only while no admin exists and create or promote the first admin through a passkey-backed flow. This supports migration of existing instances where users already exist but none are admins.

Alternative considered: setup only when `users = 0`. That would not help existing deployments and would require direct database intervention.

### Enforce admin lockout protection in the service layer

Admin service methods reject self-blocking and any admin-state/block-state change that would leave no unblocked admin. The service layer can check current actor, target, and remaining usable admins transactionally.

Alternative considered: database constraints. The invariant spans rows and the current actor, so service-layer enforcement is more practical and testable.

### Hard-kick blocked users at every session boundary

Blocking a user deletes their refresh tokens and causes current access tokens to be rejected. The JWT filter should load the current user state for authenticated requests and reject blocked or deleted users. Login and refresh should also reject blocked users before issuing tokens.

Alternative considered: rely only on token expiration. That would leave blocked users active until access-token expiry and would not meet the hard-kick requirement.

### Move registration toggle to persistent application settings

Store `registrationEnabled` in a database-backed settings record that admins can update at runtime. Existing environment configuration can seed or default the setting for new deployments, but request-time behavior reads the persisted value.

Alternative considered: mutate environment/config at runtime. That does not work reliably in deployed containers and would still require restart behavior.

### Recovery links are admin-initiated and user-completed

An admin creates a one-time, expiring recovery token for an unblocked target user. The admin UI displays the full recovery URL so the admin can deliver it manually. The user opens the link, completes WebAuthn registration, and receives a success page with a link to `/auth`; the recovery flow does not log the user in.

Alternative considered: admin directly adds a passkey to the user's account. That risks registering the admin's authenticator as the user's credential and blurs account ownership.

### Recovery links do not depend on registration being enabled

Registration disabling applies only to new account creation. Recovery adds a credential to an existing account, so it bypasses registration-disabled state. Recovery creation is still rejected for blocked users.

Alternative considered: make registration disabled block all credential creation. That would make account recovery unavailable precisely when a locked-down instance needs admin recovery.

### Email and audit are extension points

Recovery-token records should have stable identifiers and non-secret metadata that future audit logging can reference. The admin UI keeps manual URL display even after future email support, matching the `email-service` spec.

Alternative considered: defer recovery until email exists. Manual delivery is sufficient for this personal/household deployment model and avoids blocking the admin area.

## Risks / Trade-offs

- [Risk] Loading user state on every authenticated request adds a database lookup. -> Mitigation: keep the lookup narrow, cache only if later profiling proves it is needed, and prefer correctness for block enforcement.
- [Risk] Setup endpoints are public by necessity. -> Mitigation: enable them only while no admin exists and make final setup transactional so only one first admin can be created.
- [Risk] Manual recovery URLs are sensitive. -> Mitigation: make tokens high entropy, hashed at rest, single-use, expiring, and display/copy them with clear secret handling.
- [Risk] Admin email edits can affect login identity. -> Mitigation: enforce email uniqueness and keep WebAuthn user handles UUID-based so passkeys remain attached to the same account.
- [Risk] Existing users after migration have no admin until setup is completed. -> Mitigation: setup-required routing takes precedence and guides an authorized operator through creating/promoting the first admin.
- [Risk] Future audit/email requirements are easy to forget during implementation. -> Mitigation: shape service methods around explicit event metadata and recovery delivery status even though persistence/sending is out of scope.

## Migration Plan

1. Add Flyway migration for user admin/block fields, application settings, and recovery tokens.
2. Seed the persistent registration setting from existing configuration for new deployments.
3. Deploy backend changes before frontend changes so setup/admin state APIs exist.
4. Existing deployments with users but no admins enter setup-required mode until the first admin is created or promoted.
5. Rollback requires treating newly added columns/tables as ignored by older code; destructive migration rollback is not expected.

## Open Questions

- Exact recovery token lifetime, with 30 minutes as the suggested default.
- Whether first-admin setup for an existing user should require that user's current passkey authentication, or whether the setup wizard should create a new admin account when no admin exists. The implementation should choose the safer flow that still supports migration.
