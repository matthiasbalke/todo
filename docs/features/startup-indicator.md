# Feature: Backend Startup Indicator

## Problem

The SvelteKit frontend starts significantly faster than the Spring Boot backend (Flyway migrations add further delay). Users navigating to `/auth` before the backend is ready see a login form that immediately fails on any interaction.

## Solution

Poll `/actuator/health` from the auth page before rendering the login form. Show a loading spinner while waiting, and transition to the login form once the backend reports healthy.

## State Machine

```
'starting'  (initial)
   │  checkHealth() returns true (within 60 retries × 2s = 2 min)
   ▼
   getAuthConfig() → mode = 'idle'  (login form shown)
   │  60 retries exhausted
   ▼
'startup-timeout'  (terminal — user must reload)
```

## Implementation

- **`frontend/src/lib/api/health.ts`** — `checkHealth()` fetches `/actuator/health`, returns `true` on HTTP 200, `false` on any other status or network error.
- **`frontend/src/lib/api/health.test.ts`** — unit tests for the three cases: 200, 503, network error.
- **`frontend/src/routes/auth/+page.svelte`** — starts in `'starting'` mode, polls every 2 s, transitions to `'idle'` after health passes and config is fetched, or to `'startup-timeout'` after 60 failed retries.

## Security

`/actuator/health` is already public (`show-details: never`) and returns only `{"status":"UP"}`. No new endpoints are added.

## Edge Cases

| Scenario | Behaviour |
|---|---|
| Backend returns non-200 during poll | Poll continues, retry counter increments |
| Network error during poll | Poll continues, retry counter increments |
| 60 retries exhausted | `startup-timeout` shown, no auto-retry |
| Backend already up on first poll | `starting` visible for ≤ 2 s |
| `getAuthConfig` fails after health passes | Silently ignored; `registrationEnabled` stays `true` |
