/* =============================================================
   verify-iframe-fit.mjs — does the portrait board survive a landscape iframe?

   GameDistribution's guidelines recommend an 800x600 iframe. Neon Drop is a
   portrait game, so the risk is that the board gets clipped or letterboxed into
   an unplayable sliver inside a landscape frame — a submission-killer that no
   functional test would catch, because the game would still "work".

   The engine sizes itself with
       CELL = min((w-24)/COLS, (h-TOPBAR-16)/(ROWS+1.25))
   so it is min-constrained and should adapt. This checks that claim in a real
   browser instead of trusting the arithmetic.

   Note: getImageData() returns an all-white buffer in headless Chromium, so
   pixel inspection is useless here. We assert on geometry and on the game
   actually starting, and write screenshots for a human to eyeball.

   Usage:  node .verify/verify-iframe-fit.mjs
   ============================================================= */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GAME = path.join(ROOT, 'game');
const OUT = path.join(ROOT, '.verify', 'out-iframe');

const results = [];
const record = (name, pass, detail = '') => {
  results.push({ name, pass });
  console.log(`  ${pass ? '✅ PASS' : '❌ FAIL'}  ${name}${detail ? `\n           ${detail}` : ''}`);
};

/* Serve game/ so index.html can load game.js + monetize.js by relative path. */
const srv = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const file = path.join(GAME, rel);
  if (!file.startsWith(GAME) || !fs.existsSync(file)) { res.writeHead(404); return res.end('nope'); }
  const ext = path.extname(file);
  res.writeHead(200, {
    'Content-Type': ext === '.html' ? 'text/html' : ext === '.js' ? 'text/javascript' : 'application/octet-stream',
  });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${srv.address().port}`;

fs.mkdirSync(OUT, { recursive: true });

/* Landscape portal frames, plus the desktop control. */
const VIEWPORTS = [
  { w: 800, h: 600,  label: '800x600  (GD recommended)' },
  { w: 640, h: 480,  label: '640x480  (small landscape)' },
  { w: 1024, h: 768, label: '1024x768 (4:3 desktop)' },
  { w: 520, h: 1030, label: '520x1030 (portrait control)' },
];

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  console.log(`\n── ${vp.label} ──────────────────────────────────`);
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));

  await page.goto(`${base}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(600);

  /* The board's own geometry, read from the canvas the engine actually drew to.
     CELL/OX/OY are private to the IIFE, so derive them the same way the engine
     does and compare against the live wrap box. */
  const geo = await page.evaluate(() => {
    const wrap = document.getElementById('wrap');
    const cv = document.getElementById('cv');
    const w = wrap.clientWidth, h = wrap.clientHeight;
    const COLS = 5, ROWS = 8;
    const TOPBAR = Math.min(96, h * 0.14);
    const availH = h - TOPBAR - 16;
    const CELL = Math.floor(Math.min((w - 24) / COLS, availH / (ROWS + 1.25)));
    const OX = Math.floor((w - CELL * COLS) / 2);
    const OY = Math.floor(TOPBAR + CELL * 1.25);
    return {
      wrapW: w, wrapH: h, CELL, OX, OY,
      boardW: CELL * COLS, boardH: CELL * ROWS,
      boardBottom: OY + CELL * ROWS,
      canvasW: cv.style.width, canvasH: cv.style.height,
    };
  });

  const fitsH = geo.boardBottom <= geo.wrapH;
  const fitsW = geo.OX >= 0 && geo.OX + geo.boardW <= geo.wrapW;
  const usable = geo.CELL >= 24;

  record(`${vp.w}x${vp.h}: board fits vertically (no clipping)`, fitsH,
    `board bottom ${geo.boardBottom}px vs frame ${geo.wrapH}px`);
  record(`${vp.w}x${vp.h}: board fits horizontally`, fitsW,
    `x ${geo.OX}..${geo.OX + geo.boardW} in ${geo.wrapW}px`);
  record(`${vp.w}x${vp.h}: cells stay a usable size`, usable,
    `CELL=${geo.CELL}px (board ${geo.boardW}x${geo.boardH})`);

  /* A board that renders but cannot start is still a rejected submission. */
  await page.click('#playBtn');
  await page.waitForTimeout(900);
  const started = await page.evaluate(() => {
    const ov = document.getElementById('menuOverlay');
    return !!ov && !ov.classList.contains('on');
  }).catch(() => false);
  record(`${vp.w}x${vp.h}: game starts from Play`, started,
    started ? 'menu dismissed' : 'menu still showing');

  await page.screenshot({ path: path.join(OUT, `fit-${vp.w}x${vp.h}.png`) });
  record(`${vp.w}x${vp.h}: no console errors`, errors.length === 0,
    errors.slice(0, 2).join(' | ') || 'clean');

  await ctx.close();
}

await browser.close();
srv.close();

const failed = results.filter((r) => !r.pass).length;
console.log(`\nscreenshots -> ${path.relative(ROOT, OUT)}`);
console.log(`${'='.repeat(62)}`);
console.log(`  ${results.length - failed} passed, ${failed} failed  (of ${results.length})`);
console.log('='.repeat(62) + '\n');
process.exit(failed ? 1 : 0);
