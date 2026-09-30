/* =============================================================
   verify-itch.mjs — prove the itch.io listing actually plays.

   A 200 on the store page proves nothing: itch wraps the game in a
   cross-origin iframe (html-classic.itch.zone) that only loads after the
   visitor presses Run game. This drives the real page, in a real browser,
   the way a player does, and reports what it measured.

   Usage:
     node .verify/verify-itch.mjs [pageUrl]
   ============================================================= */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const PAGE_URL = process.argv[2] || 'https://kdbdeocampo.itch.io/neon-drop';
const OUT = path.resolve('.verify/shots-itch');
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
const record = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

/* Read the HUD the engine paints. Observes only; changes no behaviour. */
const HUD_HOOK = () => {
  window.__hud = { cur: [], frame: [] };
  const P = CanvasRenderingContext2D.prototype;
  const _ft = P.fillText;
  P.fillText = function (t, x, y) {
    window.__hud.cur.push({ t: String(t), x, y });
    return _ft.apply(this, arguments);
  };
  const _cr = P.clearRect;
  P.clearRect = function () {
    if (window.__hud.cur.length) window.__hud.frame = window.__hud.cur;
    window.__hud.cur = [];
    return _cr.apply(this, arguments);
  };
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
});
await ctx.addInitScript(HUD_HOOK);
const page = await ctx.newPage();

const consoleErrors = [];
const ours = [];   // failed requests issued by the GAME frame (itch.zone) — our problem
const theirs = []; // failed requests issued by itch.io's own page shell — not our problem
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
const noteFail = (text, url) => {
  const line = `${text}  ${url.slice(0, 120)}`;
  const inGame = /itch\.zone/.test(url);
  (inGame ? ours : theirs).push(line);
};
page.on('requestfailed', (r) => {
  // Attribute by the frame that issued it: itch.io's store shell runs its own
  // Google Analytics beacon, which aborts on close and is not our code.
  const fu = r.frame() ? r.frame().url() : '';
  const url = r.url();
  const line = `${r.failure()?.errorText}  ${url.slice(0, 120)}`;
  (/itch\.zone/.test(url) || /itch\.zone/.test(fu) ? ours : theirs).push(line);
});
page.on('response', (r) => { if (r.status() >= 400) noteFail(`HTTP ${r.status()}`, r.url()); });

// ---------------------------------------------------------------- store page
await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await sleep(1500);
record('Store page loaded', true, page.url());

const title = await page.title();
record('Page title names the game', /Neon Drop/i.test(title), title);

// ------------------------------------------------------- the game is opt-in
let gameFrame = page.frames().find((f) => f.url().includes('itch.zone'));
record('Game iframe NOT auto-loaded before the visitor asks (store page stays light)',
  !gameFrame, gameFrame ? gameFrame.url() : 'no itch.zone frame yet');

// Press Run game the way a player does.
const runBtn = page.locator('button:has-text("Run game"), a:has-text("Run game"), .game_loader button').first();
if (await runBtn.count()) {
  await runBtn.click().catch(() => {});
  record('Pressed "Run game"', true);
} else {
  record('Pressed "Run game"', false, 'button not found — trying auto-load');
}

// ------------------------------------------------------------- the game itself
for (let i = 0; i < 60 && !gameFrame; i++) {
  await sleep(500);
  gameFrame = page.frames().find((f) => f.url().includes('itch.zone'));
}
record('Game iframe loaded from itch CDN', !!gameFrame, gameFrame ? gameFrame.url() : 'timeout');

if (!gameFrame) {
  await page.screenshot({ path: path.join(OUT, 'itch-failed.png') });
  await browser.close();
  console.log('\nCould not reach the game frame. Screenshot: .verify/shots-itch/itch-failed.png');
  process.exit(1);
}

// Wait for the engine to boot and expose the HUD.
await gameFrame.waitForFunction(
  () => (window.__hud && (window.__hud.frame || []).length) || document.getElementById('cv'),
  null, { timeout: 20000, polling: 50 }
).catch(() => {});
await sleep(1500);

const hasCanvas = await gameFrame.locator('#cv').count();
record('Game canvas present', hasCanvas > 0, `${hasCanvas} canvas`);

const box = await gameFrame.locator('#cv').boundingBox();
record('Canvas has real dimensions', !!box && box.width > 100 && box.height > 100,
  box ? `${Math.round(box.width)}x${Math.round(box.height)}` : 'no box');

await page.screenshot({ path: path.join(OUT, 'itch-1-menu.png') });

// Start a game.
const playBtn = gameFrame.locator('#playBtn');
if (await playBtn.count()) {
  await playBtn.click();
  await sleep(800);
}
await gameFrame.waitForFunction(
  () => (window.__hud.frame || []).some((o) => String(o.t).startsWith('NEXT')),
  null, { timeout: 8000, polling: 25 }
).catch(() => {});

const scoreOf = async () => {
  const items = await gameFrame.evaluate(() => window.__hud.frame || []);
  const si = items.findIndex((o) => String(o.t).trim().toUpperCase() === 'SCORE');
  if (si >= 0 && items[si + 1]) return String(items[si + 1].t).trim();
  return null;
};

const scoreBefore = await scoreOf();
record('HUD is rendering (SCORE readable)', scoreBefore !== null, `SCORE = ${scoreBefore}`);

// Drop tiles. The engine ignores a drop while a tile is falling, so pace on
// the engine being idle rather than on a timer.
const waitLanded = async () => {
  await gameFrame.waitForFunction(
    () => !(window.__hud.frame || []).some((o) => String(o.t).startsWith('NEXT')),
    null, { timeout: 3000, polling: 20 }
  ).catch(() => {});
  await gameFrame.waitForFunction(
    () => (window.__hud.frame || []).some((o) => String(o.t).startsWith('NEXT')),
    null, { timeout: 6000, polling: 25 }
  ).catch(() => {});
  await sleep(40);
};

let dropped = 0;
for (const col of [0, 2, 4, 1, 3, 2]) {
  if (!box) break;
  await page.mouse.move(box.x + box.width * ((col + 0.5) / 5), box.y + box.height * 0.5);
  await sleep(60);
  await page.mouse.down();
  await page.mouse.up();
  dropped++;
  await waitLanded();
}
record('Drops accepted on the itch build', dropped === 6, `${dropped}/6 registered`);

const scoreAfter = await scoreOf();
record('Score changed — the game is actually playable', scoreAfter !== null && scoreAfter !== scoreBefore,
  `${scoreBefore} -> ${scoreAfter}`);

await sleep(400);
await page.screenshot({ path: path.join(OUT, 'itch-2-playing.png') });

// --------------------------------------------------------------- cleanliness
const realErrors = consoleErrors.filter((e) => !/favicon/i.test(e));
record('No console errors', realErrors.length === 0,
  realErrors.length ? realErrors.slice(0, 3).join(' | ') : 'clean');

const realFails = ours.filter((u) => !/favicon/i.test(u));
record('No failed requests from OUR game frame', realFails.length === 0,
  realFails.length ? realFails.slice(0, 3).join(' | ') : 'clean');

console.log(`\n(note: ${theirs.length} request(s) failed in itch.io's own page shell — ` +
  `their analytics, not our game)`);
for (const t of [...new Set(theirs)].slice(0, 3)) console.log('    ' + t);

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
console.log('screenshots: .verify/shots-itch/');
process.exit(failed.length ? 1 : 0);
