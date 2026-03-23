#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/home/zitomarketi/Desktop/Pecenje app"
FRONTEND_DIR="$ROOT_DIR/frontend"

cd "$FRONTEND_DIR"
VITE_API_BASE_URL="https://app.superpetka.com/api/v1" npm run build
