#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/home/zitomarketi/Desktop/Pecenje app"
TARGET_DIR="$HOME/.config/systemd/user"

mkdir -p "$TARGET_DIR"
cp "$ROOT_DIR/scripts/systemd/pecenje-backend.service" "$TARGET_DIR/pecenje-backend.service"
cp "$ROOT_DIR/scripts/systemd/pecenje-tunnel.service" "$TARGET_DIR/pecenje-tunnel.service"

systemctl --user daemon-reload
systemctl --user enable pecenje-backend.service pecenje-tunnel.service

echo "Installed user services:"
echo "  pecenje-backend.service"
echo "  pecenje-tunnel.service"
echo
echo "Environment:"
echo "  ASPNETCORE_ENVIRONMENT=Production"
echo
echo "Start them with:"
echo "  systemctl --user start pecenje-backend.service pecenje-tunnel.service"
