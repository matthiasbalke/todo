#!/usr/bin/env zsh
set -euo pipefail

SCRIPT_DIR="${${(%):-%x}:A:h}"

# Stop only backend and frontend on exit — leave postgres running for dev
cleanup() { docker compose -f "$SCRIPT_DIR/docker-compose.yml" stop backend frontend nginx; }
trap cleanup EXIT

# ── 1. Backend ────────────────────────────────────────────────────────────────
echo "=== [1/3] Backend tests ==="
(cd "$SCRIPT_DIR/backend" && ./gradlew test)

# ── 2. Frontend ───────────────────────────────────────────────────────────────
echo "=== [2/3] Frontend tests ==="
(cd "$SCRIPT_DIR/frontend" && bun run test --run)

# ── 3. E2E ────────────────────────────────────────────────────────────────────
echo "=== [3/3] E2E tests ==="

echo "Building docker images..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" build backend frontend nginx

echo "Starting backend and frontend..."#
docker compose -f "$SCRIPT_DIR/docker-compose.yml" up -d nginx

echo "Waiting for frontend to be ready..."
timeout 120 zsh -c \
  'until curl -sf http://localhost > /dev/null; do sleep 2; done'

(cd "$SCRIPT_DIR/e2e" && BASE_URL=http://localhost bunx playwright test)
