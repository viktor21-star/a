#!/usr/bin/env bash
set -euo pipefail

echo "== user services =="
systemctl --user --no-pager --full status pecenje-backend.service pecenje-tunnel.service || true
echo

echo "== local health =="
curl -fsS http://127.0.0.1:8081/health || true
echo
echo

echo "== public health =="
curl -fsS https://app.superpetka.com/health || true
echo
echo

echo "== database file =="
ls -lh "/home/zitomarketi/Desktop/Pecenje app/backend/Pecenje.Api/App_Data/pecenje-local.db" || true
echo

echo "== recent backups =="
ls -1t "/home/zitomarketi/Desktop/Pecenje app/backups" 2>/dev/null | head || true
