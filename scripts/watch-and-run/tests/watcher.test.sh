#!/usr/bin/env zsh
set -u
setopt pipefail

PACKAGE_ROOT="${${(%):-%x}:A:h:h}"
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

pass() {
	PASS_COUNT=$((PASS_COUNT + 1))
	printf 'ok %d - %s\n' "${PASS_COUNT}" "$1"
}

assert_contains() {
	local file_name="$1"
	local expected="$2"
	[[ -f "${file_name}" ]] || fail "expected file: ${file_name}"
	[[ "$(<"${file_name}")" == *"${expected}"* ]] || fail "expected ${file_name} to contain: ${expected}"
}

assert_equals() {
	local actual="$1"
	local expected="$2"
	[[ "${actual}" == "${expected}" ]] || fail "expected '${expected}', got '${actual}'"
}

new_fixture() {
	local fixture_name="$1"
	local fixture_root="${TEST_ROOT}/${fixture_name}"

	mkdir -p "${fixture_root}/worktree/.git" "${fixture_root}/package"
	cp -R "${PACKAGE_ROOT}/." "${fixture_root}/package/"
	cat > "${fixture_root}/package/actions.zsh" <<'EOF'
#!/usr/bin/env zsh

run_success() {
	local worktree_dir="$1"
	print -r -- success >> "${worktree_dir}/action-count"
	print -r -- "success output"
}

run_failure() {
	return 7
}

run_unavailable() {
	watch_and_run_missing_command
}

run_slow() {
	local worktree_dir="$1"
	sleep 1
	print -r -- slow >> "${worktree_dir}/action-count"
}

register_action ".run-success" "run_success" "reports/success.txt"
register_action ".run-failure" "run_failure" "reports/failure.txt"
register_action ".run-unavailable" "run_unavailable" "reports/unavailable.txt"
register_action ".run-slow" "run_slow" "reports/slow.txt"
EOF
	printf '%s' "${fixture_root}"
}

run_once() {
	local fixture_root="$1"
	zsh "${fixture_root}/package/watcher.zsh" --worktree "${fixture_root}/worktree" --once
}

test_invalid_worktree() {
	local fixture_root
	fixture_root="$(new_fixture invalid-worktree)"
	if zsh "${fixture_root}/package/watcher.zsh" --worktree relative --once >/dev/null 2>&1; then
		fail "relative worktree unexpectedly succeeded"
	fi
	pass "rejects a relative worktree"
}

test_success_and_trigger_contents() {
	local fixture_root worktree_dir
	fixture_root="$(new_fixture success)"
	worktree_dir="${fixture_root}/worktree"
	mkdir -p "${worktree_dir}/.run-success.results"
	print -r -- "stale status" > "${worktree_dir}/.run-success.results/status"
	print -r -- "stale output" > "${worktree_dir}/.run-success.results/output.log"
	print -r -- "ignored trigger data" > "${worktree_dir}/.run-success"
	run_once "${fixture_root}"
	assert_equals "$(<"${worktree_dir}/action-count")" "success"
	assert_contains "${worktree_dir}/.run-success.results/status" "outcome=passed"
	assert_contains "${worktree_dir}/.run-success.results/status" "report_path=reports/success.txt"
	assert_contains "${worktree_dir}/.run-success.results/status" "log_path=${worktree_dir}/.run-success.results/output.log"
	assert_contains "${worktree_dir}/.run-success.results/output.log" "success output"
	[[ "$(<"${worktree_dir}/.run-success.results/status")" != *"stale status"* ]] || fail "previous status was not cleared"
	[[ "$(<"${worktree_dir}/.run-success.results/output.log")" != *"stale output"* ]] || fail "previous output was not cleared"
	[[ ! -e "${worktree_dir}/.run-success" ]] || fail "request was not cleared"
	[[ ! -e "${worktree_dir}/.run-success.running" ]] || fail "running state was not cleared"
	pass "runs a configured action and ignores trigger contents"
}

test_failure_and_start_error() {
	local fixture_root worktree_dir
	fixture_root="$(new_fixture failures)"
	worktree_dir="${fixture_root}/worktree"
	touch "${worktree_dir}/.run-failure" "${worktree_dir}/.run-unavailable"
	run_once "${fixture_root}"
	assert_contains "${worktree_dir}/.run-failure.results/status" "outcome=failed"
	assert_contains "${worktree_dir}/.run-failure.results/status" "exit_code=7"
	assert_contains "${worktree_dir}/.run-unavailable.results/status" "outcome=failed"
	assert_contains "${worktree_dir}/.run-unavailable.results/status" "exit_code=127"
	assert_contains "${worktree_dir}/.run-unavailable.results/output.log" "command not found"
	pass "records action failures and unavailable commands"
}

test_unknown_trigger() {
	local fixture_root worktree_dir
	fixture_root="$(new_fixture unknown)"
	worktree_dir="${fixture_root}/worktree"
	touch "${worktree_dir}/.run-unknown"
	run_once "${fixture_root}"
	[[ -f "${worktree_dir}/.run-unknown" ]] || fail "unknown trigger was changed"
	[[ ! -e "${worktree_dir}/.run-unknown.results" ]] || fail "unknown trigger produced results"
	pass "ignores an unknown trigger"
}

test_concurrent_watchers() {
	local fixture_root worktree_dir watcher_pid run_count
	fixture_root="$(new_fixture concurrent)"
	worktree_dir="${fixture_root}/worktree"
	touch "${worktree_dir}/.run-slow"
	zsh "${fixture_root}/package/watcher.zsh" --worktree "${worktree_dir}" --once >/dev/null 2>&1 &
	watcher_pid=$!
	sleep 0.1
	[[ -f "${worktree_dir}/.run-slow.running" ]] || fail "watcher did not create a running claim file"
	[[ ! -d "${worktree_dir}/.run-slow.running" ]] || fail "running claim is a directory"
	run_once "${fixture_root}"
	wait "${watcher_pid}"
	run_count="$(wc -l < "${worktree_dir}/action-count" | tr -d '[:space:]')"
	assert_equals "${run_count}" "1"
	assert_contains "${worktree_dir}/.run-slow.results/status" "outcome=passed"
	pass "claims a request once across concurrent watchers"
}

test_invalid_worktree
test_success_and_trigger_contents
test_failure_and_start_error
test_unknown_trigger
test_concurrent_watchers
printf '1..%d\n' "${PASS_COUNT}"
