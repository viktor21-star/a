#!/usr/bin/env bash
set -euo pipefail

cd "/home/zitomarketi/Desktop/Pecenje app/frontend"
exec /snap/bin/npm run dev -- --host 0.0.0.0
