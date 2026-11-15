# Agent Guide

## Project map

Household todos, groceries, and recurring tasks. Requirements: `docs/requirements.md`.

| Path | Purpose |
|---|---|
| `backend/` | Kotlin, Spring Boot, Java 21, Gradle, PostgreSQL, Flyway |
| `frontend/` | SvelteKit 2, Svelte 5, Tailwind 4, Vite, Bun, PWA |
| `e2e/` | Playwright tests and authentication/email helpers |
| `compose.dev.yaml`, `dev/` | Development services, HTTPS proxy, reload scripts |
| `compose.yaml`, `all-in-one/` | Deployment/CI stack and combined image |
| `openspec/` | Main specs, active changes, archives |

Read versions from `backend/build.gradle.kts` and `frontend/package.json`. Read CI/release behavior from `.github/workflows/`; dependencies from `.github/renovate.jsonc`.

## Working rules

- Use Context7 for library/API documentation, code generation, setup, and configuration.
- Read nested `AGENTS.md` files for affected directories.
- Remove unused imports from modified implementation and test files.
- Repository `.sh` helpers use `#!/usr/bin/env zsh`; execute shell-sensitive helpers with zsh.
- Avoid Bash-only syntax, zsh special parameter names (`status`, `path`), and `wait -n`.
- Keep human setup details in `docs/development-compose.md`; keep agent instructions here.

## Development: Compose first

- Docker is available to agents. Start, inspect, rebuild, restart, and diagnose the dev stack without asking permission.
- Use `compose.dev.yaml` with `.env.dev`. Configuration/setup: `docs/development-compose.md`, `.env.dev.example`.
- `.env.dev` owns `LOCAL_HTTPS_DOMAIN` and `DEV_*_PORT` values. `.local-domain` and host HTTPS launchers are legacy alternatives, not Compose prerequisites.
- Reuse a healthy dev stack. If unavailable, inspect Docker, Compose state, and logs; start or repair it. Escalate only an actual unresolved external blocker.
- Preserve existing configuration, certificates, accounts, and database data. Do not run `down --volumes` or reset data without explicit authorization.

Run from the repository root; `dc` below is a shell function for this session:

```sh
dc() { docker compose --env-file .env.dev -f compose.dev.yaml "$@"; }
dc up --build -d
dc ps
dc logs --tail=100 backend frontend proxy
dc restart backend
```

| Change | Reload action |
|---|---|
| Frontend source | Vite HMR; enable `DEV_FRONTEND_POLLING` if filesystem events fail |
| Backend source/resources | Gradle continuous compilation + DevTools after successful build |
| Backend build/dependencies | `dc restart backend` |
| Frontend dependencies | Update Bun lockfile, then `dc restart frontend` |
| Dev Dockerfiles/runtime versions/Gradle wrapper | `dc up --build -d` |

Sources are mounted read-only; dependencies, generated files, and backend build output use named volumes. Prefer frontend checks inside its container to avoid host dependency conflicts.

## Validation

1. Run relevant unit/integration tests and static checks; fix failures.
2. Run E2E against the healthy Compose application after those checks pass.
3. Inspect resulting behavior against requirements. Leave the dev stack running and report its review URL.

### Backend

Run directly in the agent environment with Java 21 and Docker. Testcontainers starts real PostgreSQL; no host watcher or trigger files are needed.

```sh
(cd backend && ./gradlew test)
(cd backend && ./gradlew test --tests 'FullClassName')
(cd backend && ./gradlew build)
```

- Integration tests use the existing `AbstractIntegrationTest` / Testcontainers configuration; no database mocks.
- Diagnose Docker/Testcontainers failures directly; do not replace integration tests with mocks or assume Docker is unavailable.
- Reports: `backend/build/reports/tests/test/`; XML: `backend/build/test-results/test/`.

### Frontend

From the repository root, using the `dc` function above:

```sh
dc exec -T frontend bun run check
dc exec -T frontend bun run test -- --run
dc exec -T frontend bun run build
```

### E2E

- Derive the HTTPS origin from `.env.dev`: `https://<LOCAL_HTTPS_DOMAIN>` plus `:<DEV_PROXY_PORT>` when not 443. Set `BASE_URL` explicitly; do not rely on the legacy `.local-domain` fallback.
- Check `<origin>/actuator/health` with `curl -fsS --cacert .certs/cert.pem` before browser tests.
- The browser hostname must match TLS and WebAuthn configuration. Inside a sandbox, loopback refers to the sandbox; diagnose host routing/DNS separately and use `host.docker.internal` where appropriate.
- Resolve Mailpit access using `DEV_MAILPIT_PORT` (default 8025); configure `MAILPIT_HOST` and `MAILPIT_STARTTLS_API_URL` when defaults do not reach the Compose services.
- Run from `e2e/`: `bun install --frozen-lockfile`, then `BASE_URL="<origin>" bunx playwright test`. Append a spec path for focused runs.
- Reuse `e2e/tests/helpers.ts` for passkey registration, email verification, and API fixtures.

### Shell helpers

```sh
zsh scripts/tests/dev-environment.test.sh
zsh scripts/tests/dev-reload.test.sh
zsh scripts/tests/local-domain.test.sh  # legacy launcher coverage
zsh -n path/to/script.sh
```

## Git and OpenSpec

- Use Conventional Commits and feature branches; reuse the current feature branch or create one named for the change.
- Open PRs targeting `main`. Never merge PRs or enable automatic merging.
- Implement OpenSpec changes with `openspec-apply-change`; update task checkboxes as work completes.
- Independently verify specs/tasks using the validation workflow above before declaring readiness.
- After implementation succeeds and the user reviews it, sync delta specs and archive the change.

## Architecture constraints

- Auth: passkeys/WebAuthn or Google OAuth2; no stored passwords. Email is required.
- Compose derives WebAuthn RP ID, public URL, and CORS origins from its domain/ports in `dev/container-env.sh`.
- Real-time: SSE per list (`GET /api/lists/{id}/events`).
- Recurrence: completing an item creates the next instance from its original due date; retain completed instances linked by `parentItemId`.
- Sort items within category groups; uncategorized items form their own group.
- Attachments support configurable local filesystem or S3-compatible storage.
