## Why

Deployment-level administration currently requires environment changes, direct database edits, or manual recovery work. Issue 137 asks for an admin area so household instance owners can manage registration, users, basic usage visibility, and account recovery without downtime.

## What Changes

- Add an admin area reachable from the authenticated user menu for admin users.
- Add a setup wizard that is available when no admin users exist, including migrated instances with existing non-admin users.
- Add persistent admin and blocked-account state to users.
- Add runtime registration settings so admins can enable or disable new account creation without restarting the deployment.
- Add basic usage statistics for admins.
- Add admin user management for listing users, editing user email/display name, blocking/unblocking users, and managing admin status.
- Add admin-initiated, user-completed passkey recovery through one-time recovery links.
- Display generated recovery links to admins for manual delivery until an email service is implemented.
- Hard-kick blocked users from active sessions and reject login, refresh, and authenticated API use while blocked.
- Preserve future audit and email integration points without implementing audit logging or outbound email in this change.

## Capabilities

### New Capabilities

- `admin-area`: Covers setup wizard, admin authorization, runtime registration settings, usage statistics, admin user management, account blocking, and manual passkey recovery links.

### Modified Capabilities

- `auth-aware-routing`: Protected and public route behavior changes when setup is required or the current session belongs to a blocked user.

## Impact

- Backend auth/user model, Flyway migrations, JWT/filter/session validation, admin APIs, registration config lookup, recovery-token storage, and integration tests.
- Frontend auth/session stores, app routing, setup wizard route, admin routes, user menu, auth page registration config handling, recovery completion page, and component tests.
- Existing `audit-log` and `email-service` specs remain future capabilities; this change should expose safe metadata and extension points but not implement those services.
