# local-https-domain-configuration Specification

## Purpose

Define the shared, machine-local hostname configuration used by local HTTPS development scripts and documentation.

## Requirements

### Requirement: Local HTTPS domain has a tracked template and ignored override
The repository SHALL provide a tracked domain template containing `todo.example.com` and SHALL exclude the corresponding per-computer local domain file from Git.

#### Scenario: Developer prepares local domain configuration
- **WHEN** a developer follows the setup instructions
- **THEN** the developer SHALL be able to copy the tracked template to the ignored local file and replace `todo.example.com` with the hostname used on that computer

#### Scenario: Local domain differs between computers
- **WHEN** developers configure different hostnames in their local files
- **THEN** those machine-specific values SHALL not appear as tracked repository changes

### Requirement: HTTPS startup scripts use the shared local domain
Both HTTPS startup scripts SHALL load the hostname from the repo-root local domain file before starting child processes.

#### Scenario: Frontend HTTPS startup succeeds
- **WHEN** the local domain file contains a valid hostname and the frontend startup script is run from any working directory
- **THEN** the script SHALL use that hostname for `VITE_HMR_HOST` and SHALL use the supplied port or `443` for `VITE_HMR_CLIENT_PORT`

#### Scenario: Backend HTTPS startup succeeds
- **WHEN** the local domain file contains a valid hostname and the backend startup script is run from any working directory
- **THEN** the script SHALL use that hostname for `WEBAUTHN_RP_ID` and SHALL use `https://<hostname>:<port>` for `CORS_ALLOWED_ORIGINS`

#### Scenario: Custom HTTPS port is supplied
- **WHEN** either startup script receives a port argument
- **THEN** the script SHALL combine that port with the configured hostname without accepting a positional domain override

### Requirement: Invalid local domain configuration stops startup
The shared domain loader SHALL return a non-zero status before server or watcher processes start when the local domain file is missing, empty, or not a hostname-only value.

#### Scenario: Local domain file is missing
- **WHEN** either HTTPS startup script or the documented agent E2E setup loads configuration without `.local-domain`
- **THEN** an error SHALL identify the missing file and instruct the user to copy `.local-domain.example` to `.local-domain` and edit the domain value

#### Scenario: Local domain file is empty
- **WHEN** the local domain file contains no hostname
- **THEN** an error SHALL identify the invalid file and no development child process SHALL start

#### Scenario: Local domain contains origin syntax
- **WHEN** the configured value contains a scheme, port, path, or whitespace instead of only a hostname
- **THEN** an error SHALL explain that only a hostname is allowed and no development child process SHALL start

### Requirement: Documentation uses the configured local domain
Repository documentation SHALL describe the local domain file workflow and SHALL avoid hard-coding a computer-specific domain in agent E2E commands.

#### Scenario: Agent runs E2E tests against an existing stack
- **WHEN** an agent follows the README instructions
- **THEN** the instructions SHALL load the shared local domain and set `BASE_URL` to its HTTPS origin before running Playwright

#### Scenario: Developer reads local HTTPS setup
- **WHEN** a developer reads the local HTTPS guide
- **THEN** the guide SHALL document creating `.local-domain`, the new startup script port argument, and the missing-file recovery command
