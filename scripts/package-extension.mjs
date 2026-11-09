import { cp, mkdir, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { homedir } from 'node:os';
import { join } from 'node:path';
const version = JSON.parse(await readFile('package.json')).version;
const output = join(homedir(), 'downloads', 'dist');
await mkdir(output, { recursive: true });
const common = {
  // Omit homepage_url so store installations use the browser's native store link.
  manifest_version: 3, name: '__MSG_appName__', version, default_locale: 'en',
  description: '__MSG_description__',
  icons: { 16: 'icons/icon16.png', 32: 'icons/icon32.png', 48: 'icons/icon48.png', 128: 'icons/icon128.png', 512: 'icons/icon512.png' },
  action: { default_title: '__MSG_actionTitle__', default_icon: 'icons/icon128.png' },
  options_ui: { page: 'options.html', open_in_tab: true },
  commands: {
    'reopen-tab': { suggested_key: { default: 'Alt+Shift+T' }, description: '__MSG_reopen__' },
    'show-history': { suggested_key: { default: 'Ctrl+Shift+Y', mac: 'Command+Shift+Y' }, description: '__MSG_history__' }
  }
};
for (const target of ['chromium', 'firefox', 'safari']) {
  const dir = join(output, `reopen-history-${target}-v${version}`);
  await rm(dir, { recursive: true, force: true });
  await cp('extension', dir, { recursive: true });
  await mkdir(`${dir}/vendor`, { recursive: true });
  await cp('node_modules/tldts/dist/index.umd.min.js', `${dir}/vendor/tldts.js`);
  await cp('node_modules/tldts/LICENSE', `${dir}/vendor/tldts-LICENSE.txt`);
  const manifest = { ...common, permissions: ['storage', 'contextMenus', 'tabs', ...(target === 'safari' ? [] : ['sessions'])] };
  manifest.background = target === 'chromium' ? { service_worker: 'background.js' } : { scripts: ['core.js', 'i18n.js', 'background.js'] };
  if (target === 'safari') {
    manifest.options_ui = { page: 'options.html' };
  }
  if (target === 'chromium') {
    manifest.minimum_chrome_version = '120';
    manifest.permissions.push('favicon');
  }
  if (target === 'firefox') {
    manifest.browser_specific_settings = { gecko: { id: 'reopen-history@keman5.github.io', strict_min_version: '142.0', data_collection_permissions: { required: ['none'] } } };
  }
  await writeFile(`${dir}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
  const locales = await readdir(`${dir}/_locales`);
  const english = JSON.parse(await readFile(`${dir}/_locales/en/messages.json`));
  for (const locale of locales) {
    const messages = JSON.parse(await readFile(`${dir}/_locales/${locale}/messages.json`));
    assert.deepEqual(Object.keys(messages).sort(), Object.keys(english).sort(), `Incomplete locale: ${locale}`);
    for (const value of Object.values(messages)) assert.ok(value.message?.trim());
  }
  for (const path of ['options.html', 'options.js', 'history.html', 'history.js', 'i18n.js', 'typography.js', 'core.js', 'background.js', 'privacy.html', 'support.html', 'legal.css', 'icons/icon128.png']) assert.ok((await readFile(`${dir}/${path}`)).length);
  const archive = join(output, `reopen-history-${target}-${version}.zip`);
  await rm(archive, { force: true });
  execFileSync('/usr/bin/zip', ['-qr', archive, '.'], { cwd: dir });
  console.log(`Built ${target}: ${locales.length} locales → ${dir}`);
}
