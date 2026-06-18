## 1. Session Restoration Result

- [x] 1.1 Add a typed `restoreSession` outcome that distinguishes authenticated, confirmed unauthenticated, and temporarily unavailable results while preserving successful store population
- [x] 1.2 Classify refresh `401` responses as unauthenticated and network or non-auth HTTP failures as unavailable
- [x] 1.3 Add auth-store tests for existing in-memory sessions, successful refreshes, rejected refresh sessions, and temporary backend failures

## 2. Authentication Route Startup

- [x] 2.1 Return the initial restoration outcome from the `/auth` load guard when it does not redirect, and update load-guard tests for all outcomes
- [x] 2.2 Update the `/auth` page to retry an unavailable session after health succeeds before loading auth configuration or displaying sign-in controls
- [x] 2.3 Redirect restored users to `/lists`, display authentication controls only after a confirmed unauthenticated result, and keep unavailable retries within the existing startup timeout
- [x] 2.4 Serialize startup attempts and prevent polling or late state updates after navigation or component destruction

## 3. Regression Coverage

- [x] 3.1 Add auth-page component tests for unavailable-to-authenticated redirect, unavailable-to-unauthenticated rendering, repeated unavailable results, timeout behavior, and absence of login-control flashing
- [x] 3.2 Add Playwright coverage proving a valid refresh session redirects automatically from `/auth` to `/lists` after simulated backend startup without a page reload
- [x] 3.3 Verify existing unauthenticated auth-page, registration configuration, passkey sign-in, and route-guard behavior remains unchanged

## 4. Verification

- [x] 4.1 Run focused authentication store, load-guard, and auth-page unit tests
- [x] 4.2 Run the full frontend test suite, Svelte type checks, and production build
- [x] 4.3 Run the authentication-focused Playwright suite and validate the OpenSpec change
