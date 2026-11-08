const api = globalThis.browser || globalThis.chrome;
const t = (key, substitutions) => api.i18n.getMessage(key, substitutions);
document.documentElement.lang = api.i18n.getUILanguage();
document.documentElement.dir = /^(ar|he|fa|ur)(-|$)/.test(document.documentElement.lang) ? 'rtl' : 'ltr';
document.title = t('history') + ' · Reopen History';
for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
for (const node of document.querySelectorAll('[data-i18n-placeholder]')) {
  node.placeholder = t(node.dataset.i18nPlaceholder);
  node.setAttribute('aria-label', node.placeholder);
}
const list = document.querySelector('#list');
const status = document.querySelector('#status');
const search = document.querySelector('#search');
const reopen = document.querySelector('#reopen');
const history = document.querySelector('#history');
let recent = [];
let busy = false;
let revision = 0;
status.textContent = new URLSearchParams(location.search).get('error') || '';

function render() {
  const query = search.value.trim().toLocaleLowerCase();
  const filtered = recent.filter(item => `${item.title} ${item.url}`.toLocaleLowerCase().includes(query));
  list.replaceChildren();
  document.querySelector('#count').textContent = String(recent.length);
  const empty = document.querySelector('#empty');
  empty.hidden = filtered.length > 0;
  empty.textContent = t(recent.length ? 'noResults' : 'empty');
  reopen.disabled = busy || recent.length === 0;
  for (const entry of filtered) {
    const row = document.createElement('li');
    const button = document.createElement('button');
    button.className = 'entry';
    button.disabled = busy;
    const icon = document.createElement('span');
    icon.className = 'entry-icon';
    icon.textContent = entry.tabCount ? '▣' : '↶';
    icon.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.className = 'entry-text';
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = entry.tabCount ? t('windowTabs', String(entry.tabCount)) : (entry.title || t('untitled'));
    const subtitle = document.createElement('span');
    subtitle.className = 'subtitle';
    subtitle.textContent = entry.url || t('untitled');
    const time = document.createElement('time');
    time.className = 'time';
    if (Number.isFinite(entry.closedAt)) {
      const date = new Date(entry.closedAt);
      time.dateTime = date.toISOString();
      time.textContent = new Intl.DateTimeFormat(api.i18n.getUILanguage(), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
    }
    text.append(title, subtitle);
    button.append(icon, text, time);
    button.title = `${title.textContent}\n${entry.url}`;
    button.addEventListener('click', () => restore(entry.id));
    row.append(button);
    list.append(row);
  }
}

async function request(message) {
  const result = await api.runtime.sendMessage(message);
  if (!result || result.error) throw new Error(result?.error || t('loadError'));
  return result;
}
async function load() {
  const current = ++revision;
  try {
    const result = await request({ type: 'list' });
    if (current !== revision) return;
    recent = result.entries;
    document.querySelector('#notice').hidden = result.nativeSessions;
    render();
  } catch (error) { status.textContent = error.message; }
}
async function restore(id) {
  if (busy) return;
  busy = true;
  ++revision;
  status.textContent = '';
  render();
  try {
    const result = await request({ type: 'restore', id });
    recent = result.entries;
  } catch (error) {
    status.textContent = error.message;
    await load();
  } finally { busy = false; render(); }
}
ReopenCore.bindPress(reopen, {
  shortPress: () => restore(),
  longPress: () => { history.hidden = false; reopen.setAttribute('aria-expanded', 'true'); }
});
search.addEventListener('input', render);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { history.hidden = true; reopen.setAttribute('aria-expanded', 'false'); }
});
api.sessions?.onChanged.addListener(load);
api.storage.onChanged.addListener((_changes, area) => { if (area === 'local') load(); });
window.addEventListener('focus', load);
load();
