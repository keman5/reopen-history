/* Shared by the worker, extension pages and Node tests. */
(function (root) {
  function isRestorable(tab) {
    if (!tab || tab.incognito || !tab.url) return false;
    try {
      const url = new URL(tab.url);
      if (!['http:', 'https:'].includes(url.protocol)) return false;
      return !(url.hostname === 'ntp.msn.com' && /^\/(edge\/)?ntp\/?$/.test(url.pathname));
    }
    catch { return false; }
  }

  function siteIdentity(url) {
    try {
      const host = new URL(url).hostname;
      const parser = typeof module !== 'undefined' ? require('tldts') : root.tldts;
      const domain = parser.getDomain(host, { allowPrivateDomains: true }) || host;
      const label = domain.split('.')[0];
      let hash = 0;
      for (const char of domain) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
      return { domain, letter: Array.from(label)[0]?.toUpperCase() || '?', color: hash % 8 };
    } catch { return { domain: '', letter: '?', color: 0 }; }
  }

  // Keep only small inline raster icons: remote URLs and active SVG never enter the cache.
  function cachedIcon(value) {
    return typeof value === 'string' && value.length <= 2048 &&
      /^data:image\/(png|jpeg|gif|webp|x-icon|vnd\.microsoft\.icon);base64,[a-z0-9+/]+=*$/i.test(value) ? value : '';
  }

  function sessionsToEntries(sessions) {
    return sessions.flatMap(session => {
      const item = session.tab || session.window;
      if (!item?.sessionId) return [];
      const tabs = session.window?.tabs || [];
      if (session.tab && !isRestorable(session.tab)) return [];
      // Native window restoration is atomic; skip mixed windows rather than reopen excluded pages.
      if (session.window && (!tabs.length || !tabs.every(isRestorable))) return [];
      return [{
        id: item.sessionId,
        title: session.tab?.title || session.tab?.url || tabs[0]?.title || tabs[0]?.url || '',
        url: session.tab?.url || tabs[0]?.url || '',
        closedAt: session.lastModified * 1000,
        tabCount: session.window ? tabs.length : 0,
        pinned: Boolean(session.tab?.pinned),
        favIconUrl: cachedIcon(session.tab?.favIconUrl || tabs[0]?.favIconUrl)
      }];
    });
  }

  function bindPress(button, { shortPress, longPress, delay = 500 }) {
    let timer;
    let held = false;
    const cancel = () => { clearTimeout(timer); timer = undefined; };
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !event.isPrimary) return;
      cancel();
      held = false;
      button.setPointerCapture(event.pointerId);
      timer = setTimeout(() => { timer = undefined; held = true; longPress(); }, delay);
    });
    button.addEventListener('pointerup', cancel);
    button.addEventListener('pointercancel', () => { cancel(); held = true; });
    button.addEventListener('lostpointercapture', cancel);
    button.addEventListener('keydown', event => {
      if (event.key === 'Escape') { cancel(); held = true; }
      if (event.key === 'Enter' || event.key === ' ') held = false;
    });
    button.addEventListener('click', () => {
      cancel();
      if (!held) shortPress();
      held = false;
    });
  }

  root.ReopenCore = { isRestorable, sessionsToEntries, bindPress, siteIdentity, cachedIcon };
  if (typeof module !== 'undefined') module.exports = root.ReopenCore;
})(globalThis);
