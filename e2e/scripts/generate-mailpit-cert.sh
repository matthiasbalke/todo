#!/usr/bin/env zsh

set -euo pipefail

script_dir="${0:A:h}"
repo_root="$(cd "${script_dir}/../.." && pwd)"
cert_dir="${E2E_CERT_DIR:-${repo_root}/e2e/certs}"
ca_cert="${cert_dir}/e2e-root-ca.pem"
ca_key="${cert_dir}/e2e-root-ca.key"
cert_file="${cert_dir}/mailpit.pem"
key_file="${cert_dir}/mailpit.key"
local_domain_file="${repo_root}/.local-domain"

if [[ ! -f "${ca_cert}" || ! -f "${ca_key}" ]]; then
	printf 'Error: missing E2E root CA files in %s\n' "${cert_dir}" >&2
	exit 1
fi

typeset -a dns_names ip_addresses
dns_names=(mailpit-starttls mailpit-smtps localhost)
ip_addresses=(127.0.0.1)

if [[ -f "${local_domain_file}" ]]; then
	local_domain="$(tr -d '\r' < "${local_domain_file}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
	if [[ -n "${local_domain}" ]]; then
		if [[ "${local_domain}" =~ [[:space:]/:] ]]; then
			printf 'Error: invalid local domain in %s: %s\n' "${local_domain_file}" "${local_domain}" >&2
			printf 'Use a hostname only, without scheme, port, path, or whitespace.\n' >&2
			exit 1
		fi
		dns_names+=("${local_domain}")
	fi
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "${tmp_dir}"' EXIT

san_entries=()
for dns_name in "${dns_names[@]}"; do
	san_entries+=("DNS:${dns_name}")
done
for ip_address in "${ip_addresses[@]}"; do
	san_entries+=("IP:${ip_address}")
done

csr_file="${tmp_dir}/mailpit.csr"
ext_file="${tmp_dir}/mailpit.ext"

cat > "${ext_file}" <<EOF
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=${(j:,:)san_entries}
EOF

openssl req \
	-new \
	-newkey rsa:2048 \
	-nodes \
	-keyout "${key_file}" \
	-out "${csr_file}" \
	-subj "/CN=mailpit-starttls" \
	>/dev/null 2>&1

openssl x509 \
	-req \
	-in "${csr_file}" \
	-CA "${ca_cert}" \
	-CAkey "${ca_key}" \
	-set_serial "$(date +%s)" \
	-days 825 \
	-sha256 \
	-extfile "${ext_file}" \
	-out "${cert_file}" \
	>/dev/null 2>&1

chmod 600 "${key_file}"
chmod 644 "${cert_file}"

printf 'Generated %s and %s with SANs: %s\n' "${cert_file}" "${key_file}" "${(j:, :)san_entries}"
