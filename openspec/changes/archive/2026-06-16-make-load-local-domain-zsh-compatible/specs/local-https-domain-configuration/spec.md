## ADDED Requirements

### Requirement: Local HTTPS domain loader is zsh-compatible
The shared local HTTPS domain loader SHALL work when sourced or executed from the repository's `zsh` helper scripts and SHALL resolve the repo-root `.local-domain` file from its own location rather than the caller's working directory.

#### Scenario: Sourced from any working directory
- **WHEN** a `zsh` helper script sources the loader from any working directory
- **THEN** the loader SHALL read the repo-root `.local-domain` file and export `LOCAL_HTTPS_DOMAIN` successfully

#### Scenario: Executed directly under zsh
- **WHEN** the loader is executed directly under `zsh` from any working directory
- **THEN** it SHALL perform the same path resolution and validation and either export `LOCAL_HTTPS_DOMAIN` or fail with the same validation errors as the sourced path
