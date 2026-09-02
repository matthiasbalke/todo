## Purpose

Define the contributor-facing documentation expectations for this repository.

## Requirements

### Requirement: Contribution guide exists
The repository SHALL provide `.github/CONTRIBUTING.md` as the canonical contribution guide for contributor onboarding.

#### Scenario: Contributor opens GitHub community files
- **WHEN** a contributor inspects the repository's GitHub community files
- **THEN** `.github/CONTRIBUTING.md` is present as the contribution guide

### Requirement: Contribution guide is discoverable from README
The repository README SHALL link to the contribution guide without duplicating development setup and validation command lists.

#### Scenario: Contributor reads project README
- **WHEN** a contributor reads `README.md`
- **THEN** the README provides a visible link to `.github/CONTRIBUTING.md`
- **THEN** detailed backend, frontend, e2e, and validation commands are kept in `.github/CONTRIBUTING.md`

### Requirement: Contribution guide describes project scope and architecture references
The contribution guide SHALL summarize the project purpose and point contributors to the canonical requirements and architecture documentation.

#### Scenario: Contributor needs project context
- **WHEN** a contributor reads the guide before starting work
- **THEN** the guide identifies the app as a personal and household todo app for groceries, todos, and recurring tasks
- **THEN** the guide links to `docs/requirements.md` for full requirements and architecture

### Requirement: Contribution guide documents development prerequisites
The contribution guide SHALL document the required development tools and environment assumptions for backend, frontend, e2e, Docker, and shell helper workflows.

#### Scenario: Contributor prepares local environment
- **WHEN** a contributor follows the prerequisites section
- **THEN** the guide names Java 21, Kotlin and Gradle via the backend wrapper, Bun for frontend and e2e work, PostgreSQL or Docker Compose for full-stack runtime, Playwright browser dependencies, and zsh for repository-owned shell helpers

### Requirement: Contribution guide documents repository layout
The contribution guide SHALL describe the main repository directories and their ownership boundaries.

#### Scenario: Contributor chooses where to make a change
- **WHEN** a contributor checks the repository layout section
- **THEN** the guide explains the purpose of `backend/`, `frontend/`, `e2e/`, `all-in-one/`, `docs/`, `openspec/`, and Docker Compose files

### Requirement: Contribution guide documents change workflow
The contribution guide SHALL explain how contributors should branch, plan, implement, validate, and submit changes.

#### Scenario: Contributor starts a non-trivial change
- **WHEN** a contributor plans a behavior, architecture, API, data model, workflow, or user-facing documentation change
- **THEN** the guide tells them to create or update an OpenSpec change before implementation

#### Scenario: Contributor starts a trivial change
- **WHEN** a contributor plans a typo, comment, or narrow documentation correction
- **THEN** the guide allows the change without requiring OpenSpec artifacts

### Requirement: Contribution guide documents validation commands
The contribution guide SHALL list the key validation commands contributors should run before opening a pull request.

#### Scenario: Contributor validates backend changes
- **WHEN** a contributor changes backend code, migrations, or backend configuration
- **THEN** the guide lists `cd backend && ./gradlew test` and notes that backend integration tests use Testcontainers with PostgreSQL

#### Scenario: Contributor validates frontend changes
- **WHEN** a contributor changes frontend code or Svelte components
- **THEN** the guide lists `cd frontend && bun run check`, `cd frontend && bun run test -- --run`, and `cd frontend && bun run build`

#### Scenario: Contributor validates e2e behavior
- **WHEN** a contributor changes user-facing full-stack behavior
- **THEN** the guide lists the Playwright e2e workflow from `e2e/`

#### Scenario: Contributor validates shell helpers
- **WHEN** a contributor changes repository-owned `.sh` helper scripts
- **THEN** the guide lists zsh syntax validation and states that helper scripts must stay zsh-compatible

### Requirement: Contribution guide documents optional local DNS setup
The contribution guide SHALL document how contributors configure the repository's optional local DNS hostname file for HTTPS development.

#### Scenario: Contributor sets up local HTTPS hostname
- **WHEN** a contributor needs to test passkeys, HTTPS-only browser behavior, or another device against local development servers
- **THEN** the guide tells them to copy `.local-domain.example` to `.local-domain`
- **THEN** the guide states that `.local-domain` is ignored by Git and must contain only the hostname, without protocol, port, path, or whitespace
- **THEN** the guide explains that the HTTPS backend and frontend startup scripts read this file through `scripts/load-local-domain.sh`
- **THEN** the guide links to `docs/howto-local-dev-https-setup.md` for full mkcert, certificate, and device trust setup

### Requirement: Contribution guide documents coding conventions
The contribution guide SHALL document repository-specific coding and documentation conventions.

#### Scenario: Contributor edits implementation code
- **WHEN** a contributor reads coding conventions
- **THEN** the guide covers backend Testcontainers expectations, frontend component reuse, Svelte/SvelteKit validation, client-side filtering expectations, SSE awareness for list updates, and zsh helper compatibility

### Requirement: Contribution guide documents security expectations
The contribution guide SHALL document security-sensitive contribution expectations.

#### Scenario: Contributor changes authentication or secrets
- **WHEN** a contributor works near passkeys, OAuth2, JWTs, CORS, WebAuthn relying party configuration, setup secrets, file attachments, or account deletion
- **THEN** the guide warns them not to commit secrets and to preserve the no-password authentication model

### Requirement: Contribution guide documents pull request expectations
The contribution guide SHALL document what pull requests should include.

#### Scenario: Contributor opens a pull request
- **WHEN** a contributor prepares a pull request
- **THEN** the guide asks for a concise summary, linked OpenSpec change when applicable, validation results, screenshots or recordings for visible UI changes, migration notes when relevant, and security notes when relevant

### Requirement: Contribution guide uses maintainer-oriented tone
The contribution guide SHALL use a practical, maintainer-oriented tone instead of corporate contribution boilerplate.

#### Scenario: Contributor reads guide tone
- **WHEN** a contributor reads `.github/CONTRIBUTING.md`
- **THEN** the guide gives direct expectations, concrete commands, and concise rationale where useful
- **THEN** the guide avoids broad corporate or community-program language that does not fit a personal project

### Requirement: Contribution guide documents licensing and conduct references
The contribution guide SHALL state the license expectations and link to the repository's canonical code of conduct.

#### Scenario: Contributor submits a change
- **WHEN** a contributor submits code or documentation
- **THEN** the guide states that contributions are made under the repository's MIT License
- **THEN** the guide links to `.github/CODE_OF_CONDUCT.md` for conduct expectations
