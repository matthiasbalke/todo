## Why

The repository has multiple contribution-sensitive workflows across backend, frontend, e2e, Docker, CI, local HTTPS helpers, and OpenSpec planning, but no single contributor-facing guide that explains how to work with them consistently. Adding a contribution guide reduces onboarding friction and makes expected validation steps explicit before changes are proposed or merged.

## What Changes

- Expand `.github/CONTRIBUTING.md` into the canonical contribution guide that explains how to prepare a development environment, make changes, validate them, and submit pull requests.
- Keep `.github/CODE_OF_CONDUCT.md` as the canonical conduct document and link to it from the contribution guide where conduct is mentioned.
- Document repository-specific conventions, including zsh helper scripts, OpenSpec change planning, backend Testcontainers usage, frontend Svelte/SvelteKit checks, Playwright e2e workflow, Docker Compose usage, CI expectations, security-sensitive configuration, and licensing.
- Link from `README.md` to the contribution guide so new contributors can find it from the project entry point.
- Do not change application runtime behavior, APIs, database schema, or build outputs except for documentation links.

## Capabilities

### New Capabilities

- `repository-contribution-guide`: Defines the required content and discoverability expectations for the repository contribution guide.

### Modified Capabilities

- None.

## Impact

- Affected documentation: `.github/CONTRIBUTING.md`, `.github/CODE_OF_CONDUCT.md`, `README.md`.
- Affected systems: contributor onboarding, local validation guidance, pull request expectations.
- No backend, frontend, database, deployment, or dependency changes are expected.
