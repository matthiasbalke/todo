## Context

See proposal.md for motivation. List membership management currently has `GET/POST /api/lists/{id}/members` plus role update/removal endpoints. Inviting by unknown email already returns `404` from the backend, but frontend fallback handling can still surface the generic `403` message depending on the received error shape. The membership dialog uses the shared `Select` for roles and a separate `EmailInput` for invite email entry.

## Goals / Non-Goals

**Goals:**

- Add a list-scoped suggestion API whose results are limited to users who directly share at least one list with the authenticated user.
- Make membership suggestions available only to owners because member invites are owner-only.
- Preserve free-form email invites for accounts that are not suggested.
- Protect arbitrary invite attempts with rate limiting and non-enumerating failure messages.
- Reuse existing membership data instead of adding a contacts table or invitation model.
- Present role labels through a small shared formatting helper so display and select labels stay consistent.

**Non-Goals:**

- No invitation-by-email for users who do not already have an account.
- No global contact book, contact search, or discovery of all registered users.
- No changes to write-side membership authorization semantics; adding members remains owner-only.
- No persistence of dismissed or favorite suggestions.

## Decisions

1. Add a list-scoped suggestion endpoint.

   Use `GET /api/lists/{id}/members/suggestions` returning lightweight user suggestions, for example `{ userId, email, displayName }`. The endpoint is separate from `GET /members` because suggestions are not list members and have different authorization/privacy semantics while still being grouped under membership management.

   Alternative considered: add suggestions to the members response. That would make every member load compute suggestions even for read-only viewers and would blur two different result sets.

2. Authorize suggestions with owner-level access.

   Require `OWNER` on the target list, matching the existing `POST /members` authorization. Editors cannot add members, so suggestion access would expose extra relationship information without enabling an action they are allowed to complete.

   Alternative considered: allow editors to retrieve suggestions. That was rejected because adding members remains owner-only. Allowing all list members was also rejected because viewers should not receive additional relationship information.

3. Derive suggestions with a direct shared-list query.

   The query should find users who are co-members of any list containing the authenticated user, then exclude the authenticated user and anyone already in the target list. This prevents transitive exposure of "contacts of contacts" because every suggested user must share a concrete list with the authenticated user.

   Alternative considered: load all current user's memberships and merge members in application code. That is workable for small data, but a repository query with `DISTINCT` and exclusions keeps behavior easier to test and avoids unnecessary object loading.

4. Keep typed email as first-class input.

   The dialog should replace the invite `EmailInput` with a suggestion-aware email combobox or an adapter around the shared `Select` that supports a custom typed string. The submitted request should still send `{ email, role }`, whether the email came from a suggestion or from typed input.

   Alternative considered: force selection from suggestions. That would violate the requirement to invite account emails that are not already suggested.

5. Avoid account enumeration on arbitrary invite attempts.

   Unknown-account invite attempts should not return UI copy that confirms whether the email exists on the instance. The backend can continue using an appropriate status/code internally, but the frontend should present a non-enumerating message such as "We couldn't add that member. Check the email address and try again." The response should still avoid falling through to generic permission messaging.

   Alternative considered: show "No account found with that email address." That is clearer for legitimate owners, but it turns the invite endpoint into a registered-user oracle. Changing global `friendlyError` handling for all `404`s was also rejected because it risks less accurate messages in unrelated screens.

6. Rate-limit member invite attempts.

   Apply server-side throttling to `POST /api/lists/{id}/members` using the existing Bucket4j-based rate-limit configuration under `app.security.rate-limit.*`. The current filter applies that configuration to auth/setup endpoints; this change should extend or generalize the existing filter/configuration pattern rather than introduce a second rate-limiting library or unrelated configuration namespace. Scope buckets at least by source address and, where the authenticated principal is available at the filter point, include the authenticated user as part of the key.

   Alternative considered: add separate member-invite rate-limit settings. That gives finer tuning but increases configuration surface before there is evidence that member invites need a different threshold than other sensitive endpoints. Relying only on non-enumerating UI copy was also rejected because it reduces visible signal but does not reduce backend probing volume or abuse pressure.

   The suggestions endpoint itself should not receive special rate limiting in this change. It has no arbitrary email/query input, is owner-only, and only returns direct shared-list contacts, so authorization and data scoping are the primary controls.

7. Add audit-log planning coverage without implementing audit storage in this change.

   This change should update the existing `audit-log` spec so future audit implementation records suggestion access, unknown invite attempts, and rate-limit denials. Because audit logging is not implemented yet, member suggestion implementation should not block on audit persistence.

   Alternative considered: implement audit storage as part of this change. That would turn a focused membership UX/security change into a larger cross-cutting audit project.

8. Format roles through a helper.

   Add a small role-label helper such as `formatListRole(role)` and use it for member badges and role select labels. Role values remain enum strings in API payloads; only presentation changes.

## Risks / Trade-offs

- Suggestion query accidentally includes current-list members -> Cover with backend integration tests for overlapping list memberships.
- Suggestion query leaks indirect contacts -> Add a test where another member shares a separate list with a third user and ensure the third user is not suggested.
- Free-form combobox diverges from shared control behavior -> Keep the component small, test keyboard/filter/input submission behavior, and reuse shared styling primitives where practical.
- Rate limiting inconveniences legitimate bulk setup -> Reuse the existing configurable capacity/window so deployments can tune normal household sharing bursts and return retry guidance.
- Non-enumerating invite errors are less specific -> Keep the message actionable without confirming account existence.
- Audit requirements are planned but not implemented -> Capture the audit behavior in the existing audit-log spec and keep runtime implementation scoped to rate limiting for now.
- Backend error body shape varies across Spring error responses -> Prefer checking status plus a stable backend error code if introduced; keep the existing status-based fallback as defense.

## Migration Plan

No data migration is required. Deploy backend and frontend together so the dialog only calls the suggestion endpoint when the implementation is available. Rollback is safe because no persisted schema changes are introduced.
