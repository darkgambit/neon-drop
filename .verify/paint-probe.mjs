/* =============================================================
   Fast paint-cost A/B probe for the landing page.
   Serves the real HTML through a route interceptor so variants can be
   tested without touching files, under mobile-equivalent throttling.
   Prints FCP / LCP / first long task for each variant.
   ============================================================= */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8080';
const URL = `${BASE}/`;

const VARIANTS = {
  'baseline            ': (h) => h,
  'no h1 filter        ': (h) => h.replace(/filter:drop-shadow\(0 0 12px rgba\(64,196,255,\.22\)\)/g, ''),
  'no body gradients   ': (h) => h.replace(/background:\s*\n?\s*radial-gradient\(1100px[\s\S]*?var\(--bg\);/, 'background:var(--bg);'),
  'no h1 filter+grad   ': (h) => VARIANTS['no body gradients   '](VARIANTS['no h1 filter        '](h)),
  'no inline svg icon  ': (h) => h.replace(/<link rel="icon"[^>]*>/g, ''),
  'no iframe at all    ': (h) => h.replace(/<div class="frame">[\s\S]*?<\/div>/, '<div class="frame"></div>'),
};

const browser = await chromium.launch();
const results = [];

for (const [name, transform] of Object.entries(VARIANTS)) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__lcp = 0;
    try {
      new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; })
        .observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {}
  });
  await page.route(URL, async (route) => {
    const res = await route.fetch();
    const body = transform(await res.text());
    await route.fulfill({ response: res, body, headers: { ...res.headers(), 'content-type': 'text/html; charset=utf-8' } });
  });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: 150,
    downloadThroughput: (1638.4 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
  });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => {
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find(p => p.name === 'first-contentful-paint');
    const long = performance.getEntriesByType('longtask') || [];
    return { fcp: fcp ? Math.round(fcp.startTime) : -1, lcp: Math.round(window.__lcp), longTasks: long.length };
  });
  results.push({ name, ...m });
  await ctx.close();
}

await browser.close();
console.log('\n  variant               FCP(ms)  LCP(ms)');
console.log('  ' + '-'.repeat(42));
for (const r of results) console.log(`  ${r.name} ${String(r.fcp).padStart(6)}  ${String(r.lcp).padStart(6)}`);
