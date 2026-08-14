#!/usr/bin/env zsh
set -euo pipefail

SCRIPT_DIR="${${(%):-%x}:A:h}"
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
PYTHON_BIN="${PYTHON_BIN:-$(command -v python3 || true)}"
LSOF_BIN="${LSOF_BIN:-$(command -v lsof || true)}"
SUDO_BIN="${SUDO_BIN:-$(command -v sudo || true)}"

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

can_bind_tcp_port() {
	local port="$1"
	local -a probe_cmd

	[[ -n "${PYTHON_BIN}" && -x "${PYTHON_BIN}" ]] || return 0
	probe_cmd=(
		"${PYTHON_BIN}"
		-c
		'import socket, sys
port = int(sys.argv[1])
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
try:
    sock.bind(("0.0.0.0", port))
except OSError as exc:
    print(exc, file=sys.stderr)
    sys.exit(1)
finally:
    sock.close()'
		"${port}"
	)

	if (( 10#${port} < 1024 )) && [[ -n "${SUDO_BIN}" && -x "${SUDO_BIN}" ]]; then
		"${SUDO_BIN}" "${probe_cmd[@]}"
	else
		"${probe_cmd[@]}"
	fi
}

describe_tcp_port_listener() {
	local port="$1"
	local details

	if [[ -n "${LSOF_BIN}" && -x "${LSOF_BIN}" ]]; then
		details="$("${LSOF_BIN}" -nP -iTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
		if [[ -n "${details}" ]]; then
			printf '%s\n' "${details}"
			return 0
		fi
	fi

	if [[ -n "${LSOF_BIN}" && -x "${LSOF_BIN}" && -n "${SUDO_BIN}" && -x "${SUDO_BIN}" ]]; then
		details="$("${SUDO_BIN}" "${LSOF_BIN}" -nP -iTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
		if [[ -n "${details}" ]]; then
			printf '%s\n' "${details}"
			return 0
		fi
	fi

	return 1
}

cd "${SCRIPT_DIR}"
sudo -v

if ! bind_error="$(can_bind_tcp_port "${PORT}" 2>&1)"; then
	echo "HTTPS port ${PORT} is already in use on this machine." >&2
	if [[ -n "${bind_error}" ]]; then
		echo "Bind probe error: ${bind_error}" >&2
	fi
	if details="$(describe_tcp_port_listener "${PORT}")" && [[ -n "${details}" ]]; then
		echo "Listener details:" >&2
		echo "${details}" >&2
	else
		echo "Listener details could not be determined with lsof." >&2
	fi
	echo "Stop the existing listener on port ${PORT}, or start this launcher on another port, for example:" >&2
	echo "  $0 4443" >&2
	exit 1
fi

echo "Starting on https://${VITE_HMR_HOST}:${VITE_HMR_CLIENT_PORT}"
echo

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

is_job_running() {
	jobs -lr | grep -Eq "[[:space:]]$1[[:space:]]+running"
}

while is_job_running "${VITE_PID}" && is_job_running "${PROXY_PID}"; do
	sleep 1
done

if is_job_running "${VITE_PID}"; then
	wait "${PROXY_PID}"
else
	wait "${VITE_PID}"
fi
