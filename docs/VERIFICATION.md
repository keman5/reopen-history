# Verification — 2026-11-08

## Implemented

- Independent Manifest V3 source with browser-specific builds for Chromium, desktop Firefox and macOS Safari.
- Toolbar single-click recovery; always-available toolbar history menu and optional webpage context menus (off by default); keyboard commands.
- Searchable history page, short/long press on its own button, Escape cancellation/collapse, keyboard navigation and dark/light/RTL layouts.
- 12 complete locales, original icons, privacy documentation and dependency-free production code.
- Safari local URL recovery, private/internal URL exclusion, serialized updates, restart persistence, stale-entry errors and failed-create data preservation.
- `build.sh` for testing/packaging, optional Safari conversion/signing/installation, and cleanup of generated build caches. Output is fixed at `~/downloads/dist`; browser directories include the project name and version, and other projects in this shared directory are preserved. No VPS build or worktree was used.

## Checked

- Node core suite: **15 tests passed**, including actual toolbar callback dispatch with mocked browser APIs, stale IDs, rapid sequential restores, private-tab exclusion, storage persistence, a 100-entry cap, failure preservation and closure during Safari worker startup, shared HTTP(S) filtering, mixed-window exclusion, default-off webpage menus, preference changes, upgrade cleanup, normal-tab history opening from the context menu/shortcut, and independence from popup APIs.
- Microsoft Edge 157.0.4341.42: extension loaded in a disposable **headless** profile; actual localhost tab closures and native-session recovery, newest-first history, search, empty results, short/long press, Escape, exact-entry recovery and safe text rendering passed. The toolbar uses the same restore implementation, invoked headlessly; no physical toolbar click was simulated.
- Safari fallback: the production Safari scripts ran in a disposable **headless Edge** profile with only the background manifest adapted to Chromium's worker format. Verified that `sessions` was unavailable and real tab events/storage drove URL recovery. Options persistence and excluded-page checks also passed in both Edge modes. This checks the fallback logic, **not Safari's actual API implementation or UI**.
- Firefox 159.0.1: the actual browser ran headlessly with a temporary extension/profile, listed a real closed localhost tab with its title and URL, restored the exact native session, and removed the restored entry from closed history. The disposable test copy alone added a localhost-only permission to report results; shipped packages contain no host permissions.
- Firefox package: Mozilla `web-ext lint` returned **0 errors, 0 warnings, 0 notices**.
- Safari host: local Xcode Release build passed, app and embedded extension signed with the locally configured Developer ID, `codesign --verify --deep --strict` passed, and the app was copied to `/Applications/Reopen History.app`. Target: macOS 13+, arm64 on this machine. Temporary Xcode build caches were removed. This is a local signed build, not a notarized distribution or App Store release.
- Rebuilt all three packages and the signed Safari host under `~/downloads/dist`; archive integrity/source checks and installed-app signature verification passed. Edge native recovery, Safari fallback in Edge, and actual headless Firefox checks all passed using the new paths.
- Locale key completeness and required package files are checked by the packager. JavaScript/shell syntax and Git whitespace checks passed.

- Headless Edge verified history opens directly at `history.html` in a normal browser window, without a `POPUP` context or forced focus. Escape collapses the list without closing its tab, and restoring an entry leaves the history page open. These checks passed in native-session and Safari-fallback modes. Physical right-click menu selection remains untested.
- Version 1.0.1 includes the Apple-style history interface, toolbar context-menu history page, options page and filtering; all three packages and the signed Safari host were rebuilt and the local host replaced.
- Implemented the selected Apple-style design: original blue tab/return icons, latest-tab card, searchable earlier list, light/dark styling, privacy footer and responsive full-page layout. Popup opening, automatic dismissal and popup-only styles have been removed. Existing independent design prototypes remain in `design-demos/`.

## Pending or deliberately limited

Firefox follow-up: removed the unsupported MV3 `background.persistent` field from the shared manifest generator. The earlier static linter did not flag this browser runtime warning; the Firefox runtime check now also asserts that the generated manifest omits it.

- Safari extension activation and recovery in actual Safari have not been performed. The installed host app still requires the user to enable its extension in Safari settings.
- No physical toolbar clicks, Chrome/Brave/Opera/Vivaldi-specific runtime sessions, Intel Mac build, iOS Safari or Android Firefox testing.
- No extension store submissions, Mozilla permanent-install signature, Apple notarization or public release upload. Build ZIPs are local install/developer artifacts.
- Native toolbar long press is unavailable through portable WebExtensions APIs. The selected behavior is immediate toolbar-click recovery plus options/shortcut history and toolbar context-menu history; long press is supported on the extension-owned page button.
- Native history is the browser's current 25 sessions; closing an eligible all-web window produces one entry that restores the whole window. Safari instead retains up to 100 normal web-tab URLs and cannot recover original page/session state or tabs closed while tracking was inactive.
