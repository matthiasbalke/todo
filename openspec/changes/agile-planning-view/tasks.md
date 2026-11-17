# Tasks

## 1. Personal planning persistence and APIs

- [x] 1.1 Add the Flyway selection table, entity/repository, foreign keys, and ordering index described in design.md. Verify migration against PostgreSQL through the existing Testcontainers setup, including unique selection and deletion cascades.
- [x] 1.2 Implement authenticated Agile entries/count queries with current membership filtering, source capabilities, and batched assignee data. Verify integration cases for multiple lists, undated items, other assignees, completed counts, viewers, and isolation between two users.
- [x] 1.3 Implement idempotent selection set/unset and transactional append under a per-user lock. Verify repeat selection preserves position, removal preserves the source item, reselect appends, newly flagged unfinished items appear after existing unfinished work and above checked items, inaccessible IDs are rejected, and source fields/audit metadata remain unchanged.
- [x] 1.4 Implement complete accessible unfinished-set reorder validation and atomic position updates while retaining inaccessible selections. Verify duplicate IDs, stale sets, inaccessible IDs, concurrent append/reorder, unchanged source order, retained checked slots, concurrent completion conflicts, and last successful same-set reorder behavior with integration tests.
- [x] 1.5 Cover membership removal/restoration, item/list deletion, recurrence generation, and list duplication in integration tests. Verify hidden selections return in relative order after access restoration and duplicated items start unselected. Implement transactional recurrence-selection inheritance for every selecting user, appending successors while retaining completed slots. Verify another member completing the item, disabled Agile preferences, explicit removal before completion leaving the next occurrence unflagged regardless of ancestor flags, inherited occurrences appended after unfinished work and above checked items, concurrent selection changes, and rollback on failure.
- [x] 1.6 Update docs/requirements.md with the personal selection model, permission boundary, API contracts, concurrency semantics, and lifecycle behavior; verify examples agree with controller integration tests.

- [x] 1.7 Add persisted `agileViewEnabled` defaulting to false for existing/new accounts and extend profile/preference APIs with omission-preserves-value compatibility. Verify migration, all account creation paths, round-trip persistence, unrelated preference preservation, and user isolation with backend tests; document the setting in docs/requirements.md.

## 2. Frontend selection and state

- [x] 2.1 Add typed Agile API helpers and a user-scoped reactive store for entries, selection IDs, counts, loading, and confirmed state. Verify API/store tests cover successful writes, rollback, conflicts, stale account responses, and logout cleanup.
- [x] 2.2 Add a labeled personal Agile toggle to standard item cards and a separate section outside the source-edit form on existing item details. Load selections once per page/store instead of per card; verify component tests for owner/editor/viewer selection and unchanged source mutation permissions.
- [x] 2.3 Add the fixed overview Agile entry and unfinished count outside list/group drag zones. Verify page tests cover Today enabled/disabled placement, zero count, and count refresh after local actions and visibility regain.
- [x] 2.4 Extend the existing item-detail returnTo allowlist from `/today` to also accept `/agile`, preserving rejection of arbitrary destinations. Verify route tests for both supported paths, fallback, and unsafe URLs.

- [x] 2.5 Add the account Agile toggle using existing preference autosave/rollback behavior; gate overview entry, selection controls, and automatic Agile fetches on the saved preference. Redirect disabled `/agile` access to `/lists` while retaining backlog data. Verify account/page/store tests for default disabled, persistence, failure rollback, disable/re-enable restoration, and independent view preferences.

## 3. Agile page and interactions

- [x] 3.1 Build the protected flat `/agile` page with source links, item details, selection removal, empty/loading/error states, and capability-aware source actions. Verify page tests for cross-list sequence, mixed permissions, completed items appearing below unfinished items while retaining saved slots, and relevant action reconciliation.
- [x] 3.2 Add an independent planning drag wrapper using existing drag/auto-scroll patterns, plus keyboard movement and announcements. Verify component tests and focused Playwright coverage for mouse, touch, keyboard, long-list auto-scroll, focus, and viewer planning without source edits.
- [x] 3.3 Add user-scoped Hide checked preferences while keeping unfinished-item reorder available. Verify tests that checked items retain planning slots, A/B/C becomes C/B/A after checking B and reversing unfinished A/C then reopening B, completion/reopen updates counts, failed actions roll back, and showing checked restores the checked section.
- [x] 3.4 Wire page load, visibility refresh, local-action refresh, conflict recovery, and account reset. Verify store/page tests for another-session updates, retryable failures, and no previous-account content on account changes.
- [x] 3.5 Add e2e/tests/agile.spec.ts using existing authentication/API helpers. Verify default disabled, account enable/disable and backlog restoration, selection from cards/details, persistence after reload, two-user isolation, cross-list reorder, viewer behavior, completion, recurrence inheritance and explicit removal on the successor, deletion, and detail return navigation.

## 4. Integrated validation and review

- [x] 4.1 Run `./gradlew test` and `./gradlew build` in backend with Java 21 and Docker; fix failures and record results.
- [x] 4.2 Reuse or repair the Compose development stack without resetting data. Run frontend `bun run check`, `bun run test -- --run`, and `bun run build` inside its container; fix failures and record results.
- [x] 4.3 Derive the HTTPS origin and Mailpit settings from .env.dev, verify `/actuator/health` using the project certificate, and run focused Agile E2E followed by the relevant list/item/Today/recurrence regression tests; fix failures and record results.
- [x] 4.4 Inspect the resulting desktop and touch behavior against every Agile scenario, including source-order preservation and personal permissions. Leave the healthy stack running and provide its review URL with validation evidence.

## Workflow follow-up

- After implementation succeeds and the user reviews it, sync delta specs and archive this change using the corresponding OpenSpec skills.
- If a pull request is requested, target main; do not merge it or enable automatic merging.
