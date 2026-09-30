/* =============================================================
   verify-gd-release.mjs — pre-flight the REAL GameDistribution bundle.

   verify-gd-build.mjs proves the injection MECHANISM works, using a throwaway
   id and a temp build. This does the opposite: it inspects the actual artefact
   you are about to upload, dist/neon-drop-gd.zip, and refuses to bless it if
   anything is wrong.

   Why this exists: the dashboard's two post-upload checklist items — "Implement
   and test the SDK" and "Rewarded Ads" — can only be completed by a build that
   actually loads GD's SDK. Upload a bundle with an empty gdGameId and the game
   plays perfectly while never requesting an ad, so the checklist silently never
   completes and the cause looks like a broken integration.

   Checks:
     1. dist/neon-drop-gd.zip exists
     2. gdGameId inside it is non-empty
     3. it is NOT the known GD documentation example id
     4. at runtime the adapter reports network='gamedistribution'
     5. the GD SDK is actually requested
     6. the game still starts, with no console errors from our code

   Usage:  node .verify/verify-gd-release.mjs
   ============================================================= */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PY = 'C:/Users/ADMIN/.workbuddy-ai/binaries/python/versions/3.13.12/python.exe';
const ZIP = path.join(ROOT, 'dist', 'neon-drop-gd.zip');
const GD_SDK = 'html5.api.gamedistribution.com';

/* The id printed in GameDistribution's own SDK-Implementation wiki. It is an
   example, not a real game id — a bundle carrying it fails activation, and it
   has already appeared in this repo once by accident. */
const GD_DOC_EXAMPLE_ID = '49258a0e497c42b5b5d87887f24d27a6';

const results = [];
const record = (name, pass, detail = '') => {
  results.push({ name, pass });
  console.log(`  ${pass ? '✅ PASS' : '❌ FAIL'}  ${name}${detail ? `\n           ${detail}` : ''}`);
};

console.log('\n── the real release artefact ──────────────────────────────');

if (!fs.existsSync(ZIP)) {
  console.log('  ❌ dist/neon-drop-gd.zip does not exist.');
  console.log('\n  Build it first:');
  console.log('      python tools/make-itch-zip.py --gd-id <GAME_ID>\n');
  process.exit(1);
}
record('dist/neon-drop-gd.zip exists', true, `${(fs.statSync(ZIP).size / 1024).toFixed(1)} KB`);

/* ---- read the id straight out of the artefact ---------------------------- */
const src = execFileSync(PY, ['-c',
  `import zipfile;print(zipfile.ZipFile(r"${ZIP}").read("monetize.js").decode())`],
  { encoding: 'utf8' });

const m = src.match(/gdGameId:\s*'([^']*)'/);
const gameId = m ? m[1] : '';

record('gdGameId inside the zip is non-empty', !!gameId, `gdGameId=${JSON.stringify(gameId)}`);

if (!gameId) {
  console.log('\n  The bundle carries no game id, so the SDK will never load.');
  console.log('  Rebuild with --gd-id <GAME_ID>.\n');
  process.exit(1);
}

record('gdGameId is not GD\'s documentation example id', gameId !== GD_DOC_EXAMPLE_ID,
  gameId === GD_DOC_EXAMPLE_ID
    ? `it IS the wiki example (${GD_DOC_EXAMPLE_ID}) — GD will reject this at activation`
    : 'not the example id');

/* ---- load it in a browser and check what it actually does --------------- */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nd-release-'));
const dir = path.join(tmp, 'x');
fs.mkdirSync(dir, { recursive: true });
execFileSync(PY, ['-c', `import zipfile;zipfile.ZipFile(r"${ZIP}").extractall(r"${dir}")`]);

const srv = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const file = path.join(dir, rel);
  if (!file.startsWith(dir) || !fs.existsSync(file)) { res.writeHead(404); return res.end('nope'); }
  const ext = path.extname(file);
  res.writeHead(200, {
    'Content-Type': ext === '.html' ? 'text/html' : ext === '.js' ? 'text/javascript' : 'application/octet-stream',
  });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${srv.address().port}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 414, height: 896 } });
const page = await ctx.newPage();

const sdkRequests = [];
const consoleErrors = [];
page.on('request', (r) => { if (r.url().includes(GD_SDK)) sdkRequests.push(r.url()); });
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', (e) => consoleErrors.push('[pageerror] ' + e.message));

await page.goto(`${base}/index.html`, { waitUntil: 'load' });
await page.waitForTimeout(2500);

const state = await page.evaluate(() => ({
  network: window.Ads ? window.Ads.network : null,
  gdGameId: window.Ads && window.Ads.config ? window.Ads.config.gdGameId : null,
}));

record('adapter reports network=gamedistribution at runtime',
  state.network === 'gamedistribution', `network=${state.network}`);
record('the id survives into the running game',
  state.gdGameId === gameId, `runtime gdGameId=${JSON.stringify(state.gdGameId)}`);
record('the GD SDK is actually requested', sdkRequests.length > 0,
  `${sdkRequests.length} request(s) to ${GD_SDK}`);

await page.click('#playBtn');
await page.waitForTimeout(1200);
const started = await page.evaluate(() => {
  const ov = document.getElementById('menuOverlay');
  return !!ov && !ov.classList.contains('on');
}).catch(() => false);
record('game still starts from the Play button', started,
  started ? 'menu overlay dismissed' : 'menu overlay still showing');

/* GD's SDK complains about browsingTopics()/COOP over plain-HTTP localhost —
   a harness artefact, not a defect. Same scoping as the other suites. */
const SDK_NOISE = /browsingTopics|Cross-Origin-Opener-Policy|potentially trustworthy|gamedistribution/i;
const ours = consoleErrors.filter((e) => !SDK_NOISE.test(e));
record('no console errors from our code', ours.length === 0, ours.slice(0, 2).join(' | ') || 'clean');

await browser.close();
srv.close();
fs.rmSync(tmp, { recursive: true, force: true });

const failed = results.filter((r) => !r.pass).length;
console.log(`\n${'='.repeat(62)}`);
if (failed) {
  console.log(`  ${results.length - failed} passed, ${failed} FAILED  (of ${results.length})`);
  console.log('  DO NOT UPLOAD until this is clean.');
} else {
  console.log(`  ${results.length - failed} passed, 0 failed  (of ${results.length})`);
  console.log(`  READY TO UPLOAD — game id ${gameId}`);
}
console.log('='.repeat(62) + '\n');
process.exit(failed ? 1 : 0);
