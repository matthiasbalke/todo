# Contributing

This is a personal and household todo app for groceries, regular todos, and recurring household tasks. Changes should be easy to review, test, and maintain.

The full requirements and architecture live in [docs/requirements.md](../docs/requirements.md). Read that before changing behavior, data models, authentication, list sharing, recurrence, offline behavior, or deployment.

## Repository Layout

| Path | Purpose |
|---|---|
| `backend/` | Kotlin 2.4, Spring Boot 4, PostgreSQL persistence, auth, SSE, Flyway migrations |
| `frontend/` | SvelteKit 2, Svelte 5, TailwindCSS 4, Vite 8, PWA frontend |
| `e2e/` | Playwright full-stack tests |
| `all-in-one/` | Combined nginx, backend, and frontend container |
| `docs/` | Requirements, setup notes, and feature documentation |
| `openspec/` | OpenSpec specs, active changes, and archived changes |
| `docker-compose.yml` | Local and CI service composition |

## Prerequisites

Use the toolchain the repo already expects:

| Area | Tooling |
|---|---|
| Backend | Java 21. Use `backend/gradlew`; do not require a global Gradle install. |
| Frontend | Bun for install, checks, tests, and builds. |
| Database | PostgreSQL. Docker Compose is the usual full-stack path. |
| E2E | Bun plus Playwright browser binaries. |
| Shell helpers | zsh. Repository-owned `.sh` helpers use `#!/usr/bin/env zsh`. |
| Containers | Docker and Docker Compose for local stack and image validation. |

## Local Development

Start the full stack with Docker Compose when you need the app running end to end:

```bash
docker compose up --build
```

Frontend: `http://localhost:3000`
Backend API: `http://localhost:8080`

Backend-only workflow:

```bash
cd backend
./gradlew bootRun
```

Frontend-only workflow:

```bash
cd frontend
bun install
bun run dev
```

## Local HTTPS And DNS

Use the local HTTPS setup when testing passkeys, HTTPS-only browser behavior, iPhone/PWA behavior, or another device on your network.

Create the per-machine hostname file from the tracked template:

```bash
cp .local-domain.example .local-domain
```

Edit `.local-domain` so it contains only the hostname for this machine:

```text
todo.example.com
```

Do not include `https://`, a port, a path, or whitespace. `.local-domain` is ignored by Git, so every machine can use its own value. The HTTPS backend and frontend scripts read it through `scripts/load-local-domain.sh`.

Start HTTPS development servers with:

```bash
./backend/start-https-backend.sh [PORT]
./frontend/start-https-frontend.sh [PORT]
```

See [docs/howto-local-dev-https-setup.md](../docs/howto-local-dev-https-setup.md) for mkcert, certificate generation, and device trust setup.

## Planning Changes

Use OpenSpec for non-trivial changes:

- behavior changes
- architecture changes
- API or data model changes
- workflow changes
- user-facing documentation changes with lasting expectations

Small typo fixes, comments, or narrow documentation corrections do not need an OpenSpec change.

For a new planned change:

```bash
openspec new change "your-change-name"
openspec status --change "your-change-name"
```

Keep the proposal, design, specs, and tasks aligned with what you actually implement.

## Commit Messages

This repository uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

Use this shape:

```text
<type>[optional scope]: <description>
```

Good examples:

```text
docs: update contribution guide
fix(auth): reject expired recovery tokens
feat(lists): add group collapse persistence
```

Use `feat` for user-facing features and `fix` for bug fixes. Other useful types include `docs`, `test`, `refactor`, `build`, `ci`, and `chore`.

For breaking changes, mark the commit with `!` before the colon or add a `BREAKING CHANGE:` footer:

```text
feat(api)!: rename list membership role field
```

## Validation

Run the checks that match the files you touched. Include the results in the pull request.

| Change area | Commands |
|---|---|
| Backend code, migrations, backend config | `cd backend && ./gradlew test` |
| Frontend code or Svelte components | `cd frontend && bun run check`<br>`cd frontend && bun run test -- --run`<br>`cd frontend && bun run build` |
| Full-stack user behavior | `cd e2e && bun install`<br>`cd e2e && bunx playwright install chromium`<br>`cd e2e && bunx playwright test` |
| Linux machine missing Playwright system packages | `cd e2e && bunx playwright install --with-deps chromium` |
| zsh helper scripts | `zsh -n path/to/script.sh` |
| Local domain helper changes | `zsh scripts/tests/local-domain.test.sh` |
| Docker behavior | `docker compose up --build` |

Backend integration tests use Testcontainers with a real PostgreSQL instance. Do not replace database behavior with mocks in integration tests.

## Coding Conventions

Keep changes focused. Avoid unrelated refactors unless they are needed for the change.

Backend:

- Keep database-facing integration tests on Testcontainers and PostgreSQL.
- Add Flyway migrations for schema changes.
- Preserve the no-password auth model. Authentication is passkey/WebAuthn or Google OAuth2.
- Be careful around list membership roles. OWNER, EDITOR, and VIEWER behavior is part of the access model.
- List real-time updates use SSE per list, not a global WebSocket.

Frontend:

- Reuse shared components under `frontend/src/lib/components` before adding new primitives.
- Run `bun run check` for Svelte and TypeScript validation.
- Keep filtering behavior client-side unless a spec explicitly changes that.
- Keep role-derived UI capabilities centralized instead of scattering permission checks.
- For visible UI changes, include a screenshot or short recording in the pull request.

Shell helpers:

- Keep repository-owned `.sh` files zsh-compatible.
- Do not introduce Bash-only features such as `${BASH_SOURCE[0]}`, `read -a`, or Bash-style `wait -n`.
- Avoid zsh special parameter names such as `status` and `path` for local variables.

## Security

Do not commit secrets, tokens, private keys, local certificates, `.local-domain`, dumps with private data, or production configuration.

Be especially careful when changing:

- passkeys or WebAuthn relying party settings
- Google OAuth2 login or account linking
- JWT creation, validation, refresh, revocation, or secrets
- CORS and allowed origins
- setup secrets and admin setup
- account deletion
- file attachments and storage paths

Production `JWT_SECRET` must be a real secret. The insecure default is only for local development.

## Pull Requests

Keep pull requests reviewable:

- Explain what changed and why.
- Link the OpenSpec change when one exists.
- Use Conventional Commits for commit messages and PR titles.
- List the validation commands you ran and their results.
- Include screenshots or recordings for visible UI changes.
- Call out migrations, config changes, deployment changes, or security-sensitive changes.
- Keep generated or unrelated file churn out of the PR.

A maintainer merges pull requests after the scope is clear, relevant checks pass, and the change is reviewable.

## Conduct And License

Follow the [Code of Conduct](CODE_OF_CONDUCT.md). Keep discussion respectful and focused on the work.

Contributions are made under the repository's [MIT License](../LICENSE).
