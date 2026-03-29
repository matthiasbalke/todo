#!/usr/bin/env bash

DOMAIN=todo.example.com
PORT=

#export ORIGIN=https://${DOMAIN}${PORT}
export CORS_ALLOWED_ORIGINS=https://${DOMAIN}${PORT}
export WEBAUTHN_RP_ID=${DOMAIN}

./gradlew bootrun #--args='--debug'
