# Tasks

## 1. Persisted category creation

- [x] 1.1 Add a category-store creation operation returning the server Category and upserting it by persisted ID; verify store tests cover current-list targeting, trimmed name, no color, append order, rejected requests, and SSE/response arrival in both orders.

## 2. Reusable picker behavior

- [x] 2.1 Extend shared Select with an optional creation action distinct from ordinary values; verify tests cover Enter, navigation past partial matches, pointer activation, Escape, no enclosing-form submission, and unchanged selection-only consumers.
- [x] 2.2 Add optional async creation to CategorySelect with trimmed-name eligibility and case-insensitive exact-match suppression; verify tests cover blank input, exact and partial matches, duplicate-name options, and disabled or absent creation.
- [x] 2.3 Implement pending, success, failure/retry, and dismissed-request handling; verify tests prove one request while pending, accessible status/error, preserved prior selection and attempted name, display of the returned category, real-ID emission once, and no late selection after disposal.
- [x] 2.4 Update component README and showcase with creation and selection-only examples; verify showcase tests and documented callback/selection behavior agree with the component.

## 3. Item assignment integration

- [x] 3.1 Wire canManageCategories and current-list creation into quick-add and existing-item editing; verify integration tests for owner/editor availability, viewer restrictions, authorization failure, and correct list targeting.
- [x] 3.2 Preserve draft fields and internal focus through asynchronous creation, select only after success, and reuse normal item autosave/submission; verify form tests cover Enter, pointer activation, pending/failure, retry, no accidental submission/cancellation, and category persistence after draft discard.
- [x] 3.3 Add focused Playwright coverage for quick-add and existing-item creation, keyboard selection, pointer/touch activation, retained draft values, persisted category assignment after reload, and permission gating; verify against the Compose HTTPS deployment.

## 4. Integrated verification

- [x] 4.1 Run frontend Svelte check and focused plus relevant existing Vitest suites; verify all pass and remove unused imports from modified files.
- [x] 4.2 Independently compare the implemented behavior against both delta specs, run backend integration tests directly with Docker/Testcontainers and targeted Playwright flows against the Compose HTTPS deployment, and report review access while leaving the stack running; diagnose and repair the dev stack autonomously as needed.

## Workflow follow-up

- After implementation succeeds and the user reviews the change, sync delta specs and archive according to repository instructions.
