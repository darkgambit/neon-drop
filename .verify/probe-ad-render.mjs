/* Why is no ad iframe appearing?
   Tests the same page three ways and reports what the Adsterra script did:
   headless, headless with a normal UA, and headed. If only the headless runs
   produce no iframe, the network is filtering bots and real users are fine. */
import { chromium } from 'playwright';

const URL = process.argv[2] || 'https://neon-drop.netlify.app/';
const REAL_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

async function probe(label, launchOpts, ctxOpts) {
  const browser = await chromium.launch(launchOpts);
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const msgs = [];
  page.on('console', (m) => msgs.push(`[${m.type()}] ${m.text().slice(0, 120)}`));
  page.on('pageerror', (e) => msgs.push('[pageerror] ' + e.message.slice(0, 120)));

  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(6000);

  const info = await page.evaluate(() => {
    const slots = [...document.querySelectorAll('.adslot')];
    return {
      ua: navigator.userAgent,
      webdriver: navigator.webdriver,
      atOptions: typeof window.atOptions === 'undefined' ? 'undefined' : JSON.stringify(window.atOptions).slice(0, 90),
      iframesTotal: document.querySelectorAll('iframe').length,
      slotHTML: slots.map((s) => s.innerHTML.replace(/\s+/g, ' ').slice(0, 150)),
      slotRects: slots.map((s) => {
        const r = s.getBoundingClientRect();
        return Math.round(r.width) + 'x' + Math.round(r.height);
      }),
    };
  });

  console.log(`\n=== ${label} ===`);
  console.log('webdriver :', info.webdriver, '| atOptions:', info.atOptions);
  console.log('iframes   :', info.iframesTotal);
  console.log('slot sizes:', info.slotRects.join(', '));
  info.slotHTML.forEach((h, i) => console.log(`slot[${i}]  : ${h}`));
  if (msgs.length) console.log('console   :\n  ' + [...new Set(msgs)].slice(0, 6).join('\n  '));

  await browser.close();
}

await probe('headless (default UA)', { headless: true }, { viewport: { width: 1440, height: 900 } });
await probe('headless + real UA', { headless: true }, { viewport: { width: 1440, height: 900 }, userAgent: REAL_UA });
await probe('headed + real UA', { headless: false }, { viewport: { width: 1440, height: 900 }, userAgent: REAL_UA });
