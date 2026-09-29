/* =============================================================
   record-clips.mjs — produce the vertical marketing clips.

   Records REAL gameplay of the shipped game (no AI-generated footage,
   no mock-ups) at 9:16, then burns in a hook line and a footer.

   Determinism: Math.random is pinned before the game boots, exactly as
   the verification harness does, so every clip is reproducible.

   Usage:
     node tools/record-clips.mjs [baseUrl]
     node tools/record-clips.mjs --only 03-cascade-chain

   Output:
     marketing/clips/*.mp4            final, captioned, 1080x1920
     marketing/clips/captions.md      per-clip caption + hashtags
     .verify/tmp/clips-raw/*.webm     raw capture (gitignored)
   ============================================================= */
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv[2] && !process.argv[2].startsWith('--')
  ? process.argv[2]
  : 'https://neon-drop.netlify.app';
const ONLY = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;

const ROOT = path.resolve('.');
const RAW = path.join(ROOT, '.verify/tmp/clips-raw');
const OUT = path.join(ROOT, 'marketing/clips');
const TMP = path.join(ROOT, '.verify/tmp/clips-txt');

const VW = 540, VH = 960;                 // 9:16 CSS viewport
const OW = 1080, OH = 1920;               // final output
const FONT = 'C\\:/Windows/Fonts/segoeuib.ttf';
const BOTTOM_BAND = 190;                  // px reserved at the bottom for the footer
const HOOK_SECONDS = 2.8;                 // how long the top hook stays on screen

fs.mkdirSync(RAW, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const enc = (v) => { const pool = [2, 2, 2, 4, 4]; return (pool.indexOf(v) + 0.5) / pool.length; };

/* ---------------------------------------------------------------- specs
   `value` — tile value forced for the whole clip. Uniform values sidestep the
             engine's pickValue() one-drop lag completely.
   `drops` — column index per drop, in order.
   `gap`   — ms between drops.  `lead` / `tail` — ms held before / after.
   ---------------------------------------------------------------------- */
const CLIPS = [
  {
    id: '01-how-it-works',
    hook: 'Drop. Merge. Double.',
    sub: 'the whole game in one clip',
    value: 2, lead: 450, gap: 360, tail: 1400,
    drops: [2, 0, 4, 1, 3, 2, 0, 4, 1, 3, 2, 1, 0, 3],
    caption: 'Drop a tile into any column. Matching neighbours merge and double. That is the entire game — and it is free.',
    hashtags: '#puzzlegame #browsergame #freegame #html5game #mergegame',
  },
  {
    id: '02-first-merge',
    hook: 'Two 2s make a 4',
    sub: 'the one rule you need',
    value: 2, lead: 400, gap: 420, tail: 1400,
    drops: [1, 2, 1, 2, 2, 1, 1, 2, 2, 1, 3, 3],
    caption: 'Touching tiles with the same number merge into one tile worth double. That is it. No tutorial needed.',
    hashtags: '#puzzlegame #mergegame #casualgame #browsergame #freegame',
  },
  {
    id: '03-cascade-chain',
    hook: 'One drop, chain reaction',
    sub: 'cascades fire on their own',
    value: 2, lead: 400, gap: 120, tail: 1800,
    drops: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    caption: 'Stack the same column and the merges keep firing. Each link in the chain multiplies your score again.',
    hashtags: '#cascade #puzzlegame #satisfying #browsergame #mergegame',
  },
  {
    id: '04-combo-multiplier',
    hook: 'COMBO x4',
    sub: 'chains pay four times over',
    value: 2, lead: 400, gap: 270, tail: 1600,
    drops: [0, 0, 1, 1, 0, 1, 2, 2, 1, 1, 2, 0, 2, 1, 2, 2],
    caption: 'Every extra merge in the same chain raises the combo multiplier. Four links in one drop pays four times over.',
    hashtags: '#combo #puzzlegame #highscore #browsergame #mergegame',
  },
  {
    id: '05-staircase',
    hook: 'The staircase',
    sub: 'how to force big merges',
    value: 2, lead: 400, gap: 280, tail: 1800,
    drops: [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 1, 3, 0, 4, 2, 1],
    caption: 'Walk the drops across the board in a staircase. It lines up matches on both sides so one landing sets off several merges.',
    hashtags: '#strategy #puzzlegame #tipsandtricks #browsergame #mergegame',
  },
  {
    id: '06-score-climbs',
    hook: 'The score runs away',
    sub: 'one board, no ceiling',
    value: 2, lead: 400, gap: 110, tail: 2000,
    drops: [0, 0, 1, 1, 2, 2, 0, 1, 2, 0, 1, 2, 3, 3, 4, 4, 1, 2],
    caption: 'Survive long enough and the score stops being a number you can keep track of. Same board, no ceiling.',
    hashtags: '#highscore #puzzlegame #satisfying #browsergame #mergegame',
  },
  {
    id: '07-game-over-revive',
    hook: 'Game over? Keep going.',
    sub: 'watch one ad, clear the top',
    value: 2, lead: 350, gap: 95, tail: 800,
    fill: true,
    caption: 'Fill the board and it is over — unless you watch one short ad. That clears the top three rows and puts you back in.',
    hashtags: '#gameover #secondchance #puzzlegame #browsergame #freegame',
  },
  {
    id: '08-mobile-one-thumb',
    hook: 'One thumb. No download.',
    sub: 'portrait, instant, works offline',
    value: 2, lead: 450, gap: 360, tail: 1400,
    drops: [2, 2, 0, 4, 1, 3, 2, 0, 4, 1, 3, 2],
    caption: 'Built for a phone in portrait. No app store, no account, no download — it just opens and plays.',
    hashtags: '#mobilegame #noplaystore #puzzlegame #browsergame #freegame',
  },
  {
    id: '09-keyboard-play',
    hook: 'Arrow keys + Space',
    sub: 'desktop, no mouse needed',
    value: 2, lead: 450, gap: 360, tail: 1400,
    keyboard: true,
    drops: [1, 2, 3, 2, 1, 0, 3, 4, 2, 0, 4, 1],
    caption: 'On a desktop you can aim with the arrow keys and drop with Space. Same game, same combos, no mouse.',
    hashtags: '#keyboard #desktop #puzzlegame #browsergame #freegame',
  },
  {
    id: '10-plays-instantly',
    hook: 'Plays instantly',
    sub: 'no install, no signup',
    value: 2, lead: 400, gap: 360, tail: 1500,
    fromLanding: true,
    drops: [2, 0, 4, 1, 2, 3, 0, 1, 4, 2],
    caption: 'Click once and you are playing. Under 200 KB, no account, no download, works on phone and desktop.',
    hashtags: '#instantplay #noplaystore #puzzlegame #browsergame #freegame',
  },
];

/* ------------------------------------------------------------- driving */

/** Column centres, mirroring the engine's own layout maths, in PAGE coords. */
async function gridFor(frame) {
  const d = await frame.evaluate(() => {
    const wrap = document.getElementById('wrap');
    const r = wrap.getBoundingClientRect();
    return { w: wrap.clientWidth, h: wrap.clientHeight, x: r.left, y: r.top };
  });
  const TOPBAR = Math.min(96, d.h * 0.14);
  const availH = d.h - TOPBAR - 16;
  const CELL = Math.floor(Math.min((d.w - 24) / 5, availH / 9.25));
  const OX = Math.floor((d.w - CELL * 5) / 2);
  const OY = Math.floor(TOPBAR + CELL * 1.25);
  return {
    CELL,
    colX: (c) => d.x + OX + c * CELL + CELL / 2,
    rowY: (r) => d.y + OY + r * CELL,
  };
}

/** The 40-drop checkerboard that fills the board with no merges possible. */
function fillSequence() {
  const pattern = (c, k) => (c % 2 === 0) ? (k % 2 === 0 ? 2 : 4) : (k % 2 === 0 ? 4 : 2);
  const seq = [{ col: 0, v: pattern(0, 0) }, { col: 2, v: pattern(2, 0) }];
  for (let k = 1; k < 8; k++) seq.push({ col: 0, v: pattern(0, k) });
  for (let k = 1; k < 8; k++) seq.push({ col: 2, v: pattern(2, k) });
  for (const c of [1, 3, 4]) for (let k = 0; k < 8; k++) seq.push({ col: c, v: pattern(c, k) });
  return seq;
}

const HIDE_DEBUG = '#netTag{display:none!important}';
// Shrink the play area so the bottom band stays clear for the footer text.
const RESERVE_BOTTOM = `#wrap{height:calc(100% - ${BOTTOM_BAND}px)!important}
  body{align-items:flex-start!important;padding-top:0!important}`;

/* Non-invasive HUD reader: wrap the canvas text API so we can see the state the
   engine actually paints. Same technique as .verify/verify.mjs — it does not
   change game behaviour, it only observes. We need it to know when a dropped
   tile has LANDED: the engine's value picker lags by landings, so dropping on a
   fixed timer desynchronises any scripted sequence. */
const HUD_HOOK = () => {
  window.__hud = { cur: [], frame: [] };
  const P = CanvasRenderingContext2D.prototype;
  const _ft = P.fillText;
  P.fillText = function (t, x, y) {
    window.__hud.cur.push({ t: String(t), x, y });
    return _ft.apply(this, arguments);
  };
  const _cr = P.clearRect;
  P.clearRect = function () {
    if (window.__hud.cur.length) window.__hud.frame = window.__hud.cur;
    window.__hud.cur = [];
    return _cr.apply(this, arguments);
  };
};

const isPlaying = (frame) => frame.evaluate(
  () => (window.__hud.frame || []).some((o) => String(o.t).startsWith('NEXT'))
).catch(() => false);

async function waitPlaying(frame, timeout = 8000) {
  await frame.waitForFunction(
    () => (window.__hud.frame || []).some((o) => String(o.t).startsWith('NEXT')),
    null, { timeout, polling: 25 }
  ).catch(() => {});
}

/** Wait until the engine is idle again (tile has landed and settled). */
async function waitLanded(frame) {
  await frame.waitForFunction(
    () => !(window.__hud.frame || []).some((o) => String(o.t).startsWith('NEXT')),
    null, { timeout: 2500, polling: 20 }
  ).catch(() => {});
  await waitPlaying(frame);
  await sleep(40);
}

async function recordClip(browser, spec) {
  const ctx = await browser.newContext({
    viewport: { width: VW, height: VH },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
    recordVideo: { dir: RAW, size: { width: VW, height: VH } },
  });
  const page = await ctx.newPage();
  const t0 = Date.now();                       // video timeline starts ~here

  // Pin the RNG before the game boots. Read through window.__rand so the value
  // can be changed per drop later; the engine's picker lags by two landings.
  await page.addInitScript((r) => {
    window.__rand = r;
    Math.random = function () { return window.__rand; };
  }, enc(spec.value));
  await page.addInitScript(HUD_HOOK);
  await page.addStyleTag({ content: RESERVE_BOTTOM + HIDE_DEBUG }).catch(() => {});

  let frame;
  if (spec.fromLanding) {
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await page.addStyleTag({ content: HIDE_DEBUG }).catch(() => {});
    await sleep(500);
    await page.click('#gameLaunch');           // the real entry path
    await sleep(1500);
    frame = page.frames().find((f) => f.url().includes('/game/index.html')) || page;
  } else {
    await page.goto(`${BASE}/game/index.html`, { waitUntil: 'load' });
    frame = page;
  }

  await frame.addStyleTag({ content: RESERVE_BOTTOM + HIDE_DEBUG }).catch(() => {});
  // The engine computes CELL/OX/OY inside resize(), which only re-runs on a
  // window resize event. Injecting the CSS alone leaves the engine laid out for
  // the OLD wrap height while our column maths uses the new one — every click
  // then lands in the wrong column. Force the engine to re-measure.
  await frame.evaluate(() => window.dispatchEvent(new Event('resize'))).catch(() => {});
  await sleep(300);

  const geom = await frame.evaluate(() => {
    const wrap = document.getElementById('wrap');
    return { w: wrap.clientWidth, h: wrap.clientHeight };
  });
  await frame.click('#playBtn');
  void geom;

  const tPlay = Date.now();
  await sleep(spec.lead);

  const g = await gridFor(frame);
  const y = g.rowY(1);

  /** Aim, drop, and WAIT FOR THE TILE TO LAND. Pacing must be landing-driven:
   *  the engine's value picker advances per landing, so a fixed timer drifts
   *  and a scripted sequence stops producing the intended board. */
  const drop = async (col) => {
    await page.mouse.move(g.colX(col), y);
    await sleep(70);
    await page.mouse.down();
    await page.mouse.up();
    await waitLanded(frame);
  };

  let tOver = null;

  if (spec.fill) {
    const seq = fillSequence();
    for (let i = 0; i < seq.length; i++) {
      // Prime the value for drop i+2 (the picker lags two landings).
      if (i + 2 < seq.length) {
        await frame.evaluate((v) => { window.__rand = v; }, enc(seq[i + 2].v));
      }
      await drop(seq[i].col);
      if (tOver === null && await frame.locator('#overOverlay.on').count()) {
        tOver = Date.now();                       // mark the moment Game Over lands
      }
      await sleep(spec.gap);
    }
    if (tOver === null) await sleep(spec.tail);

    const revive = frame.locator('#reviveBtn');
    if (await revive.count() && await revive.isVisible()) {
      await revive.click({ timeout: 20000 });
      await sleep(2400);
      // Keep playing after the revive so the clip does not end on a zero score.
      await frame.evaluate(() => { window.__rand = 0.1; });   // 0.1 -> value 2
      for (const col of [0, 2, 1, 3, 2, 0]) await drop(col);
      await sleep(700);
    }
  } else if (spec.keyboard) {
    for (const col of spec.drops) {
      for (let k = 0; k < 5; k++) await page.keyboard.press('ArrowLeft');
      for (let k = 0; k < col; k++) await page.keyboard.press('ArrowRight');
      await sleep(90);
      await page.keyboard.press('Space');
      await waitLanded(frame);
      await sleep(spec.gap);
    }
    await sleep(spec.tail);
  } else {
    for (const col of spec.drops) {
      await drop(col);
      await sleep(spec.gap);
    }
    await sleep(spec.tail);
  }

  const video = page.video();
  await ctx.close();
  const webm = await video.path();

  // Keep a short beat of the menu, then the gameplay — and drop the page-load dead time.
  // For the fill clip, 40 landing-paced drops run ~16 s, which is far too long to
  // watch: keep only the last couple of seconds of the fill, the Game Over, and the revive.
  const trimStart = tOver !== null
    ? Math.max(0, (tOver - t0) / 1000 - 2.6)
    : Math.max(0, (tPlay - t0) / 1000 - 0.7);
  return { webm, trimStart };
}

/* -------------------------------------------------------------- render */
const probe = (args) => execFileSync('ffprobe', args).toString().trim();

function renderClip(spec, webm, trimStart) {
  const rawDur = Number(probe(['-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=nw=1:nk=1', webm]));
  const dur = Math.max(1, rawDur - trimStart);

  const f = (name, text) => {
    const p = path.join(TMP, `${spec.id}-${name}.txt`);
    fs.writeFileSync(p, text, 'utf8');
    return p.replace(/\\/g, '/').replace(/:/g, '\\:');
  };
  const hookFile = f('hook', spec.hook);
  const subFile = f('sub', spec.sub);
  const footFile = f('foot', 'Neon Drop · free browser puzzle · neon-drop.netlify.app');

  const fadeOutAt = Math.max(0, dur - 0.4).toFixed(2);
  const hookOn = `lt(t\\,${HOOK_SECONDS})`;

  const vf = [
    `scale=${OW}:${OH}:flags=lanczos`,
    // top hook band, only for the opening seconds
    `drawbox=x=0:y=0:w=iw:h=340:color=0x050b14@0.62:t=fill:enable='${hookOn}'`,
    `drawtext=fontfile='${FONT}':textfile='${hookFile}':fontcolor=white:fontsize=78:` +
      `x=(w-text_w)/2:y=110:shadowcolor=0x000000@0.6:shadowx=4:shadowy=4:enable='${hookOn}'`,
    `drawtext=fontfile='${FONT}':textfile='${subFile}':fontcolor=0x8FE3FF:fontsize=42:` +
      `x=(w-text_w)/2:y=228:shadowcolor=0x000000@0.5:shadowx=2:shadowy=2:enable='${hookOn}'`,
    // permanent footer in the reserved bottom band
    `drawtext=fontfile='${FONT}':textfile='${footFile}':fontcolor=white@0.9:fontsize=34:` +
      `x=(w-text_w)/2:y=h-108:box=1:boxcolor=0x050b14@0.6:boxborderw=22`,
    `fade=t=in:st=0:d=0.35`,
    `fade=t=out:st=${fadeOutAt}:d=0.4`,
  ].join(',');

  const out = path.join(OUT, `${spec.id}.mp4`);
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-ss', trimStart.toFixed(2),
    '-i', webm,
    '-vf', vf,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '21',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-an', out,
  ], { stdio: 'inherit' });
  return { out, dur };
}

/* ------------------------------------------------- captions sheet */
function writeCaptions(rows) {
  const lines = [
    '# Neon Drop — vertical clip kit',
    '',
    'Real captured gameplay of the shipped game — no mock-ups, no generated footage.',
    '1080×1920 H.264 MP4, silent. Add trending audio inside each app.',
    '',
    'Every clip is reproducible: tile values are pinned, so re-running',
    '`node tools/record-clips.mjs` regenerates the same footage.',
    '',
    '---',
    '',
  ];
  for (const c of rows) {
    lines.push(`## ${c.id}`, '');
    lines.push(`**File:** \`marketing/clips/${c.id}.mp4\` · ${c.dur.toFixed(1)}s · ${c.kb} KB`);
    lines.push('');
    lines.push(`**On-screen hook:** ${c.hook} — *${c.sub}*`);
    lines.push('');
    lines.push('**Caption:**', '', `> ${c.caption}`, '');
    lines.push(`**Hashtags:** ${c.hashtags}`);
    lines.push('');
    lines.push(`**Alt text:** Vertical gameplay clip of Neon Drop: ${c.hook.replace(/[.!?]+$/, '').toLowerCase()}.`);
    lines.push('');
  }
  fs.writeFileSync(path.join(OUT, 'captions.md'), lines.join('\n'), 'utf8');
  console.log(`\n  wrote marketing/clips/captions.md (${rows.length} clips)`);
}

/* ---------------------------------------------- --captions-only mode */
if (process.argv.includes('--captions-only')) {
  const rows = [];
  for (const spec of CLIPS) {
    const out = path.join(OUT, `${spec.id}.mp4`);
    if (!fs.existsSync(out)) continue;
    const dur = Number(probe(['-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=nw=1:nk=1', out]));
    rows.push({ ...spec, dur, kb: (fs.statSync(out).size / 1024).toFixed(0) });
  }
  if (!rows.length) { console.error('no clips found in marketing/clips/'); process.exit(1); }
  writeCaptions(rows);
  process.exit(0);
}

/* ---------------------------------------------------------------- main */
const browser = await chromium.launch();
const done = [];

for (const spec of CLIPS) {
  if (ONLY && spec.id !== ONLY) continue;
  process.stdout.write(`  ${spec.id} … `);
  let rec;
  try {
    rec = await recordClip(browser, spec);
  } catch (err) {
    console.log(`RECORD FAILED: ${err.message}`);
    continue;
  }
  const { out, dur } = renderClip(spec, rec.webm, rec.trimStart);
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`${dur.toFixed(1)}s  ${kb} KB  (trimmed ${rec.trimStart.toFixed(1)}s)`);
  done.push({ ...spec, dur, kb });
}

await browser.close();

if (!ONLY && done.length) writeCaptions(done);

console.log(`\n  done — ${done.length} clip(s) in marketing/clips/`);
