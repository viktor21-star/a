#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/home/zitomarketi/Desktop/Pecenje app"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend/Pecenje.Api"
BACKEND_LOG="/tmp/pecenje-backend.log"
LOCAL_URL="http://127.0.0.1:8081"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared is not installed."
  exit 1
fi

bash "$ROOT_DIR/scripts/stop_local_stack.sh" >/dev/null 2>&1 || true

echo "[1/3] Building frontend..."
cd "$FRONTEND_DIR"
VITE_API_BASE_URL="https://app.superpetka.com/api/v1" npm run build

echo "[2/3] Starting backend on http://0.0.0.0:8081 ..."
cd "$BACKEND_DIR"
nohup /usr/bin/dotnet run --urls "http://0.0.0.0:8081" >"$BACKEND_LOG" 2>&1 &

for _ in $(seq 1 30); do
  if curl -fsS "$LOCAL_URL/api/v1/version-policy" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS "$LOCAL_URL/api/v1/version-policy" >/dev/null 2>&1; then
  echo "Backend did not start correctly. See log: $BACKEND_LOG"
  exit 1
fi

echo "[3/3] Starting Cloudflare tunnel..."
echo "Keep this terminal open."
echo "Public URL:"
echo "  https://app.superpetka.com/"
echo

exec cloudflared tunnel --protocol http2 run pecenje-app
