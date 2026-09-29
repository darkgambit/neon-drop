/* Probe: does Netlify inject its badge into game/index.html, and does it
   overlap the playable board?   Run: node .verify/probe-game-badge.mjs  */
import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'https://neon-drop.netlify.app/game/index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync('.verify/shots-live', { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 520, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'load' });
await sleep(1500);

const info = await page.evaluate(() => {
  const badge = document.getElementById('nl-badge-frame');
  const cv = document.getElementById('cv');
  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
  };
  let overlap = null;
  if (badge && cv) {
    const a = badge.getBoundingClientRect(), b = cv.getBoundingClientRect();
    const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    overlap = { overlapW: Math.round(ox), overlapH: Math.round(oy), overlapPx: Math.round(ox * oy) };
  }
  return {
    badgePresent: !!badge,
    badgeRect: r(badge),
    canvasRect: r(cv),
    overlap,
    badgeStyle: badge ? {
      position: getComputedStyle(badge).position,
      zIndex: getComputedStyle(badge).zIndex,
      bottom: getComputedStyle(badge).bottom,
      right: getComputedStyle(badge).right,
    } : null,
    allFrames: Array.from(document.querySelectorAll('iframe')).map((f) => f.id || '(no id)'),
  };
});

console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: '.verify/shots-live/game-standalone.png' });
console.log('wrote .verify/shots-live/game-standalone.png');
await browser.close();
