# Consolidate dependency PRs

Combine all open pull requests tagged with `dependencies` into a single consolidated PR on a new branch.

## Usage

`/dependencies` — consolidate all dependency-tagged PRs into one

## Workflow

### Step 1 — Gather context

1. List all open PRs with the `dependencies` label:
   ```bash
   gh pr list --label dependencies --state open --json number,title,headRefName
   ```

2. If no PRs are found, stop and report: "No open PRs found with the `dependencies` label."

3. For each PR found, retrieve the branch name and create a mapping of PR numbers to their branch names.

### Step 2 — Create a new consolidation branch

1. Ensure you're on the default branch (usually `main`):
   ```bash
   git checkout main
   git pull origin main
   ```

2. Create a new consolidation branch with timestamp to ensure uniqueness:
   ```bash
   CONSOLIDATION_BRANCH="deps/consolidate-$(date +%Y%m%d-%H%M%S)"
   git checkout -b $CONSOLIDATION_BRANCH
   ```

### Step 3 — Merge all dependency PRs

For each PR from Step 1:

1. Fetch the source branch from the PR:
   ```bash
   git fetch origin <branch-name>
   ```

2. Merge it into the consolidation branch:
   ```bash
   git merge --no-ff origin/<branch-name> -m "Merge PR #<number>: <title>"
   ```

3. If there are merge conflicts, stop and report them to the user. Ask if they want to:
   - Abort and try a different approach
   - Resolve conflicts manually (they will need to provide the resolution strategy)

   If the user wants to resolve, guide them through the conflict resolution, then `git add .` and `git commit`.

4. If the merge succeeds, continue to the next PR.

### Step 4 — Push the consolidation branch

1. Push the new branch to the remote:
   ```bash
   git push origin $CONSOLIDATION_BRANCH
   ```

2. Confirm the push succeeded before continuing.

### Step 5 — Create the consolidated PR

1. Create a PR from the consolidation branch to main:
   ```bash
   gh pr create \
     --base main \
     --head $CONSOLIDATION_BRANCH \
     --title "chore: Consolidate dependency updates" \
     --body "This PR consolidates the following dependency update PRs:

   $(gh pr list --label dependencies --state open --json number,title | jq -r '.[] | "- PR #\(.number): \(.title)"')

   Merged branches:
   - $(git log --oneline main..$CONSOLIDATION_BRANCH | wc -l) commits from $(echo "$PR_BRANCHES" | wc -w) dependency PRs"
   ```

2. Note the PR number from the output.

3. Present the created PR number and URL to the user.

### Step 6 — Report summary

Summarize:
1. **Consolidation branch** — the new branch name
2. **Source PRs** — list all PR numbers that were merged
3. **Commits created** — total number of commits in the consolidation PR
4. **Merge conflicts** — any that occurred (if resolved, confirm resolution)
5. **Next steps** — remind the user that:
   - They can review the consolidated PR and request changes
   - Once approved, they can merge it to main
   - The original dependency PRs will likely auto-close when their branches are deleted (or can be closed manually)

Keep the report concise.
