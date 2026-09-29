/* =============================================================
   shot.mjs — capture evidence screenshots of a running Neon Drop.

   Reusable for Phase 5 (/evidence) and for eyeballing anything the
   headless checks can only assert numerically.

   Usage:
     node tools/shot.mjs <baseUrl> <outDir> [--full]

   Writes, into <outDir>:
     landing-desktop.png     1440x900  full landing page
     landing-mobile.png      390x844   full landing page
     game-desktop.png        1440x900  game loaded via the facade, mid-play
     game-mobile.png         390x844   game loaded via the facade
   ============================================================= */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.argv[2] || 'http://127.0.0.1:8080';
const OUT = path.resolve(process.argv[3] || '.verify/shots');
const FULL = process.argv.includes('--full');

fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { key: 'desktop', width: 1440, height: 900, dsf: 1 },
  { key: 'mobile', width: 390, height: 844, dsf: 2 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dsf,
    hasTouch: vp.key === 'mobile',
    isMobile: vp.key === 'mobile',
  });
  const page = await ctx.newPage();

  // ---- landing ------------------------------------------------------------
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await sleep(1200);
  await page.screenshot({ path: path.join(OUT, `landing-${vp.key}.png`), fullPage: FULL });
  console.log(`wrote landing-${vp.key}.png`);

  // ---- game, reached the way a player reaches it --------------------------
  const btn = page.locator('#gameLaunch');
  if (await btn.count()) {
    await btn.click();
    await sleep(2000);
    // start a game and play a few drops so the board is not empty
    const frame = page.frames().find((f) => f.url().includes('/game/index.html'));
    if (frame) {
      const play = frame.locator('#playBtn');
      if (await play.count()) {
        await play.click();
        await sleep(700);
        const cv = frame.locator('#cv');
        const box = await cv.boundingBox();
        if (box) {
          // boundingBox() is in PAGE coordinates, and mouse input must be sent
          // to the page (frames have no mouse of their own).
          for (const col of [0, 2, 1, 3, 2, 4]) {
            await page.mouse.click(box.x + box.width * ((col + 0.5) / 5), box.y + box.height * 0.45);
            await sleep(420);
          }
        }
      }
    }
    await sleep(600);
  }
  await page.screenshot({ path: path.join(OUT, `game-${vp.key}.png`), fullPage: FULL });
  console.log(`wrote game-${vp.key}.png`);

  await ctx.close();
}

await browser.close();
console.log('\nevidence written to', OUT);
