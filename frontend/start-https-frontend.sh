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
SOCAT_BIN="${SOCAT_BIN:-$(command -v socat || true)}"

if [[ -z "${SOCAT_BIN}" || ! -x "${SOCAT_BIN}" ]]; then
	echo "Missing required relay binary: socat" >&2
	echo "Install it with your package manager (for example: 'apt install socat' or 'brew install socat')." >&2
	exit 1
fi

VITE_INTERNAL_PORT=5173

if [[ "${PORT}" == "${VITE_INTERNAL_PORT}" ]]; then
	echo "HTTPS port ${PORT} conflicts with the internal Vite port ${VITE_INTERNAL_PORT}; choose a different exposed port." >&2
	exit 1
fi

echo "Starting on https://${VITE_HMR_HOST}:${VITE_HMR_CLIENT_PORT}"
echo

cd "${SCRIPT_DIR}"
"$(command -v bun)" run dev:https &
VITE_PID=$!

sudo "${SOCAT_BIN}" "TCP-LISTEN:${PORT},fork,reuseaddr" "TCP:127.0.0.1:${VITE_INTERNAL_PORT}" &
PROXY_PID=$!

cleanup() {
	local exit_status=$?
	trap - EXIT INT TERM
	kill "${PROXY_PID}" "${VITE_PID}" 2>/dev/null || true
	wait "${PROXY_PID}" 2>/dev/null || true
	wait "${VITE_PID}" 2>/dev/null || true
	exit "${exit_status}"
}
trap cleanup EXIT INT TERM

wait -n "${VITE_PID}" "${PROXY_PID}"
