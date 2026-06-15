## ADDED Requirements

### Requirement: Handwritten repository helpers use Python 3
The repository SHALL implement its handwritten helper programs and helper test harnesses as executable Python 3 files using only the Python standard library, and SHALL NOT rewrite generated wrappers such as `backend/gradlew`.

#### Scenario: Developer invokes a helper directly
- **WHEN** a developer executes a migrated helper through its shebang or with `python3`
- **THEN** the helper SHALL run on Python 3.9 or newer without installing Python packages

#### Scenario: Repository shell inventory is checked
- **WHEN** tracked handwritten helper files are inspected after migration
- **THEN** the replaced `.sh` files SHALL be absent
- **AND** generated or third-party shell wrappers SHALL remain unchanged

### Requirement: Python entry points are repository-location aware
Each migrated helper SHALL resolve repository-owned paths from its own file location instead of requiring a particular caller working directory.

#### Scenario: Helper is launched outside the repository directory
- **WHEN** a developer invokes a helper by path from another working directory
- **THEN** repository files, working directories, and configuration SHALL resolve relative to the helper's repository

### Requirement: Shared local HTTPS configuration remains reusable
The Python helper implementation SHALL provide importable hostname and port validation for the HTTPS launchers and a command-line interface that writes the validated local hostname to standard output.

#### Scenario: Agent resolves the configured hostname
- **WHEN** an agent runs the local-domain Python CLI with a valid `.local-domain`
- **THEN** standard output SHALL contain only the normalized hostname
- **AND** the command SHALL exit successfully

#### Scenario: Local HTTPS input is invalid
- **WHEN** the domain file is missing, empty, or contains a non-hostname value, or a supplied port is outside `1` through `65535`
- **THEN** the helper SHALL emit an actionable error to standard error
- **AND** it SHALL return a non-zero status before any server process starts

### Requirement: External commands preserve arguments, environment, and failures
Migrated helpers SHALL invoke external programs without a command shell, SHALL preserve argument boundaries, SHALL set the documented child environment and working directory, and SHALL return a non-zero status when a required command fails.

#### Scenario: Playwright receives multiple arguments
- **WHEN** a developer supplies multiple Playwright arguments to the E2E helper
- **THEN** each argument SHALL be forwarded as a distinct argument in its original order

#### Scenario: HTTPS launcher starts a child process
- **WHEN** an HTTPS launcher starts Bun or Gradle
- **THEN** the child SHALL run from the corresponding frontend or backend directory
- **AND** it SHALL receive the hostname and port-derived environment required by the existing local HTTPS specifications

#### Scenario: Required executable is missing
- **WHEN** a helper cannot locate an external executable it requires
- **THEN** it SHALL fail before dependent commands start
- **AND** the error SHALL name the missing executable

### Requirement: Long-running helpers clean up owned processes and services
Helpers that start concurrent child processes or Docker Compose services SHALL attempt cleanup on normal completion, command failure, interruption, and termination signals while preserving the primary failure status.

#### Scenario: Frontend launcher exits
- **WHEN** either Vite or the relay process exits or the launcher is interrupted
- **THEN** the launcher SHALL terminate and wait for both owned process groups

#### Scenario: Backend launcher exits
- **WHEN** `bootRun` finishes, fails, or is interrupted
- **THEN** the continuous compilation process and its descendants SHALL be terminated

#### Scenario: E2E execution fails
- **WHEN** stack startup or Playwright execution returns a failure
- **THEN** the helper SHALL still attempt to stop and remove the services it started
- **AND** the helper SHALL preserve the primary failure status

#### Scenario: Full test suite finishes
- **WHEN** the full-suite helper succeeds, fails, or is interrupted
- **THEN** it SHALL stop backend, frontend, and nginx services
- **AND** it SHALL leave PostgreSQL running

### Requirement: PostgreSQL reset requires confirmation
The PostgreSQL reset helper SHALL require explicit confirmation before stopping, removing, and recreating the local PostgreSQL service.

#### Scenario: Developer confirms interactively
- **WHEN** the developer enters an affirmative response at the reset prompt
- **THEN** the helper SHALL run the PostgreSQL reset commands

#### Scenario: Developer declines or input is unavailable
- **WHEN** the developer enters a non-affirmative response or standard input reaches EOF
- **THEN** the helper SHALL exit without changing PostgreSQL services

#### Scenario: Automation explicitly confirms reset
- **WHEN** the helper is invoked with `--yes`
- **THEN** it SHALL perform the reset without prompting

### Requirement: Certificate generation uses repository paths
The certificate helper SHALL create the repository certificate directory when needed and invoke `mkcert` with repository-root output paths and the documented local hostnames.

#### Scenario: Certificate helper runs from another directory
- **WHEN** a developer invokes the helper outside the repository root
- **THEN** the key and certificate SHALL be written under the repository's `.certs` directory

### Requirement: Python helpers have automated verification
The repository SHALL provide standard-library Python tests and CI commands that validate helper syntax, configuration parsing, command construction, environment propagation, working-directory independence, cleanup behavior, and destructive-operation confirmation.

#### Scenario: CI verifies helper code
- **WHEN** continuous integration runs for a pull request
- **THEN** it SHALL compile the Python helper sources
- **AND** it SHALL execute the Python helper test suite without requiring Docker, elevated privileges, or live application services

### Requirement: Tracked references use Python entry points
Repository documentation, agent instructions, tests, and automation SHALL invoke the migrated Python paths and SHALL describe the Python local-domain CLI rather than sourcing shell state.

#### Scenario: Developer follows local HTTPS documentation
- **WHEN** a developer copies a documented launcher command
- **THEN** the command SHALL reference the executable Python entry point and preserve the documented port behavior

#### Scenario: Agent prepares an E2E base URL
- **WHEN** an agent follows `AGENTS.md`
- **THEN** it SHALL obtain the hostname from the Python local-domain CLI and construct the HTTPS base URL without sourcing a shell script
