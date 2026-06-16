## Context

`scripts/load-local-domain.sh` is sourced by helper scripts and the agent E2E workflow to load the repo-local HTTPS hostname. The current implementation uses Bash-specific path resolution, which is fragile in this repository because helper scripts are executed with `zsh`.

The repository also contains other self-written `.sh` helpers that use Bash shebangs or Bash-only variables such as `${BASH_SOURCE[0]}`. This change should treat the local-domain loader as the known failure while auditing the full helper set:

- `run-e2e-tests.sh`
- `clear-postgress.sh`
- `run-all-test-suites.sh`
- `scripts/load-local-domain.sh`
- `scripts/tests/local-domain.test.sh`
- `frontend/start-https-frontend.sh`
- `backend/start-https-backend.sh`
- `frontend/generate-dev-certificates.sh`

## Goals / Non-Goals

**Goals:**
- Make the local domain loader work when sourced or executed under `zsh`.
- Make all repository-owned `.sh` helper scripts compatible with `zsh` execution where they can be safely run or reviewed.
- Preserve the current validation behavior, exported variable contract, and error messages as much as practical.
- Keep behavioral changes isolated to shell compatibility and any necessary tests or documentation updates.

**Non-Goals:**
- Changing the `.local-domain` file format or validation rules.
- Introducing a new shell dependency or wrapper executable.
- Redesigning frontend, backend, Docker, or test workflows beyond what is required for shell compatibility.

## Decisions

- Use zsh-native file-location resolution instead of Bash-only `${BASH_SOURCE[0]}` in repository helpers.
  - Rationale: this matches the repository’s execution environment and avoids adding a separate compatibility layer.
  - Alternative considered: require the script to be executed via `bash`. Rejected because it conflicts with the repo’s helper-script convention and would push shell selection complexity to callers.
- Keep the loader as a standalone shell function with the same exported `LOCAL_HTTPS_DOMAIN` contract.
  - Rationale: callers already depend on sourcing the script to populate the environment.
  - Alternative considered: replace sourcing with a separate command that prints the domain. Rejected because it would force changes across all consumers.
- Preserve the existing validation and error handling paths.
  - Rationale: the bug is shell compatibility, not domain parsing behavior.
  - Alternative considered: rewrite parsing and validation together. Rejected because it increases risk without helping the compatibility goal.
- Audit scripts by static review plus targeted execution where safe.
  - Rationale: some helpers start Docker services, launch long-running watchers, or remove containers, so a pure run-all approach would create avoidable side effects.
  - Alternative considered: execute every script end to end. Rejected because destructive and environment-dependent helpers need bounded verification.

## Risks / Trade-offs

- zsh path resolution can differ subtly from Bash resolution. Mitigation: verify the loader from multiple working directories and when sourced by another `zsh` script.
- Shell portability fixes can accidentally change quoting or array behavior. Mitigation: keep the code changes minimal and preserve the existing validation cases.
- Some helpers require Docker, mkcert, bun, Gradle, or long-running services. Mitigation: verify syntax and non-destructive paths under `zsh`, and document any checks that cannot be run safely in the current environment.
- Converting shebangs can expose subtle differences in option handling. Mitigation: preserve existing argument contracts and test path resolution, argument validation, traps, and sourced-helper behavior directly.

## Migration Plan

1. Inventory tracked self-written `.sh` helper scripts with `rg --files -g '*.sh'`.
2. Update incompatible helpers to use `zsh` shebangs and `zsh`-compatible syntax for path resolution, argument handling, traps, sourced helpers, and process cleanup.
3. Validate the local-domain loader from the repository root and from a different working directory.
4. Run or statically verify each helper under `zsh`, avoiding destructive or environment-dependent side effects where necessary.
5. Confirm the agent E2E setup still resolves `LOCAL_HTTPS_DOMAIN` correctly.
6. If needed, document any shell-specific assumptions in the existing setup guidance.

Rollback is straightforward: revert the script change if zsh compatibility causes regressions.

## Open Questions

- None. The scope is limited to shell compatibility for repository-owned helper scripts.
