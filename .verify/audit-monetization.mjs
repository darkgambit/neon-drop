/* Runtime monetization audit: does ANY ad request actually fire, and what does
   the adapter report? Loads the live game, starts a game, triggers the ad paths
   (interstitial on game over, rewarded on the revive button) and records every
   request the page makes to a known ad host. */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'https://neon-drop.netlify.app';
const AD_HOSTS = /(googlesyndication|doubleclick|adsbygoogle|adsterra|gamedistribution|crazygames|poki|playgama|adnxs|pubmatic|rubicon|openx|criteo|taboola|outbrain|amazon-adsystem|cloudflareinsights|google-analytics)/i;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const adReqs = [];
const allThirdParty = [];
page.on('request', (r) => {
  const u = r.url();
  if (u.startsWith(BASE) || u.startsWith('data:')) return;
  allThirdParty.push(u);
  if (AD_HOSTS.test(u)) adReqs.push(u);
});

await page.goto(BASE + '/game/index.html', { waitUntil: 'load' });
await page.waitForTimeout(2500);

const cfg = await page.evaluate(() => ({
  hasAds: !!window.Ads,
  network: window.Ads ? window.Ads.network : null,
  ready: window.Ads ? window.Ads.ready : null,
  debug: window.Ads ? window.Ads.debug : null,
  sdkPresent: {
    CrazyGames: !!window.CrazyGames,
    PokiSDK: !!window.PokiSDK,
    playgamaBridge: !!window.playgamaBridge,
    gdsdk: !!window.gdsdk,
  },
}));

// Start a game and exercise the ad paths.
const play = page.locator('#playBtn');
if (await play.count()) { await play.click(); await page.waitForTimeout(800); }

const box = await page.locator('#cv').boundingBox();
for (const col of [0, 2, 4, 1, 3]) {
  await page.mouse.click(box.x + box.width * ((col + 0.5) / 5), box.y + box.height * 0.5);
  await page.waitForTimeout(700);
}

// Call the ad API directly, the way the game's own code would.
const callResult = await page.evaluate(async () => {
  if (!window.Ads) return { error: 'window.Ads missing' };
  const out = {};
  try { out.interstitial = String(await window.Ads.interstitial()); } catch (e) { out.interstitial = 'threw: ' + e.message; }
  try {
    const r = await window.Ads.rewarded(() => {});
    out.rewarded = JSON.stringify(r);
  } catch (e) { out.rewarded = 'threw: ' + e.message; }
  return out;
});

await page.waitForTimeout(3000);

console.log('=== adapter state on the LIVE build ===');
console.log(JSON.stringify(cfg, null, 2));
console.log('\n=== ad API calls ===');
console.log(JSON.stringify(callResult, null, 2));
console.log('\n=== requests to known ad/tracking hosts ===');
console.log(adReqs.length ? [...new Set(adReqs)].join('\n') : '(NONE — no ad request fires)');
console.log('\n=== all third-party requests ===');
console.log(allThirdParty.length ? [...new Set(allThirdParty)].join('\n') : '(none)');

await browser.close();
