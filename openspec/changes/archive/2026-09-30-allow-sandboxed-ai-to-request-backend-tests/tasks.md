## 1. Host-Only Watcher Installation

- [x] 1.1 Create a self-contained watcher source package in `scripts/watch-and-run/` and implement its small dependency-free zsh polling watcher; verify the directory can be installed intact to a host-only location, invalid `--worktree` paths are rejected, a valid path limits observation to its root, and it runs without external file-watch tooling.
- [x] 1.2 Implement host-only action registration that maps fixed trigger names to fixed action functions or scripts, with backend integration tests as the initial action; verify another configured action runs without modifying the watcher core and an unknown signal runs nothing.
- [x] 1.3 Implement atomic per-trigger claiming, a `<trigger>.results/` directory with captured command output and atomically published status, and cleanup with a run identifier, outcome, report location, log location, and launch diagnostics; verify successful, failing, duplicate, and command-start-failure runs retain observable results.
- [x] 1.4 Add focused tests or a safe test mode for worktree validation, request claiming, malformed trigger contents, unknown signals, and concurrent watcher behavior; verify all cases without requiring destructive host actions.
- [x] 1.5 Add `zsh -n` validation and a concise manual security-review checklist covering the core's limited responsibilities, host-only configuration, and absence of dynamic command evaluation; verify the watcher has no runtime dependency beyond zsh and standard filesystem utilities.

## 2. Host Setup and Trust Boundary

- [x] 2.1 Document installing `scripts/watch-and-run/` to a host-only directory, startup with `--worktree`, action registration, request creation, completion checks, stale-state cleanup, and report inspection; verify commands and paths against the implemented workflow.
- [x] 2.2 Document that selected actions execute worktree code and require either a trusted-worktree model or a separately restricted runner; verify the backend-test setup identifies its chosen model and Docker-resource limitations.
- [x] 2.3 Validate the end-to-end handshake on a Docker-capable host with passing and failing backend integration-test runs, confirming the sandbox can read outcomes and reports while it cannot alter the installed watcher configuration.
