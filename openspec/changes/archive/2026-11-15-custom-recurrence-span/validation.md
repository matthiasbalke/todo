# Validation

Validated on 2026-11-15 against issue #311.

- Backend: the full Gradle suite passed (256 tests) using real PostgreSQL through Testcontainers. After final validation hardening, the focused recurrence suite passed again (9 tests), including atomic overflow rejection for all four interval units, invalid weekday input, and duplication.
- Frontend: Svelte check passed with zero errors and warnings. The final full Vitest suite passed (90 files, 835 tests), including draft restoration and list/Today transport regressions.
- Browser: targeted Playwright recurrence coverage passed (4 tests including setup), covering custom intervals, weekday persistence, editing, Today transport, and linked successors. The later optional draft-field compatibility adjustment is covered by component tests.
- OpenSpec strict validation and `git diff --check` passed; all 20 tasks are complete.

The shared HTTPS deployment was unreachable, so browser validation used the local development Compose stack, as permitted by the instructions active at the time. Temporary browser configuration and hostname resolution were used only for this sandbox. Backend validation used a temporary wrapper copy and truststore; frontend checks used the development image because host dependency executables were unavailable. No dependency, schema, or production configuration changes were required.

The original stash remains intact; unrelated stashed CSS and Git attribute edits were not restored. The user confirmed recurrence works as expected on 2026-11-15. Specs were synced and the change archived after that review.

## Live review follow-up

The previously running host backend reproduced the reported Friday/Saturday loss: quick-add sent both weekdays, but create and subsequent GET responses omitted them. It also accepted an empty weekday list, unlike this branch's validation.

Started the sandbox development stack from the current branch and verified the actual browser flow: the quick-add chip, POST request, POST response, list card, item-details editor, and reloaded details all retain Friday and Saturday. All Compose services are healthy and were left running for user review.

Startup also exposed a race between continuous compilation and bootRun: regenerated build timestamps caused concurrent resource writes and a missing build-info.properties file. Compose development now excludes the build timestamp, following Spring Boot's documented option, so bootBuildInfo and processResources remain up-to-date across those invocations. Production build information is unchanged. Verified successful startup with both processes running.
