# Privacy

Reopen History does not transmit tab history, titles, addresses or identifiers to the developer or any service. It has no analytics, accounts, telemetry, remote resources or content scripts. Page titles and addresses are rendered as text, never executable HTML.

All browsers keep up to 1,000 eligible closed entries in `storage.local`, including URL, title, pinned state, entry/session identifier, close time and window tab count when available. Chrome, Edge and Firefox import the browser's current closed-session list and accumulate records while active. They use native recovery for sessions still available; expired archived entries reopen the saved URL only. Chromium and Firefox request tab metadata permission to display and search session titles and addresses.

All browsers store a local boolean preference (`showContextMenu`) for optional webpage context menus, which default to off. The toolbar history menu is always available. This preference contains no browsing history and is not synced by the extension.

Safari lacks the sessions API, so it records closed HTTP(S) tabs locally and also caches currently open eligible tabs so their URLs remain available after closure. Private tabs and browser-internal, file, data and script URLs are excluded. Browser storage is not an encrypted password vault; URLs can contain sensitive query parameters. Uninstalling the extension removes its extension storage under the browser's normal data lifecycle.

Using Reopen History to reopen a tab loads its original website, subject to that website's own privacy policy. The extension does not request remote favicons or perform background network calls.

No browsing data is collected by the developer. Contact or report issues through the repository.
