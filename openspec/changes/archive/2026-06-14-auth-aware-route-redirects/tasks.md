## 1. Route Guards

- [x] 1.1 Replace the unconditional root redirect with a client-side load guard that awaits session restoration and redirects authenticated users to `/lists` and unauthenticated users to `/auth`.
- [x] 1.2 Add a client-side `/auth` load guard that awaits session restoration, redirects authenticated users to `/lists`, and allows unauthenticated users to view the authentication page.
- [x] 1.3 Verify the `(app)` layout remains the shared guard for all protected routes, restores the session before loading protected data, and redirects only unauthenticated users.

## 2. PWA Launch Behavior

- [x] 2.1 Change the PWA manifest `start_url` from `/lists` back to `/`, removing the workaround introduced by #90.

## 3. Automated Coverage

- [x] 3.1 Add frontend unit tests for authenticated and unauthenticated root-route load outcomes, including failed session restoration.
- [x] 3.2 Add frontend unit tests for authenticated and unauthenticated `/auth` load outcomes.
- [x] 3.3 Add frontend unit tests for the protected app layout covering restored sessions, unauthenticated redirects, and protected data loading only after authentication succeeds.
- [x] 3.4 Update Playwright authentication tests to verify `/` routes authenticated users to `/lists`, `/auth` routes authenticated users to `/lists`, protected routes redirect unauthenticated users to `/auth`, and valid refresh-cookie sessions survive direct navigation or reload.
- [x] 3.5 Add or update configuration coverage asserting that the generated PWA manifest launches at `/`.

## 4. Verification

- [x] 4.1 Run the frontend test suite and Svelte type checks.
- [x] 4.2 Run the authentication-focused Playwright tests against the full stack and resolve any redirect-loop or session-restoration regressions.
