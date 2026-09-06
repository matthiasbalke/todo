## 1. Persistence And Repository Contract

- [ ] 1.1 Add a Flyway migration that enforces unique user email identity with a unique index on `lower(trim(email))`, and verify backend startup tests apply migrations successfully.
- [ ] 1.2 Replace exact-case `UserRepository` email identity methods with trimmed, case-insensitive lookup and duplicate-check methods, and verify repository call sites compile.
- [ ] 1.3 Update all backend email identity call sites to use the trimmed, case-insensitive repository contract for registration, setup, WebAuthn lookup, profile updates, admin edits, member invites, and future OAuth email linking, and verify no exact-case `findByEmail`/duplicate checks remain for identity comparison.

## 2. Backend Behavior Coverage

- [ ] 2.1 Add or update registration tests proving duplicate registration by case/outer-whitespace variation is rejected and no second account is created, and verify the targeted auth test passes.
- [ ] 2.2 Add or update setup tests proving duplicate setup email by case/outer-whitespace variation does not create a second account, and verify the targeted setup integration test passes.
- [ ] 2.3 Add or update profile update tests proving duplicates across accounts are rejected by trimmed lower-case comparison while changing only the current user's own email casing/outer whitespace is allowed and stored trimmed, and verify `UserControllerTest` passes.
- [ ] 2.4 Add or update admin user-management tests proving duplicates across accounts are rejected by trimmed lower-case comparison while changing only the target user's own email casing/outer whitespace is allowed and stored trimmed, and verify `AdminAreaIntegrationTest` passes.
- [ ] 2.5 Add or update WebAuthn user lookup tests proving passkey lookup resolves a stored account with different submitted email casing/outer whitespace, and verify the targeted auth lookup test passes.
- [ ] 2.6 Add or update list member integration tests proving invites match account emails by trimmed lower-case comparison and reject already-current members by trimmed lower-case comparison, and verify `ListIntegrationTest` passes.

## 3. Frontend Behavior Coverage

- [ ] 3.1 Update member suggestion filtering to use deterministic trimmed lower-case email normalization, and verify Svelte type-check passes.
- [ ] 3.2 Add or update `MembersDialog` tests proving suggestion filtering excludes already-loaded members when email casing or outer whitespace differs, and verify `bun run test -- src/lib/components/MembersDialog.test.ts --run` passes.

## 4. Final Validation

- [ ] 4.1 Run `cd backend && ./gradlew test --tests "com.github.matthiasbalke.todo.auth.*" --tests "com.github.matthiasbalke.todo.lists.ListIntegrationTest"` and verify all targeted backend auth/list tests pass.
- [ ] 4.2 Run `cd frontend && bun run check` and `cd frontend && bun run test -- src/lib/components/MembersDialog.test.ts --run` and verify both pass.
- [ ] 4.3 Run `openspec validate case-insensitive-email-comparison --strict` and verify the change artifacts are valid.
