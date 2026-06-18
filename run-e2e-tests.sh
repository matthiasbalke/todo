#!/usr/bin/env zsh

docker compose up --build -d nginx
cd e2e && bunx playwright test "$@"
docker compose stop backend backend-healthcheck frontend nginx
docker compose rm -f backend backend-healthcheck frontend nginx
