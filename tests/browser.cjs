const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

(async () => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'reopen-history-edge-'));
  const profile = path.join(scratch, 'profile');
  const target = process.argv[2] || 'chromium';
  let extension = path.resolve('dist/chromium');
  if (target === 'safari') {
    // Exercise Safari's production fallback in headless Edge; only the background manifest differs.
    extension = path.join(scratch, 'extension');
    fs.cpSync('dist/safari', extension, { recursive: true });
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
