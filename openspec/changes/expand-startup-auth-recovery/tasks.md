## 1. Routing Behavior

- [ ] 1.1 Update `frontend/src/routes/+page.ts` so `restoreSession(fetch)` redirects authenticated users to `/lists`, redirects unauthenticated users to `/auth`, and returns startup state for `unavailable`.
- [ ] 1.2 Add or restore root startup UI in `frontend/src/routes/+page.svelte` that polls backend health, invalidates route data after recovery, and shows the existing unavailable timeout state after the retry budget is exhausted.
- [ ] 1.3 Update `frontend/src/routes/(app)/+layout.ts` so `unavailable` redirects to `/` before protected data loads.
- [ ] 1.4 Update `frontend/src/routes/auth/+page.ts` so `unavailable` redirects to `/` before auth controls render, while authenticated users still redirect to `/lists`.
- [ ] 1.5 Remove or bypass redundant auth-page startup polling once root-owned startup recovery covers the same states.

## 2. Tests

- [ ] 2.1 Add root route load tests for authenticated, unauthenticated, and unavailable restore results.
- [ ] 2.2 Add root startup component tests for visible startup state, health recovery invalidation, serialized polling, and timeout.
- [ ] 2.3 Add protected layout and auth route load tests for redirecting unavailable restoration to `/`.
- [ ] 2.4 Update auth page tests to assert auth controls are not shown for indeterminate sessions and remain correct for confirmed unauthenticated sessions.
- [ ] 2.5 Add Playwright coverage for startup recovery from `/` with a valid refresh session, from `/` without a valid session, and from a protected route while the backend is initially unavailable.

## 3. Verification

- [ ] 3.1 Run `cd frontend && bun run check`.
- [ ] 3.2 Run `cd frontend && bun run test -- --run`.
- [ ] 3.3 Run authentication-focused e2e tests against the configured local HTTPS deployment when available.
- [ ] 3.4 Run `openspec status --change "expand-startup-auth-recovery"` and confirm the change is apply-ready.
