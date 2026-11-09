import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const version = JSON.parse(await readFile('package.json')).version;
assert.match(version, /^\d+\.\d+\.\d+$/);
const output = join(homedir(), 'downloads', 'dist');
const destination = join('releases', version);
const includeSafariApp = process.argv.includes('--safari-app');
assert.ok(process.argv.slice(2).every(arg => arg === '--safari-app'), 'Unknown release argument');
const files = [];
for (const target of ['chromium', 'firefox', 'safari']) {
  const name = `reopen-history-${target}-${version}.zip`;
  const archive = join(output, name);
  execFileSync('unzip', ['-tq', archive]);
  const manifest = JSON.parse(execFileSync('unzip', ['-p', archive, 'manifest.json']));
  assert.equal(manifest.version, version);
  // Reusing existing packages must not silently publish stale extension code or assets.
  for (const file of await readdir('extension', { recursive: true, withFileTypes: true })) {
    if (!file.isFile()) continue;
    const relative = join(file.parentPath ?? file.path, file.name).replace(/^extension\//, '');
    const bundled = execFileSync('unzip', ['-p', archive, relative], { maxBuffer: 10 * 1024 * 1024 });
    assert.ok(bundled.equals(await readFile(join('extension', relative))), `Stale ${target} package: ${relative}`);
  }
  files.push([archive, name]);
}
for (const target of ['review-source', 'store-pages']) {
  const name = `reopen-history-${target}-${version}.zip`;
  execFileSync('unzip', ['-tq', join(output, name)]);
  files.push([join(output, name), name]);
}
let safariNote = '';
if (includeSafariApp) {
  const archive = join(output, 'reopen-history-safari-macos.zip');
  execFileSync('unzip', ['-tq', archive]);
  const plist = execFileSync('unzip', ['-p', archive, 'Reopen History.app/Contents/Info.plist']);
  const appVersion = execFileSync('plutil', ['-extract', 'CFBundleShortVersionString', 'raw', '-o', '-', '-'], { input: plist, encoding: 'utf8' }).trim();
  assert.equal(appVersion, version, 'Safari app version differs from release');
  const executable = execFileSync('unzip', ['-p', archive, 'Reopen History.app/Contents/MacOS/Reopen History'], { maxBuffer: 10 * 1024 * 1024 });
  assert.ok(executable.equals(await readFile(join(output, 'Reopen History.app/Contents/MacOS/Reopen History'))), 'Safari app ZIP differs from the verified local app');
  const architectures = execFileSync('lipo', ['-archs', join(output, 'Reopen History.app/Contents/MacOS/Reopen History')], { encoding: 'utf8' }).trim();
  execFileSync('codesign', ['--verify', '--deep', '--strict', join(output, 'Reopen History.app')]);
  files.push([archive, `reopen-history-safari-macos-${version}.zip`]);
  safariNote = `\n- Safari macOS host: \`reopen-history-safari-macos-${version}.zip\`. macOS 13+, architecture: **${architectures}**. This local build is not an App Store package; notarization is not established. Safari activation and developer settings may still be required.\n`;
}
await mkdir(destination, { recursive: true });
const sums = [];
for (const [source, name] of files) {
  await copyFile(source, join(destination, name));
  sums.push(`${createHash('sha256').update(await readFile(join(destination, name))).digest('hex')}  ${name}`);
}
// This directory is generated: remove obsolete ZIPs when rebuilding without a host app.
for (const name of await readdir(destination)) {
  if (name.startsWith('reopen-history-') && name.endsWith('.zip') && !files.some(([, expected]) => expected === name)) {
    await rm(join(destination, name));
  }
}
await writeFile(join(destination, 'SHA256SUMS.txt'), sums.join('\n') + '\n');
await writeFile(join(destination, 'README.md'), `# Reopen History ${version}\n\n一键恢复已关闭标签页，支持搜索本地记录、12 种界面语言和最小字号设置。浏览记录保存在本机。\n\nReopen closed tabs in one click, search up to 1,000 local records, choose from 12 interface languages and adjust the minimum text size.\n\n## 下载 / Downloads\n\n| 浏览器 / Browser | 文件 / File | 安装方式 / Installation |\n| --- | --- | --- |\n| Chrome / Edge 120+ (Windows, macOS, Linux) | reopen-history-chromium-${version}.zip | 解压，在 chrome://extensions 或 edge://extensions 开启开发者模式，选择“加载已解压的扩展程序” / Unzip and Load unpacked in Developer mode. |\n| Firefox 142+ desktop | reopen-history-firefox-${version}.zip | 未经 Mozilla 签名；解压，在 about:debugging#/runtime/this-firefox 临时载入 manifest.json，重启后失效 / Unsigned; temporary loading only, removed on restart. |\n| Safari extension source | reopen-history-safari-${version}.zip | 用 Xcode 转换并构建 macOS 宿主应用 / Requires conversion and a macOS host build. |\n${safariNote}\nFirefox ZIP cannot be installed permanently in standard Firefox without Mozilla signing. No signed XPI is included. Safari on iPhone/iPad and Firefox for Android are not supported.\n\n${includeSafariApp ? "Safari macOS ZIP：解压后将 Reopen History.app 放入 Applications，在 Safari → 设置 → 扩展中启用。若 macOS 或 Safari 拒绝加载，此包不等同于已公证或 App Store 安装包；普通用户应等待正式商店版本。Safari 仅恢复已记录的网址，不恢复完整页面状态。" : "Safari 宿主应用未包含在本次构建中；请从扩展源码构建。"}\n\n## 其他附件 / Other assets\n\n- reopen-history-review-source-${version}.zip: 审核源码与依赖来源 / Reviewer source and third-party provenance.\n- reopen-history-store-pages-${version}.zip: 隐私政策与支持静态网页 / Static privacy and support pages.\n- SHA256SUMS.txt: 附件校验值。在附件目录运行 shasum -a 256 -c SHA256SUMS.txt。\n\n[隐私政策 / Privacy](https://github.com/keman5/reopen-history/blob/main/PRIVACY.md) · [支持 / Support](https://github.com/keman5/reopen-history/issues)\n`);
console.log(`Prepared GitHub release ${version}: ${files.length} ZIP files → ${destination}`);
