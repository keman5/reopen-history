#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
# Clean generated output and the workspace-required Go caches.
if command -v go >/dev/null 2>&1; then go clean -cache -testcache; fi
rm -rf -- .artifacts dist
node --test tests/*.test.cjs
node scripts/package-extension.mjs
if [[ "${1:-}" == "--safari" ]]; then
  xcrun safari-web-extension-converter dist/safari --project-location dist/safari-app \
    --app-name 'Reopen History' --bundle-identifier io.github.keman5.Reopen-History \
    --swift --macos-only --copy-resources --no-open --no-prompt
  xcodebuild -project 'dist/safari-app/Reopen History/Reopen History.xcodeproj' \
    -scheme 'Reopen History' -configuration Release \
    -derivedDataPath dist/safari-derived MACOSX_DEPLOYMENT_TARGET=13.0 \
    CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY="${SAFARI_SIGN_IDENTITY:--}" \
    DEVELOPMENT_TEAM="${SAFARI_TEAM:-}" build
  ditto 'dist/safari-derived/Build/Products/Release/Reopen History.app' 'dist/Reopen History.app'
  codesign --verify --deep --strict 'dist/Reopen History.app'
  rm -rf -- dist/safari-derived
  ditto -c -k --sequesterRsrc --keepParent 'dist/Reopen History.app' dist/reopen-history-safari-macos.zip
  if [[ "${2:-}" == "--install" ]]; then
    rm -rf -- '/Applications/Reopen History.app'
    ditto 'dist/Reopen History.app' '/Applications/Reopen History.app'
    codesign --verify --deep --strict '/Applications/Reopen History.app'
  fi
fi
