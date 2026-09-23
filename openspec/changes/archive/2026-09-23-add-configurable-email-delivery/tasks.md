## 1. Backend Mail Foundation

- [x] 1.1 Add the Spring Boot mail dependency and verify `cd backend && ./gradlew dependencies --configuration runtimeClasspath` includes the mail starter.
- [x] 1.2 Add email-related deployment defaults to `application.yml` and verify the app starts with email disabled when required values are absent.
- [x] 1.3 Create email configuration domain types for enabled state, SMTP authentication enabled state, SMTP host, port, protocol, encryption, username, password state, sender identity, and source, and verify unit tests cover complete, incomplete, disabled, deployment-source, and runtime-source configurations.
- [x] 1.4 Extend app settings persistence for a complete namespaced email settings snapshot and verify repository/service tests cover save-all, load-all, reset-to-deployment, auth enabled/disabled, and password keep/replace/clear behavior.
- [x] 1.5 Implement active configuration resolution that uses deployment defaults only when no runtime snapshot exists, and verify tests cover first runtime save, deployment-password copy, runtime precedence, and reset fallback to deployment defaults.

## 2. Email Delivery Service

- [x] 2.1 Implement a backend email service interface that returns accepted, unavailable, and failed delivery results and verify unit tests cover each result type.
- [x] 2.2 Implement SMTP sending with resolved configuration, STARTTLS or SSL/TLS modes, optional authentication, sender identity, and safe timeout defaults, and verify integration or slice tests exercise the mail sender configuration.
- [x] 2.3 Add fixed test-email message generation and verify tests confirm only the recipient address is user-supplied and no user-supplied body content is sent.
- [x] 2.4 Normalize delivery failures into safe categories and verify tests confirm SMTP credentials and raw secret-bearing provider details are not exposed in responses or logs.

## 3. Admin API

- [x] 3.1 Add admin-only email settings response/update endpoints and verify backend integration tests reject unauthenticated and non-admin users.
- [x] 3.2 Ensure settings responses return active source, non-secret values, and password-present state only, and verify integration tests confirm the SMTP password is never returned.
- [x] 3.3 Implement validation for required fields, port range, supported protocol, encryption mode, SMTP authentication enabled state, and username/password requirements when authentication is enabled, and verify invalid updates leave the previous active settings unchanged.
- [x] 3.4 Add an admin-only test-email endpoint that accepts a recipient address, and verify integration tests cover success, unavailable configuration, failed delivery, recipient validation, and authorization failures.

## 4. Frontend Admin UI

- [x] 4.1 Extend the frontend admin API types and client functions for email settings and test email, and verify Vitest API tests cover request paths and payload shapes.
- [x] 4.2 Load email settings on the admin page and verify the page test renders the active email status, active source, and non-secret configuration values.
- [x] 4.3 Add admin controls for enabled state and SMTP authentication enabled state using the shared `Toggle`, SMTP host, port, encryption, username, password editing with masked configured-password placeholder, sender identity, reset-to-deployment, Save, Discard, dirty state, and validation feedback, and verify component tests cover draft editing, saving, discarding, validation feedback, and password redaction.
- [x] 4.4 Add encryption-mode default port propagation for STARTTLS port 587 and SSL/TLS port 465 only while the port field is empty or unedited, and verify component tests cover preserving user-edited ports.
- [x] 4.5 Add test-email recipient input, a test email settings button, and result feedback, and verify component tests cover success, unavailable configuration, safe failure messages, and recipient validation.

## 5. Verification

- [x] 5.1 Run `cd backend && ./gradlew test` and verify all backend tests pass.
- [x] 5.2 Run `cd frontend && bun run check` and verify Svelte type-checking passes.
- [x] 5.3 Run `cd frontend && bun run test -- --run` and verify frontend unit tests pass.
- [x] 5.4 Add Mailpit to the E2E Docker Compose path as test-only SMTP capture services with self-signed certificates for STARTTLS and SSL/TLS, trust the E2E root CA in the backend runtime, and verify Playwright can reach Mailpit's API during E2E runs.
- [x] 5.5 Add Playwright E2E coverage that configures STARTTLS email settings through the admin UI, sends a test email to a unique recipient, polls Mailpit for the captured message, and verifies recipient, sender, subject, and fixed test body.
- [x] 5.6 Add Playwright E2E coverage that configures SSL/TLS email settings through the admin UI against the SSL/TLS Mailpit endpoint and verifies a captured test message.
- [x] 5.7 Run `openspec validate add-configurable-email-delivery --strict` and verify the change passes validation.
