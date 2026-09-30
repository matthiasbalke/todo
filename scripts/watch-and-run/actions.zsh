#!/usr/bin/env zsh

run_backend_tests() {
	local worktree_dir="$1"
	(
		cd "${worktree_dir}/backend" || return 1
		./gradlew test
	)
}

register_action ".run-backend-tests" "run_backend_tests" "backend/build/reports/tests/test/index.html"
