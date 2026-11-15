#!/usr/bin/env zsh
set -euo pipefail

repo_root="${0:A:h}"
exec docker compose --project-directory "$repo_root" --env-file "$repo_root/.env.dev" -f "$repo_root/compose.dev.yaml" "$@"
