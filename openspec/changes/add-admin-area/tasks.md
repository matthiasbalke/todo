## 1. Backend Data Model

- [ ] 1.1 Add Flyway migration for user admin/block fields, application settings, and passkey recovery tokens.
- [ ] 1.2 Update `User` entity/repository with admin and blocked-account fields plus queries for admin counts and usable-admin invariants.
- [ ] 1.3 Add application settings entity/repository/service for runtime registration-enabled state seeded from existing configuration.
- [ ] 1.4 Add recovery-token entity/repository that stores hashed one-time tokens, target user, expiration, consumed timestamp, and safe identifiers.

## 2. Backend Auth And Setup

- [ ] 2.1 Add setup status API reporting whether setup is required based on zero admin users.
- [ ] 2.2 Implement setup wizard backend flow that creates or promotes the first admin only while no admin exists.
- [ ] 2.3 Include admin state in token responses/current-user payloads so the frontend can show admin navigation.
- [ ] 2.4 Update JWT authentication filtering to reject deleted or blocked users on every authenticated request.
- [ ] 2.5 Update login and refresh flows to reject blocked users and avoid issuing new tokens.
- [ ] 2.6 Invalidate a user's refresh tokens when an admin blocks the account.
- [ ] 2.7 Replace static registration checks with the persistent runtime registration setting while keeping recovery independent from registration-disabled state.

## 3. Backend Admin APIs

- [ ] 3.1 Add admin authorization helpers or service methods and protect every `/api/admin/**` operation server-side.
- [ ] 3.2 Implement admin settings endpoints for reading and changing registration-enabled state.
- [ ] 3.3 Implement admin stats endpoint with counts for users, admins, blocked users, lists, and todo items.
- [ ] 3.4 Implement admin user-list endpoint with email, display name, admin state, blocked state, passkey count, and created timestamp.
- [ ] 3.5 Implement admin user profile update endpoint with email uniqueness validation.
- [ ] 3.6 Implement admin status update endpoint with zero-usable-admin protection.
- [ ] 3.7 Implement block/unblock endpoint with self-block and zero-usable-admin protection.
- [ ] 3.8 Implement recovery-link creation endpoint that rejects blocked target users and returns a manually deliverable URL.
- [ ] 3.9 Implement recovery options and completion endpoints that consume valid recovery tokens, attach a new passkey, and do not issue login tokens.

## 4. Frontend Setup And Routing

- [ ] 4.1 Add frontend API client methods for setup status and setup completion.
- [ ] 4.2 Update root, auth, and protected-route load logic so setup-required state routes to the setup wizard before normal auth routing.
- [ ] 4.3 Add setup wizard page for first-admin creation or promotion.
- [ ] 4.4 Update auth/session handling so blocked-session responses clear local state and route to `/auth`.
- [ ] 4.5 Extend auth user/current profile types and stores with admin state.

## 5. Frontend Admin Area

- [ ] 5.1 Add Admin menu item in the profile menu for admin users only.
- [ ] 5.2 Add admin route structure and dashboard shell.
- [ ] 5.3 Add registration settings UI with immediate save and error handling.
- [ ] 5.4 Add usage statistics dashboard.
- [ ] 5.5 Add user management list with admin/block/profile state.
- [ ] 5.6 Add admin user edit controls for email and display name.
- [ ] 5.7 Add admin status controls with rejected-state feedback.
- [ ] 5.8 Add block/unblock controls with self-block and last-admin rejection feedback.
- [ ] 5.9 Add recovery-link creation UI that displays the generated secret URL for manual delivery.
- [ ] 5.10 Add recovery completion page that registers a passkey, shows success, and links to `/auth` without logging the user in.

## 6. Backend Tests

- [ ] 6.1 Add integration tests for setup-required status and first-admin setup on empty and existing-user databases.
- [ ] 6.2 Add integration tests for admin API authorization rejecting unauthenticated and non-admin users.
- [ ] 6.3 Add integration tests for runtime registration toggle behavior and recovery bypassing registration-disabled state.
- [ ] 6.4 Add integration tests for stats and user-management responses.
- [ ] 6.5 Add integration tests for profile edits and email uniqueness failures.
- [ ] 6.6 Add integration tests for admin grant/revoke and zero-usable-admin protection.
- [ ] 6.7 Add integration tests for blocking, self-block rejection, last-admin block rejection, refresh-token invalidation, and blocked request rejection.
- [ ] 6.8 Add integration tests for recovery-token creation, blocked-user rejection, expired/consumed token rejection, and successful passkey attachment without issuing tokens.

## 7. Frontend Tests

- [ ] 7.1 Add route/load tests for setup-required precedence on `/`, `/auth`, and protected routes.
- [ ] 7.2 Add layout tests for admin menu visibility by admin state.
- [ ] 7.3 Add auth/store tests for blocked-session clearing.
- [ ] 7.4 Add setup wizard component tests.
- [ ] 7.5 Add admin settings, stats, and user-management component tests.
- [ ] 7.6 Add recovery-link display and recovery completion page tests.

## 8. Verification

- [ ] 8.1 Run backend tests with `cd backend && ./gradlew test`.
- [ ] 8.2 Run frontend checks with `cd frontend && bun run check`.
- [ ] 8.3 Run frontend unit tests with `cd frontend && bun run test -- --run`.
- [ ] 8.4 Run focused Playwright coverage for setup, admin menu, blocking, and recovery if the shared HTTPS deployment is reachable.
- [ ] 8.5 Run `openspec validate add-admin-area --strict` and confirm the change is apply-ready.
