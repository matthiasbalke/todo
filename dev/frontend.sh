#!/usr/bin/env zsh
set -euo pipefail
source /workspace/dev/container-env.sh
bun install --frozen-lockfile
# Bun runs the script; Vite's node shebang selects the Node runtime.
exec bun run dev:https
