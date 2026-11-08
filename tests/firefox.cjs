const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

(async () => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'reopen-history-firefox-'));
  const extension = path.join(scratch, 'extension');
  let finish;
  const result = new Promise(resolve => { finish = resolve; });
  const server = http.createServer((req, res) => {
    if (req.url === '/result') {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => { res.end('ok'); finish(JSON.parse(data)); });
    } else {
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><title>Firefox recovery test</title><p>Disposable test page</p>');
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let child, timer;
  let logs = '';
  try {
    fs.cpSync('dist/firefox', extension, { recursive: true });
    const manifestPath = path.join(extension, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath));
    assert.equal(Object.hasOwn(manifest.background, 'persistent'), false, 'MV3 background must not declare persistent');
    // Only the disposable test copy can POST assertions to localhost.
    manifest.host_permissions = ['http://127.0.0.1/*'];
    manifest.background.scripts.push('probe.js');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    fs.writeFileSync(path.join(extension, 'probe.js'), `
(async () => {
  const base = ${JSON.stringify(base)};
  try {
    if (!nativeSessions) throw new Error('Firefox must use native sessions');
    const tab = await api.tabs.create({ url: base + '/firefox' });
    for (let i = 0; i < 100; i++) {
      const current = await api.tabs.get(tab.id);
      if (current.status === 'complete' && current.url === base + '/firefox' && current.title === 'Firefox recovery test') break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    await api.tabs.remove(tab.id);
    let entry;
    for (let i = 0; i < 100; i++) {
      entry = (await entries()).find(item => item.url === base + '/firefox');
      if (entry) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!entry || entry.title !== 'Firefox recovery test') throw new Error('Missing closed tab metadata: ' + JSON.stringify(await entries()));
    await serial(() => restore(entry.id));
    let reopened = false;
    for (let i = 0; i < 100; i++) {
      const open = await api.tabs.query({});
      reopened = open.some(item => item.url === base + '/firefox' && item.status === 'complete');
      if (reopened) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!reopened) throw new Error('Session did not restore');
    if ((await entries()).some(item => item.id === entry.id)) throw new Error('Restored session still listed');
    await fetch(base + '/result', { method: 'POST', body: JSON.stringify({ ok: true }) });
  } catch (error) {
    await fetch(base + '/result', { method: 'POST', body: JSON.stringify({ ok: false, error: error.message }) });
  }
})();
`);
    child = spawn('npm', ['exec', '--yes', '--package=web-ext', '--', 'web-ext', 'run',
      '--source-dir', extension, '--firefox', '/Applications/Firefox.app/Contents/MacOS/firefox',
      '--no-input', '--no-reload', '--no-config-discovery', '--args=-headless', '--start-url', 'about:blank'],
    { detached: true, env: { ...process.env, MOZ_HEADLESS: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', data => { logs += data; });
    child.stderr.on('data', data => { logs += data; });
    const report = await Promise.race([result, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Firefox check timed out\n' + logs)), 60000);
      child.once('error', reject);
    })]);
    assert.equal(report.ok, true, report.error);
    console.log('PASS: actual headless Firefox loads the MV3 background, lists closed tab metadata, restores its native session and removes it from history');
  } finally {
    clearTimeout(timer);
    if (child?.pid) {
      try { process.kill(-child.pid, 'SIGTERM'); } catch {}
    }
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(scratch, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
