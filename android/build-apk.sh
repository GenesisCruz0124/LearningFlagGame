#!/usr/bin/env bash
# Build a debug APK. The version auto-increments (see app/build.gradle +
# version.properties). The output is copied to the repo root as both a
# version-stamped file and a stable FlagQuest-latest.apk.
set -e
cd "$(dirname "$0")"

./gradlew assembleDebug

VN=$(grep VERSION_NAME version.properties | cut -d= -f2 | tr -d ' \r')
SRC=app/build/outputs/apk/debug/app-debug.apk
cp "$SRC" "../FlagQuest-${VN}.apk"
cp "$SRC" "../FlagQuest-latest.apk"
echo "Built FlagQuest-${VN}.apk (and FlagQuest-latest.apk)"
