## Context

See proposal.md for the motivation. Backend tests use Testcontainers, so execution belongs on a host with Docker access. The watcher must observe the worktree shared with the sandboxed requester, but its executable and trigger-to-action configuration must not be writable or readable from that sandbox. The repository uses zsh for its shell helpers.

## Goals / Non-Goals

**Goals:**
- Provide a simple repository-local request/completion handshake that is visible to both sandbox and host.
- Support multiple named validation actions while allowing only host-configured actions to run.
- Ensure each action uses a validated, explicit worktree and leaves its reports available for analysis.
- Make success, failure, and inability to launch distinguishable without relying solely on trigger-file deletion.
- Keep the watcher and action-runner core small enough for a host operator to audit and maintain without specialist tooling.

**Non-Goals:**
- Exposing a general-purpose remote command execution mechanism.
- Automatically interpreting or summarizing test reports inside the watcher.
- Replacing CI or making host Docker available to the sandbox.
- Making code from an AI-editable worktree safe to execute on a trusted host.
- Building a generic job scheduler, command language, network service, or plugin framework.

## Decisions

- Use a documented trigger file at the worktree root as the request signal. The requester creates it; the watcher claims it before starting to avoid duplicate runs and removes the active signal when the run finishes. Each configured trigger has independent running and result state.
  - Alternative: a continuously running service/API. Rejected because it adds infrastructure and network access where a filesystem handshake is sufficient.
- Publish a separate completion result containing exit status and report location. Trigger deletion alone cannot distinguish success from failure and can race with a subsequent request.
  - The watcher should write results atomically and include a run identifier so a requester can associate the completion with its request.
- Install the active watcher and its action registration in a host-only directory outside the sandbox-visible worktree. The watcher receives an absolute `--worktree` path, validates it at startup, and passes it explicitly to each action rather than deriving it from a trigger or its current directory.
  - Alternative: source action configuration from the repository. Rejected because a sandboxed requester could modify an allowlist entry to run an arbitrary host command.
- Keep the tracked watcher source and installation materials together in `scripts/watch-and-run/`. The host installer places that self-contained package in a host-only location and preserves an existing installed action configuration; the active watcher never loads its executable or action configuration from the repository copy.
  - Alternative: scatter the source among general-purpose repository scripts. Rejected because a dedicated directory makes the package easy to audit, transfer, and remove from the sandbox-visible worktree after installation.
- Register actions as host-owned zsh functions or scripts and map each fixed trigger name to one action. Treat trigger contents as untrusted and never evaluate them as commands or arguments. Backend integration tests are the initial action and retain their Gradle reports for the requester.
  - Alternative: encode commands or arbitrary test arguments in a trigger. Rejected because it turns a convenience signal into an arbitrary host command interface.
- Implement the watcher as a small zsh polling loop using standard shell and filesystem operations. Limit its responsibilities to validating the worktree, detecting configured triggers, atomically claiming a trigger, invoking its mapped action, and writing a result.
  - Alternative: add a file-watch dependency, service process manager, command parser, or extensible plugin system. Rejected because each adds operational and security-review surface without improving the small number of expected actions.
- Document the trust boundary explicitly: although the action mapping is host-owned, an action such as Gradle tests executes build and test code from the supplied worktree. The host operator must either trust that worktree or run it in a separately restricted runner.
  - Alternative: describe the external watcher as sufficient isolation. Rejected because the selected validation command can itself execute AI-modified repository code.
- Keep the watcher host-managed and opt-in, with setup and operation documented alongside repository test guidance. Do not start it automatically from application or CI processes.

## Risks / Trade-offs

- [Host watcher is not running] → Document a clear waiting/timeout check and host setup/launch instructions.
- [A stale trigger or result is mistaken for a new run] → Use per-trigger claimed/in-progress state and correlate completion with a unique request identifier; document cleanup of stale state.
- [Concurrent watchers process the same request] → Claim each trigger atomically or use an exclusive lock before invoking its action.
- [Sandboxed requester alters watcher behavior] → Keep the installed watcher and action configuration outside the sandbox-visible worktree and never source configuration from it.
- [Worktree code gains host privileges through a selected action] → Require the operator to choose and document either a trusted-worktree model or a separately restricted runner; do not represent the trigger allowlist as a full sandbox.
- [A future extension makes the runner hard to audit] → Keep the core dependency-free and narrowly scoped; require ordinary `zsh -n` checks and a manual review of any new action registration or shell behavior.
- [Test output contains sensitive environment data] → Keep results to exit status, timestamps/run identifier, and report path; do not copy full logs into the request signal.

## Migration Plan

1. Create the self-contained watcher source package in `scripts/watch-and-run/`, then install it and its host-only action configuration outside the sandbox-visible worktree before starting it with the intended absolute worktree path.
2. Configure the backend integration-test action and document how a host operator adds another fixed action.
3. Verify successful and failing runs, duplicate-request handling, unknown-trigger handling, and command-start failure on a Docker-capable host.
4. Roll back by stopping and removing the host installation; the existing backend test workflow remains unchanged.
