#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
reuse=false
publish=false
build_args=()
release_args=()
while (($#)); do
  case "$1" in
    --from-existing) reuse=true; shift ;;
    --publish) publish=true; shift ;;
    --safari-app) release_args+=(--safari-app); shift ;;
    --help)
      echo 'Usage: bash scripts/github-release/build.sh [build.sh options] [--publish]'
      echo 'Reuse local packages: --from-existing [--safari-app] [--publish]'
      exit 0 ;;
    *) build_args+=("$1"); shift ;;
  esac
done
if $reuse; then
  ((${#build_args[@]} == 0)) || { echo 'Build options cannot be combined with --from-existing' >&2; exit 2; }
  if command -v go >/dev/null 2>&1; then go clean -cache -testcache; fi
  node scripts/package-github-release.mjs "${release_args[@]}"
else
  ((${#release_args[@]} == 0)) || { echo 'Use --safari when building, --safari-app only with --from-existing' >&2; exit 2; }
  bash build.sh "${build_args[@]}"
fi
if $publish; then
  version="$(node -p 'require("./package.json").version')"
  release_dir="releases/$version"
  # Publish exactly the files reviewed and committed, without overwriting a release.
  git ls-files --error-unmatch "$release_dir/README.md" >/dev/null
  git diff --exit-code HEAD -- "$release_dir"
  [[ -z "$(git ls-files --others --exclude-standard -- "$release_dir")" ]] || { echo 'Commit all release files before publishing' >&2; exit 1; }
  commit="$(git rev-parse HEAD)"
  remote_commit="$(gh api "repos/keman5/reopen-history/commits/$commit" --jq .sha)"
  [[ "$remote_commit" == "$commit" ]]
  gh release create "v$version" "$release_dir"/*.zip "$release_dir/SHA256SUMS.txt" \
    --repo keman5/reopen-history --target "$commit" --title "Reopen History $version" \
    --notes-file "$release_dir/README.md"
fi
