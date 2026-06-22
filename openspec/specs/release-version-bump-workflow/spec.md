# Release Version Bump Workflow Specification

## Purpose

Define the manually triggered GitHub Actions workflow that updates project version metadata for release preparation.

## Requirements

### Requirement: Manual Version Bump Workflow
The repository SHALL provide a GitHub Actions workflow that is triggered only through a manual `workflow_dispatch` event with a required `version` input.

#### Scenario: Collaborator starts workflow with version input
- **WHEN** a repository collaborator manually starts the workflow with `version` set to `0.3.0`
- **THEN** the workflow SHALL receive `0.3.0` as the requested project version

#### Scenario: Workflow is not triggered by repository events
- **WHEN** code is pushed or a GitHub release is published
- **THEN** the version bump workflow SHALL NOT run from those events

### Requirement: Collaborator-Based Execution
The workflow SHALL rely on GitHub's repository permissions for manual workflow execution and SHALL NOT hard-code a specific allowed GitHub username.

#### Scenario: Workflow contains no username allowlist
- **WHEN** the workflow is inspected
- **THEN** it SHALL NOT contain a condition that limits execution to a specific GitHub username

#### Scenario: Collaborator starts workflow
- **WHEN** a repository collaborator manually starts the workflow
- **THEN** the workflow SHALL allow the version validation and file update steps to run

### Requirement: Version Input Validation
The workflow SHALL accept only plain semantic versions in the format `MAJOR.MINOR.PATCH`, where each segment is one or more digits.

#### Scenario: Valid version
- **WHEN** the workflow input `version` is `0.3.0`
- **THEN** the workflow SHALL treat the input as valid and continue

#### Scenario: Invalid version
- **WHEN** the workflow input `version` is `0.3`
- **THEN** the workflow SHALL fail before modifying `backend/build.gradle.kts` or `frontend/package.json`

### Requirement: Backend Version Update
The workflow SHALL update `backend/build.gradle.kts` so the `versionBase` assignment equals the requested version.

#### Scenario: Backend version is bumped
- **WHEN** the requested version is `0.3.0`
- **THEN** `backend/build.gradle.kts` SHALL contain `val versionBase = "0.3.0"`

### Requirement: Frontend Version Update
The workflow SHALL update `frontend/package.json` so the top-level `version` property equals the requested version.

#### Scenario: Frontend version is bumped
- **WHEN** the requested version is `0.3.0`
- **THEN** `frontend/package.json` SHALL contain a top-level `"version": "0.3.0"` property

### Requirement: Commit Updated Version Files
The workflow SHALL commit the backend and frontend version file changes back to the branch selected for the manual workflow run when those files changed.

#### Scenario: Version files changed
- **WHEN** the requested version differs from the current backend or frontend version
- **THEN** the workflow SHALL create a commit containing `backend/build.gradle.kts` and `frontend/package.json`

#### Scenario: Version files already match
- **WHEN** both version files already contain the requested version
- **THEN** the workflow SHALL complete without creating a new commit

### Requirement: Deployment Token Push
The workflow SHALL use a configured deployment token secret, not the default `GITHUB_TOKEN`, as the git credential for pushing version bump commits.

#### Scenario: Deployment token is configured
- **WHEN** the workflow checks out the repository
- **THEN** it SHALL configure checkout or git push credentials from the deployment token secret

#### Scenario: Deployment token is missing
- **WHEN** the deployment token secret is unavailable
- **THEN** the workflow SHALL fail before modifying `backend/build.gradle.kts` or `frontend/package.json`

#### Scenario: Required checks have not passed
- **WHEN** required branch checks have not passed for the version bump commit
- **THEN** the deployment token used by the workflow SHALL be capable of pushing the commit anyway
