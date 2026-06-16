# repository-shell-helper-compatibility Specification

## Purpose

Define the shell compatibility expectations for repository-owned helper scripts.

## Requirements

### Requirement: Repository helper scripts are zsh-compatible
Repository-owned `.sh` helper scripts SHALL run successfully under the repository's `zsh` execution environment, unless a script explicitly delegates to an external tool with documented shell requirements.

#### Scenario: Helper script inventory is checked
- **WHEN** implementation begins for shell helper compatibility
- **THEN** every tracked self-written `.sh` helper script in the repository SHALL be included in the compatibility audit

#### Scenario: Helper script is executed under zsh
- **WHEN** a repository-owned `.sh` helper script is run directly in the documented helper-script environment
- **THEN** the script SHALL use `zsh`-compatible syntax for shebangs, path resolution, argument handling, traps, and process cleanup

#### Scenario: Helper script sources another helper
- **WHEN** a repository-owned `.sh` helper script sources another repository helper
- **THEN** both scripts SHALL work together under `zsh` without relying on Bash-only variables or builtins

#### Scenario: Compatibility cannot be fully exercised locally
- **WHEN** a helper script requires unavailable external services, binaries, or destructive operations
- **THEN** the implementation SHALL document the compatibility review result and verify the script as far as practical without performing unsafe side effects
