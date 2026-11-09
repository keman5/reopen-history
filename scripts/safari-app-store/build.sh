#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" == "--help" ]]; then
  echo 'Usage: SAFARI_TEAM=TEAMID SAFARI_BUILD_NUMBER=1 bash scripts/safari-app-store/build.sh /absolute/path/to/Reopen History.xcodeproj'
  exit 0
fi
project="${1:?Pass the prepared Safari .xcodeproj path}"
: "${SAFARI_TEAM:?Set the App Store Apple Developer team ID}"
build_number="${SAFARI_BUILD_NUMBER:-1}"
[[ "$build_number" =~ ^[1-9][0-9]*$ ]] || { echo 'SAFARI_BUILD_NUMBER must be a positive integer' >&2; exit 2; }
[[ -d "$project" ]] || { echo "Missing Xcode project: $project" >&2; exit 2; }
task_pid=$$
caffeinate -di -w "$task_pid" &
caffeinate_pid=$!
cd "$(dirname "$0")/../.."
version="$(node -p 'require("./package.json").version')"
output="$HOME/downloads/dist/reopen-history-safari-appstore-v$version-build$build_number"
[[ ! -e "$output" ]] || { echo "Output already exists; increase SAFARI_BUILD_NUMBER: $output" >&2; exit 2; }
mkdir -p "$output"
cleanup() {
  rm -rf -- "$output/derived" .artifacts
  kill "$caffeinate_pid" 2>/dev/null || true
}
trap cleanup EXIT
if command -v go >/dev/null 2>&1; then go clean -cache -testcache; fi
cat > "$output/ExportOptions.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>method</key><string>app-store-connect</string>
<key>destination</key><string>export</string>
<key>teamID</key><string>$SAFARI_TEAM</string>
<key>signingStyle</key><string>automatic</string>
</dict></plist>
PLIST
xcodebuild -project "$project" -scheme 'Reopen History' -configuration Release \
  -destination 'generic/platform=macOS' -derivedDataPath "$output/derived" \
  -archivePath "$output/Reopen History.xcarchive" -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$SAFARI_TEAM" CODE_SIGN_STYLE=Automatic \
  MARKETING_VERSION="$version" CURRENT_PROJECT_VERSION="$build_number" \
  MACOSX_DEPLOYMENT_TARGET=13.0 ARCHS='arm64 x86_64' ONLY_ACTIVE_ARCH=NO archive
xcodebuild -exportArchive -archivePath "$output/Reopen History.xcarchive" \
  -exportPath "$output/export" -exportOptionsPlist "$output/ExportOptions.plist" \
  -allowProvisioningUpdates
echo "Local App Store export: $output/export"
echo 'Upload the exported .pkg using Transporter. This script does not upload or submit.'
