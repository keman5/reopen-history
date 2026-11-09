const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const version = require('../package.json').version;
const output = path.join(os.homedir(), 'downloads', 'dist');

(async () => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'reopen-history-edge-'));
  const profile = path.join(scratch, 'profile');
  const target = process.argv[2] || 'chromium';
  let extension = path.join(output, `reopen-history-chromium-v${version}`);
  if (target === 'safari') {
    // Exercise Safari's production fallback in headless Edge; only the background manifest differs.
    extension = path.join(scratch, 'extension');
    fs.cpSync(path.join(output, `reopen-history-safari-v${version}`), extension, { recursive: true });
    const manifestPath = path.join(extension, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath));
    manifest.background = { service_worker: 'background.js' };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  }
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<!doctype html><title>Recovery test ' + req.url + '</title><p>Disposable extension test page.</p>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let context;
  try {
    context = await chromium.launchPersistentContext(profile, {
      channel: process.env.TEST_BROWSER || 'msedge', headless: true,
      args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
    });
    const errors = [];
    context.on('weberror', error => errors.push(error.error().message));
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    const id = new URL(worker.url()).host;
    assert.equal(await worker.evaluate(() => nativeSessions), target !== 'safari');
    console.log('Testing recovery backend:', target === 'safari' ? 'local URL fallback' : 'native sessions');
    const first = await context.newPage();
    await first.goto(base + '/first');
    await first.close();
    const second = await context.newPage();
    await second.goto(base + '/second');
    await second.close();
    const history = await context.newPage();
    await history.goto(`chrome-extension://${id}/history.html`);
    await history.getByRole('button', { name: 'Recovery test /second' }).waitFor();
    const titles = await history.locator('.title').allTextContents();
    assert.equal(titles[0], 'Recovery test /second');
    assert.equal(titles[1], 'Recovery test /first');
    console.log('PASS: closed tabs render newest first');
    const appName = await history.evaluate(() => api.i18n.getMessage('appName'));
    assert.equal(await history.locator('.brand span').textContent(), appName);
    assert.ok((await history.title()).endsWith(' · ' + appName));
    assert.equal(await worker.evaluate(() => api.runtime.getManifest().name), appName);
    assert.equal(require('../extension/_locales/zh_CN/messages.json').appName.message, '恢复已关闭标签');
    console.log('PASS: localized extension name, history brand and document title');

    assert.equal(await worker.evaluate(() => api.action.getBadgeText({})), '');
    assert.equal(await worker.evaluate(() => api.runtime.getManifest().action.default_icon), 'icons/icon128.png');
    assert.equal(await history.locator('#reopen').getAttribute('title'), null);
    assert.equal(await history.locator('#reopen').getAttribute('data-i18n-title'), null);
    const chromeHeights = await history.evaluate(() => ({
      header: document.querySelector('.toolbar').getBoundingClientRect().height,
      footer: document.querySelector('.footer').getBoundingClientRect().height
    }));
    assert.ok(chromeHeights.header <= 44);
    assert.ok(chromeHeights.footer <= 34);
    console.log('PASS: compact header/footer, no button hint or numeric badge, existing icon128 used');


    await history.getByRole('searchbox').fill('/first');
    assert.equal(await history.locator('.entry').count(), 1);
    await history.getByRole('searchbox').fill('no-matching-test-address');
    await history.locator('#empty').filter({ hasText: await history.evaluate(() => api.i18n.getMessage('noResults')) }).waitFor();
    await history.getByRole('searchbox').fill('');
    console.log('PASS: history search and empty results');

    const options = await context.newPage();
    await options.goto(`chrome-extension://${id}/options.html`);
    await options.waitForFunction(() => document.title.endsWith(' · ' + api.i18n.getMessage('appName')));
    assert.equal(await options.locator('.brand span').textContent(), appName);

    const language = options.locator('#language');
    assert.equal(await language.count(), 1, 'Settings must offer a language selector');
    assert.equal(await language.locator('option').count(), 13);
    assert.equal(await language.inputValue(), 'auto');
    const english = require('../extension/_locales/en/messages.json');
    const japanese = require('../extension/_locales/ja/messages.json');
    await language.focus();
    await language.selectOption('en');
    await options.waitForFunction(() => document.querySelector('h1').textContent === 'Settings');
    await history.waitForFunction(() => document.querySelector('.brand span').textContent === 'Reopen History');
    assert.equal(await history.locator('#search').getAttribute('placeholder'), english.search.message);
    await history.waitForFunction(async expected => await api.action.getTitle({}) === expected, english.actionTitle.message);
    assert.equal(await worker.evaluate(() => api.action.getTitle({})), english.actionTitle.message);
    assert.equal(await options.evaluate(() => document.activeElement.id), 'language', 'Changing language keeps keyboard focus');
    if (process.env.TEST_LANGUAGE_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.TEST_LANGUAGE_SCREENSHOT_DIR, { recursive: true });
      await options.screenshot({ path: path.join(process.env.TEST_LANGUAGE_SCREENSHOT_DIR, 'settings-language-english.png'), fullPage: true });
    }
    await options.reload();
    await options.waitForFunction(() => !document.querySelector('#language').disabled);
    assert.equal(await language.inputValue(), 'en', 'Language survives reload');
    await language.selectOption('ja');
    await history.waitForFunction(() => document.documentElement.lang === 'ja');
    assert.equal(await history.locator('#search').getAttribute('placeholder'), japanese.search.message);
    assert.equal(await history.locator('.time').first().evaluate(time => time.title === new Date(time.dateTime).toLocaleString('ja')), true);
    await language.selectOption('ar');
    for (const page of [history, options]) {
      await page.waitForFunction(() => document.documentElement.dir === 'rtl');
      assert.equal(await page.locator('html').getAttribute('lang'), 'ar');
      await page.setViewportSize({ width: 390, height: 760 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'RTL fits a narrow viewport');
    }
    if (process.env.TEST_LANGUAGE_SCREENSHOT_DIR) {
      await options.screenshot({ path: path.join(process.env.TEST_LANGUAGE_SCREENSHOT_DIR, 'settings-language-arabic.png'), fullPage: true });
    }
    await language.selectOption('auto');
    await history.waitForFunction(name => document.querySelector('.brand span').textContent === name, appName);
    const browserDirection = await options.evaluate(() => /^ar(?:-|_|$)/i.test(api.i18n.getUILanguage()) ? 'rtl' : 'ltr');
    await options.waitForFunction(dir => document.documentElement.dir === dir && document.querySelector('#language').value === 'auto', browserDirection);
    await options.setViewportSize({ width: 1280, height: 720 });
    await history.setViewportSize({ width: 1280, height: 720 });
    console.log('PASS: automatic and manual language selection, persistence, live history/date/action localization, focus and RTL');

    const menu = options.locator('#context-menu');
    await menu.waitFor();
    await menu.isEnabled();
    assert.equal(await menu.isChecked(), false);
    await options.locator('[data-i18n="showContextMenu"]').click();
    assert.equal(await menu.isChecked(), false, 'Clicking the setting text must not toggle the switch');
    const setting = options.locator('.setting');
    const settingBounds = await setting.boundingBox();
    await setting.click({ position: { x: settingBounds.width / 2, y: 2 } });
    assert.equal(await menu.isChecked(), false, 'Clicking row whitespace must not toggle the switch');
    assert.equal(await options.getByRole('switch', {
      name: await options.evaluate(() => api.i18n.getMessage('showContextMenu'))
    }).count(), 1, 'The switch retains its accessible name');
    await menu.check();
    await options.reload();
    await options.waitForFunction(() => !document.querySelector('#context-menu').disabled);
    assert.equal(await menu.isChecked(), true);
    await menu.uncheck();
    await options.reload();
    await options.waitForFunction(() => !document.querySelector('#context-menu').disabled);
    assert.equal(await menu.isChecked(), false);
    await menu.focus();
    await options.keyboard.press('Space');
    assert.equal(await menu.isChecked(), true, 'Keyboard Space toggles the focused switch');
    await options.waitForFunction(() => !document.querySelector('#context-menu').disabled);
    await options.keyboard.press('Space');
    assert.equal(await menu.isChecked(), false);
    await options.waitForFunction(() => !document.querySelector('#context-menu').disabled);
    console.log('PASS: only the switch toggles the context-menu preference; text and row clicks do not; accessible name and keyboard control retained');

    const minimumTextSize = page => page.evaluate(() => {
      const sizes = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.textContent.trim() && node.parentElement.getClientRects().length &&
            !['SCRIPT', 'STYLE'].includes(node.parentElement.tagName)) {
          sizes.push(parseFloat(getComputedStyle(node.parentElement).fontSize));
        }
      }
      sizes.push(parseFloat(getComputedStyle(document.querySelector('input')).fontSize));
      return Math.min(...sizes);
    });
    assert.ok(await minimumTextSize(history) >= 13, 'History defaults to at least 13px');
    assert.ok(await minimumTextSize(options) >= 13, 'Settings default to at least 13px');
    const slider = options.locator('#min-font-size');
    assert.equal(await slider.getAttribute('min'), '13');
    assert.equal(await slider.getAttribute('max'), '20');
    assert.equal(await slider.inputValue(), '13');
    const otherOptions = await context.newPage();
    await otherOptions.goto(`chrome-extension://${id}/options.html`);
    await otherOptions.waitForFunction(() => !document.querySelector('#min-font-size')?.disabled);
    await slider.evaluate(input => {
      input.value = '20';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      if (getComputedStyle(document.querySelector('.font-setting>label')).fontSize !== '20px') {
        throw new Error('Slider must update the current page in the input event');
      }
    });
    for (const page of [history, otherOptions]) {
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.brand')).fontSize === '20px');
      assert.ok(await minimumTextSize(page) >= 20);
    }
    assert.ok(await minimumTextSize(options) >= 20);
    assert.equal(await otherOptions.locator('#min-font-size').inputValue(), '20');
    for (const page of [history, options]) {
      await page.setViewportSize({ width: 390, height: 760 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '20px fits a narrow viewport');
    }
    if (process.env.TEST_FONT_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.TEST_FONT_SCREENSHOT_DIR, { recursive: true });
      await options.screenshot({ path: path.join(process.env.TEST_FONT_SCREENSHOT_DIR, 'font-settings-20px.png'), fullPage: true });
      await history.screenshot({ path: path.join(process.env.TEST_FONT_SCREENSHOT_DIR, 'font-history-20px.png'), fullPage: true });
    }
    await options.reload();
    await options.waitForFunction(() => document.querySelector('#min-font-size')?.value === '20');
    assert.ok(await minimumTextSize(options) >= 20, 'Font preference survives reload');
    await slider.evaluate(input => {
      for (const value of ['14', '20', '18', '19', '13']) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    for (const page of [history, otherOptions]) {
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.brand')).fontSize === '14px');
    }
    await options.reload();
    await options.waitForFunction(() => document.querySelector('#min-font-size')?.value === '13');
    for (const [value, expected] of [[100, 20], [-5, 13], [18.4, 18], ['invalid', 13]]) {
      await worker.evaluate(value => api.storage.local.set({ minFontSize: value }), value);
      await options.waitForFunction(size => document.querySelector('#min-font-size').value === String(size), expected);
      await history.waitForFunction(size => getComputedStyle(document.documentElement).getPropertyValue('--min-font-size').trim() === `${size}px`, expected);
    }
    await worker.evaluate(() => api.storage.local.remove('minFontSize'));
    await options.waitForFunction(() => !document.querySelector('#min-font-size').disabled);
    await slider.press('End');
    await history.waitForFunction(() => getComputedStyle(document.querySelector('.brand')).fontSize === '20px');
    await slider.press('Home');
    await history.waitForFunction(() => getComputedStyle(document.querySelector('.brand')).fontSize === '14px');
    await otherOptions.close();
    for (const page of [history, options]) await page.setViewportSize({ width: 1280, height: 720 });
    if (process.env.TEST_FONT_SCREENSHOT_DIR) {
      await options.screenshot({ path: path.join(process.env.TEST_FONT_SCREENSHOT_DIR, 'font-settings-13px.png'), fullPage: true });
    }
    console.log('PASS: 13–20px minimum font, live cross-page input updates, narrow layout, rapid changes, persistence, bounds and keyboard');
    await options.close();
    const blank = await context.newPage();
    await blank.close();
    await history.evaluate(() => load());
    assert.equal(await history.locator('.title').first().textContent(), 'Recovery test /second');
    console.log('PASS: options default off, persist changes, and closed options/blank pages are filtered');


    await history.keyboard.press('Escape');
    assert.equal(await history.locator('#history').isVisible(), false);
    const initialCount = await history.locator('.entry').count();
    await history.locator('#reopen').click({ delay: 650 });
    assert.equal(await history.locator('#history').isVisible(), true);
    assert.equal(await history.locator('.entry').count(), initialCount);
    console.log('PASS: long press reveals history without restoring; Escape collapses');

    const restoredPage = context.waitForEvent('page');
    await history.locator('#reopen').click();
    const restored = await restoredPage;
    await restored.waitForURL(base + '/second');
    await history.getByRole('button', { name: 'Recovery test /second' }).waitFor({ state: 'detached' });
    assert.equal(await history.locator('.title').first().textContent(), 'Recovery test /first');
    console.log('PASS: short press reopens the latest closed tab');

    const selectedPage = context.waitForEvent('page');
    await history.getByRole('button', { name: 'Recovery test /first' }).click();
    await (await selectedPage).waitForURL(base + '/first');
    console.log('PASS: selecting a history entry reopens the correct tab');

    // Invoke the registered action listener: headless mode has no physical toolbar.
    const toolbarTest = await context.newPage();
    await toolbarTest.goto(base + '/toolbar');
    await toolbarTest.close();
    const toolbarPage = context.waitForEvent('page');
    await worker.evaluate(() => serial(() => restore()));
    await (await toolbarPage).waitForURL(base + '/toolbar');
    console.log('PASS: toolbar handler restores a real closed tab (headless invocation)');

    const openedHistory = context.waitForEvent('page');
    await worker.evaluate(() => openHistory());
    const historyTab = await openedHistory;
    await historyTab.waitForURL(`chrome-extension://${id}/history.html`);
    await historyTab.locator('#search').waitFor();
    assert.equal(await worker.evaluate(async () => {
      const tabs = await api.tabs.query({ url: api.runtime.getURL('history.html') });
      const window = await api.windows.get(tabs.at(-1).windowId);
      return window.type;
    }), 'normal');
    assert.equal(await worker.evaluate(() => api.action.getPopup({})), '');
    assert.equal((await worker.evaluate(() => api.runtime.getContexts({ contextTypes: ['POPUP'] }))).length, 0);
    assert.equal(await historyTab.evaluate(() => document.activeElement === document.body), true);
    await historyTab.keyboard.press('Escape');
    assert.equal(historyTab.isClosed(), false);
    assert.equal(await historyTab.locator('#history').isVisible(), false);
    console.log('PASS: history opens directly in a normal tab without popup or forced focus; Escape keeps the tab open');

    const recoveryTab = await context.newPage();
    await recoveryTab.goto(base + '/history-restore');
    await recoveryTab.close();
    await historyTab.locator('.entry').filter({ hasText: 'Recovery test /history-restore' }).waitFor({ state: 'attached' });
    const historyRestore = context.waitForEvent('page');
    await historyTab.locator('#reopen').click();
    await (await historyRestore).waitForURL(base + '/history-restore');
    assert.equal(historyTab.isClosed(), false);
    console.log('PASS: history page restores the latest real tab and stays open');

    // Persist enough archived entries to exercise the real list and pagination path.
    const archived = await worker.evaluate(() => serial(async () => {
      const saved = closedTabs;
      closedTabs = Array.from({ length: 205 }, (_, i) => ({
        id: `archive-${i}`, title: `Archive ${i}`, url: `https://archive.test/${i}`,
        closedAt: Date.now() - i * 1000, tabCount: 0
      }));
      await api.storage.local.set({ closedTabs });
      return saved;
    }));
    await history.evaluate(() => load());
    assert.equal(await history.locator('h1').count(), 0);
    assert.equal(await history.locator('.entry').count(), 100);
    assert.equal(await history.locator('.latest-badge').count(), 1);
    assert.equal(await history.locator('#previous').isDisabled(), true);
    await history.locator('#next').click();
    assert.equal(await history.locator('.entry').count(), 100);
    assert.equal(await history.locator('.latest-badge').count(), 0);
    await history.locator('#next').click();
    assert.equal(await history.locator('.entry').count(), 5);
    assert.equal(await history.locator('#next').isDisabled(), true);
    await history.locator('#previous').click();
    assert.equal(await history.locator('.title').first().textContent(), 'Archive 100');
    await history.getByRole('searchbox').fill('Archive 204');
    assert.equal(await history.locator('.entry').count(), 1);
    assert.equal(await history.locator('#pagination').isVisible(), false);
    assert.equal(await history.locator('.latest-badge').count(), 0);
    await history.getByRole('searchbox').fill('');
    assert.equal(await history.locator('.title').first().textContent(), 'Archive 0');
    await history.locator('#next').click();
    await history.locator('#next').click();
    await worker.evaluate(saved => serial(async () => {
      closedTabs = saved;
      await api.storage.local.set({ closedTabs });
    }), archived);
    await history.evaluate(() => load());
    assert.equal(await history.locator('#pagination').isVisible(), false);
    console.log('PASS: unified list, latest-only badge, 100-entry pages, navigation, search reset and shrinking-page clamp');

    const siteIcons = await history.evaluate(async () => {
      const icon = siteIcon({ url: 'https://docs.google.com', favIconUrl: 'https://tracker.test/icon.png' });
      const remote = icon.querySelector('img')?.src || '';
      icon.querySelector('img')?.dispatchEvent(new Event('error'));
      const data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=';
      const cached = siteIcon({ url: 'https://example.com', favIconUrl: data });
      document.body.append(cached);
      const loaded = await new Promise(resolve => {
        const image = cached.querySelector('img');
        image.addEventListener('load', () => resolve(true));
        image.addEventListener('error', () => resolve(false));
      });
      const shown = cached.classList.contains('has-favicon');
      cached.remove();
      return { letter: icon.textContent, images: icon.querySelectorAll('img').length, color: icon.className, remote, loaded, shown };
    });
    assert.equal(siteIcons.letter, 'G');
    assert.equal(siteIcons.images, 0);
    assert.match(siteIcons.color, /site-color-[0-7]/);
    assert.equal(siteIcons.remote.includes('tracker.test'), false);
    assert.equal(siteIcons.loaded, true);
    assert.equal(siteIcons.shown, true);
    console.log('PASS: colored main-domain initials, cached raster icon display, load-error fallback and remote URL exclusion');

    // UI strings and unsafe page titles must be treated as plain text.
    const rendered = await history.evaluate(() => {
      recent = [{ id: 'fake', title: '<img src=x onerror=alert(1)>', url: 'https://example.test', closedAt: Date.now(), tabCount: 0 }];
      render();
      return { images: document.querySelectorAll('#list img:not(.entry-icon img)').length, title: document.querySelector('.title').textContent };
    });
    assert.equal(rendered.images, 0);
    assert.equal(rendered.title, '<img src=x onerror=alert(1)>');
    await history.evaluate(() => load());
    console.log('PASS: untrusted page titles cannot inject HTML');
    assert.deepEqual(errors, []);
    const screenshot = process.env.TEST_SCREENSHOT;
    if (screenshot) await history.screenshot({ path: screenshot, fullPage: true });
  } finally {
    await context?.close();
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(scratch, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
