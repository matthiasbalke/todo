# Validation

Validated on 2026-11-15 against issue #311.

- Backend: the full Gradle suite passed (256 tests) using real PostgreSQL through Testcontainers. After final validation hardening, the focused recurrence suite passed again (9 tests), including atomic overflow rejection for all four interval units, invalid weekday input, and duplication.
- Frontend: Svelte check passed with zero errors and warnings. The final full Vitest suite passed (90 files, 835 tests), including draft restoration and list/Today transport regressions.
- Browser: targeted Playwright recurrence coverage passed (4 tests including setup), covering custom intervals, weekday persistence, editing, Today transport, and linked successors. The later optional draft-field compatibility adjustment is covered by component tests.
- OpenSpec strict validation and `git diff --check` passed; all 20 tasks are complete.

The shared HTTPS deployment was unreachable, so browser validation used the local development Compose stack, as permitted by the instructions active at the time. Temporary browser configuration and hostname resolution were used only for this sandbox. Backend validation used a temporary wrapper copy and truststore; frontend checks used the development image because host dependency executables were unavailable. No dependency, schema, or production configuration changes were required.

The original stash remains intact; unrelated stashed CSS and Git attribute edits were not restored. This change remains active pending user review, after which its specs will be synced and the change archived.
