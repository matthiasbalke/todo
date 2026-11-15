# Design

## Context

See proposal.md for motivation. The existing backend launcher runs continuous Kotlin/Java compilation alongside `bootRun`; DevTools is already a development dependency. It does not currently watch resource processing. The HTTPS frontend reads `.certs` and listens on 5173, but Vite's API proxy targets host localhost. SvelteKit's server hook separately supports `BACKEND_URL`. The existing Compose file runs built application images and includes two TLS Mailpit instances for E2E. Existing host launcher specs remain applicable to those launchers.

## Goals / Non-Goals

**Goals:** One development lifecycle; source-driven rebuilds; trusted domain-based HTTPS for device/passkey testing; direct frontend and API access; isolated development state and caches.

**Non-Goals:** Production or CI image changes, replacing the existing launchers, zero-interruption backend class replacement, automatic dependency/build-script reload, and remote JVM debugger configuration. Direct API debugging means published HTTP access; JDWP can be added separately.

## Decisions

### Standalone development Compose project

Add `compose.dev.yaml`, used explicitly with `docker compose --env-file .env.dev -f compose.dev.yaml`. Keep it independent of `compose.yaml`: development commands, mounts, ports, and mail behavior differ substantially from CI. Use a dedicated project name and named volumes so development data is not mixed with CI data. Use PostgreSQL with the repository's major version and a single Mailpit inbox on host port 8025. Reuse the existing Mailpit STARTTLS certificate generation (`e2e/scripts/generate-mailpit-cert.sh`) and `e2e/certs/e2e-truststore.p12`. Use `mailpit-starttls` as the service hostname already covered by that workflow. Mount the existing generated certificate/key into Mailpit and the truststore into the backend read-only; configure SMTP to `mailpit-starttls:1025`. Extend the existing generator only where needed for env-file configuration, preserving E2E usage. At startup the backend combines the mounted truststore with JDK public CA roots in a temporary container truststore, preserving dependency-download trust. No separate manual development CA or truststore workflow is introduced.

Database readiness gates backend startup; frontend and backend healthchecks inform readiness, with enough startup allowance for a cold dependency cache. Use init/signal handling so shutdown terminates Gradle, the application JVM, and watchers. nginx must tolerate temporary upstream unavailability during compilation/restarts and re-resolve service names after container replacement.

### Node frontend with Bun command and Vite HMR

Use a development-only Node image compatible with the installed Vite version, with a pinned Bun executable installed. Run frozen-lockfile installation followed by `bun run dev:https`, ensuring the Vite CLI executes under Node (do not use Bun's forced runtime flag). Bind mounted sources retain the repository-relative `.certs` layout. Keep `node_modules`, `.svelte-kit`, and dependency caches in named volumes rather than host directories. Run application processes without root privileges and initialize volume permissions appropriately.

Configure both `BACKEND_URL` and a configurable Vite proxy target as `http://backend:8080`; preserve localhost defaults for the host workflow. The direct frontend port must also support API requests. Allow the configured local hostname explicitly. In Compose mode let Vite infer WSS host and port from the page URL, rather than forcing a single HMR client port: this supports both proxy and direct frontend entrypoints with one process. Preserve existing explicit HMR environment overrides for host launchers. nginx forwards WebSocket upgrades to Vite.

A production frontend image cannot provide this feedback loop. A Bun-only image does not meet the requested Node runtime setup.

### Java 21 backend with continuous compilation and DevTools restart

Use a Java 21 JDK development image, invoking the checked-in Gradle wrapper rather than an image-provided Gradle. Mount sources and isolate `.gradle`, Gradle user home, and `build` output in named volumes. Both compiler and running application share the same build output.

Follow Spring Boot's documented DevTools trigger-file mechanism as a fresh container development design, rather than porting or repairing the host launcher. Configure `spring.devtools.restart.trigger-file=.reloadtrigger` and create that file in the generated runtime classpath before application startup.

Perform initial `classes` compilation before starting `bootRun`. Then run a development-only Gradle task in continuous mode alongside `bootRun`. That task depends on `classes` (Kotlin/Java compilation and resource processing) and updates the generated `.reloadtrigger` only after those prerequisites succeed. Ensure it executes after each successful changed build rather than being skipped as up-to-date; it must not update the trigger on compilation/resource-processing failure. Keep the trigger outside source inputs so its updates do not cause a continuous-build loop. DevTools performs restart checks when the trigger changes; Gradle supplies compilation, not application restart.

Keep the watcher alive without a TTY, retain the Gradle daemon, propagate shutdown signals, detect unexpected child termination, and expose compilation diagnostics. Verify consecutive edits, resource changes, failure followed by recovery, and that partial or failed output does not request a restart. Use Spring Boot immediate server shutdown in this development deployment so open SSE streams do not delay restarts for the graceful-shutdown timeout. This is restart of the Spring application context, not JVM hot swap.

Gradle continuous mode depends on filesystem events; validate it on the supported Docker bind mounts. A custom polling compiler supervisor is outside the initial scope. Vite may retain its opt-in polling setting. Dependency/build-script changes require restarting the backend; image changes require rebuilding. `bootRun --continuous` alone does not provide compilation while the application task is running.

### nginx owns the root HTTPS entrypoint

Use development-only nginx configuration with the existing mkcert certificate/key mounted read-only. nginx listens on container 443 and publishes host 443 by default. Route `/api/` and `/actuator/` directly to `http://backend:8080`; route other requests to `https://frontend:5173`. Disable buffering and allow long reads for SSE; forward WebSocket upgrades for HMR. Preserve the original Host including external port and forward HTTPS scheme/client information. Enable backend forwarded-header handling for this development deployment.

For the Vite upstream, explicitly scope any disabled certificate verification to this local development hop, since the browser certificate may not contain Docker service DNS names. Browser connections still validate the trusted local certificate. Caddy was considered, but nginx is already used by the project and avoids introducing a second local CA or automatic certificate workflow.

### Shared local configuration and direct published ports

Provide a tracked `.env.dev.example` and ignored `.env.dev` containing the hostname and configurable host ports. Use `docker compose --env-file .env.dev -f compose.dev.yaml up` directly, without a new host zsh launcher. Compose interpolation supplies container settings; required-variable checks, configuration validation within development containers where necessary, and missing-bind-file rejection provide actionable startup errors. Keep origin construction consistent, including canonical omission of HTTPS port 443.

The env file is the hostname source for Compose. Existing host launchers retain `.local-domain`; developers using both workflows must keep those hostnames aligned. Document the env-file copy/edit step and reuse the existing browser and SMTP certificate setup.
Default endpoints:

| Purpose | Host endpoint | Container upstream |
|---|---|---|
| Main application | `https://<domain>:443` | nginx:443 |
| Frontend directly | `https://<domain>:5173` | frontend:5173 |
| Backend directly | `http://localhost:8080` | backend:8080 |
| Mail inbox | `http://localhost:8025` | mailpit:8025 |

Publish all three requested service ports with configurable host values; all services listen on container interfaces rather than loopback. Derive `WEBAUTHN_RP_ID` from the hostname, `CORS_ALLOWED_ORIGINS` from proxy and frontend origins, and `APP_PUBLIC_BASE_URL` from the proxy origin. Omit `:443` in canonical HTTPS origins to match browser origin serialization. Keep internal addresses stable when host ports change. Trust remains the existing mkcert/DNS prerequisite, including on phones.

## Risks / Trade-offs

- Bind-mount file events differ across Linux, Docker Desktop, and remote filesystems → validate continuous compilation on supported mounts and document its filesystem-event requirement.
- Two Gradle processes consume memory and may contend on initial build state → compile first, share outputs/caches consistently, and verify successive edits and failure recovery.
- Backend restart briefly interrupts API/SSE sessions → retain existing client reconnection behavior and test recovery.
- Container volume ownership and native frontend dependencies differ from the host → isolate generated output, use non-root processes, and document dependency refresh without deleting the database volume.
- Existing host processes may occupy default ports → document stopping old launchers and configurable host ports.
- Cold image/dependency downloads take longer → persistent caches and service logs expose progress.

## Migration Plan

1. Add the development stack and validate it independently from production/CI Compose.
2. Document `.env.dev`, reuse of existing certificate workflows, certificate trust, DNS, and the direct Compose startup command; keep existing launchers available.
3. Stop any old development processes before using the default published ports. Existing host database data is not migrated automatically into the dedicated development volume.
4. Roll back by stopping the development project and using existing launchers. Normal shutdown retains data; explicit volume removal resets it.

## References

- Spring Boot DevTools: https://docs.spring.io/spring-boot/reference/using/devtools.html
- Spring Boot Gradle bootRun: https://docs.spring.io/spring-boot/gradle-plugin/running.html
- Gradle continuous builds: https://docs.gradle.org/current/userguide/continuous_builds.html
