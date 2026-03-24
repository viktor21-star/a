#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/home/zitomarketi/Desktop/Pecenje app"
DB_PATH="$ROOT_DIR/backend/Pecenje.Api/App_Data/pecenje-local.db"
BACKUP_DIR="$ROOT_DIR/backups"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <backup-file.db.gz>" >&2
  exit 1
fi

BACKUP_FILE="$1"
if [[ "$BACKUP_FILE" != /* ]]; then
  BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

mkdir -p "$(dirname "$DB_PATH")"
cp "$DB_PATH" "$DB_PATH.before-restore.$(date +%Y%m%d-%H%M%S)" 2>/dev/null || true
gunzip -c "$BACKUP_FILE" > "$DB_PATH"

echo "Database restored from: $BACKUP_FILE"
echo "Restart backend service after restore:"
echo "  systemctl --user restart pecenje-backend.service"
