#!/usr/bin/env zsh
set -u
setopt pipefail

SCRIPT_DIR="${${(%):-%x}:A:h}"
typeset -A ACTION_FUNCTIONS
typeset -A ACTION_REPORTS

die() {
	printf 'Error: %s\n' "$1" >&2
	exit 1
}

usage() {
	printf 'Usage: %s --worktree <absolute-directory> [--once] [--poll-seconds <positive-integer>]\n' "$0" >&2
	exit 1
}

register_action() {
	local trigger_name="$1"
	local action_function="$2"
	local report_location="${3:-}"

	[[ "${trigger_name}" == .run-* && "${trigger_name}" != */* && "${trigger_name}" != *$'\n'* ]] || die "invalid trigger name: ${trigger_name}"
	[[ -z "${ACTION_FUNCTIONS[${trigger_name}]-}" ]] || die "duplicate trigger name: ${trigger_name}"
	(( ${+functions[${action_function}]} )) || die "action function is not defined: ${action_function}"
	[[ -z "${report_location}" || ( "${report_location}" != /* && "${report_location}" != .. && "${report_location}" != ../* && "${report_location}" != */../* ) ]] || die "report location must be relative: ${report_location}"

	ACTION_FUNCTIONS[${trigger_name}]="${action_function}"
	ACTION_REPORTS[${trigger_name}]="${report_location}"
}

write_status() {
	local status_file="$1"
	local run_id="$2"
	local trigger_name="$3"
	local action_function="$4"
	local started_at="$5"
	local finished_at="$6"
	local exit_code="$7"
	local report_location="$8"
	local log_location="$9"
	local outcome diagnostic temporary_status

	if (( exit_code == 0 )); then
		outcome="passed"
		diagnostic="action-completed"
	else
		outcome="failed"
		diagnostic="action-exited-${exit_code}"
	fi

	temporary_status="${status_file}.${run_id}.tmp"
	{
		print -r -- "run_id=${run_id}"
		print -r -- "trigger=${trigger_name}"
		print -r -- "action=${action_function}"
		print -r -- "started_at=${started_at}"
		print -r -- "finished_at=${finished_at}"
		print -r -- "outcome=${outcome}"
		print -r -- "exit_code=${exit_code}"
		print -r -- "report_path=${report_location}"
		print -r -- "log_path=${log_location}"
		print -r -- "diagnostic=${diagnostic}"
	} > "${temporary_status}"

	mv -f "${temporary_status}" "${status_file}" || {
		rm -f "${temporary_status}"
		printf 'Error: could not publish status: %s\n' "${status_file}" >&2
		return 1
	}
}

process_trigger() {
	local trigger_name="$1"
	local request_file="${WORKTREE_DIR}/${trigger_name}"
	local running_file="${request_file}.running"
	local results_dir="${request_file}.results"
	local status_file="${results_dir}/status"
	local log_file="${results_dir}/output.log"
	local action_function="${ACTION_FUNCTIONS[${trigger_name}]}"
	local report_location="${ACTION_REPORTS[${trigger_name}]}"
	local run_id started_at finished_at exit_code

	[[ -f "${request_file}" && ! -L "${request_file}" ]] || return 0
	( set -C; : > "${running_file}" ) 2>/dev/null || return 0

	if ! rm -f "${request_file}"; then
		rm -f "${running_file}"
		printf 'Error: could not clear request: %s\n' "${request_file}" >&2
		return 1
	fi
	if [[ -L "${results_dir}" ]] || { [[ -e "${results_dir}" ]] && [[ ! -d "${results_dir}" ]]; }; then
		rm -f "${running_file}"
		printf 'Error: invalid results directory: %s\n' "${results_dir}" >&2
		return 1
	fi
	if ! mkdir -p "${results_dir}" || ! rm -f "${status_file}" "${log_file}"; then
		rm -f "${running_file}"
		printf 'Error: could not prepare results directory: %s\n' "${results_dir}" >&2
		return 1
	fi

	run_id="$(date -u +%Y%m%dT%H%M%SZ)-$$"
	started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
	"${action_function}" "${WORKTREE_DIR}" > "${log_file}" 2>&1
	exit_code=$?
	finished_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
	write_status "${status_file}" "${run_id}" "${trigger_name}" "${action_function}" "${started_at}" "${finished_at}" "${exit_code}" "${report_location}" "${log_file}"
	rm -f "${running_file}" || printf 'Error: could not clear running state: %s\n' "${running_file}" >&2
}

WORKTREE_DIR=""
RUN_ONCE=0
POLL_SECONDS=2

while (( $# > 0 )); do
	case "$1" in
		--worktree)
			shift
			(( $# > 0 )) || usage
			WORKTREE_DIR="$1"
			;;
		--once)
			RUN_ONCE=1
			;;
		--poll-seconds)
			shift
			(( $# > 0 )) || usage
			POLL_SECONDS="$1"
			;;
		*)
			usage
			;;
	esac
	shift
done

[[ -n "${WORKTREE_DIR}" && "${WORKTREE_DIR}" == /* ]] || die "--worktree must be an absolute directory"
[[ -d "${WORKTREE_DIR}" && -e "${WORKTREE_DIR}/.git" ]] || die "--worktree must be an existing Git worktree"
[[ "${POLL_SECONDS}" =~ ^[1-9][0-9]*$ ]] || die "--poll-seconds must be a positive integer"
WORKTREE_DIR="${WORKTREE_DIR:A}"

[[ -r "${SCRIPT_DIR}/actions.zsh" ]] || die "host-only action configuration is missing: ${SCRIPT_DIR}/actions.zsh"
source "${SCRIPT_DIR}/actions.zsh"
(( ${#ACTION_FUNCTIONS} > 0 )) || die "host-only action configuration registers no actions"

while true; do
	for trigger_name in ${(k)ACTION_FUNCTIONS}; do
		process_trigger "${trigger_name}"
	done
	(( RUN_ONCE == 1 )) && exit 0
	sleep "${POLL_SECONDS}"
done
