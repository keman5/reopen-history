const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
(async () => {
  const source = await fs.readFile('assets/icon-master.png');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ deviceScaleFactor: 2 });
    for (const name of ['icon', 'toolbar']) {
      for (const size of name === 'icon' ? [16, 32, 48, 128, 512] : [16, 32]) {
        await page.setViewportSize({ width: size, height: size });
        await page.setContent(`<style>html,body{margin:0;background:transparent}img{display:block;width:100vw;height:100vh}</style><img src="data:image/png;base64,${source.toString('base64')}">`);
        await page.locator('img').evaluate(image => image.decode());
        const png = await page.screenshot({ omitBackground: true, scale: 'css' });
        assert.equal(png.readUInt32BE(16), size);
        assert.equal(png.readUInt32BE(20), size);
        await fs.writeFile(`extension/icons/${name}${size}.png`, png);
      }
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
