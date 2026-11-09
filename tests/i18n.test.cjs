const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function localization({ ui = 'en-US', saved = {}, fetchLocale } = {}) {
  const listeners = [];
  const storage = { ...saved };
  const change = async language => {
    storage.language = language;
    await Promise.all(listeners.map(fn => fn({ language: { newValue: language } }, 'local')));
  };
  const api = {
    i18n: { getUILanguage: () => ui, getMessage: key => `native:${key}` },
    runtime: { getURL: file => `extension://local/${file}` },
    storage: {
      local: { get: async () => ({ ...storage }), set: async ({ language }) => change(language) },
      onChanged: { addListener: fn => listeners.push(fn) }
    }
  };
  const context = vm.createContext({ browser: api, fetch: async url => {
    assert.ok(url.startsWith('extension://local/_locales/'), 'Only packaged locale files may be requested');
    const locale = url.split('/')[4];
    const messages = fetchLocale ? await fetchLocale(locale) : JSON.parse(fs.readFileSync(`extension/_locales/${locale}/messages.json`));
    return { ok: true, json: async () => messages };
  } });
  vm.runInContext(fs.readFileSync('extension/i18n.js', 'utf8'), context);
  return { i18n: context.ReopenI18n, storage, change };
}

test('Automatic language maps browser regions and Chinese scripts to packaged locales', async () => {
  for (const [ui, expected] of [['zh-Hant-HK', 'zh-TW'], ['zh-SG', 'zh-CN'], ['pt-PT', 'pt-BR'], ['de-AT', 'de'], ['zz-ZZ', 'en']]) {
    const { i18n } = localization({ ui });
    await i18n.ready;
    assert.equal(i18n.locale, expected);
    assert.equal(i18n.preference, 'auto');
  }
});

test('All twelve manual languages override the browser, preserve substitutions and save locally', async () => {
  const { i18n, storage } = localization({ ui: 'zh-CN' });
  await i18n.ready;
  assert.equal(i18n.languages.length, 12);
  for (const { value } of i18n.languages) {
    await i18n.setLanguage(value);
    const messages = JSON.parse(fs.readFileSync(`extension/_locales/${value}/messages.json`));
    assert.equal(i18n.t('settings'), messages.settings.message);
    assert.equal(i18n.t('pageStatus', ['2', '8']), messages.pageStatus.message.replace('$1', '2').replace('$2', '8'));
    assert.equal(storage.language, value);
  }
  await i18n.setLanguage('auto');
  assert.equal(i18n.locale, 'zh-CN');
  await assert.rejects(i18n.setLanguage('../secret'));
});

test('Saved language loads on startup; invalid saved values follow the browser', async () => {
  const manual = localization({ ui: 'en-US', saved: { language: 'ja' } });
  await manual.i18n.ready;
  assert.equal(manual.i18n.locale, 'ja');
  const invalid = localization({ ui: 'fr-FR', saved: { language: 'not-a-locale' } });
  await invalid.i18n.ready;
  assert.equal(invalid.i18n.locale, 'fr');
  assert.equal(invalid.i18n.preference, 'auto');
});

test('A slower earlier locale load cannot overwrite a newer language selection', async () => {
  let release;
  const delay = new Promise(resolve => { release = resolve; });
  const { i18n, change } = localization({ fetchLocale: async locale => {
    if (locale === 'ja') await delay;
    return JSON.parse(fs.readFileSync(`extension/_locales/${locale}/messages.json`));
  } });
  await i18n.ready;
  const first = change('ja');
  await change('ar');
  release();
  await first;
  assert.equal(i18n.locale, 'ar');
  assert.equal(i18n.preference, 'ar');
});

test('Missing translated messages fall back to bundled English', async () => {
  const { i18n } = localization({ saved: { language: 'ja' }, fetchLocale: async locale => {
    const messages = JSON.parse(fs.readFileSync(`extension/_locales/${locale}/messages.json`));
    if (locale === 'ja') delete messages.saved;
    return messages;
  } });
  await i18n.ready;
  assert.equal(i18n.t('saved'), 'Saved');
});
