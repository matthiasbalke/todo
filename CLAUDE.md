# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
./gradlew build                        # build
./gradlew test                         # all tests
./gradlew test --tests "FullClassName" # single test class
./gradlew bootRun                      # run locally
```

### Frontend
```bash
bun install        # install deps
bun run dev        # dev server (Vite HMR)
bun run build      # production build
bun run check      # Svelte type-check
bun run test       # Vitest unit tests
```

### E2E
```bash
bunx playwright test            # all E2E tests
bunx playwright test <file>     # single spec
```

### Full stack
```bash
docker compose up --build      # start all services
```

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
