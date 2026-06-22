## Context

The repository currently stores the backend release version in `backend/build.gradle.kts` as `versionBase` and the frontend release version in `frontend/package.json` as `version`. The existing `Release` workflow reads these values to build and publish images, so the version bump needs to happen before the release workflow runs.

GitHub Actions supports manually triggered workflows through `workflow_dispatch` inputs. Running a manual workflow requires write access to the repository, so the workflow can rely on GitHub's repository collaborator permissions instead of hard-coding an allowed username. The workflow needs to commit changes back to the repository with a deployment token secret rather than `GITHUB_TOKEN`, because the push must work even when required checks have not passed.

## Goals / Non-Goals

**Goals:**

- Provide a manually triggered GitHub Actions workflow with a required version input.
- Allow repository collaborators with write access to run the version bump through GitHub's manual workflow permission model.
- Validate the input as a plain semantic version of the form `MAJOR.MINOR.PATCH`.
- Update both version sources consistently.
- Commit the changed files back to the branch selected for the manual workflow run using a deployment token.

**Non-Goals:**

- Automatically create Git tags, GitHub releases, or image publications.
- Change the existing release workflow triggers or image publishing behavior.
- Support prerelease, build metadata, or non-semver version values.
- Update dependency lockfiles, changelogs, or documentation.
- Create or manage the deployment token itself.

## Decisions

1. Use a separate workflow, `.github/workflows/bump-version.yml`.

   Keeping the bump operation separate from `.github/workflows/release.yml` makes the release workflow continue to do one thing: build and publish from committed repository state. Alternative considered: add a manual trigger to the release workflow. That would mix mutable version-file edits with publishing and make failures harder to reason about.

2. Do not add a hard-coded actor allowlist.

   GitHub already requires write access to manually run a `workflow_dispatch` workflow, which matches the desired team-friendly access model. Alternative considered: gate the job with a specific `github.actor` value. That would satisfy a single-user release process but would require workflow edits as the team grows.

3. Use a required `workflow_dispatch` string input named `version`.

   The GitHub Actions `inputs` context is the direct, supported way to read manual workflow input values. The workflow will validate the value with a shell regex before editing files. Alternative considered: use separate major, minor, and patch inputs. A single input matches the requested `0.3.0` workflow and keeps the UI simple.

4. Update files with existing platform tools available on `ubuntu-latest`.

   The workflow can use `perl` or `sed` for the Kotlin file and Node.js for `package.json`, avoiding new dependencies. Node is already needed for reliable JSON parsing and preserves valid JSON output. Alternative considered: introduce a reusable script in the repository. That is useful if version updates grow, but unnecessary for two small files.

5. Commit only when the requested version changes tracked files.

   If both files already contain the requested version, the workflow should report that no commit is needed. This keeps repeated manual runs idempotent. Alternative considered: always create an empty commit. Empty commits add noise without changing release inputs.

6. Use a deployment token secret for checkout and push credentials.

   The workflow should pass the deployment token secret to `actions/checkout` through its `token` input so authenticated git commands use that credential. The token must belong to a service identity or GitHub App installation that is allowed by repository rules to push the version bump even when required checks have not passed. Alternative considered: use the default `GITHUB_TOKEN`. That token is simpler, but it can be blocked by branch protection and required check rules, which would make this workflow fail in the release-preparation case it is meant to solve.

## Risks / Trade-offs

- Any collaborator with workflow write access can bump versions -> Mitigate through repository collaborator management and branch protection rather than workflow-level username checks.
- Direct text replacement can drift if `backend/build.gradle.kts` changes shape -> Mitigate by matching the exact `val versionBase = "..."` assignment and failing when the replacement does not modify the expected file.
- Committing back to protected branches can fail if the deployment token is missing or lacks bypass permission -> Mitigate by failing before file edits when the secret is unavailable and by documenting the required token capability.
- The workflow only accepts `MAJOR.MINOR.PATCH` values -> This intentionally excludes prerelease/build metadata to keep releases aligned with the current project version format.
