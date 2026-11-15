# Tasks

## 1. Compose lifecycle and dependencies

- [x] 1.1 Add standalone `compose.dev.yaml` with a dedicated project name, PostgreSQL, Mailpit, development service definitions, persistent data/cache volumes, configurable host ports, and readiness checks; verify `docker compose --env-file .env.dev -f compose.dev.yaml config` resolves without changing CI Compose behavior.
- [x] 1.2 Add tracked `.env.dev.example` and ignored `.env.dev` configuration for hostname and host ports with no new host launcher; verify direct Compose interpolation, canonical origins, and actionable missing/invalid configuration and certificate failures.
- [x] 1.3 Reuse the existing Mailpit STARTTLS generator, generated certificates, service hostname, and E2E JVM truststore; extend existing env-file integration only as needed and verify certificate trust plus backend-delivered mail in the host-accessible inbox.
- [x] 1.4 Document domain/certificate prerequisites, env-file configuration, existing mail TLS generation, direct Compose startup, logs, shutdown, port overrides, persistent data, and explicit reset commands in README and the local HTTPS guide; verify the commands match the resolved Compose configuration.

## 2. Frontend development container

- [x] 2.1 Add a development-only Node image with pinned Bun, frozen-lockfile installation, non-root execution, mounted sources/certificates, and isolated dependency/generated-output volumes; verify startup runs `bun run dev:https`, Vite uses Node, and no root-owned checkout artifacts appear.
- [x] 2.2 Make Vite's backend proxy target configurable while retaining the host localhost default, set the container's SvelteKit backend URL, and configure allowed hostname/HMR inference and optional polling; verify direct frontend API requests, run frontend check, and confirm existing host overrides remain supported.
- [x] 2.3 Document frontend dependency refresh and polling settings; verify a component edit updates a browser without an image rebuild and a dependency refresh preserves database data.

## 3. Backend development container

- [x] 3.1 Add a Java 21 development image and supervisor using the repository wrapper, initial `classes`, continuous `classes`, and `bootRun`, with shared isolated output/cache volumes and signal handling; verify API startup, noninteractive watcher lifetime, non-root output handling, and clean shutdown of child processes.
- [x] 3.2 Configure DevTools `.reloadtrigger` on the generated classpath and a development-only continuous Gradle task that updates it only after successful `classes` compilation/resource processing; verify consecutive Kotlin/resource edits, no trigger update or restart request on failure, recovery after fixing errors, and no self-triggering build loop. Do not add a custom polling compiler fallback.
- [x] 3.3 Wire database, STARTTLS SMTP/truststore, public URL, passkey relying-party ID, allowed origins, and development forwarded-header handling; verify backend health, public-link origin, and mail delivery with the configured domain and alternate proxy port.
- [x] 3.4 Document backend trigger-file restart behavior, filesystem-event requirements, build-script/dependency restart requirements, and direct API debugging; verify documented restart commands refresh the backend without losing data.

## 4. HTTPS reverse proxy

- [x] 4.1 Add development nginx TLS routing for API/health and HTTPS Vite with preserved external Host/scheme, SSE buffering disabled, WebSocket upgrades, appropriate timeouts, and upstream DNS refresh; verify nginx configuration and curl health/pages through the published proxy.
- [x] 4.2 Verify browser HMR through both proxy and direct frontend ports, SSE delivery/reconnection across backend restart, and routing after an upstream container is recreated; document the three direct/proxy URLs and local upstream TLS policy.

## 5. Integrated development acceptance

- [x] 5.1 Start the full stack from the documented workflow with a cold cache, confirm frontend/backend/proxy default and alternate published ports, and verify authentication/passkey origin configuration and application email using the configured hostname.
- [x] 5.2 Run relevant Playwright coverage following the repository HTTPS deployment workflow and frontend checks; record results, including source reload and invalid-input checks, and leave temporary source edits reverted.
- [x] 5.3 Stop/restart the dedicated project and verify database/cache persistence, complete process shutdown, generated-file isolation, and continued availability of existing host launchers and unchanged CI Compose configuration.
