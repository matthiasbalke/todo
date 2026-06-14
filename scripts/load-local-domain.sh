#!/usr/bin/env bash

load_local_https_domain() {
	local script_dir repo_root domain_file raw_domain domain label
	local -a labels

	# Resolve the config relative to this helper so callers can run from any directory.
	script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
	repo_root="$(cd "${script_dir}/.." && pwd)"
	domain_file="${repo_root}/.local-domain"

	# Do not fall back to a committed domain: every computer must opt into its local value.
	if [[ ! -f "${domain_file}" ]]; then
		printf 'Error: local HTTPS domain file not found: %s\n' "${domain_file}" >&2
		printf 'Create it with: cp "%s/.local-domain.example" "%s/.local-domain"\n' "${repo_root}" "${repo_root}" >&2
		printf 'Then edit .local-domain and replace todo.example.com with this computer'\''s domain.\n' >&2
		return 1
	fi

	# Accept CRLF files and harmless whitespace around the single configured value.
	raw_domain="$(tr -d '\r' < "${domain_file}")"
	domain="$(printf '%s' "${raw_domain}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"

	# Report an empty file separately so the recovery action is obvious.
	if [[ -z "${domain}" ]]; then
		printf 'Error: local HTTPS domain file is empty: %s\n' "${domain_file}" >&2
		printf 'Set it to a hostname only, for example: todo.example.com\n' >&2
		return 1
	fi

	# Reject origin syntax and malformed overall hostname shape before checking DNS labels.
	if [[ ${#domain} -gt 253 ]] || [[ "${domain}" == .* ]] || [[ "${domain}" == *. ]] || [[ "${domain}" =~ [[:space:]/:] ]]; then
		printf 'Error: invalid local HTTPS domain in %s: %s\n' "${domain_file}" "${domain}" >&2
		printf 'Use a hostname only, without a scheme, port, path, or whitespace.\n' >&2
		return 1
	fi

	# Validate each DNS label: 1-63 alphanumeric/hyphen characters, no edge hyphens.
	IFS='.' read -r -a labels <<< "${domain}"
	for label in "${labels[@]}"; do
		if [[ ${#label} -gt 63 ]] || [[ ! "${label}" =~ ^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$ ]]; then
			printf 'Error: invalid local HTTPS domain in %s: %s\n' "${domain_file}" "${domain}" >&2
			printf 'Use a hostname only, without a scheme, port, path, or whitespace.\n' >&2
			return 1
		fi
	done

	LOCAL_HTTPS_DOMAIN="${domain}"
	export LOCAL_HTTPS_DOMAIN
}

validate_local_https_port() {
	local port="$1"

	# Keep launch-script ports numeric and within the TCP/UDP port range.
	if [[ ! "${port}" =~ ^[0-9]+$ ]] || [[ ${#port} -gt 5 ]] || (( 10#${port} < 1 || 10#${port} > 65535 )); then
		printf 'Error: invalid HTTPS port: %s\n' "${port}" >&2
		printf 'Use a number from 1 to 65535.\n' >&2
		return 1
	fi
}

# Work both when sourced by another script and when executed directly for validation.
if ! load_local_https_domain; then
	return 1 2>/dev/null || exit 1
fi
