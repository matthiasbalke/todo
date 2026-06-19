## 1. Local Domain Configuration

- [x] 1.1 Add the tracked repo-root `.local-domain.example` template containing `todo.example.com` and add `.local-domain` to `.gitignore`.
- [x] 1.2 Add a shared shell helper that resolves the repo root, loads `.local-domain` as plain text, exports `LOCAL_HTTPS_DOMAIN`, and rejects missing, empty, or non-hostname values with actionable stderr messages.

## 2. HTTPS Startup Scripts

- [x] 2.1 Update `frontend/start-https-frontend.sh` to use strict error handling, source the shared domain helper, accept an optional port as its only positional argument, and export the configured HMR values before starting Vite.
- [x] 2.2 Update `backend/start-https-backend.sh` to use strict error handling, source the shared domain helper, accept an optional port as its only positional argument, and export matching WebAuthn and CORS values before starting Gradle processes.
- [x] 2.3 Ensure both scripts can be invoked from outside their own directories and do not start child processes when configuration loading fails.

## 3. Automated Coverage

- [x] 3.1 Add shell-script tests for loading a valid custom domain, trimming permitted surrounding whitespace, and resolving the configuration independently of the caller's working directory.
- [x] 3.2 Add shell-script tests for missing, empty, scheme-containing, port-containing, path-containing, and whitespace-containing domain values, including the template copy hint for a missing file.
- [x] 3.3 Add startup-script tests with stubbed child commands that verify frontend/backend exported values, default and custom ports, and no child invocation on configuration errors.

## 4. Documentation

- [x] 4.1 Update `docs/howto-local-dev-https-setup.md` to document copying and editing `.local-domain`, the new `[PORT]` script interface, migration from domain arguments, and configuration error recovery.
- [x] 4.2 Update the README agent E2E instructions to load the shared domain helper and construct `BASE_URL` from `LOCAL_HTTPS_DOMAIN` instead of hard-coding a domain.

## 5. Verification

- [x] 5.1 Run the shell-script test suite and Bash syntax checks for the helper and both startup scripts.
- [x] 5.2 Verify `.local-domain` remains ignored, `.local-domain.example` remains tracked, documentation commands are consistent, and all OpenSpec artifacts validate.
