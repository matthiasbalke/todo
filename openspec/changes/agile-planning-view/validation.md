# Validation

Review URL: https://todo-notebook.example.com

Enable **Account → Show Agile View**, then use **Agile** on existing item cards or
in the **Personal planning** section of item details. The feature starts disabled.
The development stack retains existing PostgreSQL data, accounts and certificates.

## Automated checks

- Backend: Java 21, real PostgreSQL through the existing Testcontainers setup;
  `./gradlew test` and `./gradlew build` passed. The final expanded suite contains
  267 tests, including 11 Agile integration tests. Coverage includes membership
  restoration, personal isolation, viewers, invalid/stale ordering, retained
  checked slots, concurrent append/reorder/completion, immediate-parent recurrence
  inheritance/removal, rollback, duplication, preference compatibility, unique
  selections, and cascading deletion.
- Frontend: Compose `bun run check` passed with zero errors/warnings;
  `bun run test -- --run --maxWorkers=1` passed all 899 tests in 95 files;
  `bun run build` passed. After adding confirmed-state refresh following reorder,
  the affected store/page tests passed again (10 tests).
- Playwright: Agile plus list/item/Today/recurrence regression run passed all
  27 tests. A final Agile-only run after the confirmed-state refresh passed all
  four tests, including setup. These tests use real passkeys and email verification.
- HTTPS `/actuator/health` returned `UP` using `.certs/cert.pem`.
- OpenSpec reports 21/21 tasks complete. `git diff --check` passed.

## Browser review

Inspected desktop (1280px) and touch (390px) screenshots. Browser coverage verifies
cross-list source links, item-detail return navigation, source-order/audit
preservation, completed slots, Hide checked persistence, opt-in/disable/re-enable,
viewer source restrictions, two-user recurrence inheritance and explicit removal,
source deletion, keyboard movement and focus restoration, mouse/touch reordering,
reload persistence and long-list auto-scroll in the app scroll container.

Screenshots are generated under `e2e/test-results/` as `agile-desktop.png` and
`agile-touch.png`. Test reports are under `backend/build/reports/tests/test/` and
`e2e/playwright-report/`.

## Reproduction notes

The HTTPS origin and Mailpit port come from `.env.dev`:

```sh
BASE_URL=https://todo-notebook.example.com
MAILPIT_HOST=todo-notebook.example.com
MAILPIT_STARTTLS_API_URL=http://todo-notebook.example.com:8025
```

Browser tests ran with `TZ=UTC` because the sandbox's inherited `CET-1` timezone
is rejected by the existing preference API. Chromium was installed in the writable
`/tmp/agile-browsers` directory to match the repository's Playwright version.
`PLAYWRIGHT_BROWSERS_PATH=/tmp/agile-browsers` selects it. The CLI was invoked as
`node node_modules/@playwright/test/cli.js` from `e2e/`, avoiding the environment's
unrelated global Playwright installation.

Backend commands used the installed Java 21, a temporary Java truststore containing
the sandbox proxy CA, and `--no-daemon --max-workers=1`. Frontend tests used one
worker to keep memory usage bounded while leaving the review stack available.
