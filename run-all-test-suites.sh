#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Stop only backend and frontend on exit — leave postgres running for dev
cleanup() { docker compose -f "$SCRIPT_DIR/docker-compose.yml" stop backend frontend; }
trap cleanup EXIT

# ── 1. Backend ────────────────────────────────────────────────────────────────
echo "=== [1/3] Backend tests ==="
(cd "$SCRIPT_DIR/backend" && ./gradlew test)

# ── 2. Frontend ───────────────────────────────────────────────────────────────
echo "=== [2/3] Frontend tests ==="
(cd "$SCRIPT_DIR/frontend" && bun run test)

# ── 3. E2E ────────────────────────────────────────────────────────────────────
echo "=== [3/3] E2E tests ==="

echo "Building docker images..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" build backend frontend

echo "Starting backend and frontend..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" up -d backend frontend

echo "Waiting for frontend to be ready..."
timeout 120 bash -c \
  'until curl -sf http://localhost:3000 > /dev/null; do sleep 2; done'

BASE_URL=http://localhost:3000 bunx playwright test --config "$SCRIPT_DIR/e2e/playwright.config.ts"
