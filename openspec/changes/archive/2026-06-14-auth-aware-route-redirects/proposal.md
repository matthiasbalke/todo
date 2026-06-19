## Why

Frontend navigation currently ignores an existing session when resolving the root and authentication routes: `/` always redirects to `/auth`, and `/auth` can show sign-in controls to an already authenticated user. This creates unnecessary authentication prompts and required the PWA launch URL workaround introduced by #90.

## What Changes

- Make `/` restore the current session and redirect authenticated users to `/lists` while sending unauthenticated users to `/auth`.
- Ensure every protected frontend route restores the session before redirecting, and only sends unauthenticated users to `/auth`.
- Make `/auth` restore the current session and redirect authenticated users to `/lists`.
- Restore the PWA manifest `start_url` from `/lists` to `/`, removing the #90 workaround after root routing becomes session-aware.
- Add automated coverage for authenticated and unauthenticated navigation through `/`, `/auth`, and protected routes.

## Capabilities

### New Capabilities

- `auth-aware-routing`: Defines session-aware frontend route access, redirects, and application launch behavior.

### Modified Capabilities

None.

## Impact

- Frontend SvelteKit load functions for the root, authentication page, and protected app layout.
- Authentication session restoration and route-guard tests.
- PWA manifest launch URL in `frontend/vite.config.ts`.
- Playwright authentication and session-navigation coverage.
- No backend API or authentication protocol changes.
