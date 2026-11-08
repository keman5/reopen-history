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
for (const node of document.querySelectorAll('[data-i18n-label]')) {
  node.setAttribute('aria-label', t(node.dataset.i18nLabel));
  node.title = t(node.dataset.i18nLabel);
}
for (const node of document.querySelectorAll('[data-i18n-title]')) node.title = t(node.dataset.i18nTitle);
if (!navigator.platform.includes('Mac')) document.querySelector('kbd').textContent = 'Alt ⇧ T';
const list = document.querySelector('#list');
const status = document.querySelector('#status');
const search = document.querySelector('#search');
const reopen = document.querySelector('#reopen');
const history = document.querySelector('#history');
const PAGE_SIZE = 100;
let page = 0;
let recent = [];
let busy = false;
let revision = 0;
status.textContent = new URLSearchParams(location.search).get('error') || '';

function makeIcon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `icons/ui.svg#${name}`);
  svg.setAttribute('aria-hidden', 'true');
  svg.append(use);
  return svg;
}
function entryTitle(entry) {
  return entry.tabCount ? t('windowTabs', String(entry.tabCount)) : (entry.title || t('untitled'));
}
function address(url) {
  try { return new URL(url).hostname; } catch { return url; }
}
function render() {
  const query = search.value.trim().toLocaleLowerCase();
  const filtered = recent.filter(item => `${item.title} ${item.url}`.toLocaleLowerCase().includes(query));
  list.replaceChildren();
  const latest = recent[0];
  reopen.setAttribute('aria-label', t('reopenAction'));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  page = Math.min(page, pages - 1);
  document.querySelector('#pagination').hidden = pages === 1;
  document.querySelector('#previous').disabled = page === 0;
  document.querySelector('#next').disabled = page === pages - 1;
  document.querySelector('#page-status').textContent = t('pageStatus', [String(page + 1), String(pages)]);
  const empty = document.querySelector('#empty');
  empty.hidden = filtered.length > 0;
  empty.textContent = t(recent.length ? 'noResults' : 'empty');
  reopen.disabled = busy || recent.length === 0;
  for (const entry of filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)) {
    const row = document.createElement('li');
    const button = document.createElement('button');
    button.className = 'entry';
    button.disabled = busy;
    const icon = document.createElement('span');
    icon.className = 'entry-icon';
    icon.replaceChildren(makeIcon(entry.tabCount ? 'window' : 'document'));
    icon.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.className = 'entry-text';
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = entryTitle(entry);
    const subtitle = document.createElement('span');
    subtitle.className = 'subtitle';
    subtitle.textContent = address(entry.url) || t('untitled');
    const time = document.createElement('time');
    time.className = 'time';
    if (Number.isFinite(entry.closedAt)) {
      const date = new Date(entry.closedAt);
      time.dateTime = date.toISOString();
      const seconds = Math.max(0, Math.round((Date.now() - entry.closedAt) / 1000));
      const unit = seconds < 60 ? 'second' : seconds < 3600 ? 'minute' : seconds < 86400 ? 'hour' : 'day';
      const value = Math.floor(seconds / ({ second: 1, minute: 60, hour: 3600, day: 86400 }[unit]));
      time.textContent = new Intl.RelativeTimeFormat(api.i18n.getUILanguage(), { numeric: 'auto', style: 'short' }).format(-value, unit);
      time.title = date.toLocaleString(api.i18n.getUILanguage());
    }
    if (entry === latest) {
      const badge = document.createElement('span');
      badge.className = 'latest-badge';
      badge.textContent = t('justClosed');
      subtitle.append(' · ', badge);
    }
    text.append(title, subtitle);
    const arrow = makeIcon('return');
    arrow.classList.add('row-return');
    button.append(icon, text, time, arrow);
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
search.addEventListener('input', () => { page = 0; render(); });
document.querySelector('#previous').addEventListener('click', () => { page--; render(); history.scrollIntoView({ block: 'start' }); });
document.querySelector('#next').addEventListener('click', () => { page++; render(); history.scrollIntoView({ block: 'start' }); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { history.hidden = true; reopen.setAttribute('aria-expanded', 'false'); }
});
api.sessions?.onChanged.addListener(load);
api.storage.onChanged.addListener((_changes, area) => { if (area === 'local') load(); });
window.addEventListener('focus', load);
load();
