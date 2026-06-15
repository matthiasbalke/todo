#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_ROOT="$(mktemp -d)"
PASS_COUNT=0

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
	cat > "${fixture}/bin/node" <<'EOF'
#!/usr/bin/env bash
printf 'node cwd=%s host=%s port=%s args=%s\n' "${PWD}" "${VITE_HMR_HOST}" "${VITE_HMR_CLIENT_PORT}" "$*"
EOF
	cat > "${fixture}/bin/sudo" <<'EOF'
#!/usr/bin/env bash
if [[ "$1" == --preserve-env=* ]]; then
	shift
fi
exec "$@"
EOF
	chmod +x "${fixture}/bin/node" "${fixture}/bin/sudo"
}

write_backend_stub() {
	local fixture="$1"
	cat > "${fixture}/backend/gradlew" <<'EOF'
#!/usr/bin/env bash
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
	local fixture output status
	fixture="$(new_fixture)"
	set +e
	output="$(run_loader "${fixture}" 2>&1)"
	status=$?
	set -e
	[[ ${status} -ne 0 ]] || fail "missing domain file should fail"
	assert_contains "${output}" ".local-domain"
	assert_contains "${output}" 'cp "'
	assert_contains "${output}" ".local-domain.example"
	assert_contains "${output}" "replace todo.example.com"
	pass "missing file shows copy and edit instructions"
}

test_invalid_domain() {
	local value="$1"
	local label="$2"
	local fixture output status
	fixture="$(new_fixture)"
	printf '%s\n' "${value}" > "${fixture}/.local-domain"
	set +e
	output="$(run_loader "${fixture}" 2>&1)"
	status=$?
	set -e
	[[ ${status} -ne 0 ]] || fail "${label} should fail"
	assert_contains "${output}" "hostname only"
	pass "rejects ${label}"
}

test_empty_domain() {
	local fixture output status
	fixture="$(new_fixture)"
	printf ' \n' > "${fixture}/.local-domain"
	set +e
	output="$(run_loader "${fixture}" 2>&1)"
	status=$?
	set -e
	[[ ${status} -ne 0 ]] || fail "empty domain should fail"
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
	assert_contains "${output}" "cwd=${fixture}/frontend"
	assert_contains "${output}" "host=frontend.example.test"
	assert_contains "${output}" "port=443"
	assert_contains "${output}" "args=./node_modules/vite/bin/vite.js dev --config vite.config.https.ts"

	output="$(cd /tmp && PATH="${fixture}/bin:${PATH}" "${fixture}/frontend/start-https-frontend.sh" 4443)"
	assert_contains "${output}" "port=4443"
	pass "frontend script exports configured domain and ports"
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

test_scripts_stop_before_children() {
	local fixture output status marker
	fixture="$(new_fixture)"
	marker="${fixture}/child-called"
	cat > "${fixture}/bin/bun" <<EOF
#!/usr/bin/env bash
touch "${marker}"
EOF
	cat > "${fixture}/bin/sudo" <<'EOF'
#!/usr/bin/env bash
exec "$@"
EOF
	cat > "${fixture}/backend/gradlew" <<EOF
#!/usr/bin/env bash
touch "${marker}"
EOF
	chmod +x "${fixture}/bin/bun" "${fixture}/bin/sudo" "${fixture}/backend/gradlew"

	set +e
	output="$(cd /tmp && PATH="${fixture}/bin:${PATH}" "${fixture}/frontend/start-https-frontend.sh" 2>&1)"
	status=$?
	set -e
	[[ ${status} -ne 0 ]] || fail "frontend should fail without configuration"
	assert_not_contains "${output}" "Starting on"
	[[ ! -e "${marker}" ]] || fail "frontend child command should not run"

	set +e
	output="$(cd /tmp && "${fixture}/backend/start-https-backend.sh" 2>&1)"
	status=$?
	set -e
	[[ ${status} -ne 0 ]] || fail "backend should fail without configuration"
	assert_not_contains "${output}" "Starting on"
	[[ ! -e "${marker}" ]] || fail "backend child command should not run"
	pass "startup scripts stop before child commands on configuration errors"
}

test_extra_arguments() {
	local fixture output status
	fixture="$(new_fixture)"
	printf 'devbox.example.test\n' > "${fixture}/.local-domain"
	write_frontend_stubs "${fixture}"

	set +e
	output="$(PATH="${fixture}/bin:${PATH}" "${fixture}/frontend/start-https-frontend.sh" old.example.test 443 2>&1)"
	status=$?
	set -e
	[[ ${status} -eq 2 ]] || fail "extra frontend arguments should return usage status"
	assert_contains "${output}" "Usage:"

	set +e
	output="$("${fixture}/backend/start-https-backend.sh" old.example.test 443 2>&1)"
	status=$?
	set -e
	[[ ${status} -eq 2 ]] || fail "extra backend arguments should return usage status"
	assert_contains "${output}" "Usage:"
	pass "startup scripts reject the old domain and port argument form"
}

test_domain_argument_as_port() {
	local fixture output status
	fixture="$(new_fixture)"
	printf 'devbox.example.test\n' > "${fixture}/.local-domain"
	write_frontend_stubs "${fixture}"
	write_backend_stub "${fixture}"

	set +e
	output="$(PATH="${fixture}/bin:${PATH}" "${fixture}/frontend/start-https-frontend.sh" old.example.test 2>&1)"
	status=$?
	set -e
	[[ ${status} -ne 0 ]] || fail "frontend should reject a domain in the port position"
	assert_contains "${output}" "invalid HTTPS port"

	set +e
	output="$("${fixture}/backend/start-https-backend.sh" old.example.test 2>&1)"
	status=$?
	set -e
	[[ ${status} -ne 0 ]] || fail "backend should reject a domain in the port position"
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
test_backend_script
test_scripts_stop_before_children
test_extra_arguments
test_domain_argument_as_port

printf '1..%d\n' "${PASS_COUNT}"
