## Purpose

Defines a repository-local handshake that lets a sandboxed contributor request configured host-side validation actions and inspect their results without controlling the host action configuration.

## Requirements

### Requirement: Configured validation actions can be requested through filesystem signals
The host environment SHALL provide a watcher that detects configured request signals in a supplied worktree and runs the corresponding host-configured validation action without requiring the requester to access the action's host resources.

#### Scenario: Host detects a configured test request
- **WHEN** the configured backend-test request signal is created at the supplied worktree root
- **THEN** the host watcher runs the configured backend integration-test action for that worktree

#### Scenario: Host detects another configured action
- **WHEN** a request signal for another configured action is created at the supplied worktree root
- **THEN** the host watcher runs that action without requiring a change to the watcher core

#### Scenario: Unknown signal is present
- **WHEN** an unconfigured request-like file is created at the supplied worktree root
- **THEN** the watcher SHALL NOT execute an action for that file

#### Scenario: Request is not executed more than once
- **WHEN** the watcher observes a request while that action's run is already in progress
- **THEN** it SHALL NOT start a concurrent run for the same request

### Requirement: Watcher configuration and worktree boundary are explicit
The active watcher executable and trigger-to-action configuration SHALL be installed outside the sandbox-visible worktree. The watcher SHALL accept and validate an absolute worktree directory at startup and SHALL use that directory explicitly for watching and action execution.

#### Scenario: Watcher starts for a worktree
- **WHEN** the host operator starts the watcher with a valid absolute worktree directory
- **THEN** it watches only configured signals at that worktree root and supplies that worktree to each action

#### Scenario: Invalid worktree is supplied
- **WHEN** the host operator starts the watcher with an invalid or non-absolute worktree directory
- **THEN** the watcher SHALL refuse to start and report the configuration error

#### Scenario: Requester modifies repository files
- **WHEN** the sandboxed requester modifies files in the worktree
- **THEN** those changes SHALL NOT alter the installed watcher executable or its trigger-to-action configuration

### Requirement: Watcher core is small and auditable
The watcher core SHALL use zsh and standard filesystem operations only, and SHALL be limited to worktree validation, configured-trigger detection, atomic request claiming, fixed-action invocation, and result publication. It SHALL NOT implement a command language, plugin framework, network API, or external file-watch dependency.

#### Scenario: Host operator reviews the watcher
- **WHEN** a host operator reviews the watcher implementation and its action registration
- **THEN** its trigger handling and fixed-action invocation can be understood without third-party runtime dependencies or dynamic command evaluation

#### Scenario: Watcher runs without optional file-watch tooling
- **WHEN** the host does not provide an external file-watch utility
- **THEN** the watcher continues to detect configured requests through its zsh polling loop

### Requirement: Action requests have observable completion and outcome
The host watcher SHALL capture an accepted action's combined standard output and standard error in `<trigger>.results/output.log`. It SHALL atomically publish `<trigger>.results/status` after the action completes, containing the action process outcome, report location, and log location, so the requester can identify completion without reading a partial status.

#### Scenario: Action succeeds
- **WHEN** a configured validation action exits successfully
- **THEN** the watcher records a successful outcome in `<trigger>.results/status`, preserves the action's generated reports and output log, and signals that the request is complete

#### Scenario: Action fails
- **WHEN** a configured validation action exits unsuccessfully
- **THEN** the watcher records a failed outcome in `<trigger>.results/status`, preserves the action's generated reports and output log, and signals that the request is complete

#### Scenario: Requester inspects a completed run
- **WHEN** the request is complete
- **THEN** the requester can determine whether the action passed and where to find its reports and captured output

### Requirement: Host action execution has a documented trust boundary
The host setup documentation SHALL state that a configured action can execute code from the supplied worktree and SHALL require the host operator to use either a trusted-worktree model or a separately restricted runner for that execution.

#### Scenario: Operator configures a worktree-executing action
- **WHEN** the host operator configures an action that runs build, test, or other worktree code
- **THEN** the documentation identifies the selected trust model and its host-resource limitations

### Requirement: Watcher executes only host-configured actions
The watcher SHALL execute only actions registered in its host-owned configuration and SHALL NOT interpret request-file contents as shell commands or arbitrary arguments.

#### Scenario: Request signal contains unexpected content
- **WHEN** a configured request signal contains data
- **THEN** the watcher ignores that data and runs only its associated configured action

#### Scenario: Configured action fails to start
- **WHEN** a configured action cannot be started
- **THEN** the watcher records the failure as a completed request with diagnostic information
