# CI Docker Build Consolidation

## Problem

Before this change, every push to main triggered redundant compilation:

- **ci.yml** — Gradle build + bun build (no Docker)
- **e2e.yml** — Docker build of backend (separate workflow, same trigger)
- **release.yml** — Docker build of backend + frontend again

The backend was compiled 3 times and the frontend 2 times per push.

## Solution

Merged `ci.yml` and `e2e.yml` into a single workflow with the following jobs:

```
compute-version
├── build-backend   (Docker, writes GHA cache scope=backend)
│   └── e2e         (Docker load from cache, no re-compile)
├── build-frontend  (Docker, writes GHA cache scope=frontend)
├── test-backend    (Gradle, parallel with Docker builds)
└── test-frontend   (bun, parallel with Docker builds)
```

## Key Design Decisions

- **Docker builds replace non-Docker CI builds.** The `build-backend` and `build-frontend` jobs use `docker/build-push-action` without `push` or `load` — their only purpose is to populate the GHA layer cache.

- **Tests run in parallel, not inside Docker.** Backend tests use Testcontainers (requires Docker-out-of-Docker, not possible inside a build stage). They run as a parallel Gradle job alongside the Docker builds.

- **E2E reads from cache.** The `e2e` job rebuilds the backend image with `load: true` and `cache-from: type=gha,scope=backend`. Because `build-backend` already populated the cache, this is a fast layer reconstruction — no Gradle compile.

- **Cache is written on push only.** `cache-to` is set only when `github.event_name == 'push'` to avoid PR runs polluting the main-branch cache.

- **release.yml unchanged.** It already uses `cache: true` via the `docker/github-builder` reusable workflow, which benefits from the GHA cache written by CI.
