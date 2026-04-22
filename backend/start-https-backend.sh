#!/usr/bin/env bash

DOMAIN=${1:-todo.example.com}
PORT=${2:-443}

ADDRESS=https://${DOMAIN}:${PORT}

echo Starting on "${ADDRESS}"
echo ""

CORS_ALLOWED_ORIGINS="${ADDRESS}"
export CORS_ALLOWED_ORIGINS

WEBAUTHN_RP_ID="${DOMAIN}"
export WEBAUTHN_RP_ID

./gradlew compileKotlin --continuous --parallel --build-cache --configuration-cache &
CONTINUOUS_PID=$!

trap 'kill $CONTINUOUS_PID 2>/dev/null; wait $CONTINUOUS_PID 2>/dev/null' EXIT

./gradlew bootRun #--args='--debug'
