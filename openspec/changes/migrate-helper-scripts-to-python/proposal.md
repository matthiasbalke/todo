## Why

The repository's handwritten shell helpers mix process orchestration, validation, cleanup, argument forwarding, and test fixtures in a form that is difficult to read and maintain consistently. Rewriting them as dependency-free Python 3 programs provides clearer control flow, structured error handling, and portable tests while preserving the existing developer workflows.

## What Changes

- Replace all eight handwritten `.sh` helper and test scripts with executable Python 3 programs using only the standard library.
- Introduce shared Python utilities for repository path resolution, subprocess execution, process cleanup, and local HTTPS domain and port validation where reuse improves clarity.
- Preserve the current observable behavior of the HTTPS launchers, certificate generator, database reset helper, full-suite runner, and E2E runner, including environment variables, working directories, exit status propagation, and child-process cleanup.
- Correct unsafe or ambiguous shell behavior during the migration: require actual confirmation before resetting PostgreSQL, provide a `--yes` automation option, reliably clean up E2E services on failure, and forward Playwright arguments without collapsing them into one string.
- Replace the shell-based local-domain test harness with Python tests that cover the same validation and launcher behavior.
- Update repository documentation, agent instructions, and internal references to invoke the Python entry points.
- Add CI coverage for the Python helper test suite and syntax validation.
- **BREAKING**: Remove the handwritten `.sh` entry points and replace their documented paths with snake_case `.py` entry points; callers outside this repository must update their commands.
- Exclude generated or third-party shell files such as `backend/gradlew` from the migration.

## Capabilities

### New Capabilities

- `python-helper-scripts`: Defines the supported Python runtime, entry-point, orchestration, cleanup, validation, and testing behavior for repository helper programs.

### Modified Capabilities

None. Existing local HTTPS domain and frontend proxy requirements remain behaviorally unchanged.

## Impact

- Affected files include the eight handwritten shell scripts under the repository root, `frontend/`, `backend/`, and `scripts/`, plus their replacements and shared Python modules.
- Documentation and automation references in `AGENTS.md`, `MEMORY.md`, and `docs/howto-local-dev-https-setup.md` must use the new Python paths and local-domain CLI contract.
- CI gains Python helper verification but no third-party Python dependency or package manager.
- Docker Compose, Bun, Gradle, Vite, Playwright, `mkcert`, `socat`, and `sudo` remain external commands invoked by the helpers.
