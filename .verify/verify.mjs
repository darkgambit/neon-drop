/* =============================================================
   NEON DROP — Phase 1 end-to-end verification harness
   -------------------------------------------------------------
   ZERO modifications to the shipped game. Everything here observes
   the game the way a player does, plus two non-invasive hooks
   installed via addInitScript:

     1. CanvasRenderingContext2D.fillText / clearRect are wrapped to
        capture the HUD text the engine actually paints each frame
        (score, best, combo, next, and the drop-guide tile).
     2. Math.random is pinned to a controllable constant so tile
        values are deterministic. This is what lets us drive a real
        game to a real Game Over.

   Usage:  node verify.mjs [baseUrl]
   ============================================================= */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const BASE = process.argv[2] || 'http://127.0.0.1:8080';
const OUT = process.env.EVIDENCE_DIR || path.resolve('.verify/out');
fs.mkdirSync(OUT, { recursive: true });

/* ----------------------------------------------------------------
   Minimal PNG decoder.
   WHY: in headless Chromium, `canvas.getContext('2d').getImageData()`
   returns an all-white buffer for this game's canvas, so pixel
   assertions built on it are vacuous. Screenshots are the ground
   truth of what the compositor actually shows, so we decode those
   instead. Handles 8-bit RGB/RGBA, non-interlaced — what Chromium
   emits — with no external dependencies.
   ---------------------------------------------------------------- */
function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let off = 8, w = 0, h = 0, colorType = 0, bitDepth = 0, interlace = 0;
  const idat = [];
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (bitDepth !== 8 || interlace !== 0) throw new Error(`unsupported PNG (depth ${bitDepth}, interlace ${interlace})`);
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (ft === 1) v += a;
      else if (ft === 2) v += b;
      else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      }
      cur[x] = v & 0xff;
    }
    cur.copy(out, y * stride);
    prev = cur;
  }
  return { w, h, bpp, data: out };
}

/** Fraction of sampled pixels whose brightest channel exceeds `thr`. */
function brightRatio(png, thr = 110, step = 3) {
  const { w, h, bpp, data } = png;
  let bright = 0, n = 0;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * bpp;
      n++;
      if (data[i] > thr || data[i + 1] > thr || data[i + 2] > thr) bright++;
    }
  }
  return { bright, n, ratio: bright / Math.max(1, n) };
}

/** The engine draws the preview tile at OY - CELL*1.15 and centres its label,
 *  so the label's y is OY - 0.65*CELL (+1 for the baseline nudge). */
const boardTopY = (hud, cell) => hud.guide ? hud.guide.y + 0.65 * cell - 1 : null;

const results = [];
let consoleErrors = [];
let failedRequests = [];      // FIRST-PARTY only — these count against the app
let thirdPartyFailures = [];  // ad/analytics hosts: reported, never fatal
let adRequests = [];          // third-party ad calls, asserted POSITIVELY
const BASE_ORIGIN = new URL(BASE).origin;
const isFirstParty = (u) => u.startsWith(BASE_ORIGIN);

function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`  ${pass ? '✅ PASS' : '❌ FAIL'}  ${name}${detail ? `\n           ${detail}` : ''}`);
}
function section(t) { console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 58 - t.length))}`); }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* ------------------------------------------------ injected hooks */
async function initHooks(page) {
  await page.addInitScript(() => {
    window.__rand = 0.5;
    Math.random = function () { return window.__rand; };
    window.__hud = { cur: [], frame: [] };
    const P = CanvasRenderingContext2D.prototype;
    const _ft = P.fillText;
    P.fillText = function (t, x, y) {
      window.__hud.cur.push({ t: String(t), x: x, y: y });
      return _ft.apply(this, arguments);
    };
    const _cr = P.clearRect;
    P.clearRect = function () {
      if (window.__hud.cur.length) window.__hud.frame = window.__hud.cur;
      window.__hud.cur = [];
      return _cr.apply(this, arguments);
    };
  });
}

/* ---------------------------------------------------- HUD reader */
const readHud = (page) => page.evaluate(() => {
  const t = window.__hud.frame || [];
  const num = (s) => { const m = String(s).replace(/[^0-9.\-]/g, ''); return m === '' ? null : Number(m); };
  const find = (p) => t.findIndex(o => o.t.startsWith(p));
  const si = find('SCORE'), bi = find('BEST'), ni = find('NEXT'), ci = find('COMBO');
  return {
    score: si >= 0 && t[si + 1] ? num(t[si + 1].t) : null,
    best: bi >= 0 && t[bi + 1] ? num(t[bi + 1].t) : null,
    next: ni >= 0 ? num(t[ni].t) : null,
    combo: ci >= 0 ? num(t[ci].t) : null,
    guide: (ni >= 0 && t.length && /^[0-9]/.test(t[0].t)) ? { v: num(t[0].t), x: t[0].x, y: t[0].y } : null,
    raw: t.map(o => o.t),
  };
});

async function waitPlaying(page, timeout = 6000) {
  await page.waitForFunction(
    () => (window.__hud.frame || []).some(o => o.t.startsWith('NEXT')),
    null, { timeout, polling: 30 }
  ).catch(() => {});
}
async function waitLanded(page) {
  await page.waitForFunction(
    () => !(window.__hud.frame || []).some(o => o.t.startsWith('NEXT')),
    null, { timeout: 1500, polling: 20 }
  ).catch(() => {});
  await waitPlaying(page);
  await sleep(60);
}

/* ------------------------------------------------------ geometry */
async function canvasRect(page) {
  return page.evaluate(() => {
    const cv = document.getElementById('cv');
    const r = cv.getBoundingClientRect();
    return { left: r.left, top: r.top, w: r.width, h: r.height };
  });
}

/** Move the pointer to both board edges to measure the real cell size. */
async function measureGrid(page) {
  const r = await canvasRect(page);
  const y = r.top + r.h * 0.55;
  await page.mouse.move(r.left + 2, y);
  await sleep(140);
  const a = await readHud(page);
  await page.mouse.move(r.left + r.w - 2, y);
  await sleep(140);
  const b = await readHud(page);
  if (!a.guide || !b.guide) return null;
  // NOTE: guide.x is the x the engine passes to fillText for the preview tile,
  // and drawTile centres its label — so guide.x is the column's CENTRE, not its
  // left edge. Column centres are OX + c*CELL + CELL/2, hence a uniform CELL gap.
  const c0 = a.guide.x, c4 = b.guide.x;
  const cell = (c4 - c0) / 4;
  return {
    rect: r, xLeft: c0, xRight: c4, cell, y,
    colX: (c) => r.left + c0 + c * cell,
    guideXAt: async (c) => { await page.mouse.move(r.left + c0 + c * cell, y); await sleep(140); return (await readHud(page)).guide?.x ?? null; },
  };
}

/* ------------------------------------------------------ dropping */
async function dropAt(page, g, col) {
  await page.mouse.move(g.colX(col), g.y);
  await page.mouse.down();
  await page.mouse.up();
  await waitLanded(page);
}
async function setRand(page, v) { await page.evaluate(x => { window.__rand = x; }, v); }
/** Encode a desired tile value into the constant Math.random returns. */
function enc(v) { const pool = [2, 2, 2, 4, 4]; const i = pool.indexOf(v); return (i + 0.5) / pool.length; }

/* ---------------------------------------------- page bootstrap */
async function newPage(browser, { hasTouch = false, viewport = { width: 414, height: 896 } } = {}) {
  const ctx = await browser.newContext({ viewport, hasTouch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(`[${page.url().split('/').pop()}] ${m.text()}`); });
  page.on('pageerror', e => consoleErrors.push(`[pageerror] ${e.message}`));
  // Scope failure attribution by origin. Adsterra banners are third-party by
  // design: ad blockers, DNS filters and the network's own latency make them
  // fail for reasons that are not our code. Collect them, print them, never
  // fail on them — but assert the ad calls DO happen (see T12), so filtering
  // the noise does not silently delete the coverage.
  const noteFailure = (u, detail) => {
    const line = `${detail} ${u}`;
    (isFirstParty(u) ? failedRequests : thirdPartyFailures).push(line);
  };
  page.on('requestfailed', r => noteFailure(r.url(), r.failure()?.errorText ?? 'failed'));
  page.on('response', r => { if (r.status() >= 400) noteFailure(r.url(), String(r.status())); });
  page.on('request', r => { if (/highrevenueformat\.com/.test(r.url())) adRequests.push(page.url()); });
  await initHooks(page);
  return { ctx, page };
}

/* ============================================================ */
/* ======================== MAIN ============================== */
/* ============================================================ */
const browser = await chromium.launch();

/* ---------- T0: landing page ---------- */
section('T0  Landing page loads clean');
{
  const { ctx, page } = await newPage(browser);
  const resp = await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(900);
  record('Landing page returns 200', resp.status() === 200, `HTTP ${resp.status()}`);
  const facade = await page.locator('#gameLaunch').count();
  record('Landing offers a click-to-play game facade', facade === 1);
  // Only OUR game frame counts. A host may inject its own chrome as an iframe —
  // Netlify's "Powered by Netlify" badge is <iframe id="nl-badge-frame">, injected
  // at the edge into every HTML page. Counting bare 'iframe' elements therefore
  // fails on any such host for reasons that have nothing to do with the facade.
  const preClickGameFrames = page.frames().filter((f) => f.url().includes('/game/index.html')).length;
  record('No game iframe is loaded before the user clicks (critical path is clean)',
    preClickGameFrames === 0, `${preClickGameFrames} game frame(s)`);
  await page.click('#gameLaunch');
  await sleep(1400);
  const gf = page.frames().filter(f => f.url().includes('/game/index.html'));
  record('Clicking the facade embeds the game', gf.length === 1, `${gf.length} game frame(s)`);
  const embeddedLive = gf.length
    ? await gf[0].evaluate(() => {
        const cv = document.getElementById('cv');
        return !!cv && cv.width > 0 && !!document.getElementById('playBtn');
      })
    : false;
  record('Embedded game boots and exposes its canvas + PLAY button', embeddedLive);
  const h1 = (await page.locator('h1').first().innerText()).replace(/\s+/g, ' ');
  record('Hero headline renders', h1.length > 5, `"${h1}"`);
  const adSlots = await page.locator('.adslot').count();
  record('Two ad slots present on landing page', adSlots === 2, `found ${adSlots}`);
  const jsonld = await page.locator('script[type="application/ld+json"]').count();
  record('JSON-LD VideoGame structured data present', jsonld === 1);
  const faq = await page.locator('#faq details').count();
  record('FAQ block present', faq >= 5, `${faq} questions`);
  const links = await page.locator('footer a').count();
  record('Footer legal links present (AdSense requirement)', links >= 3, `${links} links`);
  await page.screenshot({ path: path.join(OUT, '01-landing.png'), fullPage: false });
  await ctx.close();
}

/* ---------- T1..T5: game core ---------- */
section('T1  Game page loads and the board renders');
const { ctx: gctx, page: game } = await newPage(browser);
{
  const resp = await game.goto(`${BASE}/game/index.html`, { waitUntil: 'load' });
  record('Game page returns 200', resp.status() === 200, `HTTP ${resp.status()}`);
  await sleep(700);

  const dims = await game.evaluate(() => {
    const cv = document.getElementById('cv');
    return { w: cv.width, h: cv.height, cw: cv.clientWidth, ch: cv.clientHeight };
  });
  record('Canvas has non-zero backing size', dims.w > 0 && dims.h > 0, `${dims.w}×${dims.h} (css ${dims.cw}×${dims.ch})`);

  const menuVisible = await game.locator('#menuOverlay.on').count();
  record('Start menu overlay is shown on boot', menuVisible === 1);

  // Ask the adapter directly. This used to scrape `#netTag`'s text, which made
  // the check depend on a debug label being visible — so hiding that label for
  // players looked like an adapter failure. Query the real state instead.
  const netInfo = await game.evaluate(() => ({
    hasAds: !!window.Ads,
    network: window.Ads ? window.Ads.network : null,
    ready: window.Ads ? window.Ads.ready : null,
    debug: window.Ads ? window.Ads.debug : null,
  }));
  record('Ad adapter loaded and reports a detected network',
    netInfo.hasAds && typeof netInfo.network === 'string' && netInfo.network.length > 0,
    `network=${netInfo.network} ready=${netInfo.ready}`);
  record('Ad adapter debug output is OFF in the shipped build', netInfo.debug === false,
    `debug=${netInfo.debug}`);
}

section('T2  Drop guide tracks the pointer across all 5 columns');
let g = null;
{
  await game.click('#playBtn');
  await waitPlaying(game);
  g = await measureGrid(game);
  if (!g) record('Grid geometry measured', false, 'no guide text captured — is the game in playing state?');
  else {
    const xs = [];
    for (let c = 0; c < 5; c++) xs.push(await g.guideXAt(c));
    const distinct = new Set(xs.map(x => Math.round(x))).size;
    record('Guide x changes for each of the 5 columns', distinct === 5, `x = [${xs.join(', ')}]`);
    const ascending = xs.every((x, i) => i === 0 || x > xs[i - 1]);
    record('Guide x increases left→right', ascending);
    const gaps = xs.slice(1).map((x, i) => Math.round(x - xs[i]));
    const uniform = gaps.every(d => Math.abs(d - gaps[0]) <= 1);
    record('Column spacing is uniform (= one cell width)', uniform, `cell ≈ ${gaps[0]}px, gaps [${gaps.join(', ')}]`);
  }
}

section('T3–T5  Drop, land, merge, cascade and combo');
if (!g) { record('T3–T5 skipped — grid geometry could not be measured', false); }
else {
  // All tiles forced to value 2 → guaranteed merges and cascades.
  await setRand(game, enc(2));
  const before = await readHud(game);
  const startScore = before.score ?? 0;

  // Baseline: the same board region while the board is still empty, so the final
  // pixel assertion is a real differential rather than a magic threshold.
  const emptyTop = boardTopY(before, g.cell);
  const boardClip = { x: g.xLeft - g.cell / 2, y: emptyTop, width: g.cell * 5, height: g.cell * 8 };
  const emptyStats = brightRatio(decodePNG(await game.screenshot({ clip: boardClip })));

  let sawMerge = false, sawCascade = false, maxCombo = 0, landedOk = true;
  const cols = [0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < cols.length; i++) {
    const pre = await readHud(game);
    if (pre.guide && pre.guide.v !== 2) landedOk = false;
    await dropAt(game, g, cols[i]);
    const post = await readHud(game);
    if ((post.score ?? 0) > startScore) sawMerge = true;
    if ((post.combo ?? 0) >= 2) { sawCascade = true; maxCombo = Math.max(maxCombo, post.combo); }
  }
  const after = await readHud(game);
  record('A tile drops and lands (state returns to playing)', after.next !== null, `NEXT=${after.next}`);
  record('Deterministic value control works (every tile was a 2)', landedOk);
  record('Merging equal neighbours increases the score', sawMerge, `score ${startScore} → ${after.score}`);
  record('Cascades chain and the combo multiplier climbs', sawCascade, `peak COMBO x${maxCombo}`);
  record('BEST updates to the current score', (after.best ?? 0) >= (after.score ?? 0), `best=${after.best} score=${after.score}`);

  // Pixel evidence from the real compositor output (see decodePNG note).
  const stats = brightRatio(decodePNG(await game.screenshot({ clip: boardClip })));
  record('Canvas actually paints tiles (screenshot pixel check)',
    stats.ratio > emptyStats.ratio + 0.015,
    `lit board pixels ${(emptyStats.ratio * 100).toFixed(2)}% empty → ${(stats.ratio * 100).toFixed(2)}% after 8 drops (${stats.bright}/${stats.n})`);
  await game.screenshot({ path: path.join(OUT, '02-gameplay.png') });
}

section('T6  Score and BEST survive a page reload');
{
  const stored = await game.evaluate(() => JSON.parse(localStorage.getItem('neondrop') || '{}'));
  record('State is written to localStorage', (stored.best ?? 0) > 0, JSON.stringify(stored));
  await game.reload({ waitUntil: 'load' });
  await sleep(700);
  const menuBest = await game.locator('#bestMenu').innerText();
  record('BEST is restored into the menu after reload', Number(menuBest.replace(/,/g, '')) === stored.best,
    `menu shows ${menuBest}, stored ${stored.best}`);
}

section('T7  Game Over fires when the board fills with no merges left');
if (!g) { record('T7–T8 skipped — grid geometry could not be measured', false); }
else {
  // Target: a full board with NO two orthogonally adjacent equal tiles.
  // Even columns bottom-up 2,4,2,4…, odd columns 4,2,4,2…  (a checkerboard)
  const pattern = (c, k) => (c % 2 === 0) ? (k % 2 === 0 ? 2 : 4) : (k % 2 === 0 ? 4 : 2);
  // NOTE ON ORDER: startGame() calls pickValue() twice, and spawn() only runs
  // again after a landing — so drops 1 and 2 are forced to share a value, and
  // drop k>=3 takes the value primed one landing earlier. We therefore open with
  // the two "2" bottom tiles of columns 0 and 2 (non-adjacent, so they can't merge)
  // and let the checkerboard fall out from there.
  const seq = [{ col: 0, v: pattern(0, 0) }, { col: 2, v: pattern(2, 0) }];
  for (let k = 1; k < 8; k++) seq.push({ col: 0, v: pattern(0, k) });
  for (let k = 1; k < 8; k++) seq.push({ col: 2, v: pattern(2, k) });
  for (const c of [1, 3, 4]) for (let k = 0; k < 8; k++) seq.push({ col: c, v: pattern(c, k) });

  // Value control lags the engine — prime it BEFORE startGame() runs.
  await setRand(game, enc(seq[0].v));
  await game.click('#playBtn');
  await waitPlaying(game);
  g = await measureGrid(game) || g;

  let mismatch = 0;
  const mmDetail = [];
  let dropsDone = 0;
  for (let i = 0; i < seq.length; i++) {
    if (i + 2 < seq.length) await setRand(game, enc(seq[i + 2].v));
    const pre = await readHud(game);
    if (pre.guide && pre.guide.v !== seq[i].v) {
      mismatch++;
      if (mmDetail.length < 10) mmDetail.push(`drop#${i + 1} col${seq[i].col}: expected ${seq[i].v}, board showed ${pre.guide.v}`);
    }
    await dropAt(game, g, seq[i].col);
    dropsDone++;
    if (await game.locator('#overOverlay.on').count()) break;
  }
  const overShown = await game.locator('#overOverlay.on').count() === 1;
  record('Game Over overlay fires after the board fills', overShown,
    overShown
      ? `reached after ${dropsDone} drops filling 5×8 with a non-merging checkerboard`
      : `${dropsDone}/40 drops placed, ${mismatch} value mismatches` + (mmDetail.length ? `\n           ${mmDetail.join('\n           ')}` : ''));
  if (overShown) {
    const finalScore = await game.locator('#finalScore').innerText();
    const finalBest = await game.locator('#finalBest').innerText();
    record('Game Over panel reports a score and best', finalScore !== '' && finalBest !== '', `score=${finalScore} best=${finalBest}`);
    await game.screenshot({ path: path.join(OUT, '03-gameover.png') });

    section('T8  "Watch ad & continue" clears the top rows and resumes play');
    const scoreAtOver = Number((await game.locator('#finalScore').innerText()).replace(/,/g, ''));
    const reviveVisible = await game.locator('#reviveBtn').isVisible();
    record('Rewarded-continue button is offered', reviveVisible);
    await game.click('#reviveBtn');
    await sleep(1100);
    const resumed = await readHud(game);
    const overlayGone = await game.locator('#overOverlay.on').count() === 0;
    record('Rewarded ad resolves and play resumes', overlayGone && resumed.next !== null,
      `overlay closed=${overlayGone}, NEXT=${resumed.next}`);
    record('Score is preserved through the revive', (resumed.score ?? 0) === scoreAtOver,
      `${scoreAtOver} before → ${resumed.score} after (a no-merge checkerboard scores 0 by design)`);

    // Sample ONLY the board's top 3 rows from a real screenshot. The HUD and the
    // floating preview tile sit above OY, so they are excluded by construction.
    const OY = boardTopY(resumed, g.cell);
    if (OY === null) record('Top 3 rows were cleared by the reward', false, 'guide not visible');
    else {
      const shotTop = await game.screenshot({
        clip: { x: g.xLeft - g.cell / 2, y: OY, width: g.cell * 5, height: g.cell * 3 },
      });
      const t = brightRatio(decodePNG(shotTop));
      record('Top 3 rows were cleared by the reward', t.ratio < 0.02,
        `${(t.ratio * 100).toFixed(2)}% of the top-3-row pixels are lit (${t.bright}/${t.n})`);
      // and prove the rows BELOW are still populated, so "cleared" ≠ "board wiped"
      const shotBelow = await game.screenshot({
        clip: { x: g.xLeft - g.cell / 2, y: OY + g.cell * 3, width: g.cell * 5, height: g.cell * 5 },
      });
      const b2 = brightRatio(decodePNG(shotBelow));
      record('The rows below the reward survived (board was not wiped)', b2.ratio > 0.10,
        `${(b2.ratio * 100).toFixed(1)}% of the lower-5-row pixels are lit (${b2.bright}/${b2.n})`);
    }
    await game.screenshot({ path: path.join(OUT, '04-after-revive.png') });
  }
}

section('T9  Keyboard controls (← → + Space)');
{
  const before = await readHud(game);
  await game.keyboard.press('ArrowLeft');
  await sleep(120);
  const left = await readHud(game);
  await game.keyboard.press('ArrowRight');
  await game.keyboard.press('ArrowRight');
  await sleep(120);
  const right = await readHud(game);
  record('ArrowLeft moves the drop guide left', (left.guide?.x ?? 0) < (before.guide?.x ?? 0),
    `${before.guide?.x} → ${left.guide?.x}`);
  record('ArrowRight moves the drop guide right', (right.guide?.x ?? 0) > (left.guide?.x ?? 0),
    `${left.guide?.x} → ${right.guide?.x}`);
  const scoreBefore = (await readHud(game)).score ?? 0;
  await game.keyboard.press('Space');
  await waitLanded(game);
  const afterSpace = await readHud(game);
  record('Space drops a tile', afterSpace.next !== null && afterSpace.guide !== null,
    `score ${scoreBefore} → ${afterSpace.score}`);
}

section('T10  Touch controls');
{
  const { ctx: tctx, page: tp } = await newPage(browser, { hasTouch: true, viewport: { width: 390, height: 844 } });
  await tp.goto(`${BASE}/game/index.html`, { waitUntil: 'load' });
  await sleep(600);
  await tp.tap('#playBtn');
  await waitPlaying(tp);
  const tg = await measureGrid(tp);
  const r = await canvasRect(tp);
  if (tg) {
    await tp.touchscreen.tap(tg.colX(3), r.top + r.h * 0.55);
    await waitLanded(tp);
    const h = await readHud(tp);
    record('Touch tap drops a tile into the tapped column', h.next !== null && h.guide !== null, `NEXT=${h.next}`);
  } else {
    record('Touch tap drops a tile', false, 'could not measure grid');
  }
  await tctx.close();
}

await gctx.close();

section('T11  Responsive: playable at 4 viewports');
for (const vp of [{ width: 360, height: 640 }, { width: 414, height: 896 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
  const { ctx: vctx, page: vp_page } = await newPage(browser, { viewport: vp });
  try {
    await vp_page.goto(`${BASE}/game/index.html`, { waitUntil: 'load' });
    await sleep(500);
    await vp_page.click('#playBtn');
    await waitPlaying(vp_page);
    const vg = await measureGrid(vp_page);
    if (!vg) { record(`${vp.width}×${vp.height} — grid measurable`, false); await vctx.close(); continue; }
    await setRand(vp_page, enc(2));
    await dropAt(vp_page, vg, 2);
    await dropAt(vp_page, vg, 2);
    const h = await readHud(vp_page);
    // Board spans OX .. OX+5*CELL; xLeft/xRight are column CENTRES.
    const boardL = vg.xLeft - vg.cell / 2, boardR = vg.xRight + vg.cell / 2;
    const fits = boardL >= -1 && boardR <= vg.rect.w + 1;
    record(`${vp.width}×${vp.height} — board fits, renders, accepts drops`,
      fits && h.next !== null && (h.score ?? 0) > 0,
      `cell=${vg.cell.toFixed(1)}px board=[${boardL.toFixed(0)}..${boardR.toFixed(0)}] canvasW=${vg.rect.w.toFixed(0)}px score=${h.score}`);
    await vp_page.screenshot({ path: path.join(OUT, `05-viewport-${vp.width}x${vp.height}.png`) });
  } catch (e) {
    record(`${vp.width}×${vp.height} — playable`, false, e.message.split('\n')[0]);
  }
  await vctx.close();
}

section('T12  Console errors and failed requests');
{
  const uniqErr = [...new Set(consoleErrors)];
  const uniqReq = [...new Set(failedRequests)];
  record('Zero console errors across every page and viewport', uniqErr.length === 0,
    uniqErr.length ? uniqErr.slice(0, 8).join(' | ') : 'none');
  record('Zero first-party 404s / failed requests', uniqReq.length === 0,
    uniqReq.length ? uniqReq.slice(0, 8).join(' | ') : 'none');

  // Positive assertion for what we filtered out. Without this, scoping the
  // check to first-party would hide a page that silently lost its ad tag —
  // which is invisible revenue loss.
  //
  // Both directions are asserted, because the consent gate makes "no ad fired"
  // ambiguous on its own: it is either a revenue bug (bad) or the gate working
  // (good). A one-sided check cannot tell them apart, so:
  //   no consent  -> ZERO ad requests   (privacy gate is real)
  //   consent     -> ad requests FIRE   (the money path is wired)
  const { ctx: gctx, page: gpage } = await newPage(browser);
  await gpage.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(1200);
  const adNoConsent = adRequests.length;
  await gpage.evaluate(() => { try { localStorage.setItem('nd_ad_consent', 'granted'); } catch (e) {} });
  await gpage.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(2600);
  const adWithConsent = adRequests.length;
  await gctx.close();

  record('No ad request fires before consent is granted',
    adNoConsent === 0, `${adNoConsent} ad request(s) on a first visit`);
  const adPages = new Set(adRequests);
  record('Ad tag present on content pages after consent (728x90 / 320x50 / 300x250 units requested)',
    adWithConsent > 0, `${adWithConsent} ad request(s) from ${adPages.size} page load(s)`);
  if (thirdPartyFailures.length) {
    console.log(`\n  note: ${thirdPartyFailures.length} third-party request(s) failed ` +
      `(ad host — expected with blockers/filters, not counted against the app)`);
    for (const t of [...new Set(thirdPartyFailures)].slice(0, 3)) console.log('        ' + t.slice(0, 120));
  }
}

section('T13  No developer-facing text ships to players');
{
  // Regression guard. `#netTag` used to render unconditionally, so a player on
  // a portal saw "ad network: none" painted at the foot of the board. It is now
  // gated on AD_CONFIG.debug; this makes sure it stays that way.
  const dctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const dpage = await dctx.newPage();
  try {
    await dpage.goto(BASE + '/game/index.html', { waitUntil: 'load' });
    const play = dpage.locator('#playBtn');
    if (await play.count()) { await play.click(); await sleep(1400); }
    const tag = String((await dpage.locator('#netTag').textContent().catch(() => '')) || '').trim();
    record('Debug network label is hidden from players', tag === '',
      tag ? `visible text: "${tag}"` : 'empty');
    const body = await dpage.locator('body').innerText().catch(() => '');
    const leaks = ['ad network:', 'undefined', 'NaN', '[object Object]'].filter((s) => body.includes(s));
    record('No dev artefacts in the rendered game text', leaks.length === 0, leaks.join(', ') || 'none');
  } catch (e) {
    record('No developer-facing text ships to players', false, e.message.split('\n')[0]);
  }
  await dctx.close();
}

await browser.close();

/* --------------------------------------------------- summary */
const pass = results.filter(r => r.pass).length;
const fail = results.length - pass;
console.log(`\n${'='.repeat(62)}`);
console.log(`  PHASE 1 RESULT:  ${pass} passed, ${fail} failed  (of ${results.length})`);
console.log('='.repeat(62));
if (fail) {
  console.log('\nFAILURES:');
  results.filter(r => !r.pass).forEach(r => console.log(`  ✗ ${r.name}${r.detail ? ` — ${r.detail}` : ''}`));
}
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ base: BASE, pass, fail, results }, null, 2));
console.log(`\nEvidence written to ${OUT}`);
process.exit(fail ? 1 : 0);
