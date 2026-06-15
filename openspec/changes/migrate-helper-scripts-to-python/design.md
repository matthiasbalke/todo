## Context

The repository contains eight handwritten Bash files:

- `backend/start-https-backend.sh`
- `frontend/start-https-frontend.sh`
- `frontend/generate-dev-certificates.sh`
- `scripts/load-local-domain.sh`
- `scripts/tests/local-domain.test.sh`
- `run-all-test-suites.sh`
- `run-e2e-tests.sh`
- `clear-postgress.sh`

They cover several distinct concerns: configuration parsing, subprocess orchestration, signal handling, service cleanup, destructive database operations, certificate generation, and tests. Shell makes these concerns difficult to compose and test, and several helpers currently depend on the caller's working directory or have ambiguous behavior. The generated Gradle wrapper is outside this change.

The replacement must work on the repository's supported developer environments, Linux and macOS, and in GitHub Actions. Python is a launcher and orchestration runtime only; Bun, Gradle, Docker Compose, `mkcert`, `socat`, and `sudo` remain external dependencies.

## Goals / Non-Goals

**Goals:**

- Replace every handwritten shell helper with readable, directly executable Python 3 code.
- Preserve the established HTTPS launcher contracts and developer commands, except for documented filename changes and explicit correctness fixes.
- Centralize shared path, validation, command, and process-lifecycle behavior without creating a large internal framework.
- Make helper behavior testable with standard-library Python tests and temporary fixtures.
- Ensure commands work independently of the caller's current working directory where the helper owns a repository-relative path.
- Guarantee cleanup of child processes and Docker Compose services on success, failure, and interruption.

**Non-Goals:**

- Rewriting generated scripts such as `backend/gradlew`.
- Replacing Gradle, Bun, Docker Compose, Playwright, `mkcert`, `socat`, or `sudo`.
- Supporting native Windows execution; WSL remains equivalent to Linux.
- Publishing a Python package or adding third-party Python dependencies.
- Refactoring application code or changing the local HTTPS network architecture.

## Decisions

### Use executable snake_case Python entry points

Each handwritten `.sh` file will be removed and replaced by an executable `.py` file with a `#!/usr/bin/env python3` shebang and a `main() -> int` entry point:

| Current path | Replacement path |
|---|---|
| `backend/start-https-backend.sh` | `backend/start_https_backend.py` |
| `frontend/start-https-frontend.sh` | `frontend/start_https_frontend.py` |
| `frontend/generate-dev-certificates.sh` | `frontend/generate_dev_certificates.py` |
| `scripts/load-local-domain.sh` | `scripts/load_local_domain.py` |
| `scripts/tests/local-domain.test.sh` | `scripts/tests/test_local_domain.py` |
| `run-all-test-suites.sh` | `run_all_test_suites.py` |
| `run-e2e-tests.sh` | `run_e2e_tests.py` |
| `clear-postgress.sh` | `clear_postgres.py` |

Snake_case follows Python naming conventions and fixes the existing `postgress` typo. Keeping executable shebangs allows `./run_e2e_tests.py` while `python3 run_e2e_tests.py` remains explicit and portable.

Alternative considered: retain `.sh` compatibility wrappers. Rejected because the stated goal is to remove handwritten helper shell scripts, and wrappers would leave two entry-point layers to maintain.

### Require Python 3.9 or newer and use only the standard library

The helpers will avoid syntax and APIs newer than Python 3.9. They will use `argparse`, `pathlib`, `subprocess`, `signal`, `shutil`, `time`, `unittest`, and related standard-library modules.

Alternative considered: add Click, Typer, pytest, or a Python project manager. Rejected because these small repository helpers do not justify a second dependency ecosystem.

### Keep shared code small and importable

Reusable code will live in an importable package under `scripts/`, split by responsibility only where needed:

- local domain and port parsing
- repository path resolution
- command lookup and subprocess execution
- termination of long-running child processes or process groups

Entry points will add the repository root to `sys.path` when needed, then import shared helpers. The domain CLI will print the validated hostname to standard output, allowing agent instructions to use:

```bash
LOCAL_HTTPS_DOMAIN="$(python3 scripts/load_local_domain.py)"
```

Alternative considered: duplicate validation and subprocess utilities in each entry point. Rejected because the current duplication and sourced-shell coupling are part of the maintenance problem.

### Preserve command argument boundaries and exit semantics

Commands will be passed to `subprocess` as argument lists with `shell=False`. Sequential commands will use `subprocess.run(..., check=True)` and return the failing command's non-zero status. User-supplied Playwright arguments will be appended individually rather than combined into a single string.

The scripts will resolve owned working directories from `__file__`, not the caller's current directory. Environment overrides will be created from `os.environ.copy()` and passed only to the relevant child process.

Alternative considered: invoke compound command strings through a shell. Rejected because it reintroduces quoting ambiguity and shell dependency.

### Model long-running processes explicitly

The HTTPS launchers will use `subprocess.Popen` for concurrent processes. Signal handlers and `finally` blocks will terminate all children, wait for a bounded interval, and force-kill remaining processes. On POSIX, child process groups will be used where needed so Gradle, Vite, `sudo`/`socat`, and their descendants do not survive the launcher.

The frontend launcher will continue to run Bun as the invoking user and use `sudo socat` only for the exposed relay port. It will fail before starting Bun if required configuration or `socat` is unavailable. The backend launcher will retain the continuous compiler plus foreground `bootRun` behavior.

Alternative considered: rely on interpreter shutdown to reap children. Rejected because it does not reliably stop descendants or handle interruption.

### Make destructive database reset explicit

`clear_postgres.py` will display the affected action and require an affirmative interactive response before running Docker Compose commands. Non-interactive use must pass `--yes`; EOF or any non-affirmative answer cancels without modifying services. This aligns behavior with the existing prompt instead of preserving its current unconditional reset bug.

### Make orchestration cleanup unconditional

`run_e2e_tests.py` and `run_all_test_suites.py` will put service teardown in `finally` blocks. The E2E helper will preserve the primary test/startup failure while still attempting cleanup. The full-suite helper will keep PostgreSQL running as it does today while stopping backend, frontend, and nginx.

The frontend readiness loop will be implemented in Python with a monotonic 120-second deadline and an HTTP request or curl subprocess, avoiding the current `timeout bash -c` dependency.

### Test behavior through public functions and subprocess boundaries

The shell fixture harness will become `unittest` coverage. Pure parsing and validation will be tested directly. Entry points and orchestration will be tested with temporary repositories and executable command stubs, or with `unittest.mock` where process semantics are clearer than filesystem stubs.

CI will run Python bytecode compilation and the helper test suite. Tests that require Docker, elevated ports, certificates, or live services will remain mocked or stubbed; existing Playwright coverage remains responsible for the deployed workflow.

## Risks / Trade-offs

- [External callers still use `.sh` paths] -> Treat the rename as an explicit breaking change, update every tracked reference, and provide a migration table in developer documentation.
- [Python availability differs across developer machines] -> Require `python3` 3.9+ explicitly and add a startup version check with a clear error.
- [Signal and process-group behavior differs between Linux and macOS] -> Use POSIX-supported APIs, bounded waits, focused tests, and avoid claiming native Windows support.
- [Mocks can miss real subprocess integration problems] -> Retain fixture-based command stubs for argument, environment, working-directory, and cleanup assertions.
- [Cleanup failure can mask the command that originally failed] -> Preserve the primary exception or exit status and report cleanup failures separately.
- [A broad one-step rename makes partial migration inconsistent] -> Land shared utilities, entry points, tests, references, and deletions in one atomic change.

## Migration Plan

1. Add shared Python utilities and their direct unit tests.
2. Add Python replacements for local HTTPS configuration and launchers, then port the existing launcher fixture coverage.
3. Add Python replacements for certificate, database, E2E, and full-suite helpers with focused tests.
4. Update all tracked documentation, agent instructions, and automation references to the new paths.
5. Add CI syntax and test commands.
6. Remove the eight handwritten shell files and verify no tracked references remain, excluding generated `backend/gradlew`.
7. Run helper tests plus relevant frontend/backend checks; exercise non-destructive CLI help and failure paths locally.

Rollback is a normal source revert restoring the shell scripts and their references. No persisted application data or deployment format changes are involved.

## Open Questions

None. The implementation assumptions are fully specified above.
