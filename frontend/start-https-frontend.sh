#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if (( $# > 1 )); then
	echo "Usage: $0 [PORT]" >&2
	exit 2
fi

source "${REPO_ROOT}/scripts/load-local-domain.sh"

PORT="${1:-443}"
validate_local_https_port "${PORT}"
export VITE_HMR_HOST="${LOCAL_HTTPS_DOMAIN}"
export VITE_HMR_CLIENT_PORT="${PORT}"

echo "Starting on https://${VITE_HMR_HOST}:${VITE_HMR_CLIENT_PORT}"
echo

cd "${SCRIPT_DIR}"
sudo "$(command -v bun)" run dev:https
