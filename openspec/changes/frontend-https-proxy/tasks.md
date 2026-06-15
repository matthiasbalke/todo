## 1. HTTPS Launcher Flow

- [ ] 1.1 Update `frontend/vite.config.https.ts` so the Vite HTTPS dev server defaults to a non-privileged internal port and can still be launched directly for local development.
- [ ] 1.2 Refactor `frontend/start-https-frontend.sh` to start Vite without `sudo`, invoke an existing relay binary under `sudo` only for port `443`, and stop both processes cleanly on exit.
- [ ] 1.3 Add startup checks and documentation for a required relay binary such as `socat`, including clear install guidance for `apt` and Homebrew users.

## 2. Documentation

- [ ] 2.1 Update `docs/howto-local-dev-https-setup.md` to describe the relay-binary launcher, the unprivileged Vite process, and the new internal-port/external-port split.
- [ ] 2.2 Update any README or launcher notes that still imply the frontend dev server binds `443` directly.

## 3. Tests

- [ ] 3.1 Extend `scripts/tests/local-domain.test.sh` to stub the relay binary and assert that the frontend dev server is not started through `sudo`.
- [ ] 3.2 Add regression coverage for the exposed port, the fixed internal port, and clean shutdown behavior.
- [ ] 3.3 Verify the frontend launcher leaves generated artifacts, including `.svelte-kit`, owned by the invoking user in the test harness.
- [ ] 3.4 Verify the launcher fails with a helpful message when the relay binary is missing.

## 4. Verification

- [ ] 4.1 Run the local domain script tests.
- [ ] 4.2 Run the frontend type check or any config-focused checks affected by the Vite port change.
