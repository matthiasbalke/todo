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
ADDRESS="https://${LOCAL_HTTPS_DOMAIN}:${PORT}"

export CORS_ALLOWED_ORIGINS="${ADDRESS}"
export WEBAUTHN_RP_ID="${LOCAL_HTTPS_DOMAIN}"

echo "Starting on ${ADDRESS}"
echo

cd "${SCRIPT_DIR}"

./gradlew compileJava compileKotlin --continuous --parallel --build-cache --configuration-cache &
CONTINUOUS_PID=$!

cleanup() {
	kill "${CONTINUOUS_PID}" 2>/dev/null || true
	wait "${CONTINUOUS_PID}" 2>/dev/null || true
}
trap cleanup EXIT

./gradlew bootRun #--args='--debug'
