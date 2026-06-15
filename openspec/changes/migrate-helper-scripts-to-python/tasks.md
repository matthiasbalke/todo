## 1. Shared Python Foundation

- [ ] 1.1 Add the importable `scripts` helper package with repository path resolution and a Python 3.9 runtime guard
- [ ] 1.2 Port local HTTPS hostname loading and port validation into reusable Python functions with actionable exceptions
- [ ] 1.3 Add shared external-command lookup, checked execution, and POSIX process-group cleanup utilities
- [ ] 1.4 Add direct unit tests for path resolution, domain normalization and rejection, port validation, missing executables, and cleanup helpers

## 2. Local HTTPS Tools

- [ ] 2.1 Replace `scripts/load-local-domain.sh` with executable `scripts/load_local_domain.py` that prints only the validated hostname on success
- [ ] 2.2 Replace `frontend/start-https-frontend.sh` with `frontend/start_https_frontend.py`, preserving Bun environment, unprivileged Vite execution, `socat` forwarding, and two-process cleanup
- [ ] 2.3 Replace `backend/start-https-backend.sh` with `backend/start_https_backend.py`, preserving backend environment, continuous compilation, `bootRun`, and watcher cleanup
- [ ] 2.4 Port the existing temporary-fixture launcher coverage to Python tests for arguments, environment, working directories, missing configuration, missing relay, ownership, and child cleanup
- [ ] 2.5 Add focused tests for signal handling, child exit-status propagation, and prevention of startup when validation fails

## 3. Standalone Maintenance Helpers

- [ ] 3.1 Replace `frontend/generate-dev-certificates.sh` with `frontend/generate_dev_certificates.py`, creating repo-root `.certs` and validating `mkcert` availability
- [ ] 3.2 Replace `clear-postgress.sh` with `clear_postgres.py`, implementing affirmative interactive confirmation, cancellation, EOF handling, and `--yes`
- [ ] 3.3 Add tests for certificate command construction from arbitrary working directories and every PostgreSQL confirmation path

## 4. Test Orchestration Helpers

- [ ] 4.1 Replace `run-e2e-tests.sh` with `run_e2e_tests.py`, preserving Docker Compose startup while forwarding Playwright arguments as distinct values
- [ ] 4.2 Add unconditional E2E service stop/remove cleanup that preserves the primary startup or Playwright failure
- [ ] 4.3 Replace `run-all-test-suites.sh` with `run_all_test_suites.py`, preserving backend, frontend, image-build, stack-start, readiness, and Playwright ordering
- [ ] 4.4 Implement the 120-second frontend readiness deadline in Python and retain cleanup that stops backend, frontend, and nginx without stopping PostgreSQL
- [ ] 4.5 Add orchestration tests for command order, argument forwarding, readiness success and timeout, primary error propagation, and cleanup after success, failure, and interruption

## 5. References And Removal

- [ ] 5.1 Update `AGENTS.md` to resolve `LOCAL_HTTPS_DOMAIN` through `python3 scripts/load_local_domain.py` and retain the shared HTTPS reachability workflow
- [ ] 5.2 Update the local HTTPS guide and all other tracked documentation or internal notes with the snake_case Python paths, runtime prerequisite, and migration table
- [ ] 5.3 Update any tracked automation references to invoke the Python entry points
- [ ] 5.4 Remove the eight handwritten shell files, mark the replacement entry points executable, and verify `backend/gradlew` remains unchanged
- [ ] 5.5 Add a repository inventory assertion that rejects reintroduction of the removed helper `.sh` paths while allowing generated or third-party shell wrappers

## 6. Verification

- [ ] 6.1 Add a CI helper job using Python 3.9 or newer to compile all migrated Python sources and run the standard-library test suite
- [ ] 6.2 Run `python3 -m compileall` over the helper sources and execute all Python helper tests
- [ ] 6.3 Run non-destructive `--help`, invalid-input, missing-command, and database-reset cancellation checks for each applicable entry point
- [ ] 6.4 Run the existing local HTTPS focused checks against command stubs and verify the frontend and backend launcher contracts remain compatible with their OpenSpec requirements
- [ ] 6.5 Search the repository for stale removed `.sh` paths, Bash sourcing instructions, and the misspelled `postgress` helper name, and resolve every tracked occurrence
