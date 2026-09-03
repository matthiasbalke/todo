## 1. Backend Qualification

- [x] 1.1 Update the Today item query to qualify items through current-user list membership, current-user assignment, and unassigned single-member list checks; verify existing Today ordering projection fields are still returned by `TodayIntegrationTest`.
- [x] 1.2 Update the Today unfinished count query to use the same qualification predicate as the item query; verify `/api/today/count` matches incomplete qualifying items in integration tests.
- [x] 1.3 Keep assigned-user response mapping unchanged so unassigned qualifying items return `assignedUsers: []`; verify the Today API response for an unassigned single-member item contains an empty assigned-user list.

## 2. Test Coverage

- [x] 2.1 Add an integration test proving an unassigned item due today in a single-member list appears in `/api/today` and increments `/api/today/count`.
- [x] 2.2 Add an integration test proving an unassigned overdue item in a single-member list appears in `/api/today`.
- [x] 2.3 Add an integration test proving an unassigned due item in a multi-member list is excluded from `/api/today` and `/api/today/count` for all members.
- [x] 2.4 Run `cd backend && ./gradlew test --tests "com.github.matthiasbalke.todo.items.TodayIntegrationTest"` and verify the focused Today integration tests pass.

## 3. Validation

- [x] 3.1 Run `openspec validate today-item-without-assignee --strict` and verify the change artifacts are valid.
