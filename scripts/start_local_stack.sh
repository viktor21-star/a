#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/home/zitomarketi/Desktop/Pecenje app"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend/Pecenje.Api"

echo "[1/2] Building frontend..."
cd "$FRONTEND_DIR"
npm run build

echo "[2/2] Starting backend on http://0.0.0.0:8081 ..."
cd "$BACKEND_DIR"
/usr/bin/dotnet run --urls "http://0.0.0.0:8081"
