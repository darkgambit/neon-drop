/* =============================================================
   shot-portal.mjs — store screenshots for portal listings.

   Portal listings need *gameplay* screenshots, not landing pages.

   Two things this file exists to get right:

   1. FRAMING. `#wrap` in game/index.html is capped at `max-width:520px`.
      At a tall viewport the board is therefore width-constrained and the
      lower third of the canvas is empty background. The viewport below is
      the tallest one at which the board still fills the frame:
        CELL      = (520-24)/5 = 99.2
        needed h  = TOPBAR + CELL*1.25 + 8*CELL + 16 = 112 + 9.25*99.2 = 1030
      deviceScaleFactor 2 gives a 1040x2060 PNG — hi-res, portrait, no
      dead space, which is the right shape for a portrait game.

   2. PACING. The engine ignores a drop while a tile is still falling, so
      clicking on a timer silently loses most drops and leaves the board
      nearly empty. We wait for the engine to be idle before the next drop,
      using the same non-invasive HUD hook as .verify/verify.mjs and
      tools/record-clips.mjs. It only observes; it changes no behaviour.

   RNG is seeded, so the same boards come back on every run. A listing
   screenshot you cannot reproduce cannot be updated later without guessing.

   Usage:
     node tools/shot-portal.mjs [baseUrl] [outDir]

   Default baseUrl is the LIVE site, so the shots prove production works.
   ============================================================= */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.argv[2] || 'https://neon-drop.netlify.app';
const OUT = path.resolve(process.argv[3] || 'dist/screenshots');

const W = 520;
const H = 1030;

// The debug network label the engine paints bottom-left. Not part of the
// product; do not ship it in a store screenshot.
const HIDE_DEBUG = '#netTag{display:none!important}';

/* Chosen by looking at the output, not by guessing: this seed/count trio gives
   (1) a live combo with a floating score popup, (2) a gold 64 mid-board, and
   (3) two 64s at score 699 with a fuller board. All three are populated — a
   nearly-empty board makes a weak listing thumbnail. */
const SHOTS = [
  { at: 20, name: '01-combo-cascade.png' },
  { at: 40, name: '02-building-64.png' },
  { at: 60, name: '03-high-scores.png' },
];
const TOTAL_DROPS = SHOTS[SHOTS.length - 1].at;

/* Overrides, for re-tuning the board without editing the file:
     SEED=123 AT=10,24,44 node tools/shot-portal.mjs                        */
const SEED = Number(process.env.SEED || 777);
if (process.env.AT) {
  const counts = process.env.AT.split(',').map(Number);
  counts.forEach((n, i) => { if (SHOTS[i]) SHOTS[i].at = n; });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Read the HUD the engine paints, without touching game logic. */
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

/** The engine paints a "NEXT <n>" label only when it is idle and accepting input. */
async function waitIdle(timeout = 8000) {
  await page.waitForFunction(
    () => (window.__hud.frame || []).some((o) => String(o.t).startsWith('NEXT')),
    null, { timeout, polling: 25 }
  ).catch(() => {});
}

/** Wait for the tile to land and the cascade to settle. */
async function waitLanded() {
  await page.waitForFunction(
    () => !(window.__hud.frame || []).some((o) => String(o.t).startsWith('NEXT')),
    null, { timeout: 3000, polling: 20 }
  ).catch(() => {});
  await waitIdle();
  await sleep(40);
}

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
});
const page = await ctx.newPage();
await page.addInitScript(HUD_HOOK);

await page.goto(BASE + '/game/index.html', { waitUntil: 'load' });
await page.addStyleTag({ content: HIDE_DEBUG }).catch(() => {});

// Deterministic values, so the boards are reproducible run to run.
await page.evaluate((seed) => {
  let s = seed;
  Math.random = function () {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}, SEED);

const play = page.locator('#playBtn');
if (await play.count()) {
  await play.click();
  await sleep(600);
}
await waitIdle();

const box = await page.locator('#cv').boundingBox();
if (!box) throw new Error('canvas #cv not found — cannot aim drops');

// A repeating column walk: spreads tiles so the board fills naturally and
// merges happen on their own. We are not steering the outcome.
const COL_WALK = [0, 2, 4, 1, 3, 2, 0, 4, 1, 3, 2, 4, 0, 1, 3, 2, 4, 0, 3, 1, 2, 4, 0, 3, 1, 2, 4, 0, 3, 2, 1, 4, 0, 3];

let dropped = 0;
for (const spec of SHOTS) {
  while (dropped < spec.at) {
    const col = COL_WALK[dropped % COL_WALK.length];
    await page.mouse.move(box.x + box.width * ((col + 0.5) / 5), box.y + box.height * 0.5);
    await sleep(50);
    await page.mouse.down();
    await page.mouse.up();
    dropped++;
    await waitLanded();
  }
  await sleep(450);

  if (await page.locator('#overOverlay.on').count()) {
    console.log(`!! game over reached after ${dropped} drops — "${spec.name}" NOT written`);
    break;
  }

  const file = path.join(OUT, spec.name);
  await page.screenshot({ path: file });
  const kb = (fs.statSync(file).size / 1024).toFixed(0);
  console.log(`wrote ${spec.name}  ${W * 2}x${H * 2}  ${kb} KB  (after ${dropped} drops)`);
}

await browser.close();
console.log('\nportal screenshots written to', OUT);
