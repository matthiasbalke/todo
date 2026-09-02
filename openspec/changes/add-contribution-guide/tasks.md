## 1. Contribution Guide Content

- [x] 1.1 Expand `.github/CONTRIBUTING.md` with project scope, architecture references, and repository layout.
- [x] 1.2 Document development prerequisites for Java 21, Gradle wrapper usage, Bun, Docker Compose or PostgreSQL, Playwright, and zsh helper scripts.
- [x] 1.3 Document optional local DNS setup with `.local-domain.example`, ignored `.local-domain`, `scripts/load-local-domain.sh`, HTTPS startup scripts, and a link to `docs/howto-local-dev-https-setup.md`.
- [x] 1.4 Document the contribution workflow for branching, OpenSpec planning, implementation, validation, and pull request submission.
- [x] 1.5 Document repository-specific conventions for backend tests, frontend component reuse, Svelte validation, e2e coverage, SSE-aware changes, client-side filtering, and zsh-compatible shell helpers.
- [x] 1.6 Document security expectations for passkeys, OAuth2, JWT secrets, CORS/WebAuthn origin configuration, setup secrets, attachments, account deletion, and secret handling.
- [x] 1.7 Document MIT licensing and link to `.github/CODE_OF_CONDUCT.md` for conduct expectations.
- [x] 1.8 Write the guide in a practical maintainer-oriented voice, with direct expectations and concrete commands instead of corporate contribution boilerplate.

## 2. Discoverability

- [x] 2.1 Add a visible `.github/CONTRIBUTING.md` link from `README.md`.
- [x] 2.2 Keep the README link concise and avoid duplicating development setup and validation commands in the README.

## 3. Validation

- [x] 3.1 Verify `.github/CONTRIBUTING.md` includes each required section from `repository-contribution-guide`.
- [x] 3.2 Verify all documented commands match existing repository commands and paths.
- [x] 3.3 Run `openspec status --change add-contribution-guide` and confirm the change is ready for implementation.
