#!/usr/bin/env zsh
# Shared validation inside development containers; no host launcher is needed.
set -euo pipefail

fail_config() {
  print -u2 -- "Development configuration error: $* (check .env.dev and .env.dev.example)"
  exit 1
}

[[ -n "${LOCAL_HTTPS_DOMAIN:-}" ]] || fail_config 'LOCAL_HTTPS_DOMAIN is required'
[[ ${#LOCAL_HTTPS_DOMAIN} -le 253 && "${LOCAL_HTTPS_DOMAIN}" != *[/:[:space:]]* ]] || fail_config 'LOCAL_HTTPS_DOMAIN must be a hostname without scheme, port, or path'
for label in "${(@s:.:)LOCAL_HTTPS_DOMAIN}"; do
  [[ ${#label} -le 63 && "${label}" =~ '^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$' ]] || fail_config 'LOCAL_HTTPS_DOMAIN contains an invalid hostname label'
done
for port in "${DEV_PROXY_PORT}" "${DEV_FRONTEND_PORT}"; do
  [[ "$port" =~ '^[1-9][0-9]{0,4}$' && "$port" == <1-65535> ]] || fail_config 'published HTTPS ports must be between 1 and 65535'
done
cert_dir="${DEV_CERT_DIR:-/workspace/.certs}"
for cert_file in "${cert_dir}/cert.pem" "${cert_dir}/key.pem"; do
  [[ -s "$cert_file" && -r "$cert_file" ]] || fail_config "missing or unreadable $cert_file; generate the local mkcert certificate first"
done

proxy_origin="https://${LOCAL_HTTPS_DOMAIN}"
[[ "$DEV_PROXY_PORT" == 443 ]] || proxy_origin+=":${DEV_PROXY_PORT}"
frontend_origin="https://${LOCAL_HTTPS_DOMAIN}"
[[ "$DEV_FRONTEND_PORT" == 443 ]] || frontend_origin+=":${DEV_FRONTEND_PORT}"
export WEBAUTHN_RP_ID="$LOCAL_HTTPS_DOMAIN"
export APP_PUBLIC_BASE_URL="$proxy_origin"
export CORS_ALLOWED_ORIGINS="${proxy_origin},${frontend_origin}"
