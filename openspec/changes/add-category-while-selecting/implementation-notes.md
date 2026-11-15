# Implementation and validation

## Result

Issue #307 is implemented using the existing category API. Optional creation in Select/CategorySelect persists the trimmed name in the current list, selects the returned ID, and preserves normal quick-add submission and existing-item autosave. Owner/editor capability checks, accessible pending/error state, retry, and dismissal guards are covered. No backend or database changes were required.

## Spec review

- Creation eligibility: nonempty trimmed name, no case-insensitive exact match, enabled callback and picker; partial matches remain first and duplicate-name categories retain their IDs.
- Activation: Enter, keyboard navigation, mouse, and touch use the shared listbox; Enter does not submit the item.
- Lifecycle: one pending request, persisted ID emitted once, prior selection preserved on rejection, retryable error, no late selection after dismissal/unmount.
- Persistence: current-list category has no color and appended order; response/SSE upsert by ID; selected label works before SSE; parent deletion removes the cached category.
- Forms: permissions are rechecked before creation; draft fields remain intact; normal submission/autosave saves the real ID; discarding a draft leaves the shared category.
- Documentation: reusable callback contract and interactive showcase accompany selection-only examples.

## Verification

- Backend: direct Gradle test run with Java 21 and Docker/Testcontainers; 256 tests passed, no failures/errors/skips.
- Frontend inside Compose: 91 Vitest files, 883 tests passed; Svelte check had zero errors/warnings; production build passed.
- Feature Playwright: all six scenarios passed (plus global setup), including keyboard quick-add, pointer autosave/reload, editor/viewer authorization, failure/retry, and mobile touch.
- Regression Playwright: category, list, item, and component suites passed (38 tests including setup).
- Strict OpenSpec validation and git whitespace checks passed.

## Environment

Compose uses `compose.dev.yaml` and `.env.dev`, preserving existing data. Backend health is checked with `.certs/cert.pem`. The browser runner uses the configured HTTPS origin and Mailpit port. Playwright runs with `TZ=Europe/Berlin`: the sandbox default timezone is rejected by the existing preferences API. Restarted the frontend after production build to refresh dev-generated files.

The dev stack remains running at https://todo-notebook.example.com for review. Delta specs remain active until the user reviews the implementation; sync and archive follow that review.
