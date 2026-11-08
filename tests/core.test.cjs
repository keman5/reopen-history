const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { webcrypto } = require('node:crypto');
const core = require('../extension/core.js');

class Event {
  listeners = [];
  addListener = fn => this.listeners.push(fn);
  fire(...args) { return this.listeners.map(fn => fn(...args)); }
}
function worker({ native = true, saved = {}, tabs = [], sessions = [] } = {}) {
  const storage = structuredClone(saved);
  const restored = [];
  const menus = new Map();
  const popups = [];
  const popupValues = [];
  const windows = [];
  const created = [];
  let failCreate = false;
  const api = {
    i18n: { getMessage: key => key },
    action: { onClicked: new Event(), setBadgeText: async () => {}, setBadgeBackgroundColor: async () => {}, setPopup: async data => popupValues.push(data.popup), openPopup: async () => popups.push(true) },
    windows: { create: async data => windows.push(data) },
    commands: { onCommand: new Event() },
    contextMenus: { onClicked: new Event(), removeAll: async () => menus.clear(), create: data => { menus.set(data.id, data); } },
    runtime: { id: 'test', getURL: path => 'test-extension://' + path, onInstalled: new Event(), onMessage: new Event() },
    storage: { onChanged: new Event(), local: {
      get: async () => structuredClone(storage),
      set: async data => {
        const changes = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, { oldValue: storage[key], newValue: value }]));
        Object.assign(storage, structuredClone(data));
        api.storage.onChanged.fire(changes, 'local');
      }
    } },
    tabs: {
      query: async () => tabs,
      create: async data => { if (failCreate) throw new Error('create failed'); created.push(data); return data; },
      onCreated: new Event(), onUpdated: new Event(), onRemoved: new Event()
    }
  };
  if (native) api.sessions = {
    getRecentlyClosed: async () => sessions,
    restore: async id => { restored.push(id); sessions = sessions.filter(s => (s.tab || s.window).sessionId !== id); },
    onChanged: new Event()
  };
  const sandbox = vm.createContext({ browser: api, ReopenCore: core, crypto: webcrypto, console: { error() {}, info() {} }, URL });
  vm.runInContext(fs.readFileSync('extension/background.js', 'utf8'), sandbox);
  const message = data => new Promise(resolve => api.runtime.onMessage.fire(data, { id: 'test' }, resolve));
  return { api, storage, restored, created, menus, popups, popupValues, windows, message, openHistory: () => vm.runInContext("openHistory()", sandbox), failCreation: () => { failCreate = true; } };
}

test('Safari only records HTTP(S) tabs, excluding private and unsafe schemes', () => {
  for (const url of ['https://example.com', 'http://example.com']) assert.equal(core.isRestorable({ url }), true);
  for (const url of ['javascript:alert(1)', 'data:text/html,a', 'file:///secret', 'about:blank', 'about:newtab', 'chrome://newtab/', 'edge://newtab/', 'chrome-extension://test/options.html', 'moz-extension://test/history.html', 'safari-extension://test', 'https://ntp.msn.com/edge/ntp?test=1', 'not a URL']) {
    assert.equal(core.isRestorable({ url }), false);
  }
  assert.equal(core.isRestorable({ url: 'https://example.com', incognito: true }), false);
  assert.equal(core.isRestorable(null), false);
});

test('Native sessions preserve window entries and skip entries without restore IDs', () => {
  const result = core.sessionsToEntries([
    { lastModified: 100, tab: { sessionId: 'a', title: '<script>bad</script>', url: 'https://a.test' } },
    { lastModified: 90, window: { sessionId: 'b', tabs: [{ title: 'Window', url: 'https://b.test' }, { url: 'https://c.test' }] } },
    { tab: {} }, {}
  ]);
  assert.equal(result.length, 2);
  assert.equal(result[0].closedAt, 100000);
  assert.equal(result[0].title, '<script>bad</script>');
  assert.equal(result[1].tabCount, 2);
  assert.equal(result[1].id, 'b');
});

test('Short press restores once; long press only reveals history; cancellation does not restore', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const handlers = {};
  const button = { addEventListener: (type, handler) => { handlers[type] = handler; }, setPointerCapture() {} };
  let short = 0, long = 0;
  core.bindPress(button, { shortPress: () => short++, longPress: () => long++ });
  const down = () => handlers.pointerdown({ button: 0, isPrimary: true, pointerId: 1 });
  down(); t.mock.timers.tick(100); handlers.pointerup(); handlers.click();
  assert.equal(short, 1); assert.equal(long, 0);
  down(); t.mock.timers.tick(500); handlers.pointerup(); handlers.click();
  assert.equal(short, 1); assert.equal(long, 1);
  down(); handlers.pointercancel(); t.mock.timers.tick(700);
  assert.equal(short, 1); assert.equal(long, 1);
  handlers.keydown({ key: 'Enter' }); handlers.click();
  assert.equal(short, 2);
});

test('Native restore uses latest session and rejects stale IDs without restoring another tab', async () => {
  const w = worker({ sessions: [
    { lastModified: 2, tab: { sessionId: 'new', title: 'New', url: 'https://new.test' } },
    { lastModified: 1, tab: { sessionId: 'old', title: 'Old', url: 'https://old.test' } }
  ] });
  assert.equal((await w.message({ type: 'list' })).entries.length, 2);
  assert.equal((await w.message({ type: 'restore', id: 'missing' })).error, 'stale');
  assert.equal(w.restored.length, 0);
  await w.message({ type: 'restore' });
  assert.deepEqual(w.restored, ['new']);
  await w.message({ type: 'restore', id: 'old' });
  assert.deepEqual(w.restored, ['new', 'old']);
  assert.equal((await w.message({ type: 'restore' })).error, 'empty');
});

test('Toolbar clicks and keyboard command reach the same restore implementation', async () => {
  const w = worker({ sessions: [
    { lastModified: 2, tab: { sessionId: 'a', url: 'https://a.test' } }, { lastModified: 1, tab: { sessionId: 'b', url: 'https://b.test' } }
  ] });
  w.api.action.onClicked.fire();
  w.api.commands.onCommand.fire('reopen-tab');
  await w.message({ type: 'list' });
  assert.deepEqual(w.restored, ['a', 'b']);
});

test('Safari handles simultaneous closures, private tabs, persistence and successful restores', async () => {
  const w = worker({ native: false, tabs: [
    { id: 1, url: 'https://first.test', title: 'First' },
    { id: 2, url: 'https://second.test', title: 'Second', pinned: true },
    { id: 3, url: 'https://private.test', incognito: true }
  ] });
  await w.message({ type: 'list' });
  w.api.tabs.onRemoved.fire(1); w.api.tabs.onRemoved.fire(2); w.api.tabs.onRemoved.fire(3);
  const result = await w.message({ type: 'list' });
  assert.equal(result.entries.length, 2);
  assert.equal(result.entries[0].url, 'https://second.test');
  assert.equal(w.storage.closedTabs.length, 2);
  await w.message({ type: 'restore' });
  assert.equal(w.created[0].url, 'https://second.test');
  assert.equal(w.created[0].pinned, true);
  assert.equal(w.storage.closedTabs.length, 1);
  const restarted = worker({ native: false, saved: w.storage });
  assert.equal((await restarted.message({ type: 'list' })).entries[0].url, 'https://first.test');
});

test('Safari failed tab creation preserves recovery data and limits history to 100', async () => {
  const closedTabs = Array.from({ length: 110 }, (_, i) => ({ id: String(i), url: `https://example.com/${i}` }));
  const w = worker({ native: false, saved: { closedTabs } });
  assert.equal((await w.message({ type: 'list' })).entries.length, 100);
  w.failCreation();
  assert.equal((await w.message({ type: 'restore' })).error, 'create failed');
  assert.equal((await w.message({ type: 'list' })).entries.length, 100);
});

test('Messages from other extensions are rejected', () => {
  const w = worker();
  assert.equal(w.api.runtime.onMessage.fire({ type: 'list' }, { id: 'other' }, () => assert.fail())[0], false);
});

test('Safari preserves a tab closed while its background worker is starting', async () => {
  const w = worker({ native: false, saved: { liveTabs: { 7: { url: 'https://startup.test', title: 'Startup' } } } });
  w.api.tabs.onRemoved.fire(7);
  const result = await w.message({ type: 'list' });
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0].url, 'https://startup.test');
});

test('Native history and toolbar skip extension, blank and internal sessions without consuming them', async () => {
  const w = worker({ sessions: [
    { lastModified: 5, tab: { sessionId: 'extension', url: 'chrome-extension://id/history.html' } },
    { lastModified: 4, tab: { sessionId: 'blank', url: 'about:blank' } },
    { lastModified: 3, tab: { sessionId: 'newtab', url: 'edge://newtab/' } },
    { lastModified: 2, tab: { sessionId: 'web', url: 'https://example.com' } }
  ] });
  const result = await w.message({ type: 'list' });
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0].id, 'web');
  assert.equal((await w.message({ type: 'restore', id: 'extension' })).error, 'stale');
  w.api.action.onClicked.fire();
  await w.message({ type: 'list' });
  assert.deepEqual(w.restored, ['web']);
});

test('Window sessions never restore an excluded page as part of a batch', () => {
  const result = core.sessionsToEntries([
    { window: { sessionId: 'mixed', tabs: [{ url: 'https://example.com' }, { url: 'about:blank' }] } },
    { window: { sessionId: 'empty', tabs: [] } },
    { window: { sessionId: 'clean', tabs: [{ url: 'https://example.com' }] } }
  ]);
  assert.deepEqual(result.map(entry => entry.id), ['clean']);
});

test('Toolbar history is always available while webpage menus remain opt-in', async () => {
  const w = worker();
  w.api.runtime.onInstalled.fire();
  await w.message({ type: 'list' });
  assert.deepEqual([...w.menus.keys()], ['history']);
  await w.api.storage.local.set({ showContextMenu: true });
  await w.message({ type: 'list' });
  assert.deepEqual([...w.menus.keys()], ['history', 'reopen']);
  assert.deepEqual(Array.from(w.menus.get('history').contexts), ['action', 'page']);
  const restarted = worker({ saved: w.storage });
  await restarted.message({ type: 'list' });
  assert.equal(restarted.menus.size, 2);
  await w.api.storage.local.set({ showContextMenu: false });
  await w.message({ type: 'list' });
  assert.deepEqual([...w.menus.keys()], ['history']);
});

test('An update clears menus from the old default without changing stored Safari history', async () => {
  const saved = { closedTabs: [{ id: 'saved', url: 'https://saved.test' }] };
  const w = worker({ native: false, saved });
  w.menus.set('old-menu', {});
  w.api.runtime.onInstalled.fire();
  assert.equal((await w.message({ type: 'list' })).entries.length, 1);
  assert.deepEqual([...w.menus.keys()], ['history']);
});


test('History menu and shortcut open the full history page in normal tabs without changing toolbar behavior', async () => {
  const w = worker({ sessions: [{ lastModified: 1, tab: { sessionId: 'a', url: 'https://a.test' } }] });
  w.api.contextMenus.onClicked.fire({ menuItemId: 'history' });
  w.api.commands.onCommand.fire('show-history');
  await w.message({ type: 'list' });
  assert.deepEqual(w.created.map(tab => tab.url), ['test-extension://history.html', 'test-extension://history.html']);
  assert.equal(w.popups.length, 0);
  assert.equal(w.popupValues.length, 0);
  assert.equal(w.windows.length, 0);
  w.api.action.onClicked.fire();
  await w.message({ type: 'list' });
  assert.deepEqual(w.restored, ['a']);
});

test('History opens in a tab even when popup APIs are unavailable', async () => {
  const w = worker();
  delete w.api.action.openPopup;
  delete w.api.action.setPopup;
  delete w.api.windows;
  await w.openHistory();
  assert.equal(w.created[0].url, 'test-extension://history.html');
});
