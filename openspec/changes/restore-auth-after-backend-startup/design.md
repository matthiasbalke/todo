## Context

The refresh token is intentionally stored in an HttpOnly cookie, while the access token and current user exist only in the frontend auth store. The browser therefore cannot determine from local storage whether a session exists; it must call `POST /api/auth/refresh`.

The `/auth` client load guard currently calls `restoreSession(fetch)` once. That function catches every failure and leaves the store unauthenticated, so a network failure while the backend starts is indistinguishable from a `401` confirming that no valid refresh session exists. The mounted auth page separately polls `/actuator/health`, but after health succeeds it only loads auth configuration and displays the login UI.

## Goals / Non-Goals

**Goals:**

- Preserve enough information from session restoration to distinguish confirmed logout from temporary backend unavailability.
- Retry an indeterminate `/auth` session as soon as startup polling confirms backend readiness.
- Redirect to `/lists` before rendering authentication controls when the retry restores the session.
- Keep the existing polling interval, timeout, registration configuration, and auth flows.
- Add deterministic unit and end-to-end coverage for the startup race.

**Non-Goals:**

- Storing access or refresh credentials in `localStorage` or exposing the HttpOnly cookie to JavaScript.
- Changing refresh-token rotation, JWT issuance, WebAuthn, or backend health APIs.
- Adding continuous background session restoration after the auth page has reached a confirmed logged-out state.
- Changing protected-route or root-route destinations.

## Decisions

### Return a typed result from session restoration

`restoreSession` will return a small result type representing `authenticated`, `unauthenticated`, or `unavailable`, while continuing to populate the auth store on success. A `401` from the refresh endpoint is a confirmed unauthenticated result; network failures and non-auth HTTP failures are unavailable results.

Existing callers may continue to use the auth store after awaiting restoration, while `/auth` can use the result to decide whether a later retry is required. This is preferred over checking for a cookie locally because the refresh cookie is HttpOnly, and over treating every exception as logout because that reproduces the current race.

### Pass the initial restoration result from the load guard to the page

The `/auth` load function will return the restoration result when it does not redirect. The page uses that load data to know whether startup polling must retry authentication.

This avoids issuing a second refresh request for a user already confirmed unauthenticated when the backend was healthy during route loading. It also keeps the initial route exclusion behavior in the existing client load guard.

### Couple the retry to successful backend health polling

When health succeeds and the initial session result was unavailable, the auth page will call `restoreSession` again before loading auth configuration or switching to the idle login UI:

- `authenticated`: navigate to `/lists` and stop polling.
- `unauthenticated`: load auth configuration and show the login UI.
- `unavailable`: remain in the startup state and let the existing poll and retry budget continue.

The page will guard against overlapping poll callbacks and navigation after component destruction. This is preferred over an independent authentication retry timer because health polling already defines backend readiness and the visible startup timeout.

### Test the state transition without relying on a real passkey ceremony

Component tests will model an initial unavailable result followed by each retry outcome and verify that login controls do not flash before the decision. Browser coverage will seed or preserve a valid refresh session, make the initial refresh request fail while health is unavailable, then restore backend responses and assert automatic navigation to `/lists`.

## Risks / Trade-offs

- [Health succeeds before the refresh endpoint is ready] -> Treat the refresh result as unavailable and continue within the existing polling budget.
- [An unexpected refresh `5xx` is mistaken for logout] -> Classify only the endpoint's authentication rejection as unauthenticated; retain startup mode for network and server failures.
- [Concurrent interval callbacks rotate the same refresh token twice] -> Serialize connection attempts and skip a tick while one attempt is in flight.
- [Navigation completes after component teardown] -> Clear polling and ignore late state updates when the component is destroyed.
- [The startup timeout now includes session retry failures] -> Preserve the current bounded wait and unavailable screen rather than showing login controls without a reliable session decision.

## Migration Plan

1. Add the typed session restoration result and focused store tests.
2. Return the result from the `/auth` load guard and update its tests.
3. Integrate session retry into auth-page startup polling and add component coverage.
4. Add browser coverage for automatic redirect after backend recovery.
5. Run frontend tests, type checks, and authentication-focused Playwright tests.

Rollback restores the previous void restoration contract and health-only startup polling. No persisted data migration is required.

## Open Questions

None.
