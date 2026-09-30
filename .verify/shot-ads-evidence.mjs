/* =============================================================
   shot-ads-evidence.mjs — capture PROOF that the money path is live.

   Definition of done, requirement 3: ">=1 ad network integrated and
   verifiably making ad requests". A screenshot of the page is not proof of
   that — the page would look identical with the gate closed. So this script
   records the thing that actually matters:

     1. the raw list of third-party ad requests the browser issued
     2. the network + status of each response
     3. the rendered iframe dimensions (proof the creative was placed)
     4. screenshots of the ad units on screen

   Usage:
     node .verify/shot-ads-evidence.mjs https://neon-drop.netlify.app
   ============================================================= */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASE = (process.argv[2] || 'https://neon-drop.netlify.app').replace(/\/$/, '');
const OUT = path.join(ROOT, 'evidence', 'ads');
fs.mkdirSync(OUT, { recursive: true });

// Adsterra filters the HeadlessChrome UA token (measured: default UA -> 0
// iframes, real UA -> 2). Spoofing a real UA is the only way to see what a
// human sees. Documented so nobody later mistakes this for a hack.
const REAL_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const AD_HOST = /highrevenueformat\.com|highperformanceformat\.com|adsterra/i;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  userAgent: REAL_UA,
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();

const requests = [];
const responses = [];
const consoleErrors = [];

page.on('request', (r) => {
  if (AD_HOST.test(r.url())) requests.push({ url: r.url(), type: r.resourceType() });
});
page.on('response', async (r) => {
  if (!AD_HOST.test(r.url())) return;
  let len = null;
  try { len = (await r.body()).length; } catch (e) { /* body may be opaque */ }
  responses.push({ url: r.url(), status: r.status(), bytes: len });
});
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('[pageerror] ' + e.message));

const report = { base: BASE, capturedAt: new Date().toISOString(), steps: [] };

async function step(name, fn) {
  const before = requests.length;
  await fn();
  report.steps.push({ name, newAdRequests: requests.length - before });
}

/* ---- 1. first visit, NO consent ---------------------------------- */
await step('first visit (no consent)', async () => {
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
});
report.noConsent = {
  adRequests: requests.length,
  consentBanner: await page.locator('#ndConsent').count(),
  stored: await page.evaluate(() => { try { return localStorage.getItem('nd_ad_consent'); } catch (e) { return null; } }),
};
await page.screenshot({ path: path.join(OUT, '01-first-visit-no-consent.png') });

/* ---- 2. accept consent, reload ----------------------------------- */
await step('accept consent', async () => {
  await page.evaluate(() => { try { localStorage.setItem('nd_ad_consent', 'granted'); } catch (e) {} });
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForTimeout(5000);
});

/* ---- 3. what actually rendered ----------------------------------- */
const frames = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.adslot iframe')).map((f) => {
    const r = f.getBoundingClientRect();
    return {
      title: f.getAttribute('title'),
      w: Math.round(r.width), h: Math.round(r.height),
      src: f.getAttribute('src') || '',
    };
  })
);
report.withConsent = {
  adRequests: requests.length,
  iframes: frames,
  uniqueHosts: [...new Set(requests.map((r) => new URL(r.url).host))],
};
report.responses = responses;
report.consoleErrors = consoleErrors;

/* ---- 4. screenshots: each slot, plus the whole page --------------- */
const slots = await page.locator('.adslot').count();
report.slots = slots;
for (let i = 0; i < slots; i++) {
  const el = page.locator('.adslot').nth(i);
  try {
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await el.screenshot({ path: path.join(OUT, `slot-${i + 1}.png`) });
  } catch (e) { /* a slot that will not screenshot is itself information */ }
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT, '02-with-consent-fullpage.png'), fullPage: true });

await page.goto(`${BASE}/blog/cascade-strategy.html`, { waitUntil: 'load' });
await page.waitForTimeout(5000);
report.blog = {
  iframes: await page.locator('.adslot iframe').count(),
  adRequests: requests.length,
};
await page.screenshot({ path: path.join(OUT, '03-blog-with-ads.png'), fullPage: true });

/* ---- 5. MOBILE pass: the 320x50 unit is a DIFFERENT key --------------
   The desktop pass proves the 728x90 and 300x250 keys fill. The narrow
   viewport swaps in a different unit (320x50, its own key), so desktop
   success says nothing about it. "It requested" is not "it filled" — the
   exact trap this script exists to avoid. Verify it separately. */
const mctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  userAgent: REAL_UA,
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});
const mpage = await mctx.newPage();
const mRequests = [];
const mResponses = [];
mpage.on('request', (r) => { if (AD_HOST.test(r.url())) mRequests.push(r.url()); });
mpage.on('response', async (r) => {
  if (!AD_HOST.test(r.url())) return;
  let len = null;
  try { len = (await r.body()).length; } catch (e) {}
  mResponses.push({ url: r.url(), status: r.status(), bytes: len });
});
await mpage.goto(`${BASE}/`, { waitUntil: 'load' });
await mpage.evaluate(() => { try { localStorage.setItem('nd_ad_consent', 'granted'); } catch (e) {} });
await mpage.goto(`${BASE}/`, { waitUntil: 'load' });
await mpage.waitForTimeout(5000);

const mFrames = await mpage.evaluate(() =>
  Array.from(document.querySelectorAll('.adslot iframe')).map((f) => {
    const r = f.getBoundingClientRect();
    return { title: f.getAttribute('title'), w: Math.round(r.width), h: Math.round(r.height) };
  })
);
// Which KEYS were requested — this is what tells us the narrow unit fired.
const mKeys = mRequests.map((u) => u.split('/').slice(-2)[0]);
report.mobile = {
  adRequests: mRequests.length,
  keys: mKeys,
  usedMobileUnit: mKeys.includes('09e826ea0472cd384211a90e23a11fea'),
  iframes: mFrames,
  responses: mResponses,
  overflowsViewport: mFrames.some((f) => f.w > 390),
};
const mslots = await mpage.locator('.adslot').count();
for (let i = 0; i < mslots; i++) {
  const el = mpage.locator('.adslot').nth(i);
  try {
    await el.scrollIntoViewIfNeeded();
    await mpage.waitForTimeout(900);
    await el.screenshot({ path: path.join(OUT, `mobile-slot-${i + 1}.png`) });
  } catch (e) {}
}
await mpage.evaluate(() => window.scrollTo(0, 0));
await mpage.waitForTimeout(400);
await mpage.screenshot({ path: path.join(OUT, '04-mobile-with-ads.png') });
await mctx.close();

await browser.close();

fs.writeFileSync(path.join(OUT, 'ad-evidence.json'), JSON.stringify(report, null, 2));

/* ---- verdict ------------------------------------------------------ */
console.log('\n=== AD EVIDENCE — ' + BASE + ' ===\n');
console.log('no consent  : adRequests=' + report.noConsent.adRequests +
            '  banner=' + report.noConsent.consentBanner +
            '  stored=' + report.noConsent.stored);
console.log('with consent: adRequests=' + report.withConsent.adRequests +
            '  iframes=' + frames.length + '  hosts=' + JSON.stringify(report.withConsent.uniqueHosts));
for (const r of responses) {
  console.log(`  ${r.status}  ${r.bytes === null ? '?' : r.bytes + 'B'}  ${r.url.slice(0, 110)}`);
}
console.log('\nrendered frames (desktop):');
for (const f of frames) console.log(`  ${f.w}x${f.h}  title="${f.title}"  ${f.src.slice(0, 80)}`);

console.log('\n--- MOBILE 390x844 ---');
console.log('adRequests=' + report.mobile.adRequests +
            '  mobile 320x50 unit used=' + report.mobile.usedMobileUnit +
            '  overflow=' + report.mobile.overflowsViewport);
for (const r of mResponses) {
  console.log(`  ${r.status}  ${r.bytes === null ? '?' : r.bytes + 'B'}  ${r.url.slice(0, 110)}`);
}
console.log('frames:');
for (const f of mFrames) console.log(`  ${f.w}x${f.h}  title="${f.title}"`);

console.log('\nconsole errors: ' + (consoleErrors.length ? consoleErrors.join(' | ') : 'none'));
console.log('written to evidence/ads/ad-evidence.json + ' + (slots + mslots + 4) + ' screenshots\n');

const ok =
  report.noConsent.adRequests === 0 &&
  report.withConsent.adRequests > 0 && frames.length > 0 &&
  report.mobile.adRequests > 0 && mFrames.length > 0 && !report.mobile.overflowsViewport;
console.log(ok ? 'VERDICT: PASS — gate holds; ads fill on desktop AND mobile.' : 'VERDICT: FAIL — see above.');
process.exit(ok ? 0 : 1);
