<img src="https://github.com/matthiasbalke/todo/blob/main/docs/images/Todo%20Webbanner%20GitHub.png?raw=true" height="400">

# Todo

A personal/household app for managing todos, grocery shopping, and recurring household tasks.

## Features

- **Today view** — review assigned due and overdue work across readable lists, grouped by source list/category with role-aware item actions and a timezone-based date boundary

- **Grocery lists** — items organized by category (store/aisle), shared in real time, with a dedicated in-store view
- **Todos** — due dates, priorities, assignments, notes, and photo attachments
- **Recurring tasks** — chores that auto-regenerate on a configurable schedule when completed
- **Shared lists** — invite household members by email with OWNER / EDITOR / VIEWER roles; viewers get a read-only list, grocery, item-detail, category, and membership UI
- **PWA** — installable on iPhone, works offline, push notifications for due/assigned items

## Tech Stack

| Layer | Technology                                        |
|---|---------------------------------------------------|
| Backend | Kotlin (JRE 21) + Spring Boot                     |
| Frontend | SvelteKit + TailwindCSS (PWA)                     |
| Database | PostgreSQL                                        |
| Auth | Passkey (WebAuthn) + Google OAuth2 — no passwords |
| Real-time | Server-Sent Events (SSE)                          |
| Deployment | Docker Compose                                    |

## Running Locally

```bash
docker compose up --build
```

Frontend: http://localhost:3000
Backend API: http://localhost:8080

## All-in-one image

A single container bundling nginx, the Spring Boot backend, and the SvelteKit frontend.
nginx listens on port 80 and routes `/api/*` to Spring Boot (8080) and everything else to
SvelteKit (3000).

Required env vars:

| Env var | Local | Production | Purpose |
|---|---|---|---|
| `ORIGIN` | `http://localhost` | `https://yourdomain.com` | SvelteKit CSRF protection — must include protocol and non-standard port |
| `WEBAUTHN_RP_ID` | `localhost` | `yourdomain.com` | WebAuthn Relying Party ID — effective domain only, no protocol or port |
| `CORS_ALLOWED_ORIGINS` | `http://localhost` | `https://yourdomain.com` | Spring CORS + WebAuthn origin allowlist — must match the browser origin (protocol + host + port) |
| `JWT_SECRET` | *(has insecure default — do not use in production)* | `openssl rand -base64 32` → 32 random bytes (256 bits) encoded as base64 | Signs JWT tokens — **must be overridden in production** |

```bash
docker run \
  -e ORIGIN=http://localhost \
  -e WEBAUTHN_RP_ID=localhost \
  -e CORS_ALLOWED_ORIGINS=http://localhost \
  -e JWT_SECRET=$(openssl rand -base64 32) \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/todo \
  -e SPRING_DATASOURCE_USERNAME=todo \
  -e SPRING_DATASOURCE_PASSWORD=todo \
  -p 80:80 \
  ghcr.io/matthiasbalke/todo/all-in-one:main
```

## Development

See [Contributing](.github/CONTRIBUTING.md) for setup details, validation commands, and pull request expectations.

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
