# Proposal

## Why

Local HTTPS development currently requires separate frontend and backend launchers, a host TCP relay, and Compose-managed dependencies. A dedicated development Compose stack will provide one lifecycle for the application while preserving fast feedback from source edits and direct access for debugging.

## What Changes

- Add a standalone `compose.dev.yaml` for PostgreSQL, Mailpit, a live Vite frontend, a live Gradle backend, and an HTTPS nginx entrypoint.
- Run `bun run dev:https` in a Node-based frontend image with Bun installed, source mounts, and container-managed dependencies.
- Run Java 21, the repository Gradle wrapper, continuous compilation, and Spring Boot DevTools with a restart trigger updated only after successful compilation and resource processing in a backend development container.
- Publish configurable proxy, frontend, and backend host ports, defaulting to 443, 5173, and 8080 respectively.
- Configure Compose through `.env.dev` using a tracked `.env.dev.example`, reuse `.certs` and the existing Mailpit certificate/truststore workflow, and route API traffic, SSE, and Vite HMR inside Docker.
- Document startup, shutdown, logs, dependency refresh, reload limits, and direct debugging. Retain existing launchers as an alternative.

## Capabilities

### New Capabilities

- `containerized-development`: Lifecycle, source reload, routing, direct service access, and persistent development data for the dedicated Compose stack.

### Modified Capabilities

None. Existing host launcher contracts remain supported; the new Compose workflow is additive.

## Impact

Adds development-only container definitions, Compose configuration, nginx configuration, and a development env-file template. Makes Vite's backend target configurable while preserving its host default. Updates README and local HTTPS documentation. Uses existing Java 21, Gradle wrapper, Bun lockfile, DevTools, and certificate conventions; does not change production images, application APIs, or CI Compose behavior.
