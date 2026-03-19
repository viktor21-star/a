#!/usr/bin/env bash
set -euo pipefail

echo "Stopping local Pecenje stack on port 8081..."

PIDS="$(ss -ltnp 2>/dev/null | awk '/:8081 / {print $NF}' | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u)"

if [ -z "$PIDS" ]; then
  echo "No process is listening on port 8081."
  exit 0
fi

for PID in $PIDS; do
  echo "Stopping PID $PID"
  kill "$PID" || true
done

echo "Done."
