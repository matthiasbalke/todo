# frontend-https-proxy Specification

## Purpose

Define the frontend HTTPS launch flow that keeps Vite unprivileged while exposing the dev server on a privileged public port through an existing relay binary.

## Requirements

### Requirement: Frontend HTTPS launcher keeps the dev server unprivileged
The frontend HTTPS startup workflow SHALL start the Vite dev server as the invoking user on a non-privileged local port and SHALL NOT run the Vite process with elevated privileges.

#### Scenario: Default HTTPS launch uses a privileged forwarder and an unprivileged dev server
- **WHEN** a developer runs the frontend HTTPS startup script without overriding the exposed port
- **THEN** the workflow SHALL expose the site on `https://<local-domain>:443`
- **AND** the Vite dev server SHALL listen on a separate non-privileged local port
- **AND** the Vite process SHALL run without root privileges

#### Scenario: Generated frontend artifacts remain user-owned
- **WHEN** the frontend HTTPS launcher has started successfully and the frontend generates development artifacts
- **THEN** the generated files, including `.svelte-kit`, SHALL be owned by the invoking user instead of root

### Requirement: Frontend HTTPS launcher uses an existing relay binary for the public port
The frontend HTTPS startup workflow SHALL use an existing TCP relay binary, such as `socat`, to accept connections on the externally visible HTTPS port and relay them to the unprivileged Vite server.

#### Scenario: Custom exposed port is forwarded to the dev server
- **WHEN** a developer runs the frontend HTTPS startup script with a custom exposed port
- **THEN** the forwarding process SHALL bind that exposed port
- **AND** the Vite server SHALL continue listening on a separate non-privileged local port
- **AND** the browser SHALL be able to connect to the configured `https://<local-domain>:<port>` endpoint

#### Scenario: Forwarding process terminates with the launcher
- **WHEN** the frontend HTTPS launcher stops
- **THEN** the forwarding process and the Vite dev server SHALL both exit

#### Scenario: Relay binary is missing
- **WHEN** the required relay binary is not installed on the system
- **THEN** the launcher SHALL fail with a clear message that names the missing binary and how to install it with a common package manager
