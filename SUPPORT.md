# Support and FAQ / 支持与常见问题

Effective / updated: 2026-11-09

Maintainer: [keman5](https://github.com/keman5/reopen-history)

## Support and FAQ

For help, bug reports and suggestions, contact keman5 through GitHub Issues. The extension needs no account; posting on GitHub requires a GitHub account. Support requests are never sent automatically by the extension.

### Report a problem

Search existing issues first. Include browser and OS versions, extension version, installation source, steps to reproduce, expected behavior and actual behavior. If needed, attach screenshots with personal information removed. Do not upload browsing archives, private URLs, passwords, tokens or other sensitive information to public issues.

This is a community-maintained project with no guaranteed response time.

[Existing issues](https://github.com/keman5/reopen-history/issues) · [Report a bug or suggestion](https://github.com/keman5/reopen-history/issues/new)

### How do I reopen a closed tab?

Pin the extension to your toolbar, open and close an ordinary HTTP/HTTPS page, then click the toolbar action to reopen the latest eligible entry. The browser’s native toolbar action supports a single click, not a long press.

### How do I search the full list?

Right-click the toolbar action and choose Closed tabs. Search by title or hostname, then choose an entry to reopen it. Holding the extension’s own Reopen button on its history page for about 500ms shows the list. Escape collapses the list without closing the page. Pages show up to 100 entries.

### Why are entries missing or unavailable?

New-tab, blank, browser-internal, extension and browser-identified private pages are excluded. Up to 1,000 eligible entries are retained. Browsers expose only a limited recent-session list; complete history from before installation cannot be imported. Test with a normal webpage that has finished loading.

Chrome/Edge/Firefox use native restoration while the session is available. Expired archived entries reopen their URL only; an archived window falls back to its first tab URL. Windows containing excluded tabs are skipped to avoid reopening pages that should be filtered.

### Why does Safari only reopen a URL?

Enable the extension in Safari > Settings > Extensions on macOS to start tracking eligible tabs. Safari has no sessions API, so restoration only opens saved URLs, without form contents, scroll position, navigation history or complete window layouts. Pages closed while the extension is not running cannot be recovered. This release does not support iPhone/iPad Safari.

### Settings and keyboard shortcuts

Settings lets you follow the browser language or choose one of 12 bundled languages, set a minimum text size of 13–20px, and toggle optional webpage menus. Preferences save automatically on your device.

The defaults are Alt+Shift+T to reopen the latest entry and Ctrl+Shift+Y to open history (Command+Shift+Y on macOS). Change conflicting bindings in the browser’s extension shortcut settings; Safari handling depends on its shortcut support. Tab, Enter and Space navigation are supported, without forced initial focus.

### Why is the Firefox ZIP not a permanent installation?

Local ZIPs and about:debugging temporary loading are for development. Temporary extensions are removed when Firefox restarts. Normal Firefox permanent installation needs Mozilla signing; use the signed AMO version after publication. Development ZIPs are not advertised as signed store releases.

### How do I stop recording and clear local data?

Disable the extension in your browser to stop future recording. Remove the extension or use the browser’s data-clearing controls to clear extension data; for Safari, follow its extension removal instructions. Cleanup timing is controlled by the browser and operating system. There is no server account or cloud copy maintained by this extension.

The browser’s own history and the extension archive are separate. Clearing one does not necessarily clear the other.

[Read the privacy policy](PRIVACY.md)

### Supported browsers and site icons

Supported targets are Chrome/Edge 120+, desktop Firefox 142+, and Safari 16+ on macOS 13+. Other Chromium browsers require their own compatibility check.

Icons come only from the browser’s local cache or available inline images. A colored domain initial is the expected fallback when no icon is available. No remote favicon service is used.

## 支持与常见问题

需要帮助或想反馈问题？请通过 GitHub Issues 联系 keman5。扩展无需账号；在 GitHub 发布问题需要 GitHub 账号。支持请求不会由扩展自动发送。

### 反馈问题

请先搜索已有问题。新建问题时提供浏览器和系统版本、扩展版本、安装来源、重现步骤、预期与实际结果。必要时附上已经遮盖个人信息的截图；不要上传完整浏览记录或私人 URL。公开 Issues 不适合发送密码、令牌或隐私材料。

这是社区维护项目，不承诺固定回复时间。

[查看已有问题](https://github.com/keman5/reopen-history/issues) · [新建问题或建议](https://github.com/keman5/reopen-history/issues/new)

### 如何恢复关闭的标签页？

安装后将扩展固定到浏览器工具栏。打开一个普通 HTTP/HTTPS 页面并关闭，再点击扩展按钮即可恢复最近一条合格记录。工具栏原生按钮仅支持单击，不支持长按。右键菜单仅额外提供“关闭历史”，不添加恢复菜单项；顶部原生名称项由浏览器控制，扩展不指定主页覆盖，让商店安装版本使用对应商店入口，本地加载版本可能显示为灰色。

### 如何打开完整历史和搜索？

右键工具栏的扩展按钮，选择“关闭历史”菜单项；在历史页搜索标题或域名，再选择条目恢复。历史页自己的“重新打开”按钮按住约 500ms 可显示列表，Escape 会收起列表并保留页面。每页最多 100 条。

### 为什么列表为空或有些页面不能恢复？

新标签页、空白页、浏览器内部页面、扩展页和浏览器标记为私密的页面不会记录。最多保留 1,000 条合格记录。浏览器可导入的原生最近关闭会话有限，安装前更早的完整历史无法回填。先关闭一个加载完成的普通网页测试。

Chrome/Edge/Firefox 仍有原生会话时可完整恢复；过期归档仅重新打开网址，窗口归档退化为首个标签网址。混有不合格标签的窗口会被跳过，避免恢复本应排除的页面。

### Safari 为什么只能打开网址？

在 macOS Safari → 设置 → 扩展中启用后，扩展才开始追踪合格标签。Safari 没有 sessions API，因此仅重新打开已保存的网址，不恢复表单、滚动位置、前进后退历史或完整窗口布局，也不能恢复扩展未运行期间关闭的页面。当前没有 iPhone/iPad Safari 版本。

### 设置和快捷键

设置页可以选择跟随浏览器或手动选择 12 种语言、调整 13–20px 最小字号、开启或关闭网页右键菜单。设置会自动在本机保存。

默认 Alt+Shift+T 恢复最近记录；Ctrl+Shift+Y 打开历史，macOS 使用 Command+Shift+Y。若与系统或其他扩展冲突，请在浏览器的扩展快捷键页面调整；Safari 是否接收这些组合由其快捷键支持决定。页面支持 Tab、Enter、空格导航，不主动抢焦点。

### Firefox ZIP 为什么不能永久安装？

本地 ZIP 和 about:debugging 临时加载适合开发，临时扩展会在浏览器重启后移除。普通 Firefox 的永久安装需要 Mozilla 签名，应使用 AMO 发布后提供的签名版本。项目没有把开发 ZIP 描述为已签名商店版本。

### 如何停用和清理本地数据？

在浏览器扩展管理页面停用可停止后续记录。移除扩展或使用浏览器的数据清除功能来清理扩展数据；Safari 请遵循扩展设置中的移除说明。清理时机受浏览器和系统控制。扩展没有服务器端账号或可供删除的云端副本。

浏览器自身的历史记录与扩展归档是不同的数据。清理其中之一不保证清理另一项。

[阅读完整隐私政策](PRIVACY.md)

### 支持范围与网站图标

支持 Chrome/Edge 120+、桌面 Firefox 142+ 和 macOS 13+ 的 Safari 16+；其他 Chromium 浏览器需要自行确认兼容性。

网站图标只使用浏览器本地缓存或已提供的内嵌图像；无法使用时显示彩色域名首字母。这是隐私保护下的正常回退，不使用远程图标服务。
