/* Probe: does the 40-drop checkerboard actually reach Game Over in the
   clip-recording configuration (540x960, dsf 2, mobile+touch)? */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'https://neon-drop.netlify.app';
const MOBILE = process.argv.includes('--mobile');   // toggles the mobile/touch context
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BOTTOM_BAND = 190;
const RESERVE = `#wrap{height:calc(100% - ${BOTTOM_BAND}px)!important}
  body{align-items:flex-start!important;padding-top:0!important}`;
const enc = (v) => { const pool = [2, 2, 2, 4, 4]; return (pool.indexOf(v) + 0.5) / pool.length; };

function fillSequence() {
  const pattern = (c, k) => (c % 2 === 0) ? (k % 2 === 0 ? 2 : 4) : (k % 2 === 0 ? 4 : 2);
  const seq = [{ col: 0, v: pattern(0, 0) }, { col: 2, v: pattern(2, 0) }];
  for (let k = 1; k < 8; k++) seq.push({ col: 0, v: pattern(0, k) });
  for (let k = 1; k < 8; k++) seq.push({ col: 2, v: pattern(2, k) });
  for (const c of [1, 3, 4]) for (let k = 0; k < 8; k++) seq.push({ col: c, v: pattern(c, k) });
  return seq;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 540, height: 960 }, deviceScaleFactor: 2,
  hasTouch: MOBILE, isMobile: MOBILE,
});
const page = await ctx.newPage();

await page.addInitScript(() => {
  window.__hud = { cur: [], frame: [] };
  const P = CanvasRenderingContext2D.prototype;
  const _ft = P.fillText;
  P.fillText = function (t, x, y) { window.__hud.cur.push({ t: String(t), x, y }); return _ft.apply(this, arguments); };
  const _cr = P.clearRect;
  P.clearRect = function () { if (window.__hud.cur.length) window.__hud.frame = window.__hud.cur; window.__hud.cur = []; return _cr.apply(this, arguments); };
  Math.random = function () { return window.__rand === undefined ? 0.1 : window.__rand; };
});

console.log('context:', MOBILE ? 'mobile + touch' : 'desktop, no touch');

await page.goto(`${BASE}/game/index.html`, { waitUntil: 'load' });
await page.addStyleTag({ content: RESERVE });
await page.evaluate(() => window.dispatchEvent(new Event('resize')));
await sleep(350);

const g = await page.evaluate(() => {
  const wrap = document.getElementById('wrap');
  const r = wrap.getBoundingClientRect();
  const h = wrap.clientHeight, w = wrap.clientWidth;
  const TOPBAR = Math.min(96, h * 0.14), availH = h - TOPBAR - 16;
  const CELL = Math.floor(Math.min((w - 24) / 5, availH / 9.25));
  const OX = Math.floor((w - CELL * 5) / 2), OY = Math.floor(TOPBAR + CELL * 1.25);
  return { x: r.left, y: r.top, CELL, OX, OY };
});
const colX = (c) => g.x + g.OX + c * g.CELL + g.CELL / 2;
const y = g.y + g.OY + g.CELL;

const readHud = () => page.evaluate(() => {
  const t = window.__hud.frame || [];
  const num = (s) => { const m = String(s).replace(/[^0-9.\-]/g, ''); return m === '' ? null : Number(m); };
  const find = (p) => t.findIndex((o) => o.t.startsWith(p));
  const si = find('SCORE'), ni = find('NEXT');
  return {
    score: si >= 0 && t[si + 1] ? num(t[si + 1].t) : null,
    next: ni >= 0 ? num(t[ni].t) : null,
    guide: (ni >= 0 && t.length && /^[0-9]/.test(String(t[0].t))) ? num(t[0].t) : null,
  };
});

const seq = fillSequence();
await page.evaluate((v) => { window.__rand = v; }, enc(seq[0].v));
await page.click('#playBtn');
await sleep(700);
console.log('after PLAY:', JSON.stringify(await readHud()));

let mismatches = 0, merges = 0, prevScore = 0;
for (let i = 0; i < seq.length; i++) {
  if (i + 2 < seq.length) await page.evaluate((v) => { window.__rand = v; }, enc(seq[i + 2].v));
  const pre = await readHud();
  if (pre.guide !== seq[i].v) { mismatches++; if (mismatches <= 6) console.log(`   drop#${i + 1} col${seq[i].col}: wanted ${seq[i].v}, guide showed ${pre.guide}`); }
  await page.mouse.click(colX(seq[i].col), y);
  await sleep(110);
  const post = await readHud();
  if (post.score !== null && prevScore !== null && post.score > prevScore) merges++;
  if (post.score !== null) prevScore = post.score;
  if (i % 8 === 7) console.log(`   after ${i + 1} drops: score=${post.score} next=${post.next}`);
}

await sleep(800);
const over = await page.locator('#overOverlay.on').count();
const revive = await page.locator('#reviveBtn').count();
const visible = revive ? await page.locator('#reviveBtn').isVisible() : false;
console.log(`\nvalue mismatches: ${mismatches}/${seq.length}`);
console.log(`score increases (merges): ${merges}`);
console.log(`#overOverlay.on: ${over}   #reviveBtn count: ${revive}  visible: ${visible}`);
await page.screenshot({ path: `.verify/tmp/fill-${MOBILE ? 'mobile' : 'desktop'}.png` });

await browser.close();
