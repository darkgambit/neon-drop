/* =============================================================
   verify-gd-build.mjs — prove the two portal bundles are isolated.

   The GameDistribution bundle injects a game id into monetize.js; the itch
   bundle must NOT have one. That difference is load-bearing:

     - With an id, the adapter reports network='gamedistribution' and fetches
       the GD SDK.
     - Without one, it must report 'none' and fetch nothing, so our own site
       and the itch build stay ad-neutral with Adsterra as the only ad system.

   Asserting on the ZIP CONTENTS would not be enough — the question is what
   the adapter actually DOES at runtime. So this extracts both bundles, serves
   them, loads them in a real browser, and reads window.Ads.network.

   Usage:  node .verify/verify-gd-build.mjs [gameId]
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
const GD_SDK = 'html5.api.gamedistribution.com';

const results = [];
const record = (name, pass, detail = '') => {
  results.push({ name, pass });
  console.log(`  ${pass ? '✅ PASS' : '❌ FAIL'}  ${name}${detail ? `\n           ${detail}` : ''}`);
};

/* ---- 1. rebuild both bundles, so we test what the tool actually emits ---- */
//
// The throwaway id below is NOT a real GameDistribution id — it exists only to
// prove the injection path works. The build therefore goes to a temp dir, never
// to dist/: writing it to dist/ would leave a bundle carrying a fake id sitting
// exactly where a release bundle is expected, and the next person to upload
// would ship something GD rejects at activation.
const TEST_ID = process.argv[2] || 'TESTIDNOTREAL00000000000000000000';
const BUILD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'nd-build-'));
console.log('\n── rebuilding bundles ─────────────────────────────────────');
console.log(`   build dir: ${BUILD_DIR}  (dist/ untouched)`);
execFileSync(PY, ['tools/make-itch-zip.py', '--gd-id', TEST_ID, '--out-dir', BUILD_DIR],
  { cwd: ROOT, stdio: 'pipe' });

const bundles = [
  { name: 'itch', zip: path.join(BUILD_DIR, 'neon-drop-itch.zip'), expectNetwork: 'none', expectSdk: false },
  { name: 'gamedistribution', zip: path.join(BUILD_DIR, 'neon-drop-gd.zip'), expectNetwork: 'gamedistribution', expectSdk: true },
];

/* ---- 2. extract each to a temp dir and serve it ------------------------- */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nd-bundles-'));
const servers = [];

async function serveDir(dir) {
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
  servers.push(srv);
  return `http://127.0.0.1:${srv.address().port}`;
}

for (const b of bundles) {
  const dir = path.join(tmp, b.name);
  fs.mkdirSync(dir, { recursive: true });
  execFileSync(PY, ['-c', `import zipfile;zipfile.ZipFile(r"${b.zip}").extractall(r"${dir}")`]);
  b.dir = dir;
  b.base = await serveDir(dir);
}

/* ---- 3. load each in a real browser ------------------------------------ */
const browser = await chromium.launch();

for (const b of bundles) {
  console.log(`\n── ${b.name} bundle ────────────────────────────────────────`);
  const ctx = await browser.newContext({ viewport: { width: 414, height: 896 } });
  const page = await ctx.newPage();

  const sdkRequests = [];
  const consoleErrors = [];
  page.on('request', (r) => { if (r.url().includes(GD_SDK)) sdkRequests.push(r.url()); });
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('[pageerror] ' + e.message));

  await page.goto(`${b.base}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);

  const state = await page.evaluate(() => ({
    hasAds: !!window.Ads,
    network: window.Ads ? window.Ads.network : null,
    ready: window.Ads ? window.Ads.ready : null,
    gdsdk: typeof window.gdsdk,
    gdGameId: window.Ads && window.Ads.config ? window.Ads.config.gdGameId : null,
  }));

  record(`${b.name}: adapter detected the expected network`,
    state.network === b.expectNetwork, `network=${state.network} (expected ${b.expectNetwork})`);

  record(`${b.name}: GD SDK ${b.expectSdk ? 'IS' : 'is NOT'} requested`,
    (sdkRequests.length > 0) === b.expectSdk,
    `${sdkRequests.length} request(s) to ${GD_SDK}`);

  record(`${b.name}: gdGameId ${b.expectSdk ? 'is set' : 'is empty'}`,
    b.expectSdk ? !!state.gdGameId : !state.gdGameId,
    `gdGameId=${JSON.stringify(state.gdGameId)}`);

  // The game must be playable either way — a bundle that cannot start is a
  // rejected submission regardless of its ad configuration.
  //
  // NOTE: overlays are toggled with the `on` CLASS, not style.display, so a
  // display check would pass/fail for the wrong reason. Read the class.
  await page.click('#playBtn');
  await page.waitForTimeout(1200);
  const started = await page.evaluate(() => {
    const ov = document.getElementById('menuOverlay');
    return !!ov && !ov.classList.contains('on');
  }).catch(() => false);
  record(`${b.name}: game still starts from the Play button`, started,
    started ? 'menu overlay dismissed' : 'menu overlay still showing');

  // Scope console errors by origin. GD's SDK legitimately complains when it is
  // served over plain HTTP from 127.0.0.1: it calls the Privacy Sandbox
  // browsingTopics() API and sets a Cross-Origin-Opener-Policy header, both of
  // which require a trustworthy (HTTPS) origin. On GD's platform it is HTTPS,
  // so this is a localhost artifact of THIS harness — not a defect in the game.
  // Same product-vs-harness split as the itch analytics beacon.
  const SDK_NOISE = /browsingTopics|Cross-Origin-Opener-Policy|potentially trustworthy|gamedistribution/i;
  const ours = consoleErrors.filter((e) => !SDK_NOISE.test(e));
  const sdk = consoleErrors.filter((e) => SDK_NOISE.test(e));
  record(`${b.name}: no console errors from OUR code`, ours.length === 0,
    ours.slice(0, 2).join(' | ') || 'clean');
  if (sdk.length) {
    console.log(`           note: ${sdk.length} error(s) from GD's SDK over plain HTTP — ` +
      `expected on localhost, not counted against the game`);
  }

  await ctx.close();
}

await browser.close();
for (const s of servers) s.close();
fs.rmSync(tmp, { recursive: true, force: true });
fs.rmSync(BUILD_DIR, { recursive: true, force: true });

// The release artefacts must be exactly as they were before this ran.
const distGd = path.join(ROOT, 'dist', 'neon-drop-gd.zip');
if (fs.existsSync(distGd)) {
  const landed = execFileSync(PY, ['-c',
    `import zipfile;print(zipfile.ZipFile(r"${distGd}").read("monetize.js").decode())`],
    { encoding: 'utf8' });
  const leaked = landed.includes(`gdGameId: '${TEST_ID}',`);
  record('the test id did NOT leak into the release artefact',
    !leaked,
    leaked ? `dist/neon-drop-gd.zip now carries the throwaway id ${TEST_ID}` : 'dist/ untouched by this run');
} else {
  console.log('  (dist/neon-drop-gd.zip not present — nothing to check)');
}

const failed = results.filter((r) => !r.pass).length;
console.log(`\n${'='.repeat(62)}`);
console.log(`  ${results.length - failed} passed, ${failed} failed  (of ${results.length})`);
console.log('='.repeat(62) + '\n');
process.exit(failed ? 1 : 0);
