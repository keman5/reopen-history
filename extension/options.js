const api = globalThis.browser || globalThis.chrome;
const t = ReopenI18n.t;
const checkbox = document.querySelector('#context-menu');
const status = document.querySelector('#save-status');
const language = document.querySelector('#language');
let languageRevision = 0;
for (const { value, name } of ReopenI18n.languages) {
  const option = new Option(name, value);
  option.lang = value.replaceAll('_', '-');
  language.add(option);
}
function setStatus(key) {
  status.dataset.i18n = key;
  status.textContent = t(key);
}
function localize() {
  ReopenI18n.localizeDocument('settings');
  language.value = ReopenI18n.preference;
}
ReopenI18n.subscribe(localize);
ReopenI18n.ready.then(() => {
  localize();
  language.disabled = false;
});
language.addEventListener('change', async () => {
  const current = ++languageRevision;
  delete status.dataset.i18n;
  status.textContent = '';
  try {
    await ReopenI18n.setLanguage(language.value);
    if (current === languageRevision) setStatus('saved');
  } catch {
    if (current === languageRevision) {
      language.value = ReopenI18n.preference;
      setStatus('settingsError');
    }
  }
});
checkbox.disabled = true;
api.storage.local.get('showContextMenu').then(saved => {
  checkbox.checked = saved.showContextMenu === true;
  checkbox.disabled = false;
}).catch(() => { setStatus('settingsError'); });
checkbox.addEventListener('change', async () => {
  checkbox.disabled = true;
  delete status.dataset.i18n;
  status.textContent = '';
  try {
    await api.storage.local.set({ showContextMenu: checkbox.checked });
    setStatus('saved');
  } catch {
    checkbox.checked = !checkbox.checked;
    setStatus('settingsError');
  } finally { checkbox.disabled = false; }
});
api.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && Object.hasOwn(changes, 'showContextMenu')) checkbox.checked = changes.showContextMenu.newValue === true;
});
