## 1. Inventory

- [x] 1.1 Enumerate tracked self-written `.sh` helper scripts with `rg --files -g '*.sh'` and confirm the implementation scope.
- [x] 1.2 Review each helper for Bash-specific shebangs, `${BASH_SOURCE[0]}`, Bash-only `read` usage, process cleanup behavior, and sourced-helper assumptions.

## 2. Shell Compatibility

- [x] 2.1 Update `scripts/load-local-domain.sh` to resolve its own location with `zsh`-compatible syntax instead of Bash-only `BASH_SOURCE` usage.
- [x] 2.2 Replace any Bash-specific parsing or array handling in the loader with `zsh`-compatible equivalents while preserving the current validation behavior and exported `LOCAL_HTTPS_DOMAIN` contract.
- [x] 2.3 Update direct helper script shebangs and Bash-specific path resolution in `run-e2e-tests.sh`, `clear-postgress.sh`, `run-all-test-suites.sh`, `scripts/tests/local-domain.test.sh`, `frontend/start-https-frontend.sh`, `backend/start-https-backend.sh`, and `frontend/generate-dev-certificates.sh` where required.
- [x] 2.4 Preserve existing argument handling, environment exports, traps, process cleanup, and child-command behavior while making the scripts `zsh`-compatible.

## 3. Verification

- [x] 3.1 Run the loader from the repository root and from a different working directory under `zsh` to confirm it loads the repo-root `.local-domain` file.
- [x] 3.2 Verify the missing-file, empty-file, and malformed-domain failure cases still produce the expected errors after the shell compatibility refactor.
- [x] 3.3 Run the local-domain shell test suite under `zsh`, updating test stubs as needed so the tests validate `zsh` behavior.
- [x] 3.4 Run non-destructive syntax or smoke checks for each self-written `.sh` helper under `zsh`, and document any helpers that cannot be fully executed because they require Docker services, long-running watchers, certificate tooling, or destructive operations.
