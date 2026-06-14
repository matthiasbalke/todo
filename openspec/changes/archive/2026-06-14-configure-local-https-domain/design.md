## Context

`frontend/start-https-frontend.sh` and `backend/start-https-backend.sh` each default their first positional argument to `todo.example.com`. Developers therefore need matching command-line arguments on every start, and the README separately hard-codes an agent E2E deployment domain. The frontend and backend values must remain identical because they drive HMR, CORS, and WebAuthn relying-party validation.

## Goals / Non-Goals

**Goals:**

- Establish one per-computer domain value shared by frontend startup, backend startup, and documented agent E2E commands.
- Keep machine-specific configuration out of Git while providing a discoverable tracked template.
- Fail before starting Vite, Gradle watchers, or Spring Boot when configuration is missing or invalid.
- Keep the scripts runnable from any working directory.
- Provide focused automated coverage without launching the actual development servers.

**Non-Goals:**

- Managing TLS certificates, DNS, hosts-file entries, tunnels, or reverse proxies.
- Storing the HTTPS port in the domain file.
- Changing production deployment configuration.
- Automatically creating the local file or silently falling back to a committed domain.

## Decisions

### Use a repo-root plain-text domain file

The tracked template will be `.local-domain.example` with the single value `todo.example.com`. Each developer copies it to `.local-domain`, which is listed in `.gitignore`.

A one-value plain-text file is preferred over sourcing an `.env` file because the configuration contains only a hostname and must not execute arbitrary shell code. The loader will trim line endings and surrounding whitespace, then reject empty values or values containing a scheme, port, path, or whitespace.

### Centralize loading in a shared shell helper

A repo-owned helper will locate the repository root from its own `BASH_SOURCE`, read `.local-domain`, validate it, and expose `LOCAL_HTTPS_DOMAIN` to the calling script. Both HTTPS startup scripts will source this helper.

This avoids duplicated path, validation, and error-message logic. It also gives README agent commands a supported way to load the same domain.

### Make missing configuration an actionable startup error

When `.local-domain` is absent, the helper will write an error to stderr, show the exact copy command `cp .local-domain.example .local-domain`, remind the developer to edit the value, and return a non-zero status. Empty or malformed files will identify the file and expected hostname-only format.

The scripts will use strict error handling so no server or watcher starts after the helper fails.

### Retain port customization as the only positional argument

Both startup scripts will use the configured domain and accept an optional first argument for the HTTPS port, defaulting to `443`. The prior `[DOMAIN] [PORT]` interface will become `[PORT]`.

This keeps non-standard local proxy ports possible while ensuring the domain has one source of truth.

### Test configuration behavior with command stubs

Shell tests will exercise the helper and startup scripts using temporary repositories or temporary configuration state plus stubbed `sudo`, `bun`, and `gradlew` commands. Tests will assert exported environment values, working-directory independence, missing/empty/invalid diagnostics, and that child commands are not invoked on configuration failure.

## Risks / Trade-offs

- [Existing personal commands still pass a domain as argument] -> Document the breaking invocation change and update all committed examples.
- [A malformed domain could produce confusing HMR or WebAuthn failures] -> Validate hostname-only syntax before exporting any variables.
- [Frontend and backend might be launched with different ports] -> Keep port explicit per invocation and document that both scripts must use the same externally visible port.
- [README E2E commands may run before local configuration exists] -> Source the same helper so agents receive the standard copy-and-edit diagnostic.

## Migration Plan

1. Add `.local-domain.example` and ignore `.local-domain`.
2. Add and test the shared loader.
3. Update both startup scripts to source the loader and accept only an optional port.
4. Update README and local HTTPS documentation, including migration from domain arguments.
5. Copy the template locally before using the scripts or agent E2E commands.

Rollback restores positional domain arguments and removes the helper/template contract; no data migration is involved.

## Open Questions

None.
