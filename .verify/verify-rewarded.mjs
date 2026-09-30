/* =============================================================
   verify-rewarded.mjs — the reward must require a COMPLETED view.

   GameDistribution's docs are unambiguous:

     "You can track 'SDK_REWARDED_WATCH_COMPLETE' event if that event
      triggered, that means the user watched the advertisement completely,
      you can give reward there."
     ".catch(error => { // An error catched. Please don't give reward here. })"

   The original adapter resolved TRUE whenever gdsdk.showAd('rewarded')
   resolved. That promise also settles when the player CLOSES the ad early, so
   a skipped ad paid out the reward — a breach of GD's completed-impression
   rule and exactly what their invalid-traffic clawback clauses target.

   This test drives both paths against a stubbed gdsdk and asserts the
   OUTCOME of Ads.rewarded(), which is what the game actually branches on:

     complete event fired   -> true   (reward given)
     closed early, no event -> false  (reward withheld)

   Usage:  node .verify/verify-rewarded.mjs
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

const results = [];
const record = (name, pass, detail = '') => {
  results.push({ name, pass });
  console.log(`  ${pass ? '✅ PASS' : '❌ FAIL'}  ${name}${detail ? `\n           ${detail}` : ''}`);
};

/* Build a GD bundle with a throwaway id into a temp dir — never dist/. */
const TEST_ID = 'TESTIDNOTREAL00000000000000000000';
const BUILD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'nd-reward-'));
console.log('\n── building a GD bundle (throwaway id, dist/ untouched) ──');
execFileSync(PY, ['tools/make-itch-zip.py', '--gd-id', TEST_ID, '--out-dir', BUILD_DIR],
  { cwd: ROOT, stdio: 'pipe' });

const dir = path.join(BUILD_DIR, 'x');
fs.mkdirSync(dir, { recursive: true });
execFileSync(PY, ['-c',
  `import zipfile;zipfile.ZipFile(r"${path.join(BUILD_DIR, 'neon-drop-gd.zip')}").extractall(r"${dir}")`]);

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

/* Hermetic: block the real SDK so our stub is the only gdsdk. */
await ctx.route('**html5.api.gamedistribution.com/**', (r) => r.abort());

await ctx.addInitScript(() => {
  window.__stub = { showAdCalls: 0, preloadCalls: 0 };
  window.gdsdk = {
    preloadAd: function () { window.__stub.preloadCalls++; return Promise.resolve(); },
    showAd: function () { window.__stub.showAdCalls++; return Promise.resolve(); },
  };
});

const page = await ctx.newPage();
const consoleErrors = [];
const failedRequests = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('[pageerror] ' + e.message));
page.on('requestfailed', (r) => failedRequests.push(r.url()));

await page.goto(`${base}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => window.Ads && window.Ads.ready, null, { timeout: 15000 });

const net = await page.evaluate(() => window.Ads.network);
record('adapter routed to gamedistribution', net === 'gamedistribution', `network=${net}`);

const hasOnEvent = await page.evaluate(
  () => !!(window.GD_OPTIONS && typeof window.GD_OPTIONS.onEvent === 'function'));
record('GD_OPTIONS.onEvent is registered (the reward signal can arrive)', hasOnEvent);

/* ---- Scenario A: the player watches the ad to completion ---------------- */
console.log('\n── A: ad watched completely ───────────────────────────────');
const completeResult = await page.evaluate(async () => {
  const p = window.Ads.rewarded();
  // The SDK reports a completed view, exactly as GD documents.
  window.GD_OPTIONS.onEvent({ name: 'SDK_REWARDED_WATCH_COMPLETE' });
  return await p;
});
record('rewarded() resolves TRUE when the completion event fires',
  completeResult === true, `resolved ${JSON.stringify(completeResult)}`);

/* ---- Scenario B: the player closes the ad early ------------------------- */
console.log('\n── B: ad closed early (no completion event) ───────────────');
const closedEarly = await page.evaluate(async () => {
  const t0 = Date.now();
  const v = await window.Ads.rewarded();   // showAd resolves, but no event
  return { v: v, ms: Date.now() - t0 };
});
record('rewarded() resolves FALSE when the ad is not completed',
  closedEarly.v === false,
  `resolved ${JSON.stringify(closedEarly.v)} after ${closedEarly.ms} ms`);

record('the early-close path still settles (never hangs the revive button)',
  closedEarly.ms < 30000, `${closedEarly.ms} ms`);

const calls = await page.evaluate(() => window.__stub);
record('the SDK was actually asked to play a rewarded ad',
  calls.showAdCalls === 2, `showAd called ${calls.showAdCalls}x (expected 2)`);

/* The ONLY request this harness blocks is the real GD SDK, on purpose — the
   stub must be the sole gdsdk. Chromium logs a console error for the aborted
   load, so scope that out by URL rather than by message text (the console line
   is a bare "net::ERR_FAILED" with no host in it). */
const blockedSdk = failedRequests.filter((u) => u.includes('html5.api.gamedistribution.com'));
const otherFailures = failedRequests.filter((u) => !u.includes('html5.api.gamedistribution.com'));

record('only the deliberately-blocked SDK request failed',
  otherFailures.length === 0,
  otherFailures.slice(0, 2).join(' | ') || `blocked ${blockedSdk.length} SDK request(s), nothing else`);

const ours = consoleErrors.filter((e) => {
  if (/gamedistribution|browsingTopics|Cross-Origin/i.test(e)) return false;
  // An ERR_FAILED console line is attributable to the block above, and only
  // when that block actually happened.
  if (/net::ERR_FAILED/.test(e) && blockedSdk.length > 0) return false;
  return true;
});
record('no console errors from our code', ours.length === 0, ours.slice(0, 2).join(' | ') || 'clean');

await browser.close();
srv.close();
fs.rmSync(BUILD_DIR, { recursive: true, force: true });

const failed = results.filter((r) => !r.pass).length;
console.log(`\n${'='.repeat(62)}`);
console.log(`  ${results.length - failed} passed, ${failed} failed  (of ${results.length})`);
console.log('='.repeat(62) + '\n');
process.exit(failed ? 1 : 0);
