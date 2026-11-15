#!/usr/bin/env zsh
set -euo pipefail
repo_root="${0:A:h:h:h}"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
print certificate > "$tmp_dir/cert.pem"
print key > "$tmp_dir/key.pem"

run_config() {
  env LOCAL_HTTPS_DOMAIN="$1" DEV_PROXY_PORT="$2" DEV_FRONTEND_PORT="$3" DEV_CERT_DIR="$tmp_dir" \
    zsh -c 'source "$1"; print -r -- "$APP_PUBLIC_BASE_URL|$CORS_ALLOWED_ORIGINS|$WEBAUTHN_RP_ID"' \
    zsh "$repo_root/dev/container-env.sh"
}
[[ "$(run_config todo.example.com 443 5173)" == 'https://todo.example.com|https://todo.example.com,https://todo.example.com:5173|todo.example.com' ]]
[[ "$(run_config todo.example.com 4443 55173)" == 'https://todo.example.com:4443|https://todo.example.com:4443,https://todo.example.com:55173|todo.example.com' ]]
for invalid_domain in '' 'https://todo.example.com' 'todo.example.com:443' 'todo.example.com/path' 'a b' '.example.com' 'example.com.' '-bad.example' 'bad..example'; do
  if run_config "$invalid_domain" 443 5173 > "$tmp_dir/output" 2>&1; then
    print -u2 -- "Accepted invalid hostname: $invalid_domain"
    exit 1
  fi
  [[ "$(<"$tmp_dir/output")" == *'Development configuration error'* ]]
done
for invalid_port in 0 65536 -1 abc 0443 '443/path'; do
  if run_config todo.example.com "$invalid_port" 5173 > "$tmp_dir/output" 2>&1; then
    print -u2 -- "Accepted invalid port: $invalid_port"
    exit 1
  fi
done
rm "$tmp_dir/key.pem"
if run_config todo.example.com 443 5173 > "$tmp_dir/output" 2>&1; then
  print -u2 'Accepted missing certificate key'
  exit 1
fi
[[ "$(<"$tmp_dir/output")" == *'generate the local mkcert certificate first'* ]]
print 'Development environment checks passed'
