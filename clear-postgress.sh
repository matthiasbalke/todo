#!/usr/bin/env bash

echo "============================================"
echo "  Do you want to drop all tables and data?"
echo "============================================"
echo ""

docker compose stop postgres
docker compose rm -f postgres
docker compose up -d postgres
