#!/usr/bin/env bash

DOMAIN=${1:-todo.example.com}
PORT=${2:-443}

VITE_HMR_HOST=${DOMAIN}
export VITE_HMR_HOST

VITE_HMR_CLIENT_PORT=${PORT}
export VITE_HMR_CLIENT_PORT

echo Starting on https://${VITE_HMR_HOST}:${VITE_HMR_CLIENT_PORT}
echo ""

sudo $(which bun) run dev:https
