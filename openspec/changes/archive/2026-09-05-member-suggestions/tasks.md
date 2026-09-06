## 1. Backend Suggestions API

- [x] 1.1 Add a lightweight member suggestion DTO and `GET /api/lists/{id}/members/suggestions` endpoint, and verify the route requires an authenticated user.
- [x] 1.2 Add repository/service logic that returns distinct users sharing at least one list with the requesting user while excluding the requesting user and current-list members, and verify with backend integration tests.
- [x] 1.3 Enforce owner-only authorization for member suggestions, and verify owners can retrieve suggestions while editors, viewers, and non-members cannot.
- [x] 1.4 Extend the existing Bucket4j rate-limit filter/configuration pattern to `POST /api/lists/{id}/members`, and verify repeated arbitrary invite attempts eventually return a rate-limit response.
- [x] 1.5 Preserve invite-by-email behavior and ensure unknown invitee emails return a non-enumerating failure response, and verify `POST /api/lists/{id}/members` tests cover the response status/body used by the frontend.

## 2. Frontend API And Controls

- [x] 2.1 Add frontend API types/client support for member suggestions, and verify the client builds/type-checks.
- [x] 2.2 Add a suggestion-aware invite email control that lets owners choose a suggestion or submit a typed valid email not present in suggestions, and verify with component tests.
- [x] 2.3 Load suggestions when an owner opens the membership dialog and exclude already-loaded members from the invite choices defensively, and verify the dialog test covers suggested and unsuggested invite submissions.

## 3. Membership Presentation And Errors

- [x] 3.1 Add a shared list-role label formatter and use it for member badges and role selects, and verify labels render as `Owner`, `Editor`, and `Viewer`.
- [x] 3.2 Update member invite error handling so missing accounts show a non-enumerating invite failure message instead of a generic permission message, and verify the dialog test covers this error path.
- [x] 3.3 Update member invite error handling so rate-limited attempts tell the owner to wait before trying again, and verify the dialog test covers this error path.
- [x] 3.4 Preserve existing role-change and remove-member behavior while updating labels, and verify existing `MembersDialog` tests still pass.

## 4. Validation

- [x] 4.1 Run backend membership integration tests with `cd backend && ./gradlew test --tests "com.github.matthiasbalke.todo.lists.ListIntegrationTest"` and verify they pass.
- [x] 4.2 Run frontend validation with `cd frontend && bun run check` and targeted Vitest coverage for membership components/API, and verify both pass.
- [x] 4.3 Run `openspec validate member-suggestions --strict` and verify the change artifacts are valid.
