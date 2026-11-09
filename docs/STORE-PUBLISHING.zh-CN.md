# Reopen History 1.0 上架指南

核对日期：2026-11-09。发布包版本统一为 **1.0.0**，商店展示可称“1.0”。本指南只准备与说明上架；没有创建商店记录、支付费用、上传或提交审核。

## 一、这次应该用哪个文件

所有产物在 `~/downloads/dist`，Finder 用“前往 → 前往文件夹”进入。

| 平台 | 上传内容 | 说明 |
| --- | --- | --- |
| Firefox / AMO | `reopen-history-firefox-1.0.0.zip` | AMO 审核、签名后可供普通用户安装；本地 ZIP 本身没有 Mozilla 签名 |
| Chrome Web Store | `reopen-history-chromium-1.0.0.zip` | ZIP 根目录已经包含 manifest.json，不要再套一层文件夹 |
| Microsoft Edge Add-ons | 同一个 Chromium ZIP | Chrome、Edge 分别注册、分别审核；可共用此包 |
| Safari，本地 Xcode 路线 | `reopen-history-safari-xcode-v1.0.0/Reopen History/Reopen History.xcodeproj` | 先配置团队与商店签名，再本地 archive/export，最后上传导出的 PKG |
| Safari，可选 Apple 在线打包路线 | `reopen-history-safari-1.0.0.zip` | 上传到 App Store Connect 的 Safari Web Extension Packager，由 Apple 云端打包 |
| Mozilla 审核源码 | `reopen-history-review-source-1.0.0.zip` | 源码补充材料，不能当扩展安装包上传 |
| Safari 本地试用 | `Reopen History.app` / `reopen-history-safari-macos.zip` | 本次本地签名应用不是 Mac App Store 上传包 |

重现本次本地构建：

```sh
npm ci
bash build.sh --version 1.0.0 --safari --install --keep-safari-project
```

不传 `--version` 时仍自动递增补丁版本。第一次公开发布可以使用 1.0.0；如果某商店已经发布过更大的版本，必须为该商店准备更大的更新版本，不能靠降低版本号覆盖旧版。不要在已发布后反复修改相同版本的文件。

## 二、先准备这些共用资料

1. 商店名称：中文“恢复已关闭标签”，英文“Reopen History”。建议先填写简体中文、英文两个商店语言。扩展内的 12 种语言不代表商店文案会自动翻译。
2. 一个真实、经常查看的支持邮箱。不要用虚构邮箱提交。Apple 审核联系资料也需真实。
3. 公开的 HTTPS 隐私政策页面和支持页面，必须在退出登录的浏览器里也能访问。仓库现已公开，支持入口使用 GitHub Issues。中英文页面已在 docs/privacy.html、docs/support.html 生成，根目录 PRIVACY.md、SUPPORT.md 为同源文档。发布静态页面和填写商店链接的方法见 STORE-LISTING.md；尚未部署的 Pages 地址不能当作已上线地址。
4. 本次隐私政策已包括维护者 keman5、2026-11-09 生效日期、GitHub Issues 联系入口、本地数据类别、保存与清理方式和 Safari 限制。内容源为 store/content.mjs，构建时同时生成网页、扩展内离线页面及 Markdown，避免版本漂移。不要写成“完全不访问浏览数据”。
5. 图标可用 `extension/icons/icon128.png` 与 `icon512.png`。Edge 推荐 300×300 的商店 logo，可用现有大图另存对应尺寸；浏览器包内现有尺寸不受影响。
6. 准备 2–4 张没有个人浏览记录的真实截图：历史列表、搜索结果、设置页，可加深色模式。Chrome/Edge 共用 **1280×800** 最方便。Chrome 还准备 **440×280** 小推广图，1400×560 大推广图按需；Edge logo 推荐 300×300，截图可用 1280×800 或 640×480。各后台最终要求以当前表单为准。Firefox 的截图单独上传到 Preview/截图区域。Mac App Store 截图应来自真实 Safari/Mac 界面，尺寸从 Apple 的 Mac 截图规格中选择，不用 Edge 截图冒充 Safari。
7. 首发说明：版本 1.0.0；免费、无需账号、无内购（若计划收费，先调整对应商店资料）。本项目许可证 MIT。

官方图片规格：[Chrome](https://developer.chrome.com/docs/webstore/images)、[Edge 发布表单](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)、[Apple 截图规格](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)。

## 三、可以直接复用的商店文案

### 简介

中文：一键恢复已关闭标签页，快速搜索最近记录，数据仅保存在本机。

English: Reopen closed tabs in one click. Search recent history, with data kept on your device.

### 中文详细介绍

> 不小心关闭了标签页？点击工具栏按钮，即可重新打开最近关闭的标签页。
>
> • 一键恢复最近关闭的标签页或符合条件的窗口。
> • 在历史页面搜索标题与网址，最多保存 1,000 条本地记录，每页显示 100 条。
> • 支持键盘操作、浅色与深色界面，以及多种语言。
> • 可选网页右键菜单，默认关闭。
> • 无需账号，不含广告、遥测或远程代码，不向开发者上传浏览记录。
>
> 仅记录符合条件的 HTTP/HTTPS 页面。安装前的完整浏览历史无法回填。浏览器仍保留的会话可原生恢复，过期记录只重新打开已保存的网址。

Safari 文案把最后一段替换为：

> Safari 版从启用后开始在本地记录关闭的普通 HTTP/HTTPS 标签页。恢复时重新打开保存的网址，不能恢复表单、滚动位置、前进后退历史或完整窗口布局，也不能恢复扩展未运行期间关闭的页面。当前仅支持 macOS Safari，不宣称支持 iPhone/iPad。

### 英文详细介绍

> Reopen recently closed tabs in one click, or search your locally saved closed-tab list by title and URL. Keep up to 1,000 eligible entries with 100 entries per page. Includes keyboard navigation, light and dark themes, multiple languages, and optional webpage context menus.
>
> No account, ads, analytics or remotely hosted code. Browsing records stay on your device and are not sent to the developer. Only eligible HTTP(S) pages are included. Browser-provided sessions are restored when available; expired archived entries reopen their saved URL only. Older history from before installation cannot be fully imported.

### 单一用途 / Single purpose

> Help the user reopen recently closed browser tabs and find entries in a local, searchable closed-tab history.

### 权限理由：Chrome、Edge 可逐项粘贴

| 权限 | 英文解释 |
| --- | --- |
| sessions | Lists recently closed browser sessions and restores the session selected by the user, including one-click recovery of the latest eligible session. |
| tabs | Reads tab titles and URLs to display and search closed-tab entries. The Safari version also tracks eligible open tabs locally so their URLs remain available after closure. |
| storage | Stores extension preferences and up to 1,000 closed-tab records locally. No extension data is synchronized or uploaded by this extension. |
| contextMenus | Adds the toolbar history menu and optional webpage recovery/history menu items controlled by the user. Webpage menu items are disabled by default. |
| favicon | Displays site icons from the browser's local favicon cache in the history list. No third-party favicon service is contacted. |

没有 `<all_urls>`、内容脚本、网页内容读取或远程代码权限。`tabs` 权限与是否有 host_permissions 是两回事，不要因为没有 host_permissions 就写成“不访问网址”。

## 四、Firefox：AMO 上架

入口：[AMO 新扩展提交](https://addons.mozilla.org/developers/addon/submit/)。Mozilla AMO 常规提交不收取开发者注册费。

1. 登录或创建 Mozilla 账号，进入开发者中心，接受开发者协议；完成页面要求的账号验证。
2. 选 **On this site / 在此网站发布**，这样才会出现在 addons.mozilla.org。**On your own** 是自分发签名，不等于公开商店上架。
3. 上传 `reopen-history-firefox-1.0.0.zip`，等待自动校验；有错误先修复，有警告逐条确认。
4. 平台只选择桌面 Firefox 支持的 Windows、macOS、Linux，**不要选择 Android**。包里的最低 Firefox 版本是 142；固定扩展 ID 为 `reopen-history@keman5.github.io`，后续更新保持此 ID。
5. 源码步骤可以上传 `reopen-history-review-source-1.0.0.zip`，其中有 `docs/REVIEW-BUILD.md` 的重建说明。项目自有代码未压缩；依赖 tldts 是官方压缩包，仍须在审核备注提供版本与原始下载链接，不要声称项目完全不含第三方压缩代码。
6. 填名称、简介、详细介绍、类别（例如 Tabs）、许可证 MIT、支持邮箱/网站、隐私政策。免费且没有支付依赖时不用勾“需要付款”等选项。添加图标、截图。
7. 数据声明：当前没有向外传输个人数据，manifest 已声明 `data_collection_permissions.required: ["none"]`；政策仍清楚说明本地保存标题、URL 等。若以后增加统计/同步，必须重新评估声明。
8. Notes for Reviewers 粘贴后文审核说明及第三方依赖来源。无需登录测试账号。
9. 提交版本，关注 AMO 页面与邮件，及时回答审核问题。通过后安装 AMO 提供的签名版本验证，不要拿本地临时加载当成商店安装验证。

第三方依赖备注：

```text
The only bundled runtime library is the unmodified official tldts 7.4.19 UMD distribution.
Original package: https://registry.npmjs.org/tldts/-/tldts-7.4.19.tgz
Core package: https://registry.npmjs.org/tldts-core/-/tldts-core-7.4.19.tgz
Versioned readable source: https://github.com/remusao/tldts/tree/4ecabd1690a72c8e30dbaeb24502f7355908830b
vendor/tldts.js is copied byte-for-byte from dist/index.umd.min.js.
Readable dependency sources, maps and licenses are included in the reviewer-source ZIP.
See docs/REVIEW-BUILD.md for exact reproduction instructions.
```

官方流程：[提交扩展](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)、[源码要求](https://extensionworkshop.com/documentation/publish/source-code-submission/)、[第三方库要求](https://extensionworkshop.com/documentation/publish/third-party-library-usage/)。

## 五、Chrome：Chrome Web Store 上架

入口：[Chrome 开发者后台](https://chrome.google.com/webstore/devconsole)。需要 Google 账号和一次性开发者注册费；通常为 US$5，实际币种、税费及支付金额以注册页面为准。完成两步验证、联系邮箱/身份信息等后台要求。

1. 注册开发者，确认开发者显示名称、可收信邮箱；按账户页面要求完成联系验证。
2. **Add new item / 新增项目**，上传 `reopen-history-chromium-1.0.0.zip`。
3. **Store listing**：填写中文/英文介绍、合适类别、图标、真实截图、小推广图、支持入口及主页。不要写“官方推荐”“排名第一”等未经证实的宣传。
4. **Privacy practices**：填上面的单一用途及各权限理由；远程代码选择 **No**。依赖已经打包在 ZIP 内，不是远程代码。
5. **Data usage**：本扩展在本地读取、保存网页标题和 URL，按字段实际定义披露 **Web history / 浏览记录**；如果表单区分“仅本地处理”与“传出设备收集”，分别照实填写，并在用途说明中注明本地存储、无上传。不能仅因为没有服务器就把本地浏览记录处理也隐瞒。不要勾选实际上未处理的页面正文、密码、财务、支付、定位或健康数据。
6. 填公开隐私政策 URL，阅读并确认没有出售、无广告使用、用途受限等声明均与实际行为一致。
7. **Distribution**：选择 Public、地区和免费分发。按现行规则填写 trader/身份等附加问题，无法确定的身份问题据真实情况填，不机械照抄。
8. **Test instructions**：填后文审核说明，无账号、无凭据。
9. **Submit for review**；想控制上线时间可选择审核后手动发布。提交后关注后台和开发者邮箱，不保证固定审核时长。
10. 发布后从商店安装一次，验证权限提示、右键历史菜单、恢复与设置；以后在同一个 item 上传更高版本，保留商店 item ID。

Google 明确要求即使仅在本地处理/保存也披露数据处理：[User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)。其余：[注册](https://developer.chrome.com/docs/webstore/register)、[上传与提交](https://developer.chrome.com/docs/webstore/publish)、[隐私字段](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)。

## 六、Edge：Microsoft Edge Add-ons 上架

入口：[Microsoft Partner Center](https://partner.microsoft.com/dashboard)。要注册的是 **Microsoft Edge 扩展开发者计划**，不是 Windows 应用的收费计划。Edge 扩展注册/提交没有注册费，个人可用真实个人资料注册，机构按实际情况提供验证资料。

1. 用 Microsoft 账号创建 Partner Center 开发者账户，加入 Microsoft Edge 计划，完成资料验证。
2. 进入 Edge 扩展工作区，选择 **Create new extension**。
3. **Packages** 上传同一个 `reopen-history-chromium-1.0.0.zip`；无需自己打 CRX，也不用复制 Chrome 商店的扩展 ID。
4. **Availability**：设 Public 和目标市场。
5. **Properties / Privacy**：选择类别，填单一用途、权限理由、远程代码 No、真实的数据处理声明和公开隐私政策。注意当前 Edge 也有单独的隐私字段，不是只填一个链接。
6. **Store listings**：先完善一种语言，再补英文/中文。上传 logo、截图、详细文案和支持链接；可以用 Duplicate 复制共用素材，但文字翻译仍要核对。
7. **Certification notes**：填审核测试步骤，说明无登录、可通过打开并关闭普通网页产生测试记录。
8. 检查全部表单后点 **Publish / 提交认证**，等待认证与邮件。通过后用 Edge 商店版本验证，今后在同一记录更新。

官方：[开发者账户](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/create-dev-account)、[完整提交流程](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)。

## 七、Safari：按本地构建路线发布 Mac App Store

Safari 上架的是包含 Safari Web Extension 的 **macOS 应用**。当前仅验证 macOS 的实现，不勾 iOS/iPadOS 平台。需要 Apple Developer Program（标准年费 US$99 或当地币种），具有对应团队权限的 App Store Connect 账号，并完成 Apple 所要求的协议/联系资料。

本次构建只是本地签名安装。Developer ID 用于商店外分发，不等于 Mac App Store 分发签名；本机存在 Developer ID 证书也不能证明 App Store 签名/配置已就绪。

### A. 先在真实 Safari 里验收

1. 打开 `/Applications/Reopen History.app`，再到 Safari → 设置 → 扩展，启用扩展。
2. 新开普通 HTTP/HTTPS 标签页，等加载完成后关闭；点击工具栏按钮确认重新打开网址。
3. 检查右键菜单进入历史页、搜索、Escape、设置、Safari 重启后保存的记录。
4. 检查私密浏览和不支持页面不会进入记录；测试时不要保留个人敏感页面截图。
5. Safari 使用本地 URL 恢复，不是 sessions 原生会话还原。本次自动测试在 Edge 模拟 Safari fallback，**不替代真实 Safari 验收**。上架前这一项必须人工完成。

### B. 准备 Apple 记录和本地 Xcode 工程

1. 在 Apple Developer 的 Certificates, Identifiers & Profiles 检查/注册应用 Bundle ID，默认 `io.github.keman5.Reopen-History`，以及实际生成工程里扩展 target 的 Bundle ID。它们必须属于最终上架团队；如未占用可以保留，不要在后续版本随意改 ID。
2. 打开输出目录里的 `.xcodeproj`。Xcode → Settings → Accounts 登录对应开发者账号。
3. 在应用、扩展两个 target 的 **Signing & Capabilities** 都选同一个正确的 Team，启用 Automatically manage signing。当前实际生成的扩展 Bundle ID 是 `io.github.keman5.Reopen-History.Extension`，两个 target 已配置 App Sandbox。核对实际需要的能力，不要添加不需要的权限。
4. 核对本地工程的资源、AppIcon 和版本。营销版本为 1.0.0，首次商店构建号可用 1；再次上传同营销版本时用 2、3 等递增。生成工程已经包含 16px 到 1024px 的 Mac AppIcon 资源，但应在 Xcode 确认内容为最终图标，再执行商店验证；不能仅凭有文件就宣称通过商店校验。若验证提示图标/隐私清单等问题，按实际错误补齐后重建。
5. 在 App Store Connect → Apps → + → New App，平台只选 macOS，填名称、主要语言、同一个 Bundle ID、自己定义的唯一 SKU（例如 `reopen-history-macos`）。App Store 版本可建为 1.0.0。

### C. 通过脚本在本地 archive / export

已经提供 `scripts/safari-app-store/build.sh`。先保存 Xcode 签名和资源修改，再运行：

```sh
SAFARI_TEAM=你的团队ID SAFARI_BUILD_NUMBER=1 \
bash scripts/safari-app-store/build.sh \
  "$HOME/downloads/dist/reopen-history-safari-xcode-v1.0.0/Reopen History/Reopen History.xcodeproj"
```

脚本本地构建 arm64 + x86_64，archive 并按 `app-store-connect` 方式导出，不上传、不提交审核，清理 derived/.artifacts 缓存。它需要有效的 Apple 账户、正确团队、自动签名权限、App Store 分发证书/描述文件；`-allowProvisioningUpdates` 允许 Xcode 向 Apple 请求签名资源。只有 Developer ID 不够。此分发流程尚未用你的 App Store 签名实际执行，不能把准备好的脚本当成已验证的商店包。

生成文件在：

```text
~/downloads/dist/reopen-history-safari-appstore-v1.0.0-build1/export/
```

### D. 上传、填表、送审

1. 用 Apple 的 **Transporter** 登录同一个 App Store Connect 团队，把导出的 `.pkg` 添加并上传。不能上传本地 `.app.zip` 替代。
2. 等待构建处理完成，查看邮件/后台是否有阻塞。可先用 TestFlight 测试；外部测试如被要求则先走 Beta Review。
3. macOS 1.0.0 版本页添加对应 build。填写名称、描述、关键词、支持 URL、隐私政策 URL、真实 Mac 截图、类别、版权、年龄分级、价格和地区。
4. **App Privacy**：当前代码没有把数据传出设备供开发者/第三方使用，按 Apple 的“collect”定义可以填 **Data Not Collected**，同时隐私政策仍披露本地数据处理。若新加 SDK/统计必须重评估。
5. App Review Information：真实联系人；不需要登录账号；备注说明应用用于承载 Safari Web Extension、如何启用和测试，以及 Safari 只恢复网址的限制。
6. 根据实际使用的加密/API回答 Export Compliance 等问卷，不根据“只是扩展”直接假定所有问题不适用。
7. 选择手动或自动发布，确认版本资料、截图、真实 Safari 验收都完成后 Add for Review / Submit。通过后从 Mac App Store 安装验证。

官方：[Safari 分发](https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension)、[创建 macOS App 记录](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/)、[Apple 隐私定义](https://developer.apple.com/app-store/app-privacy-details/)、[会员](https://developer.apple.com/programs/whats-included)。

### 可选：Apple 新增在线打包路线

Apple 官方现在允许在 App Store Connect **Users and Access → Xcode Cloud → Safari Web Extension Packager → Upload** 上传完整 Safari 扩展 ZIP（本项目为 `reopen-history-safari-1.0.0.zip`），由 Apple 打包，再进入 TestFlight / App Store 流程。先创建 macOS app 记录，按页面匹配应用、平台和构建信息。它会使用会员包含的 Xcode Cloud 配额，不是本地构建；按本项目默认“所有构建在本地完成”的要求，主流程采用上面的本地 Xcode 脚本。只有你决定使用 Apple 云打包时再选此路线。

官方：[Safari Web Extension Packager 在线流程](https://developer.apple.com/documentation/safariservices/packaging-and-distributing-safari-web-extensions-with-app-store-connect)。

## 八、通用审核测试说明

Chrome/Edge/Firefox 可粘贴：

```text
No account, subscription, payment or test credentials are required.
1. Install the extension and pin its toolbar action.
2. Open a normal HTTP/HTTPS page, wait for it to load, and close that tab.
3. Click the toolbar action to reopen the most recently closed eligible tab.
4. Close another eligible tab. Right-click the extension toolbar action and choose Closed tabs to open history.html in a normal browser tab.
5. Search by title or hostname, then select an entry to reopen it.
6. Open Settings, enable/disable webpage context menus, and verify the setting persists.
7. Escape collapses the history list without closing its browser tab. Tab navigation is supported without forced initial focus.
Only normal HTTP(S) entries are eligible. Internal pages, extension pages and new-tab/blank pages are excluded. Native toolbar long press is not implemented; long press is only available on the extension's own Reopen button in its history page.
Browsing records and preferences are stored locally. No browsing data is sent to the developer and no remotely hosted code is used.
```

Safari 增补：

```text
The macOS application hosts the Safari Web Extension. After installation, enable it in Safari Settings > Extensions. Only macOS is supported by this release. Safari has no sessions API; this extension records eligible tab URLs locally while enabled and reopens saved URLs only. It cannot restore form state, scroll position, navigation history, complete window groups, or pages closed while the extension is not running. Private tabs and non-HTTP(S) pages are excluded.
```

## 九、后续版本

- Chrome、Edge、AMO：在原商店项目内上传 1.0.1、1.0.2 等更高版本；不要重建新 listing 替代升级。
- Firefox ID 保持不变，Chrome/Edge 商店 ID 由各平台管理，Apple app/extension Bundle ID 归属最终团队后保持不变。
- Apple 营销版本与 build number 分开管理，同版本重复上传要递增 build number。
- 发布前保存产物 SHA-256 和源码版本。本次生成的 reviewer-source ZIP 是工作区快照，不依赖审核员访问私有 GitHub。
- 费用、表单和平台政策可能调整；按上述官方入口核对。没有哪一个本地测试能保证商店必定审核通过。
