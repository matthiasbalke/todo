#!/usr/bin/env zsh
set -euo pipefail

REPO_ROOT="${${(%):-%x}:A:h:h:h}"
TEST_ROOT="$(mktemp -d)"
PASS_COUNT=0
ZSH_BIN="$(command -v zsh)"

cleanup() {
	rm -rf "${TEST_ROOT}"
}
trap cleanup EXIT

fail() {
	printf 'FAIL: %s\n' "$1" >&2
	exit 1
}

assert_contains() {
	local haystack="$1"
	local needle="$2"
	[[ "${haystack}" == *"${needle}"* ]] || fail "expected output to contain: ${needle}"
}

assert_not_contains() {
	local haystack="$1"
	local needle="$2"
	[[ "${haystack}" != *"${needle}"* ]] || fail "expected output not to contain: ${needle}"
}

assert_equals() {
	local actual="$1"
	local expected="$2"
	[[ "${actual}" == "${expected}" ]] || fail "expected '${expected}', got '${actual}'"
}

file_owner_uid() {
	local file_path="$1"
	if stat -c %u "${file_path}" >/dev/null 2>&1; then
		stat -c %u "${file_path}"
	else
		stat -f %u "${file_path}"
	fi
}

pass() {
	PASS_COUNT=$((PASS_COUNT + 1))
	printf 'ok %d - %s\n' "${PASS_COUNT}" "$1"
}

new_fixture() {
	local fixture
	fixture="$(mktemp -d "${TEST_ROOT}/fixture.XXXXXX")"
	mkdir -p "${fixture}/scripts" "${fixture}/frontend" "${fixture}/backend" "${fixture}/bin"
	cp "${REPO_ROOT}/scripts/load-local-domain.sh" "${fixture}/scripts/"
	cp "${REPO_ROOT}/frontend/start-https-frontend.sh" "${fixture}/frontend/"
	cp "${REPO_ROOT}/backend/start-https-backend.sh" "${fixture}/backend/"
	cp "${REPO_ROOT}/.local-domain.example" "${fixture}/"
	printf '%s' "${fixture}"
}

run_loader() {
	local fixture="$1"
	(
		cd /tmp
		source "${fixture}/scripts/load-local-domain.sh"
		printf 'domain=%s\n' "${LOCAL_HTTPS_DOMAIN}"
	)
}

write_frontend_stubs() {
	local fixture="$1"
	cat > "${fixture}/bin/bun" <<'EOF'
#!/usr/bin/env zsh
mkdir -p .svelte-kit
touch .svelte-kit/generated
printf 'bun cwd=%s host=%s port=%s args=%s\n' "${PWD}" "${VITE_HMR_HOST}" "${VITE_HMR_CLIENT_PORT}" "$*" >> "${PWD}/bun.log"
printf 'bun cwd=%s host=%s port=%s args=%s\n' "${PWD}" "${VITE_HMR_HOST}" "${VITE_HMR_CLIENT_PORT}" "$*"
EOF
	cat > "${fixture}/bin/socat" <<'EOF'
#!/usr/bin/env zsh
trap 'printf "terminated\n" >> "${PWD}/socat.exit"; exit 0' INT TERM
trap 'printf "exited\n" >> "${PWD}/socat.exit"' EXIT
printf 'socat cwd=%s args=%s\n' "${PWD}" "$*" >> "${PWD}/socat.log"
printf 'socat cwd=%s args=%s\n' "${PWD}" "$*"
while true; do
	sleep 1
done
EOF
	cat > "${fixture}/bin/python3" <<'EOF'
#!/usr/bin/env zsh
exit 0
EOF
	cat > "${fixture}/bin/sudo" <<'EOF'
#!/usr/bin/env zsh
printf '%s\n' "$*" >> "${PWD}/sudo.log"
if [[ "$1" == "-v" ]]; then
	exit 0
fi
exec "$@"
EOF
	chmod +x "${fixture}/bin/bun" "${fixture}/bin/socat" "${fixture}/bin/python3" "${fixture}/bin/sudo"
}

write_backend_stub() {
	local fixture="$1"
	cat > "${fixture}/backend/gradlew" <<'EOF'
#!/usr/bin/env zsh
printf 'gradle cwd=%s rp=%s cors=%s args=%s\n' "${PWD}" "${WEBAUTHN_RP_ID}" "${CORS_ALLOWED_ORIGINS}" "$*"
EOF
	chmod +x "${fixture}/backend/gradlew"
}

test_valid_domain() {
	local fixture output
	fixture="$(new_fixture)"
	printf 'devbox.example.test\n' > "${fixture}/.local-domain"
	output="$(run_loader "${fixture}")"
	assert_equals "${output}" "domain=devbox.example.test"
	pass "loads a valid domain from any working directory"
}

test_trimmed_domain() {
	local fixture output
	fixture="$(new_fixture)"
	printf ' \tdevbox.example.test \r\n' > "${fixture}/.local-domain"
	output="$(run_loader "${fixture}")"
	assert_equals "${output}" "domain=devbox.example.test"
	pass "trims surrounding whitespace and CRLF"
}

test_missing_domain() {
	local fixture output exit_status
	fixture="$(new_fixture)"
	set +e
	output="$(run_loader "${fixture}" 2>&1)"
	exit_status=$?
	set -e
	[[ ${exit_status} -ne 0 ]] || fail "missing domain file should fail"
	assert_contains "${output}" ".local-domain"
	assert_contains "${output}" 'cp "'
	assert_contains "${output}" ".local-domain.example"
	assert_contains "${output}" "replace todo.example.com"
	pass "missing file shows copy and edit instructions"
}

test_invalid_domain() {
	local value="$1"
	local label="$2"
	local fixture output exit_status
	fixture="$(new_fixture)"
	printf '%s\n' "${value}" > "${fixture}/.local-domain"
	set +e
	output="$(run_loader "${fixture}" 2>&1)"
	exit_status=$?
	set -e
	[[ ${exit_status} -ne 0 ]] || fail "${label} should fail"
	assert_contains "${output}" "hostname only"
	pass "rejects ${label}"
}

test_empty_domain() {
	local fixture output exit_status
	fixture="$(new_fixture)"
	printf ' \n' > "${fixture}/.local-domain"
	set +e
	output="$(run_loader "${fixture}" 2>&1)"
	exit_status=$?
	set -e
	[[ ${exit_status} -ne 0 ]] || fail "empty domain should fail"
	assert_contains "${output}" "is empty"
	assert_contains "${output}" "hostname only"
	pass "rejects an empty domain"
}

test_frontend_script() {
	local fixture output
	fixture="$(new_fixture)"
	printf 'frontend.example.test\n' > "${fixture}/.local-domain"
	write_frontend_stubs "${fixture}"

	output="$(cd /tmp && PATH="${fixture}/bin:${PATH}" "${fixture}/frontend/start-https-frontend.sh")"
	assert_contains "${output}" "Starting on https://frontend.example.test:443"
	assert_contains "$(cat "${fixture}/frontend/bun.log")" "cwd=${fixture}/frontend"
	assert_contains "$(cat "${fixture}/frontend/bun.log")" "host=frontend.example.test"
	assert_contains "$(cat "${fixture}/frontend/bun.log")" "port=443"
	assert_contains "$(cat "${fixture}/frontend/bun.log")" "args=run dev:https"
	assert_contains "$(cat "${fixture}/frontend/socat.log")" "socat cwd=${fixture}/frontend"
	assert_contains "$(cat "${fixture}/frontend/socat.log")" "TCP-LISTEN:443,fork,reuseaddr TCP:127.0.0.1:5173"
	assert_equals "$(head -n 1 "${fixture}/frontend/sudo.log")" "-v"
	assert_contains "$(cat "${fixture}/frontend/sudo.log")" "${fixture}/bin/socat TCP-LISTEN:443,fork,reuseaddr TCP:127.0.0.1:5173"
	[[ -f "${fixture}/frontend/socat.exit" ]] || fail "relay binary should be shut down when the launcher exits"
	[[ "$(file_owner_uid "${fixture}/frontend/.svelte-kit/generated")" == "$(id -u)" ]] || fail "generated frontend artifacts should be owned by the invoking user"

	output="$(cd /tmp && PATH="${fixture}/bin:${PATH}" "${fixture}/frontend/start-https-frontend.sh" 4443)"
	assert_contains "$(cat "${fixture}/frontend/bun.log")" "port=4443"
	pass "frontend script exports configured domain and ports"
}

test_frontend_missing_relay() {
	local fixture output exit_status
	fixture="$(new_fixture)"
	printf 'frontend.example.test\n' > "${fixture}/.local-domain"
	cat > "${fixture}/bin/bun" <<'EOF'
#!/usr/bin/env zsh
printf 'bun should not run\n'
EOF
	cat > "${fixture}/bin/sudo" <<'EOF'
#!/usr/bin/env zsh
if [[ "$1" == "-v" ]]; then
	exit 0
fi
exec "$@"
EOF
	chmod +x "${fixture}/bin/bun" "${fixture}/bin/sudo"

	set +e
	output="$(cd /tmp && PATH="${fixture}/bin:${PATH}" SOCAT_BIN=/nonexistent/socat "${ZSH_BIN}" "${fixture}/frontend/start-https-frontend.sh" 2>&1)"
	exit_status=$?
	set -e
	[[ ${exit_status} -ne 0 ]] || fail "frontend should fail when socat is missing"
	assert_contains "${output}" "Missing required relay binary: socat"
	pass "frontend launcher fails clearly when the relay binary is missing"
}

test_frontend_occupied_port() {
	local fixture output exit_status
	fixture="$(new_fixture)"
	printf 'frontend.example.test\n' > "${fixture}/.local-domain"
	cat > "${fixture}/bin/bun" <<'EOF'
#!/usr/bin/env zsh
printf 'bun should not run\n'
EOF
	cat > "${fixture}/bin/socat" <<'EOF'
#!/usr/bin/env zsh
printf 'socat should not run\n'
EOF
	cat > "${fixture}/bin/python3" <<'EOF'
#!/usr/bin/env zsh
printf '[Errno 98] Address already in use\n' >&2
exit 1
EOF
	cat > "${fixture}/bin/lsof" <<'EOF'
#!/usr/bin/env zsh
printf 'COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\n'
printf 'existing-server 1234 user 3u IPv4 12345 0t0 TCP *:443 (LISTEN)\n'
EOF
	cat > "${fixture}/bin/sudo" <<'EOF'
#!/usr/bin/env zsh
if [[ "$1" == "-v" ]]; then
	exit 0
fi
exec "$@"
EOF
	chmod +x "${fixture}/bin/bun" "${fixture}/bin/socat" "${fixture}/bin/python3" "${fixture}/bin/lsof" "${fixture}/bin/sudo"

	set +e
	output="$(cd /tmp && PATH="${fixture}/bin:${PATH}" "${fixture}/frontend/start-https-frontend.sh" 2>&1)"
	exit_status=$?
	set -e
	[[ ${exit_status} -ne 0 ]] || fail "frontend should fail when the exposed port is occupied"
	assert_contains "${output}" "HTTPS port 443 is already in use"
	assert_contains "${output}" "Bind probe error: [Errno 98] Address already in use"
	assert_contains "${output}" "Listener details:"
	assert_contains "${output}" "existing-server 1234 user"
	assert_contains "${output}" "${fixture}/frontend/start-https-frontend.sh 4443"
	assert_not_contains "${output}" "bun should not run"
	assert_not_contains "${output}" "socat should not run"
	pass "frontend launcher fails clearly when the exposed port is occupied"
}

test_frontend_occupied_port_uses_sudo_for_root_listener() {
	local fixture output exit_status
	fixture="$(new_fixture)"
	printf 'frontend.example.test\n' > "${fixture}/.local-domain"
	cat > "${fixture}/bin/bun" <<'EOF'
#!/usr/bin/env zsh
printf 'bun should not run\n'
EOF
	cat > "${fixture}/bin/socat" <<'EOF'
#!/usr/bin/env zsh
printf 'socat should not run\n'
EOF
	cat > "${fixture}/bin/python3" <<'EOF'
#!/usr/bin/env zsh
printf '[Errno 98] Address already in use\n' >&2
exit 1
EOF
	cat > "${fixture}/bin/lsof" <<'EOF'
#!/usr/bin/env zsh
if [[ "${SUDO_WRAPPED:-}" == "1" ]]; then
	printf 'COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\n'
	printf 'root-server 4321 root 3u IPv4 12345 0t0 TCP *:443 (LISTEN)\n'
fi
EOF
	cat > "${fixture}/bin/sudo" <<EOF
#!/usr/bin/env zsh
printf '%s\n' "\$*" >> "${fixture}/sudo.log"
if [[ "\$1" == "-v" ]]; then
	exit 0
fi
SUDO_WRAPPED=1 exec "\$@"
EOF
	chmod +x "${fixture}/bin/bun" "${fixture}/bin/socat" "${fixture}/bin/python3" "${fixture}/bin/lsof" "${fixture}/bin/sudo"

	set +e
	output="$(cd /tmp && PATH="${fixture}/bin:${PATH}" "${fixture}/frontend/start-https-frontend.sh" 2>&1)"
	exit_status=$?
	set -e
	[[ ${exit_status} -ne 0 ]] || fail "frontend should fail when the exposed port is occupied by a root listener"
	assert_contains "${output}" "HTTPS port 443 is already in use"
	assert_contains "${output}" "Listener details:"
	assert_contains "${output}" "root-server 4321 root"
	assert_contains "$(cat "${fixture}/sudo.log")" "-v"
	assert_contains "$(cat "${fixture}/sudo.log")" "${fixture}/bin/lsof -nP -iTCP:443 -sTCP:LISTEN"
	assert_not_contains "${output}" "bun should not run"
	assert_not_contains "${output}" "socat should not run"
	pass "frontend launcher uses sudo to identify root-owned occupied ports"
}

test_frontend_stops_when_sudo_auth_fails() {
	local fixture output exit_status
	fixture="$(new_fixture)"
	printf 'frontend.example.test\n' > "${fixture}/.local-domain"
	cat > "${fixture}/bin/bun" <<'EOF'
#!/usr/bin/env zsh
printf 'bun should not run\n'
EOF
	cat > "${fixture}/bin/socat" <<'EOF'
#!/usr/bin/env zsh
printf 'socat should not run\n'
EOF
	cat > "${fixture}/bin/sudo" <<'EOF'
#!/usr/bin/env zsh
printf '%s\n' "$*" >> "${PWD}/sudo.log"
if [[ "$1" == "-v" ]]; then
	printf 'sudo auth failed\n' >&2
	exit 1
fi
exec "$@"
EOF
	chmod +x "${fixture}/bin/bun" "${fixture}/bin/socat" "${fixture}/bin/sudo"

	set +e
	output="$(cd /tmp && PATH="${fixture}/bin:${PATH}" "${fixture}/frontend/start-https-frontend.sh" 2>&1)"
	exit_status=$?
	set -e
	[[ ${exit_status} -ne 0 ]] || fail "frontend should fail when sudo auth fails"
	assert_contains "${output}" "sudo auth failed"
	assert_not_contains "${output}" "bun should not run"
	assert_not_contains "${output}" "socat should not run"
	assert_equals "$(cat "${fixture}/frontend/sudo.log")" "-v"
	pass "frontend launcher waits for sudo auth before starting child processes"
}

test_backend_script() {
	local fixture output
	fixture="$(new_fixture)"
	printf 'backend.example.test\n' > "${fixture}/.local-domain"
	write_backend_stub "${fixture}"

	output="$(cd /tmp && "${fixture}/backend/start-https-backend.sh")"
	assert_contains "${output}" "cors=https://backend.example.test:443"

	output="$(cd /tmp && "${fixture}/backend/start-https-backend.sh" 4443)"
	assert_contains "${output}" "Starting on https://backend.example.test:4443"
	assert_contains "${output}" "cwd=${fixture}/backend"
	assert_contains "${output}" "rp=backend.example.test"
	assert_contains "${output}" "cors=https://backend.example.test:4443"
	assert_contains "${output}" "args=bootRun"
	pass "backend script exports configured domain and custom port"
}

test_backend_interrupt_cleans_up_continuous_build() {
	local fixture launcher_pid waited output
	fixture="$(new_fixture)"
	printf 'backend.example.test\n' > "${fixture}/.local-domain"
	cat > "${fixture}/backend/gradlew" <<'EOF'
#!/usr/bin/env zsh
if [[ "$*" == *"--continuous"* ]]; then
	printf '%s\n' "$$" > "${PWD}/continuous.pid"
	trap 'printf "terminated\n" > "${PWD}/continuous.exit"; exit 0' INT TERM
	while true; do
		sleep 1
	done
fi

printf '%s\n' "$$" > "${PWD}/bootrun.pid"
while true; do
	sleep 1
done
EOF
	chmod +x "${fixture}/backend/gradlew"

	(
		cd /tmp
		"${fixture}/backend/start-https-backend.sh" > "${fixture}/backend/launcher.out" 2>&1
	) &
	launcher_pid=$!

	waited=0
	while [[ ! -s "${fixture}/backend/continuous.pid" || ! -s "${fixture}/backend/bootrun.pid" ]]; do
		sleep 0.1
		waited=$((waited + 1))
		(( waited < 100 )) || fail "backend launcher did not start both gradle processes"
	done

	kill -INT "$(cat "${fixture}/backend/bootrun.pid")"
	wait "${launcher_pid}" 2>/dev/null || true

	waited=0
	while [[ ! -e "${fixture}/backend/continuous.exit" ]]; do
		sleep 0.1
		waited=$((waited + 1))
		(( waited < 100 )) || fail "continuous gradle process was not terminated"
	done

	output="$(cat "${fixture}/backend/continuous.exit")"
	assert_equals "${output}" "terminated"
	pass "backend launcher cleans up continuous build on interrupt"
}

test_scripts_stop_before_children() {
	local fixture output exit_status marker
	fixture="$(new_fixture)"
	marker="${fixture}/child-called"
	cat > "${fixture}/bin/bun" <<EOF
#!/usr/bin/env zsh
touch "${marker}"
EOF
	cat > "${fixture}/bin/sudo" <<'EOF'
#!/usr/bin/env zsh
if [[ "$1" == "-v" ]]; then
	exit 0
fi
exec "$@"
EOF
	cat > "${fixture}/backend/gradlew" <<EOF
#!/usr/bin/env zsh
touch "${marker}"
EOF
	chmod +x "${fixture}/bin/bun" "${fixture}/bin/sudo" "${fixture}/backend/gradlew"

	set +e
	output="$(cd /tmp && PATH="${fixture}/bin:${PATH}" "${fixture}/frontend/start-https-frontend.sh" 2>&1)"
	exit_status=$?
	set -e
	[[ ${exit_status} -ne 0 ]] || fail "frontend should fail without configuration"
	assert_not_contains "${output}" "Starting on"
	[[ ! -e "${marker}" ]] || fail "frontend child command should not run"

	set +e
	output="$(cd /tmp && "${fixture}/backend/start-https-backend.sh" 2>&1)"
	exit_status=$?
	set -e
	[[ ${exit_status} -ne 0 ]] || fail "backend should fail without configuration"
	assert_not_contains "${output}" "Starting on"
	[[ ! -e "${marker}" ]] || fail "backend child command should not run"
	pass "startup scripts stop before child commands on configuration errors"
}

test_extra_arguments() {
	local fixture output exit_status
	fixture="$(new_fixture)"
	printf 'devbox.example.test\n' > "${fixture}/.local-domain"
	write_frontend_stubs "${fixture}"

	set +e
	output="$(PATH="${fixture}/bin:${PATH}" "${fixture}/frontend/start-https-frontend.sh" old.example.test 443 2>&1)"
	exit_status=$?
	set -e
	[[ ${exit_status} -eq 2 ]] || fail "extra frontend arguments should return usage status"
	assert_contains "${output}" "Usage:"

	set +e
	output="$("${fixture}/backend/start-https-backend.sh" old.example.test 443 2>&1)"
	exit_status=$?
	set -e
	[[ ${exit_status} -eq 2 ]] || fail "extra backend arguments should return usage status"
	assert_contains "${output}" "Usage:"
	pass "startup scripts reject the old domain and port argument form"
}

test_domain_argument_as_port() {
	local fixture output exit_status
	fixture="$(new_fixture)"
	printf 'devbox.example.test\n' > "${fixture}/.local-domain"
	write_frontend_stubs "${fixture}"
	write_backend_stub "${fixture}"

	set +e
	output="$(PATH="${fixture}/bin:${PATH}" "${fixture}/frontend/start-https-frontend.sh" old.example.test 2>&1)"
	exit_status=$?
	set -e
	[[ ${exit_status} -ne 0 ]] || fail "frontend should reject a domain in the port position"
	assert_contains "${output}" "invalid HTTPS port"

	set +e
	output="$("${fixture}/backend/start-https-backend.sh" old.example.test 2>&1)"
	exit_status=$?
	set -e
	[[ ${exit_status} -ne 0 ]] || fail "backend should reject a domain in the port position"
	assert_contains "${output}" "invalid HTTPS port"
	pass "startup scripts reject a legacy domain as the sole argument"
}

test_valid_domain
test_trimmed_domain
test_missing_domain
test_empty_domain
test_invalid_domain "https://todo.example.com" "scheme-containing values"
test_invalid_domain "todo.example.com:443" "port-containing values"
test_invalid_domain "todo.example.com/path" "path-containing values"
test_invalid_domain "todo example.com" "internal whitespace"
test_frontend_script
test_frontend_missing_relay
test_frontend_occupied_port
test_frontend_occupied_port_uses_sudo_for_root_listener
test_frontend_stops_when_sudo_auth_fails
test_backend_script
test_backend_interrupt_cleans_up_continuous_build
test_scripts_stop_before_children
test_extra_arguments
test_domain_argument_as_port

printf '1..%d\n' "${PASS_COUNT}"
