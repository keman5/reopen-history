# 1.0.0 商店填写资料

发布者 / Publisher: keman5

名称 / Name: 恢复已关闭标签 / Reopen History

主要用途：一键恢复符合条件的已关闭标签页，并在本地搜索最近关闭的记录。

Single purpose: Reopen eligible recently closed browser tabs and search a locally stored closed-tab archive.

简体中文简介：一键恢复已关闭标签页，搜索最近记录，浏览数据仅保存在本机。

English summary: Reopen closed tabs in one click and search recent entries. Browsing records stay on your device.

## 公开链接

- 支持入口（已公开）：https://github.com/keman5/reopen-history/issues
- 仓库主页（已公开）：https://github.com/keman5/reopen-history
- Markdown 隐私政策：https://github.com/keman5/reopen-history/blob/main/PRIVACY.md
- Markdown 支持说明：https://github.com/keman5/reopen-history/blob/main/SUPPORT.md

本次修改尚未提交、推送或发布。Markdown 链接只在相应文件推送后才展示本次内容。不要把本地页面地址填写为商店 URL。

如使用 GitHub Pages，推送本次修改后在仓库 Settings → Pages 选择 Deploy from a branch → main → /docs。docs/.nojekyll 禁用 Jekyll 构建，页面已在本地生成。预计公开地址为：

- 主页：https://keman5.github.io/reopen-history/
- 隐私政策：https://keman5.github.io/reopen-history/privacy.html
- 支持页面：https://keman5.github.io/reopen-history/support.html

以上 Pages 地址在启用并完成部署、通过未登录访问检查之前，不视为已上线地址。也可以把本地生成的网页 ZIP 解压上传到自己的 HTTPS 静态网站。

## 原生右键菜单的商店入口

构建不设置 manifest 的 homepage_url，避免用项目主页覆盖浏览器的商店入口。Chrome 从商店安装后，顶部原生名称项使用对应商店详情页；其他浏览器由自身原生菜单规则决定。未上架或本地加载的版本可能显示为灰色；不会填入虚构的商店 ID。上架后请从各商店安装验证跳转。工具栏自定义菜单仅保留“关闭历史”，网页恢复菜单仍由设置开关控制。

## 中文详细介绍

不小心关闭了标签页？点击工具栏按钮，即可重新打开最近关闭的合格标签页。

- 一键恢复最近关闭的标签页或符合条件的窗口。
- 按标题和网址搜索，最多保留 1,000 条本地记录，每页最多 100 条。
- 支持浅色界面、键盘操作、12 种界面语言与 13–20px 最小字号设置。
- 可选网页右键菜单，默认关闭。
- 无需账号，不含广告、遥测或远程执行代码，不向开发者上传浏览记录。

仅普通 HTTP/HTTPS 页面会进入恢复记录，私密、空白、扩展和浏览器内部页面被排除。原生会话可用时原生恢复；过期记录只重新打开网址，窗口归档退化为首个标签网址。不能回填安装前的完整浏览历史。

Safari 版额外说明：仅支持 macOS。启用后开始记录，恢复时只重新打开保存的网址，不能恢复表单、滚动位置、前进后退历史、完整窗口布局或扩展未运行时关闭的标签。

## English description

Reopen eligible recently closed tabs in one click, or search the local archive by title and URL. Keep up to 1,000 entries with 100 entries per page. Includes keyboard navigation, 12 interface languages, adjustable 13–20px minimum text size and optional webpage context menus.

No account, ads, analytics or remotely hosted executable code. Browsing records stay on your device and are not sent to the developer. Only ordinary HTTP(S) pages are eligible. Available native sessions are restored; expired archived entries reopen their saved URL only. Complete history from before installation cannot be imported.

Safari: macOS only. Records eligible pages while enabled and restores saved URLs only, without form contents, scroll position, navigation history or complete window layouts. It cannot recover tabs closed while the extension is not running.

## 数据声明和权限

- Chrome/Edge：如实披露本地处理的网页标题、网址与关闭记录，并说明无上传、出售、广告或统计；不要把“仅本地处理”写成“不处理浏览记录”。
- Firefox：manifest 声明 required: ["none"]，表示不传输收集数据；政策仍说明本地保存内容。
- Apple：按“传出设备供开发者/合作方使用”的定义，当前代码适合 Data Not Collected；任何新增 SDK 或联网数据处理都要重新评估。
- 权限说明、第三方依赖来源及审核重现步骤：见 STORE-PUBLISHING.zh-CN.md。

## 素材和剩余人工资料

- 图标：extension/icons/icon128.png、icon512.png。
- 现有界面截图：assets/screenshots/。提交时核对当前 UI、尺寸和隐私信息；真实 Safari 截图需要在 Safari 验收后采集。
- 支持渠道按维护者选择仅为 GitHub Issues，没有虚构邮箱。后台如要求账号联系邮箱或 Apple 审核联系人，应填写维护者真实资料，这些不等于必须把邮箱写在公开支持页。
- 不填写尚不存在的商店安装链接，不把本地 ZIP 宣称为 Mozilla 签名或 Mac App Store 分发包。
