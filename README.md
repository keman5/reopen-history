# Reopen History

A small, local-only browser extension for recovering closed tabs. Built independently, with the one-click behavior of [Reopen closed tab Button™](https://microsoftedge.microsoft.com/addons/detail/reopen-closed-tab-button%E2%84%A2/ffikmgfojmfconjpbcflembkiclgfgeo) as a reference; no original code, assets or branding are included.

[简体中文说明](docs/README.zh-CN.md) · [Privacy](PRIVACY.md) · [Verification and limitations](docs/VERIFICATION.md)

## Usage

- **Click the pinned toolbar button:** reopen the most recently closed tab or window.
- **Right-click the toolbar button → Closed tabs:** open `history.html` directly in a normal browser tab. Browsers own the native right-click menu, so selecting this item is required. Extension options can additionally enable webpage menus (off by default).
- **Inside the history page:** click the blue button to reopen the latest entry; hold it for 500 ms to reveal the list. Escape hides the history list without closing the tab. Standard Tab, Enter and Space navigation is supported, without automatically focusing controls.
- **Keyboard:** `Alt+Shift+T` reopens the latest entry; `Ctrl+Shift+Y` opens history (`⌘+Shift+Y` on macOS). Browser or OS shortcuts may take precedence; change bindings in your browser's extension shortcuts settings.

**Toolbar long press:** standard WebExtensions toolbar actions expose click events, not pointer-down/up events. A portable extension cannot distinguish a short click from a long hold on the native toolbar. The toolbar therefore keeps immediate one-click recovery; long press is implemented on the extension's own button. This tradeoff was explicitly selected for this project.

## Browser support

| Browser | Package | Recovery |
| --- | --- | --- |
| Chrome 120+, Edge 120+, Brave, Opera, Vivaldi | `~/downloads/dist/reopen-history-chromium-v1.0.1` | Native `sessions` restore, including browser-provided tab state |
| Firefox 142+ desktop | `~/downloads/dist/reopen-history-firefox-v1.0.1` | Native `sessions` restore |
| Safari 16+ on macOS 13+ | `~/downloads/dist/reopen-history-safari-v1.0.1` + generated macOS host app | Local URL recovery; see limitations below |

Chrome/Edge/Firefox show the browser's most recent 25 **sessions**. Only normal HTTP(S) pages are eligible; extension, blank, new-tab and browser-internal pages are excluded from history, badge counts and recovery. A closed window is shown as one entry only when every tab is eligible, because native restoration reopens the entire window. Mixed windows are skipped without deleting browser history. Native history is owned by the browser, may expire or disappear after restart, and is not an unlimited history archive. Safari stores the latest 100 eligible closed tabs on your device and retains them across background restarts. The Safari host app targets macOS 13 and newer.

Safari does not implement `sessions`. Its fallback begins recording after the extension is enabled, saves only normal HTTP(S) tab URLs, titles and pinned state, and excludes private/internal/file/data pages. It cannot restore form contents, scroll position, back/forward history, window grouping, or tabs closed while the extension is disabled or not running. iOS Safari and Firefox for Android are not supported by this release.

## Build and install

Requirements: Node.js 22+, `zip`, installed Microsoft Edge (headless icon rendering); Xcode for the Safari app. The extension has **no runtime dependencies**. Playwright is used only for development tests.

```sh
npm ci
bash build.sh
```

The script runs the core tests, validates every locale and produces unpacked builds plus ZIP files for all three targets. All output is written to `~/downloads/dist`. It replaces only this project's matching versioned output, preserves other projects' downloads, and clears this project's `.artifacts` and old local `dist` output; when Go is installed it also clears Go build/test caches as required by the workspace instructions.

**Chrome/Edge:** open `chrome://extensions` or `edge://extensions`, enable Developer mode, choose **Load unpacked**, and select `~/downloads/dist/reopen-history-chromium-v1.0.1` (expand `~` to your home directory). Pin the toolbar button. Other Chromium browsers use their corresponding extensions page.

**Firefox:** open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, then select `~/downloads/dist/reopen-history-firefox-v1.0.1/manifest.json` (removed on browser restart). Permanent installation requires Mozilla signing; a ZIP is not a signed XPI.

**Safari:**

```sh
bash build.sh --safari
```

This generates a macOS Swift host using Apple's converter and compiles it locally with an ad-hoc signature by default. The app is placed in `~/downloads/dist/Reopen History.app`; temporary Xcode build caches are removed after packaging. For personal development, Safari may require Developer settings → Allow unsigned extensions. To sign with your own certificate and install/replace the local host app:

```sh
SAFARI_SIGN_IDENTITY='Developer ID Application: Your Name (TEAMID)' \
SAFARI_TEAM=TEAMID bash build.sh --safari --install
```

The install option replaces `/Applications/Reopen History.app` after the new build passes signature verification; it does not enable the browser extension. Safari still requires explicit user activation. For normal distribution, sign the host and extension with your Apple Developer credentials and follow Apple's Safari distribution requirements. This project does not automatically change browser security settings or publish to any extension store.

## Development checks

```sh
npm test
npm run test:browser
npm run test:browser:safari
npm run test:firefox
```

The browser check runs installed Microsoft Edge **headlessly** in a disposable profile and serves test pages on localhost. It never touches your existing browser profile or foreground windows. It verifies actual native-session recovery, list ordering, searching, short/long press, Escape, options persistence, invalid-page filtering, and safe rendering of untrusted titles. It invokes the toolbar's shared restore function headlessly; it does not prove a physical click on the native toolbar. Use `TEST_BROWSER=chromium` to test a separately installed Playwright Chromium build. The Safari fallback check runs its scripts in headless Edge with only the background manifest adapted; it does not verify Safari itself. The Firefox check uses `web-ext` from npm, an installed `/Applications/Firefox.app`, and a disposable extension/profile with a localhost-only result reporter.

## Languages

English, 简体中文, 繁體中文, 日本語, 한국어, Deutsch, Français, Español, Português (Brasil), Italiano, Русский, العربية. The browser selects the language automatically, falls back to English, and uses right-to-left layout for Arabic. Every packaged locale must have the same complete set of keys.

## Permissions

- `sessions` (Chromium/Firefox): list and restore the browser's closed sessions.
- `contextMenus`: toolbar history menu; optional webpage recovery/history menus are disabled by default.
- `storage`: local context-menu preference; Safari also stores local history and cached tab metadata. Other builds do not persist native session history.
- `tabs`: Safari needs URLs and titles to track closed tabs; Chromium and Firefox also require this permission to display and search native session titles and URLs.

No content scripts, host permissions, remote favicons, telemetry, accounts, external libraries or network requests are used by the extension. Restoring a tab naturally loads its website. Browsing metadata is sensitive even when it stays local; see [PRIVACY.md](PRIVACY.md).

## License

MIT. This project is not affiliated with Microsoft or the author of the referenced extension.
