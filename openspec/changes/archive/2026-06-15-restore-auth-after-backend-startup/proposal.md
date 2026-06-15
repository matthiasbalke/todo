## Why

When `/auth` is opened while the backend is unavailable, its route guard attempts session restoration only once and treats the network failure like a logged-out session. The page later detects that the backend is healthy, but it displays sign-in controls without retrying the valid refresh-token cookie, leaving an already authenticated user on `/auth` until they reload.

## What Changes

- Distinguish temporary backend unavailability during session restoration from a confirmed invalid or absent session.
- While `/auth` waits for backend startup, retry session restoration after the health check succeeds and redirect restored users to `/lists`.
- Show the authentication controls only after backend readiness and the post-startup session decision have both completed.
- Preserve the existing startup timeout and unauthenticated sign-in and registration behavior.
- Add focused frontend and browser coverage for an authenticated session whose first restoration attempt fails because the backend is still starting.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `auth-aware-routing`: Require the authentication route to re-evaluate an indeterminate session after temporary backend unavailability and redirect a restored user without requiring a reload.

## Impact

- Frontend authentication session restoration result handling in `frontend/src/lib/stores/auth.svelte.ts`.
- `/auth` route startup polling and navigation in `frontend/src/routes/auth/`.
- Authentication route unit tests and startup-race Playwright coverage.
- No backend API, refresh-cookie, WebAuthn, database, or dependency changes.
