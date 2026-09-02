## Context

The repository currently exposes development details across `README.md`, `AGENTS.md`, `docs/requirements.md`, helper scripts, package manifests, Gradle configuration, Docker Compose files, and GitHub Actions workflows. That is enough for maintainers and coding agents, but contributors do not have a single public entry point that explains how to prepare a change, what validation commands matter, and which project conventions are non-negotiable.

The change is documentation-only. It should expand the existing `.github/CONTRIBUTING.md`, preserve `.github/CODE_OF_CONDUCT.md` as the canonical conduct document, and link the contribution guide from the README without altering application code, CI behavior, package versions, Docker images, or runtime configuration.

## Goals / Non-Goals

**Goals:**

- Provide one contributor-facing guide for setup, repository layout, development workflow, validation, pull requests, security expectations, and licensing.
- Keep commands aligned with the actual backend, frontend, e2e, Docker, and zsh helper workflows in this repository.
- Explain OpenSpec usage as the preferred planning workflow for non-trivial changes.
- Keep the guide concise enough to maintain manually while still covering the minimum information a contributor needs before opening a pull request.

**Non-Goals:**

- Introduce or replace the code of conduct file or create a broader governance process.
- Replace detailed architecture documentation in `docs/requirements.md`.
- Replace feature-specific documentation under `docs/features/`.
- Change test commands, CI workflow definitions, dependency versions, or local environment scripts.

## Decisions

- Use `.github/CONTRIBUTING.md` as the canonical contribution guide because GitHub recognizes it and the repository already has a basic file there. Do not create a duplicate root-level contribution guide.
- Keep `.github/CODE_OF_CONDUCT.md` as the canonical conduct document. The contribution guide should link to it instead of duplicating the full conduct policy.
- Link the guide from `README.md` near the development or project-information sections. Keep development setup and validation commands in `.github/CONTRIBUTING.md` so the README stays short and avoids stale duplicated command lists.
- Include command tables grouped by area: backend, frontend, e2e, Docker, and shell helpers. This mirrors the repository structure and avoids burying important validation commands in prose.
- Treat local HTTPS and e2e guidance carefully. The guide should describe supported human workflows without copying agent-specific instructions from `AGENTS.md` that assume access to ignored local files.
- Document the optional local DNS setup through `.local-domain.example`, `.local-domain`, `scripts/load-local-domain.sh`, and the HTTPS backend/frontend startup scripts. Keep it contributor-facing by explaining when to use it and linking to `docs/howto-local-dev-https-setup.md` for the full mkcert and device-testing flow.
- Document OpenSpec expectations for substantial changes: propose first, apply after artifacts exist, and keep specs/tasks in sync. Small documentation or typo fixes can remain lightweight.
- Include security guidance for secrets, passkeys, OAuth, JWT configuration, attachments, and vulnerability reporting boundaries because the project includes authentication and household data.
- Use a maintainer-oriented, practical tone instead of corporate contribution boilerplate. The guide should give direct expectations, concrete commands, and short rationale where it matters, while avoiding broad community-program language that does not fit a personal project.

## Risks / Trade-offs

- Contributor guide drifts from actual commands → Mitigation: reference existing scripts and keep command examples limited to commands already used by the repository.
- Guide duplicates too much README content → Mitigation: link to `docs/requirements.md` and existing documentation instead of restating architecture in full.
- `.github/CONTRIBUTING.md` is less visible in the file list than a root-level guide → Mitigation: add a visible README link to the canonical guide.
- OpenSpec process feels heavy for tiny changes → Mitigation: explicitly reserve it for non-trivial behavior, architecture, or workflow changes.
- Security section may imply a formal disclosure program that does not exist → Mitigation: keep reporting guidance simple and repository-scoped.
- Maintainer-oriented tone could read as abrupt → Mitigation: keep the language respectful and specific, with expectations framed around reviewability, testability, and long-term maintainability.
