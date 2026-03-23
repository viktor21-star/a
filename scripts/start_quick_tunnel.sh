#!/usr/bin/env bash
set -euo pipefail

LOCAL_URL="http://127.0.0.1:8081"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared is not installed."
  echo "Install it first, then run this script again."
  exit 1
fi

if ! curl -fsS "$LOCAL_URL/api/v1/version-policy" >/dev/null 2>&1; then
  echo "Backend is not reachable on $LOCAL_URL."
  echo "Start the local stack first:"
  echo "bash \"/home/zitomarketi/Desktop/Pecenje app/scripts/start_local_stack.sh\""
  exit 1
fi

echo "Starting Cloudflare quick tunnel for $LOCAL_URL ..."
echo "When the public URL appears, use:"
echo "  <PUBLIC_URL>/api/v1"
echo "for the app API base."
echo

exec cloudflared tunnel --protocol http2 --url "$LOCAL_URL"
