if (typeof importScripts === 'function') importScripts('core.js', 'i18n.js');
const api = globalThis.browser || globalThis.chrome;
const { isRestorable, sessionsToEntries, cachedIcon } = ReopenCore;
const nativeSessions = Boolean(api.sessions?.getRecentlyClosed);
const t = ReopenI18n.t;
const HISTORY_LIMIT = 1000;
let queue = Promise.resolve();
let liveTabs = {};
let closedTabs = [];
let nativeIds = new Set();
let starting = true;
const removedWhileStarting = new Set();

// Serialize history changes and restores so simultaneous events cannot lose records.
function serial(task) {
  const result = queue.then(task);
  queue = result.catch(error => console.error('Reopen History:', error));
  return result;
}

async function entries() {
  if (nativeSessions) {
    const fresh = sessionsToEntries(await api.sessions.getRecentlyClosed({ maxResults: 25 }));
    nativeIds = new Set(fresh.map(entry => entry.id));
    const merged = [...fresh, ...closedTabs.filter(entry => !nativeIds.has(entry.id))]
      .sort((a, b) => b.closedAt - a.closedAt).slice(0, HISTORY_LIMIT);
    if (JSON.stringify(merged) !== JSON.stringify(closedTabs)) {
      closedTabs = merged;
      await api.storage.local.set({ closedTabs });
    }
  }
  return closedTabs;
}

async function restore(id) {
  const recent = await entries();
  const entry = id ? recent.find(item => item.id === id) : recent[0];
  if (!entry) throw new Error(t(id ? 'stale' : 'empty'));
  if (nativeSessions && nativeIds.has(entry.id)) await api.sessions.restore(entry.id);
  else {
    if (!isRestorable(entry)) throw new Error(t('stale'));
    await api.tabs.create({ url: entry.url, pinned: Boolean(entry.pinned) });
  }
  // Remove only after recovery succeeds, preserving data on failure.
  closedTabs = closedTabs.filter(item => item.id !== entry.id);
  await api.storage.local.set({ closedTabs });
  await refreshHistory();
}

async function refreshHistory() {
  await entries();
}

async function openHistory() {
  await api.tabs.create({ url: api.runtime.getURL('history.html') });
}

async function report(error) {
  console.error('Reopen History:', error);
  await api.tabs.create({ url: api.runtime.getURL('history.html') + '?error=' + encodeURIComponent(error.message) });
}

api.action.onClicked.addListener(() => { serial(() => restore()).catch(report); });
api.commands.onCommand.addListener(command => {
  if (command === 'show-history') openHistory().catch(report);
  if (command === 'reopen-tab') serial(() => restore()).catch(report);
});
api.contextMenus.onClicked.addListener(info => {
  if (info.menuItemId === 'history') openHistory().catch(report);
  if (info.menuItemId === 'reopen') serial(() => restore()).catch(report);
});
async function updateMenus() {
  await ReopenI18n.ready;
  await api.contextMenus.removeAll();
  const { showContextMenu } = await api.storage.local.get('showContextMenu');
  if (showContextMenu === true) api.contextMenus.create({ id: 'reopen', title: t('reopenAction'), contexts: ['page'] });
  api.contextMenus.create({ id: 'history', title: t('menuHistory'), contexts: showContextMenu === true ? ['action', 'page'] : ['action'] });
  await api.action.setTitle({ title: t('actionTitle') });
}
ReopenI18n.subscribe(() => { serial(updateMenus); });
api.runtime.onInstalled.addListener(() => { serial(updateMenus); });
api.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && Object.hasOwn(changes, 'showContextMenu')) serial(updateMenus);
});
serial(updateMenus);
// Clear badges left by older versions; history changes no longer add a count.
serial(() => api.action.setBadgeText({ text: '' }));
api.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== api.runtime.id) return false;
  if (!['list', 'restore'].includes(message?.type)) return false;
  serial(async () => {
    if (message.type === 'restore') await restore(message.id);
    return { entries: await entries(), nativeSessions };
  }).then(respond, error => respond({ error: error.message }));
  return true;
});

if (nativeSessions) {
  api.sessions.onChanged.addListener(() => { serial(refreshHistory).catch(console.error); });
  serial(async () => {
    const saved = await api.storage.local.get('closedTabs');
    closedTabs = (saved.closedTabs || []).filter(isRestorable).slice(0, HISTORY_LIMIT);
    await api.storage.local.set({ closedTabs });
    await refreshHistory();
  });
} else {
  serial(async () => {
    const saved = await api.storage.local.get(['closedTabs', 'liveTabs']);
    closedTabs = (saved.closedTabs || []).filter(isRestorable).slice(0, HISTORY_LIMIT);
    liveTabs = saved.liveTabs || {};
    const current = await api.tabs.query({});
    const snapshots = Object.fromEntries(current.filter(isRestorable).map(({ id, url, title, pinned, favIconUrl }) => [id, { url, title, pinned, favIconUrl: cachedIcon(favIconUrl) }]));
    // Preserve cached metadata for removal events queued while the worker wakes.
    for (const id of removedWhileStarting) if (isRestorable(liveTabs[id])) snapshots[id] = liveTabs[id];
    liveTabs = snapshots;
    starting = false;
    removedWhileStarting.clear();
    await api.storage.local.set({ closedTabs, liveTabs });
    await refreshHistory();
  });
  const remember = tab => serial(async () => {
    if (isRestorable(tab)) liveTabs[tab.id] = { url: tab.url, title: tab.title, pinned: tab.pinned, favIconUrl: cachedIcon(tab.favIconUrl) };
    else delete liveTabs[tab.id];
    await api.storage.local.set({ liveTabs });
  });
  api.tabs.onCreated.addListener(tab => { remember(tab).catch(console.error); });
  api.tabs.onUpdated.addListener((_id, _change, tab) => { remember(tab).catch(console.error); });
  api.tabs.onRemoved.addListener(id => {
    if (starting) removedWhileStarting.add(id);
    serial(async () => {
      const tab = liveTabs[id];
      delete liveTabs[id];
      if (isRestorable(tab)) {
        closedTabs.unshift({ ...tab, id: crypto.randomUUID(), closedAt: Date.now(), tabCount: 0 });
        closedTabs = closedTabs.slice(0, HISTORY_LIMIT);
      }
      await api.storage.local.set({ closedTabs, liveTabs });
      await refreshHistory();
    }).catch(console.error);
  });
}
