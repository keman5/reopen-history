(() => {
  const api = globalThis.browser || globalThis.chrome;
  const slider = document.querySelector('#min-font-size');
  const output = document.querySelector('#min-font-size-value');
  const status = document.querySelector('#save-status');
  let revision = 0;
  let pending = null;
  let saving = false;

  function setStatus(key) {
    if (!status) return;
    status.dataset.i18n = key;
    status.textContent = ReopenI18n.t(key);
  }

  function apply(value) {
    const size = typeof value === 'number' && Number.isFinite(value)
      ? Math.max(13, Math.min(20, Math.round(value))) : 13;
    document.documentElement.style.setProperty('--min-font-size', `${size}px`);
    if (slider) {
      slider.value = String(size);
      slider.setAttribute('aria-valuetext', `${size}px`);
      output.value = `${size}px`;
    }
    return size;
  }

  // Keep writes ordered and coalesce intermediate values during a fast drag.
  async function save() {
    if (saving) return;
    saving = true;
    try {
      while (pending !== null) {
        const size = pending;
        pending = null;
        await api.storage.local.set({ minFontSize: size });
      }
      setStatus('saved');
    } catch {
      pending = null;
      setStatus('settingsError');
    } finally {
      saving = false;
    }
  }

  if (slider) {
    slider.disabled = true;
    slider.addEventListener('input', () => {
      ++revision;
      pending = apply(Number(slider.value));
      delete status.dataset.i18n;
      status.textContent = '';
      void save();
    });
  }
  api.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && Object.hasOwn(changes, 'minFontSize')) {
      ++revision;
      if (!saving) apply(changes.minFontSize.newValue);
    }
  });
  const initialRevision = revision;
  api.storage.local.get('minFontSize').then(saved => {
    if (revision === initialRevision) apply(saved.minFontSize);
  }).catch(() => {
    setStatus('settingsError');
  }).finally(() => {
    if (slider) slider.disabled = false;
  });
})();
