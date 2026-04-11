#!/usr/bin/env bash

DOMAIN=todo.example.com
PORT=

export CORS_ALLOWED_ORIGINS=https://${DOMAIN}${PORT}
export WEBAUTHN_RP_ID=${DOMAIN}

./gradlew compileKotlin --continuous --parallel --build-cache --configuration-cache &
./gradlew bootrun #--args='--debug'
