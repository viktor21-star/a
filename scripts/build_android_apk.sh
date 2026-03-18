#!/usr/bin/env bash
set -euo pipefail

FRONTEND_DIR="/home/zitomarketi/Desktop/Pecenje app/frontend"
ANDROID_DIR="$FRONTEND_DIR/android"
LOCAL_PROPERTIES_FILE="$ANDROID_DIR/local.properties"
NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
JAVA_CANDIDATES=(
  "/usr/lib/jvm/java-17-openjdk-arm64"
  "/usr/lib/jvm/java-17-openjdk-amd64"
  "/usr/lib/jvm/java-17-openjdk"
)
SDK_CANDIDATES=(
  "${ANDROID_HOME:-}"
  "${ANDROID_SDK_ROOT:-}"
  "$HOME/Android/Sdk"
  "$HOME/Android/sdk"
  "$HOME/snap/android-studio/current/android-sdk"
  "$HOME/AndroidStudio/sdk"
)

if [ -s "$NVM_DIR/nvm.sh" ]; then
  # Load the user-installed Node toolchain instead of snap binaries.
  . "$NVM_DIR/nvm.sh"
  nvm use 24 >/dev/null 2>&1 || true
fi

for candidate in "${JAVA_CANDIDATES[@]}"; do
  if [ -x "$candidate/bin/java" ]; then
    export JAVA_HOME="$candidate"
    export PATH="$JAVA_HOME/bin:$PATH"
    break
  fi
done

SDK_DIR=""
for candidate in "${SDK_CANDIDATES[@]}"; do
  if [ -n "$candidate" ] && [ -d "$candidate" ]; then
    SDK_DIR="$candidate"
    break
  fi
done

if [ -z "$SDK_DIR" ]; then
  echo "Android SDK not found. Install Android Studio SDK or export ANDROID_HOME."
  exit 1
fi

mkdir -p "$ANDROID_DIR"
cat > "$LOCAL_PROPERTIES_FILE" <<EOF
sdk.dir=$SDK_DIR
EOF

AAPT2_OVERRIDE="$SDK_DIR/build-tools/34.0.0/aapt2"
cd "$FRONTEND_DIR"

echo "==> Building web bundle for Android"
npm run mobile:sync

echo "==> Building debug APK"
cd "$ANDROID_DIR"
if [ -x "$AAPT2_OVERRIDE" ]; then
  ./gradlew -Pandroid.aapt2FromMavenOverride="$AAPT2_OVERRIDE" assembleDebug
else
  ./gradlew assembleDebug
fi

echo
echo "APK generated at:"
echo "$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
