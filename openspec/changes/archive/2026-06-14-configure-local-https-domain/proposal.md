## Why

Developers use different local HTTPS domain names across computers, but both startup scripts currently embed `todo.example.com` and require command-line overrides. A shared, ignored local configuration will keep frontend HMR, backend CORS, WebAuthn, and agent E2E commands aligned without committing machine-specific domains.

## What Changes

- Add a tracked local-domain template containing `todo.example.com`.
- Add a git-ignored local-domain file that each developer copies from the template and edits for their computer.
- Make both `start-https-*` scripts read the domain from the shared local file, regardless of the current working directory.
- Fail fast with a clear copy-and-edit instruction when the local file is missing, empty, or unusable.
- **BREAKING**: Remove the positional domain argument from the HTTPS startup scripts; retain the optional HTTPS port argument.
- Update local HTTPS documentation and the README agent E2E instructions to use the configured local domain rather than a hard-coded deployment URL.
- Add automated shell-script coverage for successful configuration loading and configuration errors.

## Capabilities

### New Capabilities

- `local-https-domain-configuration`: Defines the shared per-computer domain configuration, HTTPS startup behavior, diagnostics, and E2E documentation contract.

### Modified Capabilities

None.

## Impact

- `frontend/start-https-frontend.sh` and `backend/start-https-backend.sh`.
- Repo-root tracked template, ignored local configuration, and `.gitignore`.
- `README.md` agent E2E instructions and `docs/howto-local-dev-https-setup.md`.
- Shell-script or equivalent automated tests for configuration handling.
- No production runtime, API, database, or authentication protocol changes.
