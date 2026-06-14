## Context

The frontend keeps the access token and current user in the client-side auth store, while the refresh token is an HttpOnly cookie. `restoreSession(fetch)` exchanges that cookie for a new access token when the in-memory session is absent. Protected routes under `(app)` already disable SSR, await restoration, and redirect unauthenticated users, but `/` redirects to `/auth` unconditionally and `/auth` has no route guard. The PWA therefore launches at `/lists` as a workaround.

## Goals / Non-Goals

**Goals:**

- Resolve root, authentication, and protected routes only after the client has attempted session restoration.
- Apply consistent redirect behavior for authenticated and unauthenticated users.
- Remove the #90 PWA launch workaround by making `/` the canonical session-aware entry point.
- Cover route decisions without requiring real passkey ceremonies in every test.

**Non-Goals:**

- Changing JWT, refresh-cookie, WebAuthn, or backend authorization behavior.
- Preserving an originally requested protected URL through a successful sign-in.
- Adding server-side session storage or exposing the refresh token to frontend code.

## Decisions

### Use client-side load guards for session-dependent redirects

The root and authentication routes will use client-side `load` functions with `ssr = false`, matching the existing protected app layout. Each guard will await `restoreSession(fetch)` before reading `isAuthenticated()`.

This is preferred over making a redirect decision during SSR because the server load path does not currently derive frontend auth-store state from the HttpOnly refresh cookie. Adding that would duplicate refresh/session logic and broaden the change into a new authentication architecture.

### Keep protected-route enforcement at the `(app)` layout boundary

The existing `(app)/+layout.ts` remains the single guard for all protected child routes. It will continue restoring the session before loading protected data and will redirect only when restoration leaves the user unauthenticated.

This is preferred over adding guards to individual pages because layout inheritance already covers the protected route group and prevents inconsistent access behavior.

### Treat `/` as the canonical PWA entry point

The PWA manifest `start_url` will return to `/`. The root guard will then route authenticated users to `/lists` and unauthenticated users to `/auth`.

This removes the #90 workaround and centralizes launch behavior in application routing instead of encoding an authenticated destination in the manifest.

### Test route decisions at unit and end-to-end levels

Focused frontend tests will mock session restoration and authentication state for both outcomes on `/`, `/auth`, and the protected layout. Playwright coverage will verify browser-level redirects and session restoration across reload/navigation. A manifest/config assertion will protect the restored root launch URL.

## Risks / Trade-offs

- [Client-only route guards briefly defer rendering while session restoration completes] -> Keep the redirect in `load` so protected or auth-page UI is not rendered before the decision.
- [Multiple guards may call `restoreSession` during navigation] -> The existing early return for an authenticated session makes subsequent calls cheap; tests will verify route outcomes rather than call-count coupling.
- [An invalid or revoked refresh cookie is indistinguishable from no session to the frontend] -> Preserve the existing `restoreSession` behavior and route the user to `/auth`.
- [Redirect loops could be introduced by inconsistent guards] -> Define one-way outcomes explicitly: `/auth` redirects only authenticated users to `/lists`, while protected routes redirect only unauthenticated users to `/auth`.

## Migration Plan

1. Add and test session-aware guards for `/` and `/auth`.
2. Confirm the protected layout still waits for restoration and permits authenticated navigation.
3. Change the PWA `start_url` from `/lists` to `/`.
4. Run frontend unit tests and authentication-focused Playwright tests.

Rollback consists of restoring the previous root redirect and PWA `start_url`; no data or backend migration is required.

## Open Questions

None.
