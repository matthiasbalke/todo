## Context

`bugfix/recheck-auth` and current `main` both address the same startup race: `restoreSession()` used to collapse refresh failures into "logged out", so a valid refresh cookie could be ignored while the backend was still starting.

The shared part is already on `main`: `restoreSession()` returns a typed result (`authenticated`, `unauthenticated`, `unavailable`), and `/auth` keeps controls hidden while backend health polling retries an indeterminate session. The unmerged branch went further by making `/` the neutral startup owner. In that approach, root loads that cannot restore a session render startup UI at `/`, and `/auth` plus protected routes redirect to `/` when the backend is unavailable.

The practical difference is user-visible routing. On `main`, a launch through `/` or a protected route during backend startup redirects into `/auth`, and `/auth` later recovers. On the branch, the same launch remains in an application startup state at `/` until the session can be decided.

## Goals / Non-Goals

**Goals:**

- Adopt the branch's neutral root-owned startup recovery on top of the `main` typed restoration API.
- Keep the current `main` behavior that hides auth controls while session state is indeterminate.
- Ensure `/`, `/auth`, and protected app routes make post-startup decisions only after retrying session restoration.
- Preserve direct routing to `/auth` for conclusively absent, expired, invalid, or revoked refresh sessions.
- Cover the route differences that made the old branch materially broader than current `main`.

**Non-Goals:**

- Changing refresh token storage, rotation, JWT issuance, WebAuthn, cookies, or backend health endpoints.
- Preserving protected deep links after backend startup recovery; restored users can continue to land on `/lists`.
- Replacing `RestoreSessionResult` with the branch's older `SessionRestoreState` name.
- Adding server-side auth resolution.

## Decisions

### Keep the current typed restore contract

Use `RestoreSessionResult = 'authenticated' | 'unauthenticated' | 'unavailable'` from `main` rather than porting the branch's `backend-unavailable` spelling. This avoids churn in existing `main` tests and keeps the smallest implementation delta.

### Move startup ownership to the root route

Update `/` so an `unavailable` restore result returns startup page data instead of redirecting to `/auth`. Add root startup UI that polls health and invalidates routing after recovery, matching the branch's central recovery model.

This is preferred over leaving ownership in `/auth` because `/auth` is an authentication surface, not a neutral application startup state. It also makes PWA launch behavior match the documented session-aware root route more directly.

### Redirect indeterminate `/auth` and protected loads to `/`

When `/auth` or the protected app layout receives `unavailable`, redirect to `/`. The root route then owns polling and the final authenticated or unauthenticated destination.

This is preferred over duplicating retry loops in multiple route components and keeps startup timeout behavior in one place.

### Keep `/auth` controls guarded

During the transition, retain the `main` safeguard that authentication controls are not rendered before an indeterminate session is retried. If `/auth` redirects to `/` before rendering for `unavailable`, the existing auth-page retry code may be simplified only after equivalent root coverage exists.

## Risks / Trade-offs

- [Root invalidation can loop if health succeeds but refresh still returns unavailable] -> Keep the root startup state active until a later route load produces `authenticated` or `unauthenticated`, and retain the retry budget.
- [Changing `/auth` unavailable handling can regress direct-auth startup behavior] -> Add route and component tests for `/auth` redirecting through `/` and for root recovery to both `/lists` and `/auth`.
- [Protected deep links are not restored] -> Keep this as an explicit non-goal consistent with the old branch; recovered authenticated users can land on `/lists`.
- [Duplicate startup implementations can drift] -> Centralize polling in root and remove or bypass auth-page polling once route-level redirection makes it unused.

## Migration Plan

1. Update root load and root page startup UI to own unavailable session recovery.
2. Update `/auth` and protected route loads to redirect `unavailable` to `/`.
3. Remove redundant auth-page startup retry paths only after root-owned behavior has tests.
4. Add tests for store classification, root startup UI, route redirects, and e2e recovery.
5. Roll back by restoring `/auth` as the startup owner and redirecting root/protected unavailable cases to `/auth`.

## Open Questions

None.
