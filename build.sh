#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
output_dir="$HOME/downloads/dist"
version="$(node -p 'require("./package.json").version')"
safari_build_dir="$output_dir/.reopen-history-safari-build"
# Clean generated output and the workspace-required Go caches.
if command -v go >/dev/null 2>&1; then go clean -cache -testcache; fi
rm -rf -- .artifacts dist
mkdir -p "$output_dir"
node --test tests/*.test.cjs
node scripts/package-extension.mjs
if [[ "${1:-}" == "--safari" ]]; then
  trap 'rm -rf -- "$safari_build_dir"' EXIT
  rm -rf -- "$safari_build_dir"
  xcrun safari-web-extension-converter "$output_dir/reopen-history-safari-v$version" \
    --project-location "$safari_build_dir/project" \
    --app-name 'Reopen History' --bundle-identifier io.github.keman5.Reopen-History \
    --swift --macos-only --copy-resources --no-open --no-prompt
  xcodebuild -project "$safari_build_dir/project/Reopen History/Reopen History.xcodeproj" \
    -scheme 'Reopen History' -configuration Release \
    -derivedDataPath "$safari_build_dir/derived" MACOSX_DEPLOYMENT_TARGET=13.0 \
    CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY="${SAFARI_SIGN_IDENTITY:--}" \
    DEVELOPMENT_TEAM="${SAFARI_TEAM:-}" build
  safari_app="$safari_build_dir/derived/Build/Products/Release/Reopen History.app"
  codesign --verify --deep --strict "$safari_app"
  rm -rf -- "$output_dir/Reopen History.app"
  ditto "$safari_app" "$output_dir/Reopen History.app"
  ditto -c -k --sequesterRsrc --keepParent "$output_dir/Reopen History.app" "$output_dir/reopen-history-safari-macos.zip"
  if [[ "${2:-}" == "--install" ]]; then
    rm -rf -- '/Applications/Reopen History.app'
    ditto "$output_dir/Reopen History.app" '/Applications/Reopen History.app'
    codesign --verify --deep --strict '/Applications/Reopen History.app'
  fi
fi
