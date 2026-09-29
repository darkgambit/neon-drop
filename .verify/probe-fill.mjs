/* Probe: is my column maths landing where the engine thinks the columns are? */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'https://neon-drop.netlify.app';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BOTTOM_BAND = 190;
const RESERVE = `#wrap{height:calc(100% - ${BOTTOM_BAND}px)!important}
  body{align-items:flex-start!important;padding-top:0!important}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 540, height: 960 }, deviceScaleFactor: 2,
  hasTouch: true, isMobile: true,
});
const page = await ctx.newPage();

// Capture the HUD text the engine paints, so we can read the guide's real x.
await page.addInitScript(() => {
  window.__hud = { cur: [], frame: [] };
  const P = CanvasRenderingContext2D.prototype;
  const _ft = P.fillText;
  P.fillText = function (t, x, y) { window.__hud.cur.push({ t: String(t), x, y }); return _ft.apply(this, arguments); };
  const _cr = P.clearRect;
  P.clearRect = function () { if (window.__hud.cur.length) window.__hud.frame = window.__hud.cur; window.__hud.cur = []; return _cr.apply(this, arguments); };
  Math.random = function () { return 0.1; };
});

await page.goto(`${BASE}/game/index.html`, { waitUntil: 'load' });
await page.addStyleTag({ content: RESERVE });
await sleep(300);

const before = await page.evaluate(() => {
  const w = document.getElementById('wrap');
  return { w: w.clientWidth, h: w.clientHeight };
});
console.log('wrap BEFORE resize dispatch:', JSON.stringify(before));

await page.evaluate(() => window.dispatchEvent(new Event('resize')));
await sleep(400);

const after = await page.evaluate(() => {
  const w = document.getElementById('wrap');
  const cv = document.getElementById('cv');
  return { w: w.clientWidth, h: w.clientHeight, cvw: cv.width, cvh: cv.height,
           cvClientW: cv.clientWidth, cvClientH: cv.clientHeight };
});
console.log('wrap AFTER  resize dispatch:', JSON.stringify(after));

await page.click('#playBtn');
await sleep(600);

const readGuide = () => page.evaluate(() => {
  const f = window.__hud.frame || [];
  // The engine paints the preview tile FIRST each frame, and only while playing.
  const playing = f.some((e) => String(e.t).startsWith('NEXT'));
  if (!playing || !f.length || !/^[0-9]/.test(String(f[0].t))) return null;
  return { x: f[0].x, y: f[0].y, v: f[0].t };
});

// My own maths, mirroring the engine
const TOPBAR = Math.min(96, after.h * 0.14);
const availH = after.h - TOPBAR - 16;
const CELL = Math.floor(Math.min((after.w - 24) / 5, availH / 9.25));
const OX = Math.floor((after.w - CELL * 5) / 2);
const OY = Math.floor(TOPBAR + CELL * 1.25);
console.log(`my maths: CELL=${CELL} OX=${OX} OY=${OY}`);

const box = await page.locator('#wrap').boundingBox();
console.log('wrap box:', JSON.stringify(box));

console.log('\ncolumn | my page-x | engine guide x (+box.x) | delta');
for (let c = 0; c < 5; c++) {
  const myX = box.x + OX + c * CELL + CELL / 2;
  await page.mouse.move(myX, box.y + OY + CELL);
  await sleep(180);
  const g = await readGuide();
  const engX = g ? box.x + g.x : null;
  console.log(`   ${c}   |  ${myX.toFixed(1)}  |  ${engX === null ? 'n/a' : engX.toFixed(1)}  |  ${engX === null ? '-' : (engX - myX).toFixed(1)}`);
}

await browser.close();
