#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/home/zitomarketi/Desktop/Pecenje app"
DB_PATH="$ROOT_DIR/backend/Pecenje.Api/App_Data/pecenje-local.db"
BACKUP_DIR="$ROOT_DIR/backups"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

if [[ ! -f "$DB_PATH" ]]; then
  echo "Database not found: $DB_PATH" >&2
  exit 1
fi

cp "$DB_PATH" "$BACKUP_DIR/pecenje-local-$STAMP.db"
gzip -f "$BACKUP_DIR/pecenje-local-$STAMP.db"

find "$BACKUP_DIR" -type f -name 'pecenje-local-*.db.gz' | sort | head -n -14 | xargs -r rm -f

echo "Backup created: $BACKUP_DIR/pecenje-local-$STAMP.db.gz"
