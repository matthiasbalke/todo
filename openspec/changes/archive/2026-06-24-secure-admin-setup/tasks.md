## 1. Backend Setup Secret

- [x] 1.1 Add a setup-secret service that generates a high-entropy secret while setup is required, stores only a hash in memory, validates submissions with constant-time comparison, and clears state after setup completes.
- [x] 1.2 Log the raw setup secret with clear first-admin setup instructions when a new setup secret is generated.
- [x] 1.3 Ensure backend restart while setup is still required creates and logs a new setup secret.
- [x] 1.4 Provide an E2E-safe way to supply or retrieve the setup secret in test environments without exposing it through production unauthenticated APIs.

## 2. Setup API Enforcement

- [x] 2.1 Extend setup WebAuthn register-options and register request bodies to include the setup secret.
- [x] 2.2 Reject missing or invalid setup secrets before creating setup users, WebAuthn options, or admin promotions.
- [x] 2.3 Preserve `SETUP_NOT_REQUIRED` behavior when at least one admin exists, regardless of submitted secret.
- [x] 2.4 Keep setup status public but limited to setup-required state with no secret metadata.

## 3. Frontend Setup Flow

- [x] 3.1 Add a required setup-secret field to the setup page with copy that points operators to backend logs.
- [x] 3.2 Pass the setup secret through setup API helpers for both WebAuthn setup calls.
- [x] 3.3 Show backend validation errors clearly without treating the setup secret as an account password.

## 4. Verification

- [x] 4.1 Add backend tests for valid secret, missing secret, invalid secret, admin-exists rejection, no mutation before valid secret, and restart/regeneration behavior.
- [x] 4.2 Add frontend unit tests for setup-secret input, API payloads, and invalid-secret error handling.
- [x] 4.3 Update or add Playwright coverage for first-admin setup using the E2E-accessible setup secret path.
- [x] 4.4 Run backend tests and frontend check/test commands relevant to the changed setup flow.
