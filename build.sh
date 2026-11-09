#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
output_dir="$HOME/downloads/dist"
release_version=""
build_safari=false
install_safari=false
keep_safari_project=false
render_icons=true
while (($#)); do
  case "$1" in
    --version)
      [[ $# -ge 2 && "$2" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo 'Use --version MAJOR.MINOR.PATCH' >&2; exit 2; }
      release_version="$2"; shift 2 ;;
    --safari) build_safari=true; shift ;;
    --install) install_safari=true; shift ;;
    --keep-safari-project) keep_safari_project=true; shift ;;
    --skip-icon-render) render_icons=false; shift ;;
    --help)
      echo 'Usage: bash build.sh [--version 1.0.0] [--safari] [--install] [--keep-safari-project] [--skip-icon-render]'
      exit 0 ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done
if $install_safari || $keep_safari_project; then
  $build_safari || { echo '--install and --keep-safari-project require --safari' >&2; exit 2; }
fi
if [[ -n "$release_version" ]]; then
  npm version "$release_version" --no-git-tag-version --allow-same-version >/dev/null
else
  npm version patch --no-git-tag-version >/dev/null
fi
version="$(node -p 'require("./package.json").version')"
safari_build_dir="$output_dir/.reopen-history-safari-build"
# Clean generated output and the workspace-required Go caches.
if command -v go >/dev/null 2>&1; then go clean -cache -testcache; fi
rm -rf -- .artifacts dist
mkdir -p "$output_dir"
if $render_icons; then node scripts/render-icons.cjs; fi
node scripts/build-store-pages.mjs
node --test tests/*.test.cjs
node scripts/package-extension.mjs
node scripts/package-review-source.mjs
if $build_safari; then
  trap 'rm -rf -- "$safari_build_dir"' EXIT
  rm -rf -- "$safari_build_dir"
  xcrun safari-web-extension-converter "$output_dir/reopen-history-safari-v$version" \
    --project-location "$safari_build_dir/project" \
    --app-name 'Reopen History' --bundle-identifier io.github.keman5.Reopen-History \
    --swift --macos-only --copy-resources --no-open --no-prompt
  xcodebuild -project "$safari_build_dir/project/Reopen History/Reopen History.xcodeproj" \
    -scheme 'Reopen History' -configuration Release \
    -derivedDataPath "$safari_build_dir/derived" MACOSX_DEPLOYMENT_TARGET=13.0 \
    CONFIGURATION_BUILD_DIR="$safari_build_dir/products" \
    MARKETING_VERSION="$version" CURRENT_PROJECT_VERSION="$version" \
    CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY="${SAFARI_SIGN_IDENTITY:--}" \
    DEVELOPMENT_TEAM="${SAFARI_TEAM:-}" build
  safari_app="$safari_build_dir/products/Reopen History.app"
  codesign --verify --deep --strict "$safari_app"
  rm -rf -- "$output_dir/Reopen History.app"
  ditto "$safari_app" "$output_dir/Reopen History.app"
  ditto -c -k --sequesterRsrc --keepParent "$output_dir/Reopen History.app" "$output_dir/reopen-history-safari-macos.zip"
  if $keep_safari_project; then
    safari_project_dir="$output_dir/reopen-history-safari-xcode-v$version"
    if [[ -e "$safari_project_dir" ]]; then
      echo "Preserving existing Xcode project: $safari_project_dir"
      ditto "$output_dir/reopen-history-safari-v$version" "$safari_project_dir/Reopen History/Reopen History Extension/Resources"
    else
      ditto "$safari_build_dir/project" "$safari_project_dir"
      rm -rf -- "$safari_project_dir/Reopen History/Build"
    fi
  fi
  if $install_safari; then
    rm -rf -- '/Applications/Reopen History.app'
    ditto "$output_dir/Reopen History.app" '/Applications/Reopen History.app'
    codesign --verify --deep --strict '/Applications/Reopen History.app'
  fi
fi
checksum_files=(
  "reopen-history-chromium-$version.zip"
  "reopen-history-firefox-$version.zip"
  "reopen-history-safari-$version.zip"
  "reopen-history-review-source-$version.zip"
  "reopen-history-store-pages-$version.zip"
)
if $build_safari; then checksum_files+=(reopen-history-safari-macos.zip); fi
(
  cd "$output_dir"
  shasum -a 256 "${checksum_files[@]}" > "reopen-history-$version-SHA256SUMS.txt"
)
release_args=()
if $build_safari; then release_args+=(--safari-app); fi
node scripts/package-github-release.mjs "${release_args[@]}"
