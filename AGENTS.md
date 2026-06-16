# AGENTS.md

See [CLAUDE.md](CLAUDE.md).

## Agent e2e workflow

- The agent runs in a `zsh` environment in this workspace. Use `zsh`-compatible commands and prefer direct `zsh` execution for shell-sensitive tasks.

- For Playwright e2e runs, first source `scripts/load-local-domain.sh` from the repo root and resolve `LOCAL_HTTPS_DOMAIN` from the tracked `.local-domain` file.
- Check whether the shared HTTPS deployment is reachable with `curl` before starting any local stack. Prefer `curl -fsS --cacert .certs/cert.pem https://${LOCAL_HTTPS_DOMAIN}/actuator/health` and treat a successful response as the signal to use that deployment.
- If the HTTPS deployment is reachable, run Playwright `BASE_URL="https://${LOCAL_HTTPS_DOMAIN}" bunx playwright test` from `e2e/`.
- To run one spec, append its path, for example `BASE_URL="https://${LOCAL_HTTPS_DOMAIN}" bunx playwright test tests/auth.spec.ts`.
- If the HTTPS deployment is not reachable, do not assume Docker or PostgreSQL are available to the agent. Escalate or ask the user for the next environment-specific step instead of trying to bring up a local stack.
- This rule is agent-specific. Keep human-facing setup and local development instructions in `README.md` and related docs.
