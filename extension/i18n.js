(() => {
  const api = globalThis.browser || globalThis.chrome;
  const languages = [
    { value: 'en', name: 'English' },
    { value: 'zh_CN', name: '简体中文' },
    { value: 'zh_TW', name: '繁體中文' },
    { value: 'ja', name: '日本語' },
    { value: 'ko', name: '한국어' },
    { value: 'de', name: 'Deutsch' },
    { value: 'fr', name: 'Français' },
    { value: 'es', name: 'Español' },
    { value: 'pt_BR', name: 'Português (Brasil)' },
    { value: 'it', name: 'Italiano' },
    { value: 'ru', name: 'Русский' },
    { value: 'ar', name: 'العربية' }
  ];
  const supported = new Set(languages.map(({ value }) => value));
  const listeners = new Set();
  const cache = new Map();
  let preference = 'auto';
  let locale = 'en';
  let messages = {};
  let english = {};
  let revision = 0;
  let pendingPreference;
  let pending;

  function browserLocale() {
    const tag = api.i18n.getUILanguage().replaceAll('_', '-').toLowerCase();
    if (tag === 'zh' || tag.startsWith('zh-')) {
      return /(?:^|-)(hant|tw|hk|mo)(?:-|$)/.test(tag) ? 'zh_TW' : 'zh_CN';
    }
    const base = tag.split('-')[0];
    return base === 'pt' ? 'pt_BR' : supported.has(base) ? base : 'en';
  }

  function catalog(code) {
    if (!cache.has(code)) {
      cache.set(code, fetch(api.runtime.getURL(`_locales/${code}/messages.json`))
        .then(response => {
          if (!response.ok) throw new Error('Could not load bundled language');
          return response.json();
        }).catch(() => ({})));
    }
    return cache.get(code);
  }

  function apply(value) {
    const nextPreference = supported.has(value) ? value : 'auto';
    if (pendingPreference === nextPreference) return pending;
    pendingPreference = nextPreference;
    const nextLocale = nextPreference === 'auto' ? browserLocale() : nextPreference;
    const current = ++revision;
    pending = Promise.all([catalog('en'), catalog(nextLocale)]).then(([fallback, translated]) => {
      if (current !== revision) return;
      preference = nextPreference;
      locale = nextLocale.replaceAll('_', '-');
      english = fallback;
      messages = translated;
      for (const listener of listeners) listener();
    });
    return pending;
  }

  function t(key, substitutions = []) {
    const message = messages[key]?.message || english[key]?.message;
    if (!message) return api.i18n.getMessage(key, substitutions);
    const values = Array.isArray(substitutions) ? substitutions : [substitutions];
    return message.replace(/\$\$|\$(\d+)/g, (token, index) => token === '$$' ? '$' : String(values[Number(index) - 1] ?? ''));
  }

  function localizeDocument(titleKey) {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
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
    document.title = `${t(titleKey)} · ${t('appName')}`;
  }

  const initialRevision = revision;
  const ready = api.storage.local.get('language').then(saved => {
    return revision === initialRevision ? apply(saved.language) : pending;
  }, () => revision === initialRevision ? apply('auto') : pending);
  api.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && Object.hasOwn(changes, 'language')) return apply(changes.language.newValue);
  });
  globalThis.ReopenI18n = {
    languages, ready, t, localizeDocument,
    get locale() { return locale; },
    get preference() { return preference; },
    subscribe(listener) { listeners.add(listener); },
    async setLanguage(value) {
      if (value !== 'auto' && !supported.has(value)) throw new Error('Unsupported language');
      const before = revision;
      await api.storage.local.set({ language: value });
      // A newer storage event may already have selected a different language.
      if (revision === before || pendingPreference === value) await apply(value);
      else await pending;
    }
  };
})();
