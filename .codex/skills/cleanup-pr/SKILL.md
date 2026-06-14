---
name: cleanup-pr
description: Rebase branches to cleanup multiple connected commits.
license: MIT
compatibility: 
metadata:
  author: matthiasbalke
  version: "1.0"
---

You are helping the user clean up a noisy PR branch by rewriting its history into clean, logical commits using a safe backup-first workflow.

## Step 1 — Gather context

Run these commands in parallel:
- `git branch --show-current` — get the current branch name
- `git log --oneline origin/main..HEAD` — show the noisy commit history
- `git diff --stat origin/main..HEAD` — show what files actually changed

Present the log and diff-stat to the user so they can see what needs cleaning up.

## Step 2 — Create & push backup branch

- Create a backup branch: `git branch backup/<current-branch>`
- Push it: `git push origin backup/<current-branch>`

**The push must succeed before continuing.** If the push fails, stop and report the error. Do not touch the PR branch.

Confirm to the user that the backup is safe on the remote at `backup/<current-branch>`.

## Step 3 — Plan clean history with user

Show the diff-stat from Step 1 again for reference. Then use AskUserQuestion to ask the user to describe the desired clean commits. For each commit they want, you need:
- The commit message
- Which files (or source SHAs) should be included in that commit

Wait for the user's answer before proceeding.

## Step 4 — Rebase

Execute the rebase plan:

1. `git reset --hard origin/main` — reset branch to main
2. For each planned commit in order:
    - Stage the relevant files: `git checkout <sha> -- <file1> <file2> ...`
      (use the original HEAD SHA from before the reset to restore file contents)
    - Commit: `git commit -m "<message>"`

## Step 5 — Verify

Run in parallel:
- `git log --oneline origin/main..HEAD` — confirm commit count and messages match the plan
- `git diff --name-only origin/main..HEAD` — confirm the right files are included

Present both outputs to the user and ask them to confirm it looks correct before force-pushing.

## Step 6 — Force-push

1. Refresh the tracking ref: `git fetch origin <branch>`
2. Force-push with lease: `git push --force-with-lease`

If `--force-with-lease` fails with a "stale" or "rejected" error, tell the user:
> The tracking ref is stale even after fetch. Run `git push --force` manually to complete the push. This is safe because you verified the backup is on the remote at `backup/<current-branch>`.

Do **not** run `git push --force` automatically — let the user decide.