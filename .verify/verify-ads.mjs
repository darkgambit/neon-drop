/* Verify the Adsterra banner integration AND its consent gate.

   Two paths matter, and the second is the one that keeps the privacy policy
   honest:

     A. No consent (a first-time visitor)  -> banner shown, ZERO ad requests.
     B. Consent granted                    -> ad requests fire, iframes render.

   IMPORTANT — the user agent is spoofed on purpose. Adsterra refuses to serve
   to headless browsers: Playwright's default UA contains "HeadlessChrome" and
   produced 0 iframes on a page where a real browser renders 2. Measured:
       headless, default UA  -> 0 iframes
       headless, real UA     -> 2 iframes
       headed,   real UA     -> 2 iframes
   So the honest test is headless + a real UA. Without this the suite would
   report "no ad renders" forever and look like a broken integration. */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.argv[2] || 'http://127.0.0.1:8099';
const REAL_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const PAGES = ['/', '/blog/cascade-strategy.html', '/blog/how-merge-scoring-works.html', '/blog/best-free-browser-puzzle-games.html'];
const AD = /highrevenueformat\.com/;

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

const browser = await chromium.launch();

async function load(ctxOpts, url, wait = 6000) {
  const ctx = await browser.newContext({ userAgent: REAL_UA, ...ctxOpts });
  const page = await ctx.newPage();
  const adReqs = [];
  page.on('request', (r) => { if (AD.test(r.url())) adReqs.push(r.url()); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(wait);
  return { ctx, page, adReqs };
}

/* ---- A. first-time visitor: no consent, no ads --------------------------- */
console.log('\n=== A. no consent (first-time visitor) ===');
for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  for (const p of PAGES) {
    const { ctx, page, adReqs } = await load({ viewport: vp }, BASE + p, 3000);
    const banner = await page.locator('#ndConsent').count();
    const h1 = await page.locator('h1').first().textContent().catch(() => '');
    check(`no ads before consent (${vp.width}px) ${p}`, adReqs.length === 0 && banner === 1 && !!h1,
      `ads=${adReqs.length} banner=${banner} h1="${(h1 || '').slice(0, 22)}"`);
    await ctx.close();
  }
}

/* ---- B. consent granted: ads fire and render ----------------------------- */
console.log('\n=== B. consent granted ===');
const GRANT = () => { try { localStorage.setItem('nd_ad_consent', 'granted'); } catch (e) {} };
for (const vp of [{ w: 1440, h: 900, label: 'desktop' }, { w: 390, h: 844, label: 'mobile' }]) {
  for (const p of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, userAgent: REAL_UA });
    await ctx.addInitScript(GRANT);
    const page = await ctx.newPage();
    const adReqs = [];
    page.on('request', (r) => { if (AD.test(r.url())) adReqs.push(r.url()); });
    await page.goto(BASE + p, { waitUntil: 'load' });
    await page.waitForTimeout(6000);

    const health = await page.evaluate(() => ({
      h1: (document.querySelector('h1') || {}).textContent || '',
      frames: document.querySelectorAll('.adslot iframe').length,
      untitled: [...document.querySelectorAll('.adslot iframe')].filter((f) => !f.getAttribute('title')).length,
      banner: document.getElementById('ndConsent') ? 1 : 0,
      bodyLen: document.body.innerHTML.length,
    }));
    const overflow = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('.adslot iframe').forEach((el) => {
        const r = el.getBoundingClientRect();
        const host = el.parentElement.getBoundingClientRect();
        if (r.width > host.width + 1) out.push(`${Math.round(r.width)}>${Math.round(host.width)}`);
      });
      return out;
    });

    const ok = adReqs.length > 0 && health.frames > 0 && health.h1.length > 0 &&
               health.banner === 0 && health.bodyLen > 2000 && overflow.length === 0 &&
               health.untitled === 0;
    check(`ads render after consent (${vp.label}) ${p}`, ok,
      `req=${adReqs.length} iframes=${health.frames} untitled=${health.untitled} overflow=${overflow.length}`);
    if (p === '/' && vp.label === 'desktop') {
      fs.mkdirSync(path.resolve('.verify/shots-ads'), { recursive: true });
      await page.screenshot({ path: path.resolve('.verify/shots-ads/landing-with-ads.png'), fullPage: true });
    }
    await ctx.close();
  }
}

/* ---- C. decline is respected -------------------------------------------- */
console.log('\n=== C. decline ===');
{
  const { ctx, page, adReqs } = await load({ viewport: { width: 1440, height: 900 } }, BASE + '/', 2500);
  await page.locator('#ndConsent [data-decline]').click();
  await page.waitForTimeout(2500);
  const gone = await page.locator('#ndConsent').count();
  const stored = await page.evaluate(() => localStorage.getItem('nd_ad_consent'));
  check('Decline hides the banner, stores the choice, and loads no ads',
    gone === 0 && stored === 'denied' && adReqs.length === 0,
    `banner=${gone} stored=${stored} ads=${adReqs.length}`);
  await ctx.close();
}

/* ---- D. the game page stays clean --------------------------------------- */
console.log('\n=== D. game page ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, userAgent: REAL_UA });
  await ctx.addInitScript(GRANT);
  const page = await ctx.newPage();
  const adReqs = [];
  page.on('request', (r) => { if (AD.test(r.url())) adReqs.push(r.url()); });
  await page.goto(BASE + '/game/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  const banner = await page.locator('#ndConsent').count();
  check('game page carries NO site ads and NO consent banner',
    adReqs.length === 0 && banner === 0, `ads=${adReqs.length} banner=${banner}`);
  await ctx.close();
}

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) failed.forEach((f) => console.log('  FAILED: ' + f.name));
process.exit(failed.length ? 1 : 0);
