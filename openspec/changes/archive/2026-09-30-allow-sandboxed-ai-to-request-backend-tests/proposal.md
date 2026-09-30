## Why

Backend integration tests require Testcontainers and Docker, which are unavailable inside the sandboxed AI environment. This change provides a controlled, host-owned action runner that lets the AI request those tests and inspect the resulting reports without gaining access to the runner's scripts or configuration.

## What Changes

- Add a filesystem-based request/response handshake for host-side validation actions, with backend integration tests as the first configured action.
- Define safe watcher behavior for detecting configured requests, running the associated fixed action from an explicit worktree, recording the outcome, and clearing the request signal.
- Install the active watcher and its action configuration in a host-only directory that is inaccessible to the sandboxed requester.
- Keep the watcher and action-runner core deliberately small, dependency-free, and easy for a host operator to inspect and maintain.
- Document the worktree argument, host trust boundary, and how the AI and host watcher coordinate and locate reports.

## Capabilities

### New Capabilities
- `host-triggered-validation-actions`: Request and observe configured host-side validation actions from outside the sandbox.

### Modified Capabilities

## Impact

- A source package in `scripts/watch-and-run/` that can be installed into a host-only watcher location, its host-only action configuration, and test-runner workflow documentation.
- Backend Gradle test execution and generated test reports; no application API or runtime behavior changes.
- Host environment setup is required for the watcher because it must access Docker and the worktree visible to the sandboxed requester.
