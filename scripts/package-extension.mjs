import { cp, mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const version = JSON.parse(await readFile('package.json')).version;
const common = {
  manifest_version: 3, name: 'Reopen History', version, default_locale: 'en',
  description: '__MSG_description__',
  icons: { 16: 'icons/icon16.png', 32: 'icons/icon32.png', 48: 'icons/icon48.png', 128: 'icons/icon128.png' },
  action: { default_title: '__MSG_actionTitle__', default_icon: { 16: 'icons/icon16.png', 32: 'icons/icon32.png' } },
  options_ui: { page: 'history.html', open_in_tab: true },
  commands: {
    'reopen-tab': { suggested_key: { default: 'Alt+Shift+T' }, description: '__MSG_reopen__' },
    'show-history': { suggested_key: { default: 'Ctrl+Shift+Y', mac: 'Command+Shift+Y' }, description: '__MSG_history__' }
  }
};
for (const target of ['chromium', 'firefox', 'safari']) {
  const dir = `dist/${target}`;
  await cp('extension', dir, { recursive: true });
  const manifest = { ...common, permissions: ['storage', 'contextMenus', 'tabs', ...(target === 'safari' ? [] : ['sessions'])] };
  manifest.background = target === 'chromium' ? { service_worker: 'background.js' } : { scripts: ['core.js', 'background.js'], persistent: false };
  if (target === 'safari') {
    delete manifest.background.persistent;
    manifest.options_ui = { page: 'history.html' };
  }
  if (target === 'chromium') manifest.minimum_chrome_version = '120';
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
  for (const path of ['history.html', 'history.js', 'core.js', 'background.js', 'icons/icon128.png']) assert.ok((await readFile(`${dir}/${path}`)).length);
  execFileSync('/usr/bin/zip', ['-qr', `../reopen-history-${target}-${version}.zip`, '.'], { cwd: dir });
  console.log(`Built ${target}: ${locales.length} locales`);
}
