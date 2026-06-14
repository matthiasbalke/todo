## Context

The frontend stores authenticated user data and the access token in memory, while the refresh token remains in an HttpOnly cookie. Client-side route guards call `restoreSession(fetch)` when memory is empty. That function currently catches every refresh failure and returns no result, so guards cannot distinguish an invalid refresh token from a backend that has not started yet.

The backend startup indicator is embedded in `/auth`. A launch through `/` can therefore fail restoration while the backend is unavailable, redirect to `/auth`, wait until health succeeds, and then display sign-in without retrying the valid refresh cookie.

## Goals / Non-Goals

**Goals:**

- Distinguish a conclusively unauthenticated session from transient backend unavailability.
- Keep users on a neutral startup screen while the backend is unavailable.
- Re-run session-aware routing after backend health recovers.
- Preserve startup timeout feedback and existing authenticated/unauthenticated destinations.
- Cover the startup race with focused unit and browser tests.

**Non-Goals:**

- Changing refresh-token, JWT, cookie, or WebAuthn behavior.
- Adding server-side rendering of authenticated state.
- Preserving an arbitrary protected deep link across startup recovery.
- Retrying invalid, expired, or revoked sessions indefinitely.

## Decisions

### Return a typed outcome from session restoration

`restoreSession` will report whether the caller is authenticated, unauthenticated, or blocked by backend unavailability. HTTP authentication failures remain conclusive unauthenticated outcomes, while network failures and backend-unavailable responses produce the transient outcome.

This is preferred over checking health before every refresh request because the refresh attempt is already the authoritative test when the backend is available, and a typed result lets every route guard handle the same failure consistently.

### Make `/` the neutral startup surface

The root load function will redirect immediately for authenticated and conclusively unauthenticated outcomes. For backend unavailability it will render the existing startup indicator behavior at `/`, poll health, and re-run the route load after recovery.

This is preferred over keeping the startup indicator owned by `/auth` because `/auth` implies that authentication has already been resolved. It also keeps the PWA `start_url` and browser launch URL at the canonical session-aware root.

### Re-enter route loading after health recovery

When health polling succeeds, the startup surface will invalidate route data rather than selecting `/auth` or `/lists` itself. The root load function will retry session restoration and make the destination decision from current authentication state.

Direct visits to `/auth` or protected routes that encounter backend unavailability will return to `/` for startup recovery. This centralizes polling and avoids parallel startup state machines.

### Preserve conclusive authentication failures

Missing, expired, invalid, or revoked refresh sessions will continue to route to `/auth` without startup polling. Only failures that indicate the backend cannot currently answer are recoverable startup conditions.

This avoids loops where a healthy backend repeatedly sends an unauthenticated user through the startup page.

### Test the race at store, route, and browser boundaries

Store tests will verify restoration outcome classification. Route tests will verify that unavailable restoration reaches the root startup state while authenticated and unauthenticated outcomes retain their redirects. Component tests will verify health recovery re-runs routing and timeout remains terminal. Playwright coverage will simulate launch before backend readiness with a valid session and assert that sign-in is not shown after recovery.

## Risks / Trade-offs

- [Incorrect error classification could treat a server failure as logout or wait unnecessarily] -> Classify explicit authentication responses separately from fetch/network and service-unavailable failures, with unit coverage for each category.
- [Route invalidation after health recovery could trigger duplicate refresh calls] -> Keep restoration idempotent and rely on its existing authenticated-session early return.
- [Redirecting an unavailable protected deep link to `/` loses the original destination] -> Accept this existing non-goal and route authenticated users to `/lists` after startup.
- [Moving startup UI can regress direct `/auth` behavior] -> Add direct-auth tests for healthy unauthenticated, healthy authenticated, and unavailable-backend outcomes.

## Migration Plan

1. Introduce the typed restoration outcome and update all route-guard callers.
2. Move startup health polling and timeout presentation to the root route.
3. Route transiently unavailable `/auth` and protected loads through `/`.
4. Remove the authentication page's independent startup state after equivalent coverage exists at root.
5. Run frontend unit, type-check, build, and authentication-focused Playwright tests.

Rollback restores the previous void restoration API and `/auth` startup indicator; no data migration is required.

## Open Questions

None.
