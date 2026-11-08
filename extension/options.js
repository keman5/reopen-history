const api = globalThis.browser || globalThis.chrome;
const t = key => api.i18n.getMessage(key);
document.documentElement.lang = api.i18n.getUILanguage();
document.documentElement.dir = /^(ar|he|fa|ur)(-|$)/.test(document.documentElement.lang) ? 'rtl' : 'ltr';
document.title = t('settings') + ' · Reopen History';
for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
const checkbox = document.querySelector('#context-menu');
const status = document.querySelector('#save-status');
checkbox.disabled = true;
api.storage.local.get('showContextMenu').then(saved => {
  checkbox.checked = saved.showContextMenu === true;
  checkbox.disabled = false;
}).catch(() => { status.textContent = t('settingsError'); });
checkbox.addEventListener('change', async () => {
  checkbox.disabled = true;
  status.textContent = '';
  try {
    await api.storage.local.set({ showContextMenu: checkbox.checked });
    status.textContent = t('saved');
  } catch {
    checkbox.checked = !checkbox.checked;
    status.textContent = t('settingsError');
  } finally { checkbox.disabled = false; }
});
api.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && Object.hasOwn(changes, 'showContextMenu')) checkbox.checked = changes.showContextMenu.newValue === true;
});
