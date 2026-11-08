# Reopen History

轻量、无运行时依赖的关闭标签页恢复扩展，支持 Chrome、Edge、Firefox，以及通过本地记录实现兼容的 macOS Safari。独立实现，不包含参考插件的源码、图标或品牌。

## 操作

- 固定工具栏按钮后，**单击直接恢复最近关闭的标签页或窗口**。
- **右键工具栏按钮或网页 → 已关闭的标签页**，打开可搜索的历史列表。
- 历史页面中的绿色按钮：**单击恢复、长按 500 毫秒显示列表**；Esc 收起列表。支持 Tab、Enter、空格，不主动抢焦点。
- 快捷键：`Alt+Shift+T` 恢复；`Ctrl+Shift+Y` 打开历史，macOS 为 `⌘+Shift+Y`。若冲突，请在浏览器的扩展快捷键设置中修改。

浏览器扩展标准不提供原生工具栏按钮的按下／松开事件，因此无法跨浏览器可靠识别工具栏长按。本项目按确认的选择保留工具栏单击恢复，长按放在扩展页面内，并提供右键和快捷键历史入口。

## 兼容范围

| 浏览器 | 方式 | 限制 |
| --- | --- | --- |
| Chrome / Edge 120+、Brave、Opera、Vivaldi | 浏览器原生会话恢复 | 显示最近最多 25 个会话，关闭的窗口作为整体恢复 |
| 桌面 Firefox 142+ | 浏览器原生会话恢复 | 永久安装需要 Mozilla 签名；临时安装重启后失效 |
| macOS 13+ Safari 16+ | 本机记录后重新打开网址 | 只记录扩展启用后的普通网页，最多 100 条；不能恢复页面状态、前进后退记录或窗口分组 |

Safari 不记录隐私标签页和浏览器内部页面，不提供启用前的关闭历史。iOS Safari 和 Android Firefox 不在当前支持范围内。Safari 宿主应用最低支持 macOS 13。

## 构建与安装

在项目根目录执行：

```sh
npm ci
bash build.sh
```

Chrome / Edge 在扩展管理页启用开发者模式，选择「加载解压缩的扩展」，载入本项目的 `dist/chromium`。

Firefox 在 `about:debugging#/runtime/this-firefox` 点击「临时载入附加组件」，选择 `dist/firefox/manifest.json`。

Safari：

```sh
bash build.sh --safari
```

生成 Xcode 工程并本地编译 macOS 宿主应用，位于 `dist/Reopen History.app`。默认构建使用临时签名，未做分发签名，开发安装可能需要在 Safari 开发者设置允许未签名扩展；正式分发需要 Apple 开发者签名等步骤。可通过 `SAFARI_SIGN_IDENTITY` 和 `SAFARI_TEAM` 指定自己的签名，追加 `--install` 会替换 `/Applications/Reopen History.app`。构建完成后清理临时 Xcode 缓存。脚本不会自动修改浏览器安全设置、启用扩展，也不会提交商店。

所有测试均在后台执行。`npm run test:browser` 使用独立临时配置启动无头 Edge，不影响当前浏览器。各项实际验证边界见 [VERIFICATION.md](VERIFICATION.md)。

支持 12 种完整界面语言，随浏览器语言自动选择。数据仅保存在本机，无账号、无统计、无远程图标请求；打开网页本身仍会访问对应网站。详见 [隐私说明](../PRIVACY.md)。
