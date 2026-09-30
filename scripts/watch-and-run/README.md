# Watch and Run

`watcher.zsh` is a small host-side action runner for a worktree shared with a sandboxed requester. The requester creates an empty configured trigger file at the worktree root; the watcher runs only the matching host-configured action and publishes the result beside that trigger.

## Install

The tracked `scripts/watch-and-run/` directory is source material only. Install it to a host-only location that the sandbox cannot read or modify, review its contents, then start the installed copy with the absolute path of the shared worktree.

```zsh
zsh scripts/watch-and-run/install.zsh
"${HOME}/.local/bin/watch-and-run" --worktree "/absolute/path/to/todo"
```

The installer writes the package to `${HOME}/.local/share/watch-and-run` and creates `${HOME}/.local/bin/watch-and-run`. Both locations must be outside the sandbox-visible filesystem. The installer preserves an existing installed `actions.zsh` during upgrades so a sandbox-visible source update cannot replace the host-owned allowlist.

The active watcher only sources `actions.zsh` beside its own installed `watcher.zsh`; it never loads action configuration from the worktree.

## Actions

`actions.zsh` is the host-owned allowlist. Define a function that accepts the worktree directory as its only argument, then register it with a trigger and optional relative report location.

```zsh
run_frontend_check() {
	local worktree_dir="$1"
	(
		cd "${worktree_dir}/frontend" || return 1
		bun run check
	)
}

register_action ".run-frontend-check" "run_frontend_check" "frontend/.svelte-kit"
```

Restart the watcher after changing its installed `actions.zsh`. Trigger names must start with `.run-`; unknown files are ignored. Trigger contents are ignored and are never treated as commands or arguments.

The default `.run-backend-tests` action runs `./gradlew test` from `<worktree>/backend` and reports `backend/build/reports/tests/test/index.html`.

## Request and Inspect

Create a configured trigger only when no request or running state exists for that action.

```zsh
touch "/absolute/path/to/todo/.run-backend-tests"
```

When it claims a request, the watcher clears the previous `.run-backend-tests.results/status` and `.run-backend-tests.results/output.log`. During execution, it creates the empty `.run-backend-tests.running` claim file and writes the action's combined standard output and standard error to `.run-backend-tests.results/output.log`. On completion it removes the claim file and atomically writes `.run-backend-tests.results/status` containing the run ID, timestamps, outcome, exit code, report path, log path, and diagnostic.

```zsh
cat "/absolute/path/to/todo/.run-backend-tests.results/status"
cat "/absolute/path/to/todo/.run-backend-tests.results/output.log"
```

The `.run-*` request, running, and results files are ignored by Git. If the watcher stops unexpectedly, leave its `.running` claim file in place until the host operator confirms no watcher or action is still running, then remove that exact stale file before restarting the watcher.

Use `--once` to process configured requests once and exit, and `--poll-seconds <positive-integer>` to change the default two-second polling interval.

## Trust Boundary

The default backend action uses the **trusted-worktree model**: Gradle wrapper, build scripts, and tests from the supplied worktree execute with the permissions of the host watcher. The trigger allowlist does not make that code safe. In particular, Testcontainers requires Docker access, which may provide powerful host capabilities.

Only run the default action when the worktree is trusted by the host operator. For untrusted AI changes, replace the action with a host-owned wrapper that submits the worktree to a separately restricted runner and document that runner's Docker and filesystem limits.

## Security Review

- Verify the installed package and `actions.zsh` are outside the sandbox-visible worktree and inaccessible to the requester.
- Verify every registered trigger maps to a reviewed fixed function; do not add `eval`, command-string parsing, or trigger-derived arguments.
- Verify each action uses the supplied worktree intentionally and has only the required host and Docker permissions.
- Run `zsh -n watcher.zsh actions.zsh install.zsh` after changes, then run `zsh tests/watcher.test.sh` from the source package before installing it to the host-only location.
- Confirm the watcher uses only zsh and standard filesystem utilities; it has no network service, plugin system, or external file-watch dependency.
