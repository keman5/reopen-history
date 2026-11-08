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

    await history.getByRole('searchbox').fill('/first');
    assert.equal(await history.locator('.entry').count(), 1);
    await history.getByRole('searchbox').fill('no-matching-test-address');
    await history.locator('#empty').filter({ hasText: await history.evaluate(() => api.i18n.getMessage('noResults')) }).waitFor();
    await history.getByRole('searchbox').fill('');
    console.log('PASS: history search and empty results');

    const options = await context.newPage();
    await options.goto(`chrome-extension://${id}/options.html`);
    const menu = options.locator('#context-menu');
    await menu.waitFor();
    await menu.isEnabled();
    assert.equal(await menu.isChecked(), false);
    await menu.check();
    await options.reload();
    await options.waitForFunction(() => !document.querySelector('#context-menu').disabled);
    assert.equal(await menu.isChecked(), true);
    await menu.uncheck();
    await options.reload();
    await options.waitForFunction(() => !document.querySelector('#context-menu').disabled);
    assert.equal(await menu.isChecked(), false);
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

    // UI strings and unsafe page titles must be treated as plain text.
    const rendered = await history.evaluate(() => {
      recent = [{ id: 'fake', title: '<img src=x onerror=alert(1)>', url: 'https://example.test', closedAt: Date.now(), tabCount: 0 }];
      render();
      return { images: document.querySelectorAll('#list img').length, title: document.querySelector('.title').textContent };
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
