# Privacy

Reopen History does not transmit tab history, titles, addresses or identifiers to the developer or any service. It has no analytics, accounts, telemetry, remote resources or content scripts. Page titles and addresses are rendered as text, never executable HTML.

Chrome, Edge and Firefox use the browser's own closed-session list; the extension does not keep an additional history database. Chromium and Firefox request tab metadata permission to display and search session titles and addresses.

All browsers store a local boolean preference (`showContextMenu`) for optional webpage context menus, which default to off. The toolbar history menu is always available. This preference contains no browsing history and is not synced by the extension.

Safari lacks the sessions API, so this build keeps up to 100 closed HTTP(S) tabs in `storage.local`, plus a local cache of currently open eligible tabs so their URLs remain available after closure. Stored fields are URL, title, pinned state, local entry identifier and close time. Private tabs and browser-internal, file, data and script URLs are excluded. Browser storage is not an encrypted password vault; URLs can contain sensitive query parameters. Uninstalling the extension removes its extension storage under the browser's normal data lifecycle.

Using Reopen History to reopen a tab loads its original website, subject to that website's own privacy policy. The extension does not request remote favicons or perform background network calls.

No browsing data is collected by the developer. Contact or report issues through the repository.
