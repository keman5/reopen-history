# Reopen History 1.0.0

一键恢复已关闭标签页，支持搜索本地记录、12 种界面语言和最小字号设置。浏览记录保存在本机。

Reopen closed tabs in one click, search up to 1,000 local records, choose from 12 interface languages and adjust the minimum text size.

## 下载 / Downloads

| 浏览器 / Browser | 文件 / File | 安装方式 / Installation |
| --- | --- | --- |
| Chrome / Edge 120+ (Windows, macOS, Linux) | reopen-history-chromium-1.0.0.zip | 解压，在 chrome://extensions 或 edge://extensions 开启开发者模式，选择“加载已解压的扩展程序” / Unzip and Load unpacked in Developer mode. |
| Firefox 142+ desktop | reopen-history-firefox-1.0.0.zip | 未经 Mozilla 签名；解压，在 about:debugging#/runtime/this-firefox 临时载入 manifest.json，重启后失效 / Unsigned; temporary loading only, removed on restart. |
| Safari extension source | reopen-history-safari-1.0.0.zip | 用 Xcode 转换并构建 macOS 宿主应用 / Requires conversion and a macOS host build. |

- Safari macOS host: `reopen-history-safari-macos-1.0.0.zip`. macOS 13+, architecture: **arm64**. This local build is not an App Store package; notarization is not established. Safari activation and developer settings may still be required.

Firefox ZIP cannot be installed permanently in standard Firefox without Mozilla signing. No signed XPI is included. Safari on iPhone/iPad and Firefox for Android are not supported.

Safari macOS ZIP：解压后将 Reopen History.app 放入 Applications，在 Safari → 设置 → 扩展中启用。若 macOS 或 Safari 拒绝加载，此包不等同于已公证或 App Store 安装包；普通用户应等待正式商店版本。Safari 仅恢复已记录的网址，不恢复完整页面状态。

## 其他附件 / Other assets

- reopen-history-review-source-1.0.0.zip: 审核源码与依赖来源 / Reviewer source and third-party provenance.
- reopen-history-store-pages-1.0.0.zip: 隐私政策与支持静态网页 / Static privacy and support pages.
- SHA256SUMS.txt: 附件校验值。在附件目录运行 shasum -a 256 -c SHA256SUMS.txt。

[隐私政策 / Privacy](https://github.com/keman5/reopen-history/blob/main/PRIVACY.md) · [支持 / Support](https://github.com/keman5/reopen-history/issues)
