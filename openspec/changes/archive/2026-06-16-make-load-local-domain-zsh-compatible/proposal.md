## Why

The repository’s self-written `.sh` helper scripts are expected to run in a `zsh` environment, but several currently rely on Bash-specific shebangs, path resolution, or invocation assumptions. The local HTTPS domain loader is a known failing case, and the change should verify the full helper script set instead of fixing only one file.

## What Changes

- Audit every self-written `.sh` helper script in the repository for `zsh` compatibility.
- Refactor incompatible helper scripts so they can run under `zsh` without Bash-only assumptions.
- Refactor `scripts/load-local-domain.sh` so it is compatible with `zsh` execution and sourcing.
- Preserve the current validation and error handling for missing, empty, and malformed `.local-domain` files.
- Keep the exported `LOCAL_HTTPS_DOMAIN` contract unchanged for callers.

## Capabilities

### New Capabilities

- `repository-shell-helper-compatibility`: ensure repository-owned `.sh` helper scripts are compatible with the `zsh` execution environment.

### Modified Capabilities

- `local-https-domain-configuration`: the shared local HTTPS domain loading workflow must be compatible with `zsh` execution in addition to the existing hostname validation and startup behavior.

## Impact

- `scripts/load-local-domain.sh`
- `run-e2e-tests.sh`
- `clear-postgress.sh`
- `run-all-test-suites.sh`
- `scripts/tests/local-domain.test.sh`
- `frontend/start-https-frontend.sh`
- `backend/start-https-backend.sh`
- `frontend/generate-dev-certificates.sh`
- Agent E2E setup flow described in `AGENTS.md`
- Any helper scripts that source the local domain loader
