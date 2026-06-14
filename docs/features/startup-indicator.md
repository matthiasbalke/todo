# Feature: Backend Startup Indicator

## Problem

The SvelteKit frontend starts significantly faster than the Spring Boot backend (Flyway migrations add further delay). If startup recovery is owned by `/auth`, a valid refresh-token cookie can be treated as unauthenticated before the backend is ready and the user is shown the sign-in form after recovery.

## Solution

Poll `/actuator/health` from the root startup surface before choosing an authenticated or unauthenticated destination. Show a loading spinner while waiting, and re-run session-aware routing once the backend reports healthy.

## State Machine

```
'starting'  (initial)
   │  checkHealth() returns true (within 60 retries × 2s = 2 min)
   ▼
   invalidateAll() → root load restores session and redirects to /lists or /auth
   │  60 retries exhausted
   ▼
'startup-timeout'  (terminal — user must reload)
```

## Implementation

- **`frontend/src/lib/api/health.ts`** — `checkHealth()` fetches `/actuator/health`, returns `true` on HTTP 200, `false` on any other status or network error.
- **`frontend/src/lib/api/health.test.ts`** — unit tests for the three cases: 200, 503, network error.
- **`frontend/src/routes/+page.svelte`** — starts in `'starting'` mode, polls every 2 s, and invalidates the route once health passes so the root load can restore the session again.
- **`frontend/src/routes/auth/+page.svelte`** — renders the authentication UI after startup routing has already resolved backend availability; it only fetches config and handles passkey actions.

## Security

`/actuator/health` is already public (`show-details: never`) and returns only `{"status":"UP"}`. No new endpoints are added.

## Edge Cases

| Scenario | Behaviour |
|---|---|
| Backend returns non-200 during poll | Poll continues, retry counter increments |
| Network error during poll | Poll continues, retry counter increments |
| 60 retries exhausted | `startup-timeout` shown, no auto-retry |
| Backend already up on first poll | `starting` visible for ≤ 2 s |
| `invalidateAll()` re-runs root load and finds an authenticated session | User lands on `/lists` without seeing the auth form |
| `invalidateAll()` re-runs root load and finds no session | User lands on `/auth` |
