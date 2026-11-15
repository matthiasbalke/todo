# Validation

Validated on 2026-11-15 with Docker Compose and the configured mkcert hostname.

## Automated checks

- OpenSpec strict validation: passed.
- `zsh scripts/tests/dev-environment.test.sh`: passed, including invalid hostname/port and missing certificate checks.
- `zsh scripts/tests/dev-reload.test.sh`: passed with the real Gradle continuous task and an isolated offline Java fixture; source/resource edits, failed-build trigger stability, recovery, and idle stability verified.
- Backend `test`: 250 tests passed with real Testcontainers PostgreSQL.
- Frontend `bun run check`: no errors or warnings.
- Frontend Vitest: 87 files, 805 tests passed.
- Playwright authentication: 16 tests passed against the default HTTPS proxy. Another 3 tests passed on alternate port 4443, covering setup readiness, email verification, and passkey sign-in.
- Existing HTTPS helper tests: 18 passed using a temporary LF-normalized copy of the unchanged helpers.
- Development zsh syntax checks, Compose config, and `nginx -t`: passed.

## Live stack checks

- Cold image/dependency startup; non-root Node/Vite and Java/Gradle processes; read-only source mounts and named generated-output/cache volumes.
- Direct backend health, direct HTTPS frontend API routing, and HTTPS proxy health/pages on default ports 8080/5173/443 and alternate ports 18080/55173/4443. Mailpit inbox on 8025 and 18025.
- Browser CSS HMR through both direct frontend and proxy entrypoints, including alternate ports; temporary edits restored.
- Real Kotlin controller and resource edits caused DevTools restarts. A deliberate compile error retained the serving application and trigger; fixing it recovered automatically. No idle restart loop. Temporary probe files removed.
- Native browser EventSource received item events without buffering, reconnected after a DevTools restart, and received subsequent events. Development immediate shutdown prevents SSE from delaying restart for the graceful-shutdown timeout.
- STARTTLS email captured by Mailpit; alternate-port passkey/email verification passed. Derived public URL, allowed origins, and relying-party ID matched the configured hostname/ports.

- Recreated frontend and backend individually while retaining the same nginx container; routing recovered through Docker DNS resolution.
- Full Compose shutdown removed all development containers. Startup retained a database marker row, Gradle cache marker, and frontend dependencies; test markers were removed afterward. Default-port health recovered after restart.

## Validation environment

The sandbox required a temporary, uncommitted proxy/truststore Compose override for outbound dependency downloads. Browser tests used the installed Chromium executable, a temporary hostname mapping, and an explicit supported browser timezone. Existing CRLF host helpers were normalized only in a scratch directory. These adaptations are not part of the development stack.

Gradle continuous compilation was verified on this sandbox's Docker bind mounts. Docker Desktop/remote filesystem event delivery remains platform dependent, as documented in the development guide.
