/* Probe: why doesn't the game start during clip recording? */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'https://neon-drop.netlify.app';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 540, height: 960 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
});
const page = await ctx.newPage();
page.on('console', (m) => console.log('   [console]', m.type(), m.text()));
page.on('pageerror', (e) => console.log('   [pageerror]', e.message));

await page.addInitScript(() => { Math.random = function () { return 0.1; }; });

console.log('goto landing…');
await page.goto(`${BASE}/`, { waitUntil: 'load' });
await sleep(400);

console.log('goto game…');
await page.goto(`${BASE}/game/index.html`, { waitUntil: 'load' });
await sleep(600);

const frames = page.frames().map((f) => f.url());
console.log('frames:', frames);

const frame = page.frames().find((f) => f.url().includes('/game/index.html')) || page;
console.log('chosen frame url:', frame.url(), ' isMain:', frame === page.mainFrame());

console.log('menu overlay .on before click:', await frame.locator('#menuOverlay.on').count());
console.log('playBtn count:', await frame.locator('#playBtn').count());

await frame.click('#playBtn');
await sleep(1200);

console.log('menu overlay .on after click :', await frame.locator('#menuOverlay.on').count());
console.log('canvas present:', await frame.locator('#cv').count());
const box = await frame.locator('#cv').boundingBox();
console.log('canvas box:', JSON.stringify(box));

// does a mouse click actually register a drop?
const before = await page.screenshot({ clip: box });
await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4);
await sleep(200);
await page.mouse.down();
await page.mouse.up();
await sleep(1200);
const after = await page.screenshot({ clip: box });
console.log('screenshot changed after a click:', !before.equals(after));

await browser.close();
