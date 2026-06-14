## Why

When the frontend becomes available before the backend, the root route's session restoration fails and redirects the user to `/auth`. The authentication page waits for backend health but does not retry session restoration, so a user with a valid refresh-token cookie is incorrectly shown the sign-in form after startup completes.

## What Changes

- Treat backend unavailability during initial session restoration as a pending startup state rather than a final unauthenticated result.
- After the backend becomes healthy, retry the session-aware root routing flow before deciding between the authenticated application and the authentication page.
- Keep the startup indicator available while the backend is unavailable without coupling it to the authentication form.
- Add automated coverage for valid-session launches where the frontend starts before the backend.
- Preserve existing behavior for genuinely unauthenticated users and for startup timeout handling.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `auth-aware-routing`: Require application startup recovery to re-evaluate authentication after backend health is restored before displaying `/auth` or loading protected routes.

## Impact

- Frontend root and authentication route loading behavior.
- Backend health polling and startup indicator ownership.
- Authentication store/session restoration error signaling if needed to distinguish backend unavailability from an invalid session.
- Frontend unit tests and Playwright launch/session restoration coverage.
- No backend authentication protocol, token format, or API contract changes.
