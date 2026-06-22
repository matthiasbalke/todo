## 1. Workflow Definition

- [x] 1.1 Add `.github/workflows/bump-version.yml` with a `workflow_dispatch` trigger and required string `version` input.
- [x] 1.2 Configure checkout to use a deployment token secret as the git credential for fetch and push operations.
- [x] 1.3 Ensure the workflow does not hard-code a username allowlist and relies on GitHub's manual workflow permission model.
- [x] 1.4 Fail early with a clear error when the deployment token secret is not configured.

## 2. Version Update Logic

- [x] 2.1 Validate the `version` input with a `MAJOR.MINOR.PATCH` numeric regex before modifying files.
- [x] 2.2 Update `backend/build.gradle.kts` by replacing the `val versionBase = "..."` assignment with the requested version.
- [x] 2.3 Update `frontend/package.json` by setting the top-level `version` property to the requested version using JSON-aware tooling.
- [x] 2.4 Fail the workflow if the expected backend or frontend version update cannot be applied.

## 3. Commit Behavior

- [x] 3.1 Configure the workflow commit author for GitHub Actions.
- [x] 3.2 Commit and push only `backend/build.gradle.kts` and `frontend/package.json` when either file changes, using the deployment token credential.
- [x] 3.3 Complete successfully without creating a commit when both files already contain the requested version.

## 4. Validation

- [x] 4.1 Validate the workflow YAML parses correctly.
- [x] 4.2 Run `openspec validate add-release-version-workflow --strict` and resolve any issues.
