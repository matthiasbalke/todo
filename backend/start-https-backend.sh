#!/usr/bin/env bash

DOMAIN=todo.example.com
PORT=

export CORS_ALLOWED_ORIGINS=https://${DOMAIN}${PORT}
export WEBAUTHN_RP_ID=${DOMAIN}

./gradlew compileKotlin --continuous --parallel --build-cache --configuration-cache &
CONTINUOUS_PID=$!

trap 'kill $CONTINUOUS_PID 2>/dev/null; wait $CONTINUOUS_PID 2>/dev/null' EXIT

./gradlew bootRun #--args='--debug'
