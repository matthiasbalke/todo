# Todo

A personal/household app for managing todos, grocery shopping, and recurring household tasks.

## Features

- **Grocery lists** — items organized by category (store/aisle), shared in real time, with a dedicated in-store view
- **Todos** — due dates, priorities, assignments, notes, and photo attachments
- **Recurring tasks** — chores that auto-regenerate on a configurable schedule when completed
- **Shared lists** — invite household members by email with OWNER / EDITOR / VIEWER roles
- **PWA** — installable on iPhone, works offline, push notifications for due/assigned items

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Kotlin + Spring Boot, Java 25 |
| Frontend | SvelteKit + TailwindCSS (PWA) |
| Database | PostgreSQL |
| Auth | Passkey (WebAuthn) + Google OAuth2 — no passwords |
| Real-time | Server-Sent Events (SSE) |
| Deployment | Docker Compose |

## Running Locally

```bash
docker compose up --build
```

Frontend: http://localhost:3000
Backend API: http://localhost:8080

## Development

**Backend**
```bash
cd backend
./gradlew bootRun        # start dev server
./gradlew test           # run tests
```

**Frontend**
```bash
cd frontend
bun install
bun run dev              # start Vite dev server
bun run test -- --run    # run unit tests
```

**E2E tests**
```bash
cd e2e
bun install
bunx playwright test
```

## Architecture

See [`docs/requirements.md`](docs/requirements.md) for the full requirements and architecture document, including data model, API shape, and feature specification.

## CI/CD

| Workflow | Trigger |
|---|---|
| CI (build + unit tests) | Push / PR → `main` |
| E2E (Playwright) | Push → `main` |
| Release (Docker images → `ghcr.io`) | Push → `main` or `v*` tag |

## License

MIT — Matthias Balke
