# Reproducing the submitted extension

Requirements: Node.js 22+, npm, bash and zip on macOS or Linux. No Apple account, Xcode, browser, API key or private repository access is needed for the WebExtension ZIPs.

```sh
npm ci
REVIEW_VERSION=$(node -p 'require("./package.json").version')
bash build.sh --version "$REVIEW_VERSION" --skip-icon-render
```

The explicit version disables automatic version increments. The skip flag preserves the submitted PNG assets byte for byte and avoids the optional Microsoft Edge icon renderer. Production HTML, CSS and JavaScript are copied unchanged. Generated manifests differ by browser. Output is written to `$HOME/downloads/dist/reopen-history-{chromium,firefox,safari}-v<VERSION>`, matching package.json. Compare extracted files, not ZIP timestamps. Core and localization tests run during the build. No source transpilation or minification is performed by this project.

The only runtime library is MIT-licensed `tldts` 7.4.19 (with `tldts-core` 7.4.19). The packager copies `node_modules/tldts/dist/index.umd.min.js` to `vendor/tldts.js` without modification. Its SHA-256 must match. The lockfile pins the npm dependency tarballs and integrity hashes. The review-source ZIP includes the installed libraries, readable sources, licenses and source maps in `third-party/` for inspection.

- Official release package: https://registry.npmjs.org/tldts/-/tldts-7.4.19.tgz
- Official core package: https://registry.npmjs.org/tldts-core/-/tldts-core-7.4.19.tgz
- Versioned source commit: https://github.com/remusao/tldts/tree/4ecabd1690a72c8e30dbaeb24502f7355908830b

The project does not fetch or execute remote code. Browser-facing packages contain no test reporter, localhost host permission, credentials or developer profile. Firefox declares `data_collection_permissions.required: ["none"]`: browsing records remain on the device and are never transmitted by this extension. Refer to PRIVACY.md for local storage details.

The source ZIP is for reviewers. Upload `reopen-history-firefox-<VERSION>.zip` as the actual Firefox extension, not the source ZIP. AMO's third-party-library guidance permits verification of unchanged official library distributions; include the exact npm tarball and source links in Notes for Reviewers even when uploading the full source ZIP.
