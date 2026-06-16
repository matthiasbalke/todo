# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Memory
After any bigger update or troubleshooting, update the MEMORY.md with your findings.

## Documentation

Always use Context7 when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

## Project

A personal/household todo app (MIT License, Matthias Balke) covering grocery shopping, regular todos, and recurring household tasks. Full requirements and architecture are in `docs/requirements.md`.

## Status

Early setup — no source code exists yet. The `.gitignore` is pre-configured for Java/Kotlin + Gradle + Node.

## Planned Tech Stack

- **Backend:** Kotlin + Spring Boot, Java 21 (LTS), Gradle
- **Frontend:** SvelteKit + TailwindCSS + Vite, PWA via `@vite-pwa/sveltekit`
- **Database:** PostgreSQL
- **Auth:** Spring Security 6.3+ (WebAuthn/passkeys + Google OAuth2 + JWT) — no passwords stored
- **Real-time:** SSE (Server-Sent Events)
- **Push notifications:** Web Push API via `java-webpush`
- **Deployment:** Docker Compose (backend + frontend + PostgreSQL + optional MinIO)
- **Helper Scripts:** zsh compatible shell scripts

## Planned Project Structure

```
todo/
├── backend/          # Kotlin Spring Boot (auth/, lists/, items/, audit/, push/, sse/)
├── frontend/         # SvelteKit PWA (routes/, lib/api/, lib/stores/, lib/components/)
├── e2e/              # Playwright end-to-end tests
└── docker-compose.yml
```

## GitHub Actions

| Workflow | Trigger | Jobs |
|---|---|---|
| `ci.yml` | push/PR → `main` | backend (Gradle build + tests) and frontend (type-check + Vitest) in parallel |
| `e2e.yml` | push → `main` only | full stack via `docker compose`, then Playwright (Chromium only) |
| `release.yml` | push → `main` or `v*` tag | build + push backend and frontend Docker images to `ghcr.io` in parallel |

Docker images are tagged with branch name, short SHA, and semver (on tags). Layer caching uses GitHub Actions cache (`type=gha`). Dependabot covers Gradle, npm (frontend + e2e — Dependabot uses `package-ecosystem: npm` which works for bun projects), Dockerfiles, and Actions — all on a weekly schedule.

## Planned Commands

### Backend
```bash
./gradlew test                         # all tests
./gradlew test --tests "FullClassName" # single test class
./gradlew build                        # build
./gradlew bootRun                      # run locally
```

### Frontend
```bash
bun install        # install deps
bun run check      # Svelte type-check
bun run test       # Vitest unit tests
bun run build      # production build
bun run dev        # dev server (Vite HMR)
```

### Agent e2e workflow

- The agent runs in a `zsh` environment in this workspace. Use `zsh`-compatible commands and prefer direct `zsh` execution for shell-sensitive tasks.

- For Playwright e2e runs, first source `scripts/load-local-domain.sh` from the repo root and resolve `LOCAL_HTTPS_DOMAIN` from the tracked `.local-domain` file.
- Check whether the shared HTTPS deployment is reachable with `curl` before starting any local stack. Prefer `curl -fsS --cacert .certs/cert.pem https://${LOCAL_HTTPS_DOMAIN}/actuator/health` and treat a successful response as the signal to use that deployment.
- If the HTTPS deployment is reachable, run Playwright `BASE_URL="https://${LOCAL_HTTPS_DOMAIN}" bunx playwright test` from `e2e/`.
- To run one spec, append its path, for example `BASE_URL="https://${LOCAL_HTTPS_DOMAIN}" bunx playwright test tests/auth.spec.ts`.
- If the HTTPS deployment is not reachable, do not assume Docker or PostgreSQL are available to the agent. Escalate or ask the user for the next environment-specific step instead of trying to bring up a local stack.
- This rule is agent-specific. Keep human-facing setup and local development instructions in `README.md` and related docs.

## Known Constraints & Future Upgrades

- **Java version is 21 (not 25)** — Kotlin 2.2.x does not yet support JVM target 25 (falls back to 24, causing a Java/Kotlin compiler target mismatch at build time). Java 21 LTS is used until Kotlin adds JVM 25 support. Upgrade path: bump `languageVersion` in `build.gradle.kts` and the base images in `backend/Dockerfile` once a Kotlin release lists JVM 25 as a supported target.

## Key Architecture Decisions

- **No passwords** — authentication is passkey (WebAuthn, Spring Security 6.3 built-in) or Google OAuth2 only. Email is always required as the primary identifier.
- **WebAuthn Relying Party ID** is configured via `WEBAUTHN_RP_ID` env var (`localhost` in dev, domain in prod).
- **Real-time updates** use SSE per-list (`GET /api/lists/{id}/events`), not a global WebSocket.
- **Recurrence** — on mark-done, the backend creates the next instance using the original due date as base (not completion date). Completed instances are kept and linked via `parentItemId`.
- **Sorting** is applied within category groups; items with no category form their own group.
- **Backend tests** must use Testcontainers for a real PostgreSQL instance — no DB mocks. Share a single container via `AbstractIntegrationTest` base class.
- **File storage** (attachments) is configurable between local filesystem and S3-compatible via env var.
