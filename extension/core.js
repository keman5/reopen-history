/* Shared by the worker, extension pages and Node tests. */
(function (root) {
  function isRestorable(tab) {
    if (!tab || tab.incognito || !tab.url) return false;
    try { return ['http:', 'https:'].includes(new URL(tab.url).protocol); }
    catch { return false; }
  }

  function sessionsToEntries(sessions) {
    return sessions.flatMap(session => {
      const item = session.tab || session.window;
      if (!item?.sessionId) return [];
      const tabs = session.window?.tabs || [];
      return [{
        id: item.sessionId,
        title: session.tab?.title || session.tab?.url || tabs[0]?.title || tabs[0]?.url || '',
        url: session.tab?.url || tabs[0]?.url || '',
        closedAt: session.lastModified * 1000,
        tabCount: session.window ? tabs.length : 0
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

  root.ReopenCore = { isRestorable, sessionsToEntries, bindPress };
  if (typeof module !== 'undefined') module.exports = root.ReopenCore;
})(globalThis);
