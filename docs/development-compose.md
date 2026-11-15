# Development with Docker Compose

The development stack runs PostgreSQL, Mailpit, a Node/Vite frontend, a Java 21/Gradle backend, and nginx. Docker Compose manages every long-running process. Existing host HTTPS launchers remain available as an alternative.

## One-time setup

Install Docker with Compose v2.20 or later, mkcert, and zsh/OpenSSL for the existing Mailpit certificate generator. Configure DNS (or a hosts entry) so your chosen hostname reaches this computer.

From the repository root:

```sh
cp .env.dev.example .env.dev
```

Set `LOCAL_HTTPS_DOMAIN` in `.env.dev` to that hostname, without a scheme, port, or path. This file is ignored by Git. Compose reads it directly; no host launcher or `.local-domain` is required. If you also use the old launchers, keep their `.local-domain` hostname aligned manually.

Generate the browser certificate using the existing mkcert workflow, substituting your hostname:

```sh
mkcert -install
mkdir -p .certs
mkcert -key-file .certs/key.pem -cert-file .certs/cert.pem localhost 127.0.0.1 todo.example.com
zsh e2e/scripts/generate-mailpit-cert.sh
```

The existing Mailpit generator includes the Docker hostname `mailpit-starttls`; its generated certificate and key and the existing `e2e/certs/e2e-truststore.p12` are reused directly. At container startup, the backend combines that truststore with the JDK public CA roots in a temporary container file, preserving HTTPS dependency downloads. No additional CA/truststore setup is needed. The checked-in E2E CA is for local testing only.

For phone testing, trust the mkcert root CA on the device and ensure the hostname resolves to this computer. See [local HTTPS setup](howto-local-dev-https-setup.md) for device certificate trust instructions. Host tools must be able to read the browser key; application containers use UID 1000 and need read access to `.certs`.

## Start and access

```sh
docker compose --env-file .env.dev -f compose.dev.yaml up --build -d
docker compose --env-file .env.dev -f compose.dev.yaml logs -f
```

Cold startup downloads dependencies and compiles the backend. nginx starts after the backend and frontend are healthy. Configuration/certificate errors appear in service logs.

| Service | Default URL |
|---|---|
| Main application | `https://<LOCAL_HTTPS_DOMAIN>` |
| Frontend directly | `https://<LOCAL_HTTPS_DOMAIN>:5173` |
| Backend API directly | `http://localhost:8080` |
| Backend health directly | `http://localhost:8080/actuator/health` |
| Mailpit inbox | `http://localhost:8025` |

Use `SETUP_SECRET` from `.env.dev` when setting up an empty database. The development stack raises the authentication rate limit to support repeated local passkey/browser tests. Application email uses Mailpit STARTTLS on the Docker network; SMTP and PostgreSQL are not published to the host. The inbox UI is published.

Change `DEV_PROXY_PORT`, `DEV_FRONTEND_PORT`, `DEV_BACKEND_PORT`, or `DEV_MAILPIT_PORT` in `.env.dev` to avoid port conflicts. Stop old launchers before using the same ports. Re-run `up -d` after changing env values. Public email links use the proxy HTTPS origin; passkeys and CORS allow both HTTPS frontend entrypoints. Port 443 is omitted from canonical origins. Published ports bind all host interfaces for device access; these settings and local secrets are intended for development.

## Source changes and reload

The frontend runs `bun run dev:https` with Vite under Node. Source edits update the browser through HMR on either HTTPS entrypoint. Set `DEV_FRONTEND_POLLING=true` if Docker Desktop misses Vite filesystem events, then recreate the frontend with `up -d frontend`.

The backend uses Spring Boot's [DevTools trigger file](https://docs.spring.io/spring-boot/reference/using/devtools.html#using.devtools.restart.triggerfile):

1. An initial Gradle build compiles Kotlin/Java and processes main resources.
2. Gradle continuously watches main-source/resource inputs.
3. Only a successful build updates `build/devtools/.reloadtrigger`, on the runtime classpath.
4. DevTools checks the completed classpath and restarts the application context.

A failed build leaves the trigger unchanged and reports errors in backend logs. Fixing the source causes another build and restart request. Generated trigger files are outside source inputs, preventing a watch loop. The development backend uses immediate server shutdown so long-lived SSE requests do not hold up reload for the normal graceful-shutdown timeout. API requests and SSE connections may briefly disconnect during restart.

Gradle continuous compilation requires filesystem events to reach the container. There is no custom compiler polling fallback. Backend build-script or dependency changes require a backend restart:

```sh
docker compose --env-file .env.dev -f compose.dev.yaml restart backend
```

Direct backend access on 8080 supports curl and API clients. JVM remote breakpoint debugging is not configured.

For frontend dependency changes, update the checked-in Bun lockfile, then restart the frontend. Startup runs frozen-lockfile installation into its container dependency volume:

```sh
docker compose --env-file .env.dev -f compose.dev.yaml restart frontend
```

Rebuild images after changing a development Dockerfile, Bun/Node/JDK version, or Gradle wrapper:

```sh
docker compose --env-file .env.dev -f compose.dev.yaml up --build -d
```

Sources are mounted read-only. Dependency caches, backend build output, and frontend generated files are in named volumes, separate from host installations. For configuration helper checks, run `zsh scripts/tests/dev-environment.test.sh`. After the backend image and Gradle cache are populated, `zsh scripts/tests/dev-reload.test.sh` checks continuous compilation and trigger-file failure recovery using an isolated offline Java fixture. For frontend checks:

```sh
docker compose --env-file .env.dev -f compose.dev.yaml exec frontend bun run check
```

## Stop, retain data, or reset

```sh
docker compose --env-file .env.dev -f compose.dev.yaml down
```

Normal shutdown retains database data and dependency/build caches. The `todo-dev` project is isolated from the CI Compose project; existing host database contents are not migrated automatically.

To discard all development data and caches deliberately:

```sh
docker compose --env-file .env.dev -f compose.dev.yaml down --volumes
```

This deletes the development database, including accounts and lists. To refresh dependencies without resetting data, use the service restart commands above. Stop this stack before returning to the host launchers if their ports overlap.

nginx terminates browser TLS, routes API/health directly to Spring Boot, forwards Vite WebSockets, and disables SSE buffering. Certificate verification is disabled only on nginx's local HTTPS hop to Vite because the browser certificate does not cover Docker's `frontend` service hostname. Browser-facing certificate verification is unchanged.
