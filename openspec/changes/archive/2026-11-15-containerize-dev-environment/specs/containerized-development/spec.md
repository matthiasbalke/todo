# Spec Delta

## Purpose

Define a unified local development environment with automatic source updates, trusted HTTPS routing, and direct service access for debugging.

## ADDED Requirements

### Requirement: Unified development lifecycle
The repository SHALL provide `compose.dev.yaml` that starts the frontend, backend, database, mail capture service, and reverse proxy as one development stack without separately running host application processes or a host routing service.

#### Scenario: Start and stop the stack
- **GIVEN** the documented local domain and certificate prerequisites are satisfied
- **WHEN** the developer follows the documented Compose startup command
- **THEN** all five services SHALL start and the application SHALL become reachable through the HTTPS entrypoint
- **AND** the documented shutdown command SHALL stop all development services and reload processes

### Requirement: Live frontend updates
The development frontend SHALL reflect supported source edits without rebuilding its container image and SHALL provide working browser HMR through the HTTPS entrypoint.

#### Scenario: Edit a component
- **WHEN** a developer saves a frontend component change while the stack is running
- **THEN** the browser SHALL receive the update through HMR without manual container restart
- **AND** the HMR connection SHALL use the browser-accessible HTTPS hostname and port

### Requirement: Live backend updates
The development backend SHALL compile backend source edits and restart the application automatically after successful compilation, without rebuilding its container image. Main resource edits SHALL also be reflected automatically. Restarts SHALL be requested through a DevTools trigger file updated only after compilation and resource processing succeed.

#### Scenario: Save a valid backend change
- **WHEN** a developer saves a valid Kotlin or Java source edit
- **THEN** the running API SHALL serve the updated behavior after compilation and application restart

#### Scenario: Save a main resource change
- **WHEN** a developer changes a backend main resource
- **THEN** the application SHALL load the updated resource without manual container restart

#### Scenario: Failed build does not request restart
- **WHEN** compilation or resource processing fails
- **THEN** the restart trigger file SHALL remain unchanged
- **AND** that failed build SHALL not request an application restart

#### Scenario: Recover from compilation errors
- **WHEN** a source edit fails compilation and the developer subsequently fixes it
- **THEN** the errors SHALL be visible in service logs and automatic recompilation SHALL recover without rebuilding the image

### Requirement: HTTPS routing preserves application protocols
The proxy SHALL route `/api/` and `/actuator/` to the backend and application pages and frontend development traffic to the frontend. It SHALL preserve streaming SSE, WebSocket HMR, and the external HTTPS origin.

#### Scenario: Use the application through the entrypoint
- **WHEN** a browser opens the configured HTTPS entrypoint
- **THEN** pages, API requests, and health requests SHALL reach their respective services
- **AND** SSE events SHALL arrive without proxy buffering
- **AND** frontend HMR WebSocket connections SHALL succeed

### Requirement: Direct service access
The stack SHALL publish independently configurable host ports for the reverse proxy, frontend, and backend, defaulting to 443, 5173, and 8080 respectively. The backend API SHALL be accessible directly without passing through the proxy.

#### Scenario: Inspect the API directly
- **WHEN** a developer requests `http://localhost:8080/actuator/health` using default ports
- **THEN** the backend SHALL respond directly

#### Scenario: Access the frontend directly
- **WHEN** a developer opens the configured domain on the published frontend HTTPS port
- **THEN** the frontend SHALL load and its API requests and HMR SHALL work while the stack is running

#### Scenario: Change host ports
- **WHEN** the developer configures alternate published ports using the documented settings
- **THEN** all three services SHALL be reachable on those ports
- **AND** browser origins and HMR SHALL use the appropriate external ports

### Requirement: Shared domain and certificates
The Compose workflow SHALL read hostname and port settings from ignored `.env.dev`, with a tracked `.env.dev.example`, and SHALL reuse `.certs` plus the existing Mailpit TLS certificate and truststore workflow without a new host launcher. It SHALL derive browser-facing origin and passkey settings consistently and reject missing or invalid prerequisites with actionable errors before starting application processes.

#### Scenario: Start directly with an env file
- **WHEN** a developer supplies valid `.env.dev` configuration to the documented direct Compose command
- **THEN** the stack SHALL use its hostname and published ports without sourcing `.local-domain` or running a host zsh launcher

#### Scenario: Configure trusted local HTTPS
- **WHEN** the developer starts with a valid hostname and matching trusted certificate
- **THEN** both HTTPS entrypoints SHALL use that certificate
- **AND** passkey relying-party configuration SHALL use the hostname without a port
- **AND** public links SHALL use the proxy HTTPS origin

#### Scenario: Invalid prerequisites
- **WHEN** the domain is missing or invalid, or a required certificate file is missing
- **THEN** startup SHALL fail with instructions identifying the configuration to fix

### Requirement: Persistent data and isolated generated files
Normal stack shutdown SHALL preserve database data and reusable dependency caches. Container dependencies and generated build output SHALL not overwrite host dependency installations or create root-owned generated files in the source checkout.

#### Scenario: Restart development
- **WHEN** the developer stops and restarts the stack without deleting volumes
- **THEN** existing application data SHALL remain available and dependency caches SHALL be reusable

#### Scenario: Build from mounted sources
- **WHEN** development services install dependencies or generate build output
- **THEN** those outputs SHALL be isolated from host dependency installations and SHALL not leave root-owned generated files in the checkout

### Requirement: Development mail capture
The development backend SHALL send configured application email to the stack's mail capture service, whose web inbox SHALL be accessible from the host.

#### Scenario: Inspect an application email
- **WHEN** a configured email flow sends a message
- **THEN** the message SHALL appear in the published development inbox without delivery to an external mail server

### Requirement: Documented development operations
Documentation SHALL describe prerequisites, startup, shutdown, logs, direct service URLs, port overrides, dependency refresh, reload limitations, and data reset. Existing host launchers SHALL remain supported and the dedicated stack SHALL not change CI or production Compose behavior.

#### Scenario: Change a build dependency
- **WHEN** a developer changes a dependency manifest or backend build configuration
- **THEN** documentation SHALL identify how to refresh dependencies and restart the affected service
