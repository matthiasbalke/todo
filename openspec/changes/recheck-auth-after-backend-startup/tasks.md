## 1. Session Restoration Outcomes

- [ ] 1.1 Define a typed session-restoration outcome for authenticated, unauthenticated, and backend-unavailable results.
- [ ] 1.2 Update `restoreSession` to classify successful restoration, explicit authentication rejection, and transient network or service-unavailable failures without clearing a valid in-memory session.
- [ ] 1.3 Add auth-store unit tests covering each restoration outcome and the existing authenticated-session early return.

## 2. Startup-Aware Routing

- [ ] 2.1 Update the root load function to redirect authenticated users to `/lists`, redirect conclusively unauthenticated users to `/auth`, and render startup state for backend unavailability.
- [ ] 2.2 Move health polling, loading presentation, and timeout presentation from the authentication page to the root page.
- [ ] 2.3 Re-run root route loading after health recovery so session restoration determines the final destination.
- [ ] 2.4 Update `/auth` and protected layout guards to route backend-unavailable restoration through `/` while preserving their existing authenticated and unauthenticated behavior.
- [ ] 2.5 Remove the authentication page's independent backend-startup state and initialize its configuration only after routing has conclusively allowed the page.

## 3. Automated Coverage

- [ ] 3.1 Update root route tests for authenticated, unauthenticated, backend-unavailable, recovered, and timed-out startup outcomes.
- [ ] 3.2 Update authentication and protected-layout route tests to verify backend unavailability redirects through `/` without displaying sign-in or loading protected data.
- [ ] 3.3 Update authentication page component tests for the removal of startup polling and preservation of sign-in, registration, and configuration behavior.
- [ ] 3.4 Add Playwright coverage for a valid refresh session launched while the backend is unavailable, verifying recovery reaches `/lists` without showing the authentication form.
- [ ] 3.5 Add Playwright coverage confirming an unauthenticated startup recovery reaches `/auth`.

## 4. Documentation And Verification

- [ ] 4.1 Update the startup indicator feature documentation and `MEMORY.md` to describe root-owned startup recovery and auth re-evaluation.
- [ ] 4.2 Run the frontend unit test suite, Svelte type checks, and production build.
- [ ] 4.3 Run the authentication-focused Playwright tests against the full stack and resolve startup redirect or session-restoration regressions.
