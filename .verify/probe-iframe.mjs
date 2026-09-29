/* Probe: what iframe (if any) does the landing page have before a click?
   Run:  node .verify/probe-iframe.mjs [baseUrl]                          */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'https://neon-drop.netlify.app';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

page.on('console', (m) => console.log('  [console:' + m.type() + ']', m.text()));

const resp = await page.goto(BASE + '/', { waitUntil: 'load' });
console.log('status:', resp.status());

for (const t of [0, 200, 900, 2000, 4000]) {
  await sleep(t === 0 ? 0 : t);
  const info = await page.evaluate(() => {
    const ifr = Array.from(document.querySelectorAll('iframe'));
    return {
      count: ifr.length,
      items: ifr.map((f) => ({
        src: f.getAttribute('src'),
        id: f.id || null,
        cls: f.className || null,
        html: f.outerHTML.slice(0, 300),
      })),
      // does the page contain the string "iframe" as an element anywhere?
      bodyHasFrame: !!document.querySelector('frame, frameset, embed, object'),
    };
  });
  console.log(`after ~${t}ms cumulative: iframe count = ${info.count}`);
  for (const it of info.items) console.log('   ', JSON.stringify(it));
  if (t === 0) await sleep(200);
}

console.log('\nframes reported by Playwright:');
for (const f of page.frames()) console.log('   ', f.url());

await browser.close();
