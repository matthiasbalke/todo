## Why

`main` already retries an indeterminate `/auth` session after backend startup, but the unmerged `bugfix/recheck-auth` branch handled the same race from a broader routing surface. Comparing the two shows that launches and protected-route visits still collapse through `/auth` on `main`, while the branch kept backend startup as a neutral root-level state before making the final auth decision.

## What Changes

- Expand backend-startup recovery from `/auth`-only handling to session-aware routing at `/`.
- Route protected-route and `/auth` restoration failures caused by backend unavailability through the root startup state instead of treating `/auth` as the startup owner.
- Preserve the existing typed session restoration result and `/auth` retry behavior already present on `main`.
- Keep conclusively invalid refresh sessions routing directly to `/auth`.
- Add focused route, component, and browser coverage for authenticated and unauthenticated startup recovery from `/`, `/auth`, and protected routes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `auth-aware-routing`: extend backend startup recovery requirements from `/auth`-local retry behavior to root-owned session-aware startup routing.

## Impact

- Frontend route loads: `frontend/src/routes/+page.ts`, `frontend/src/routes/(app)/+layout.ts`, `frontend/src/routes/auth/+page.ts`
- Startup UI: `frontend/src/routes/+page.svelte`, with possible simplification in `frontend/src/routes/auth/+page.svelte`
- Auth store contract remains the current `RestoreSessionResult` API.
- Tests: auth store, root route, protected layout, auth route/page, and authentication-focused Playwright coverage.
- No backend API, database, token, cookie, or WebAuthn changes.
