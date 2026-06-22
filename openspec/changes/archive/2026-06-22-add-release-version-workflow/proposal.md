## Why

Preparing a release currently requires manually editing the backend and frontend version files, which is easy to miss or update inconsistently. A manually triggered workflow gives repository collaborators a repeatable way to bump both project versions before the existing release workflow builds and publishes images.

## What Changes

- Add a GitHub Actions workflow that can only be run manually with a version input such as `0.3.0`.
- Rely on GitHub's manual workflow permissions so repository collaborators with write access can execute the version bump.
- Update `backend/build.gradle.kts` by replacing the `versionBase` value with the requested version.
- Update `frontend/package.json` by replacing the `version` value with the requested version.
- Commit and push the resulting version file changes back to the repository branch from which the workflow was run using a configured deployment token.
- Reject invalid version inputs before modifying files.

## Capabilities

### New Capabilities

- `release-version-bump-workflow`: Defines the manually triggered collaborator-accessible workflow for updating project version metadata.

### Modified Capabilities

None.

## Impact

- Adds a new workflow under `.github/workflows/`.
- Modifies release process behavior by introducing a user-triggered version bump step before normal release builds.
- Writes to `backend/build.gradle.kts` and `frontend/package.json` when the workflow runs.
- Requires a repository secret containing a deployment token that can push to the selected branch even when required checks have not passed.
