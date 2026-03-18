#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOWNLOADS_DIR="${HOME}/Downloads"
BACKEND_DOWNLOADS_DIR="${ROOT_DIR}/backend/Pecenje.Api/wwwroot/downloads"
BACKEND_SETTINGS="${ROOT_DIR}/backend/Pecenje.Api/appsettings.json"
FRONTEND_VERSION_FILE="${ROOT_DIR}/frontend/src/lib/version.ts"
TARGET_APK="${BACKEND_DOWNLOADS_DIR}/app-debug.apk"
FORCE_UPDATE="${1:-false}"

mkdir -p "${BACKEND_DOWNLOADS_DIR}"

latest_apk="$(find "${DOWNLOADS_DIR}" -type f -name "app-debug.apk" -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n1 | cut -d' ' -f2-)"

if [[ -z "${latest_apk}" ]]; then
  latest_zip="$(find "${DOWNLOADS_DIR}" -type f -name "*.zip" -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n1 | cut -d' ' -f2-)"

  if [[ -z "${latest_zip}" ]]; then
    echo "No app-debug.apk or zip artifact was found in ${DOWNLOADS_DIR}."
    exit 1
  fi

  temp_dir="$(mktemp -d)"
  unzip -o "${latest_zip}" -d "${temp_dir}" >/dev/null
  latest_apk="$(find "${temp_dir}" -type f -name "app-debug.apk" | head -n1)"

  if [[ -z "${latest_apk}" ]]; then
    echo "The latest zip artifact does not contain app-debug.apk."
    exit 1
  fi
fi

cp "${latest_apk}" "${TARGET_APK}"

version="$(sed -n 's/^export const APP_VERSION = "\(.*\)";$/\1/p' "${FRONTEND_VERSION_FILE}")"
build="$(sed -n 's/^export const APP_BUILD = "\(.*\)";$/\1/p' "${FRONTEND_VERSION_FILE}")"
released_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

if [[ -z "${version}" || -z "${build}" ]]; then
  echo "Cannot read APP_VERSION or APP_BUILD from ${FRONTEND_VERSION_FILE}."
  exit 1
fi

python3 - <<PY
import json
from pathlib import Path

settings_path = Path(${BACKEND_SETTINGS@Q})
data = json.loads(settings_path.read_text(encoding="utf-8"))
policy = data.setdefault("AppVersioning", {})
policy["LatestVersion"] = ${version@Q}
policy["BuildNumber"] = ${build@Q}
policy["ReleasedAt"] = ${released_at@Q}
policy["ForceUpdate"] = ${FORCE_UPDATE@Q}.lower() == "true"
policy["DownloadUrl"] = "/downloads/app-debug.apk"
settings_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY

echo "Published APK:"
echo "  source: ${latest_apk}"
echo "  target: ${TARGET_APK}"
echo "  version: ${version}"
echo "  build: ${build}"
echo "  forceUpdate: ${FORCE_UPDATE}"
