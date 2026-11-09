# Verification — 2026-11-08

## 2026-11-09 manual interface language selection (1.0.1)

- Added a Settings language selector: Follow browser or any of the 12 bundled languages, saved locally. Open history/settings pages, dates, context menus and toolbar tooltips update without reloading or forced focus. Browser-owned extension names and command descriptions continue to follow the browser language.
- Shared localization loads only packaged JSON files, falls back to English, handles Chinese language/region variants, and rejects stale asynchronous loads when selections change quickly. Arabic uses RTL layout. Search, page selection and closed-tab data are preserved.
- Core/localization tests: 24 passed. Headless Edge native and Safari-fallback checks passed, including language persistence, English/Japanese/Arabic switching, cross-page updates, localized dates/action tooltip, focus retention, RTL narrow layout, and the existing recovery/font-size checks. Actual headless Firefox native recovery passed. Mozilla web-ext lint: 0 errors, 0 warnings, 0 notices.
- Browser packages and the signed local Safari app were built at 1.0.1; the local app was replaced and the versioned Safari Xcode project retained. Actual Safari language UI/activation remains unverified. No store upload or review submission was performed.

## Implemented

- Independent Manifest V3 source with browser-specific builds for Chromium, desktop Firefox and macOS Safari.
- Toolbar single-click recovery; always-available toolbar history menu and optional webpage context menus (off by default); keyboard commands.
- Searchable history page, short/long press on its own button, Escape cancellation/collapse, keyboard navigation and dark/light/RTL layouts.
- 12 complete locales, original icons, privacy documentation and dependency-free production code.
- Safari local URL recovery, private/internal URL exclusion, serialized updates, restart persistence, stale-entry errors and failed-create data preservation.
- `build.sh` for testing/packaging, optional Safari conversion/signing/installation, and cleanup of generated build caches. Output is fixed at `~/downloads/dist`; browser directories include the project name and version, and other projects in this shared directory are preserved. No VPS build or worktree was used.

## Checked

- Node core suite: **17 tests passed**, including actual toolbar callback dispatch with mocked browser APIs, stale IDs, rapid sequential restores, private-tab exclusion, storage persistence, a 1,000-entry cap, failure preservation and closure during Safari worker startup, shared HTTP(S) filtering, mixed-window exclusion, default-off webpage menus, preference changes, upgrade cleanup, normal-tab history opening from the context menu/shortcut, and independence from popup APIs.
- Unified-list checks passed in both headless Edge modes with 205 archived entries: 100/100/5 pagination, previous/next limits, newest-only badge, no page heading, full-history search resetting to page one, and page clamping after records shrink. Core checks also cover accumulation beyond 25 native sessions, deduplication, restart persistence and failed URL recovery without data loss.
- Microsoft Edge 157.0.4341.42: extension loaded in a disposable **headless** profile; actual localhost tab closures and native-session recovery, newest-first history, search, empty results, short/long press, Escape, exact-entry recovery and safe text rendering passed. The toolbar uses the same restore implementation, invoked headlessly; no physical toolbar click was simulated.
- Safari fallback: the production Safari scripts ran in a disposable **headless Edge** profile with only the background manifest adapted to Chromium's worker format. Verified that `sessions` was unavailable and real tab events/storage drove URL recovery. Options persistence and excluded-page checks also passed in both Edge modes. This checks the fallback logic, **not Safari's actual API implementation or UI**.
- Firefox 159.0.1: the actual browser ran headlessly with a temporary extension/profile, listed a real closed localhost tab with its title and URL, restored the exact native session, and removed the restored entry from closed history. The disposable test copy alone added a localhost-only permission to report results; shipped packages contain no host permissions.
- Firefox package: Mozilla `web-ext lint` returned **0 errors, 0 warnings, 0 notices**.
- Safari host: local Xcode Release build passed, app and embedded extension signed with the locally configured Developer ID, `codesign --verify --deep --strict` passed, and the app was copied to `/Applications/Reopen History.app`. Target: macOS 13+, arm64 on this machine. Temporary Xcode build caches were removed. This is a local signed build, not a notarized distribution or App Store release.
- Rebuilt all three packages and the signed Safari host under `~/downloads/dist`; archive integrity/source checks and installed-app signature verification passed. Edge native recovery, Safari fallback in Edge, and actual headless Firefox checks all passed using the new paths.
- Locale key completeness and required package files are checked by the packager. JavaScript/shell syntax and Git whitespace checks passed.

- Headless Edge verified history opens directly at `history.html` in a normal browser window, without a `POPUP` context or forced focus. Escape collapses the list without closing its tab, and restoring an entry leaves the history page open. These checks passed in native-session and Safari-fallback modes. Physical right-click menu selection remains untested.
- Version 1.0.1 includes the Apple-style history interface, toolbar context-menu history page, options page and filtering; all three packages and the signed Safari host were rebuilt and the local host replaced.
- Implemented the selected Apple-style design: orange folder/return icon and a matching orange interface theme, unified searchable list with a newest-entry badge and 100-entry pagination, light/dark styling, privacy footer and responsive full-page layout. Popup opening, automatic dismissal and popup-only styles have been removed. Existing independent design prototypes remain in `design-demos/`.

## Pending or deliberately limited

Firefox follow-up: removed the unsupported MV3 `background.persistent` field from the shared manifest generator. The earlier static linter did not flag this browser runtime warning; the Firefox runtime check now also asserts that the generated manifest omits it.

- Safari extension activation and recovery in actual Safari have not been performed. The installed host app still requires the user to enable its extension in Safari settings.
- No physical toolbar clicks, Chrome/Brave/Opera/Vivaldi-specific runtime sessions, Intel Mac build, iOS Safari or Android Firefox testing.
- No extension store submissions, Mozilla permanent-install signature, Apple notarization or public release upload. Build ZIPs are local install/developer artifacts.
- Native toolbar long press is unavailable through portable WebExtensions APIs. The selected behavior is immediate toolbar-click recovery plus options/shortcut history and toolbar context-menu history; long press is supported on the extension-owned page button.
- All browsers retain up to 1,000 local entries. Native browsers initially import at most 25 available sessions, then accumulate closures while active; missing older sessions cannot be backfilled. Available all-web window sessions restore the whole window; expired archived entries reopen only their saved URL (the first tab for windows). Safari cannot recover original page/session state or tabs closed while tracking was inactive.


## Site icons — 2026-11-09

- Added registrable-domain initials and eight deterministic color choices using the locally bundled MIT-licensed `tldts` suffix parser.
- Chromium uses the browser-local favicon cache with `favicon` permission; small inline raster images from native-session/Safari metadata are preserved in local history. No remote icon fetches or third-party favicon service.
- Core suite: 19 tests passed, including public/private suffix handling, stable colors, invalid URLs, icon size/type limits and session icon retention.
- Headless Edge checks passed for both native and Safari fallback builds: real inline raster image display, load-error letter fallback, deterministic color class and exclusion of remote icon URLs. Existing recovery, search and pagination checks also passed.
- Rebuilt all browser packages and signed/installed the Safari host through `build.sh` into `~/downloads/dist`. Actual Safari icon rendering remains unverified.

## 2026-11-09 compact history chrome and toolbar icon

- Reduced history-page header, footer and outer spacing; removed the reopen button help tooltip while retaining its visible action text and accessible name.
- Removed the toolbar count badge and clear any badge retained by an older version on background startup. History storage and synchronization remain active.
- All manifests reference the existing `icons/icon128.png` directly for the toolbar. Builds no longer redraw source PNG icons; the supplied icon SHA-256 remained `66465a656d118643331721bb4d6e9046eaa8392ce716084e72b80ea98d29ef85`.
- All packages rebuilt under `~/downloads/dist`; Safari host signed, verified and replaced locally. Core suite: 19 passed. Headless Edge checks passed in native and Safari-fallback modes, including header/footer dimensions, absent tooltip, empty badge and manifest icon path. Actual Safari activation/UI remains untested.

## 2026-11-09 localized extension name

- Added `appName` in all 12 locales. Simplified Chinese is `恢复已关闭标签`; Traditional Chinese is `恢復已關閉標籤`; English retains `Reopen History`.
- Localized the manifest name, history/options brand labels and document titles. Safari host app filename and bundle identifiers remain stable.
- Rebuilt all browser packages and signed/replaced the Safari host. Core tests: 19 passed. Headless Edge native/fallback checks passed, including localized manifest/brand/title and options branding. Locale key completeness checks passed. Actual Safari UI and every individual language setting were not tested.
