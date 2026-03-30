#!/usr/bin/env bash

docker compose stop postgres
docker compose rm -f postgres
docker compose up -d postgres
