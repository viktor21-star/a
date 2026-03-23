#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/home/zitomarketi/Desktop/Pecenje app"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend/Pecenje.Api"
LAN_IP="$(hostname -I | awk '{print $1}')"

if [ -z "$LAN_IP" ]; then
  echo "Cannot determine LAN IP address."
  exit 1
fi

echo "Using LAN IP: $LAN_IP"

if fuser 8081/tcp >/dev/null 2>&1; then
  echo "Stopping existing process on port 8081..."
  fuser -k 8081/tcp || true
fi

echo "[1/2] Building frontend..."
cd "$FRONTEND_DIR"
VITE_API_BASE_URL="http://192.168.11.40:8081/api/v1" npm run build

echo "[2/2] Starting backend on http://0.0.0.0:8081 ..."
cd "$BACKEND_DIR"
/usr/bin/dotnet run --urls "http://0.0.0.0:8081"
