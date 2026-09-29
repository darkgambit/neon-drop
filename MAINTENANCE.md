# MAINTENANCE.md — Neon Drop

Everything needed to change, test and ship Neon Drop without re-deriving how it works.

---

## The 30-second version

```bash
cd "C:/Users/ADMIN/Documents/ClaudeProjects/Business 1/neondropgame/neondrop"

# 1. change something, then test it locally
"C:/Users/ADMIN/.workbuddy-ai/binaries/python/envs/default/Scripts/python.exe" -m http.server 8080
node .verify/verify.mjs http://127.0.0.1:8080        # 42 functional checks

# 2. build the public payload and deploy
node tools/build-site.mjs
node "C:/Users/ADMIN/.workbuddy-ai/binaries/node/workspace/node_modules/netlify-cli/bin/run.js" deploy --prod

# 3. commit
git add -A && git commit -m "…" && git push origin main
```

**Live:** https://neon-drop.netlify.app · **Repo:** https://github.com/darkgambit/neon-drop

---

## Layout

```
neondrop/
├─ index.html          landing page (ad slots, click-to-play facade, guides section)
├─ game/
│  ├─ index.html       the game shell (menu / game-over / pause overlays)
│  ├─ game.js          the engine — ~19 KB, vanilla, no dependencies
│  └─ monetize.js      ad adapter: one build, many networks, safe stub fallback
├─ blog/               three original articles (SEO + AdSense content requirement)
├─ contact.html  privacy.html  terms.html
├─ robots.txt  sitemap.xml  ads.txt
├─ netlify.toml        build command + publish dir + security headers
├─ tools/              build / asset / clip generators
├─ .verify/            the test harness (committed; its output is not)
├─ marketing/          clips + launch post drafts
├─ dist/               portal upload bundle + cover art (gitignored, regenerable)
├─ _site/              staged deploy output (gitignored, regenerable)
└─ DEPLOY_SECRETS.local.md   ⚠️ gitignored — account IDs, never commit
```

---

## ⚠️ The one thing that can leak

The repo root doubles as the site source, so it also contains
`DEPLOY_SECRETS.local.md`, `PROGRESS.md`, this file, the submission kit and the
agent briefs. **Never deploy the repo root.** `netlify.toml` sets
`publish = "_site"` and `tools/build-site.mjs` copies an explicit allowlist into it,
refusing to build if a forbidden file sneaks in.

If you ever add a new public file, **add it to the `FILES` or `DIRS` list in
`tools/build-site.mjs`** or it will silently not be published.

Verify after any deploy:

```bash
for p in / /game/index.html /blog/cascade-strategy.html /robots.txt /sitemap.xml; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' https://neon-drop.netlify.app$p)  $p"; done
# every one of these must be 404:
for p in /DEPLOY_SECRETS.local.md /PROGRESS.md /netlify.toml /dist/neon-drop-itch.zip; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' https://neon-drop.netlify.app$p)  $p"; done
```

---

## Tooling, and where it lives

Everything is installed **outside the repo**, in the managed runtime directories —
the game itself has zero dependencies and that should stay true.

| Tool | Invoke as |
|---|---|
| Python + Pillow | `"C:/Users/ADMIN/.workbuddy-ai/binaries/python/envs/default/Scripts/python.exe"` |
| Node + Playwright + Lighthouse | `C:/Users/ADMIN/.workbuddy-ai/binaries/node/versions/22.22.2-2/node.exe` |
| Netlify CLI | `node "C:/Users/ADMIN/.workbuddy-ai/binaries/node/workspace/node_modules/netlify-cli/bin/run.js"` |
| ffmpeg / ffprobe | on `PATH` |

**Netlify CLI gotcha:** there is no `node_modules/.bin/netlify` shim on this machine.
Always call `bin/run.js` directly, as above.

---

## Tests

| Command | What it does |
|---|---|
| `node .verify/verify.mjs http://127.0.0.1:8080` | 42 functional checks (also accepts the live URL) |
| `node .verify/lighthouse.mjs http://127.0.0.1:8080` | perf/a11y/best-practices/SEO gate |
| `node tools/shot.mjs <url> <outDir>` | evidence screenshots, desktop + mobile |

### How the harness works (so you don't "fix" it by accident)

It never modifies the game. It installs two non-invasive hooks:

1. `CanvasRenderingContext2D.fillText` / `clearRect` are wrapped to capture the HUD
   text the engine actually paints — that is how score, best, combo, next and the
   drop-guide position are read.
2. `Math.random` is pinned to a controllable constant, which is what makes tile
   values deterministic and a real 40-drop Game Over reproducible.

**Non-obvious things that will bite you:**

- `guide.x` from `fillText` is the column's **centre**, not its left edge.
  `drawTile` centres its label.
- `canvas.getContext('2d').getImageData()` returns an **all-white buffer** in
  headless Chromium for this canvas. Pixel assertions must decode real screenshots
  (there is a pure-Node PNG decoder in `verify.mjs`).
- Lighthouse `formFactor: 'desktop'` **without** a matching `throttling` preset
  silently throttles a desktop viewport like mobile, costing ~10 points.
- Counting bare `<iframe>` elements fails on any host that injects its own chrome.
  Count only frames whose URL contains `/game/index.html`.
- **Editing the same file with parallel edits clobbers changes.** Apply edits
  sequentially and read back.

### The engine's value-picker lag — the single most important quirk

`startGame()` calls `pickValue()` twice (setting `current` and `nextVal`), and
`spawn()` only runs again after a landing. So **drops 1 and 2 are forced to share a
value, and drop `k ≥ 3` takes the value that was primed one landing earlier.**

Consequences:
- To force a specific value on drop *i*, set `window.__rand` to `enc(seq[i+2].v)`
  **before** drop *i*. Priming one ahead desynchronises the board.
- To sidestep it entirely, use a **uniform** tile value for a whole sequence — then
  the lag cannot matter. Most marketing clips do this.
- Any scripted sequence must be **landing-paced**, not timer-paced. Wait for the
  tile to land before the next drop (`waitLanded` in `record-clips.mjs`).

---

## Regenerating assets

```bash
# portal upload bundle -> dist/neon-drop-itch.zip (index.html flat at the root)
python tools/make-itch-zip.py

# social preview image -> og-cover.jpg (1200x630, ~83 KB)
python tools/make-og-cover.py

# the ten vertical marketing clips -> marketing/clips/
node tools/record-clips.mjs https://neon-drop.netlify.app

# just one clip
node tools/record-clips.mjs --only 03-cascade-chain
```

Re-run `make-itch-zip.py` **after any change to `game/`** — the zip is a snapshot,
and a stale zip is how a portal ends up serving an old build.

---

## Deploying

`netlify.toml` runs `node tools/build-site.mjs` then publishes `_site`. Locally:

```bash
node "C:/Users/ADMIN/.workbuddy-ai/binaries/node/workspace/node_modules/netlify-cli/bin/run.js" deploy --prod --message "…"
```

The site is **not** currently wired to auto-deploy from GitHub. Every deploy is a
manual CLI push. If you want push-to-deploy, connect the repo in the Netlify UI
(Project configuration → Build & deploy → Link repository) — that needs the Netlify
GitHub App authorised once, in a browser.

---

## Periodic checks

| How often | What |
|---|---|
| After every deploy | the 200/404 curl loop above |
| Monthly | `node .verify/verify.mjs https://neon-drop.netlify.app` |
| Monthly | Search Console → check for indexing errors |
| Monthly | Ad network dashboards → confirm impressions are non-zero |
| On any game change | re-run `make-itch-zip.py` and re-upload to the portals |
| Yearly | Netlify free-tier bandwidth (100 GB/month) — nowhere near it yet |

---

## Known traps

**Netlify's "Powered by Netlify" badge.** Free-plan projects created on or after
2026-08-19 get `<iframe id="nl-badge-frame">` injected into *every* HTML page —
including `game/index.html`, where `position:fixed; bottom-right; z-index:2147483647`
puts it on top of the playable board. Invisible locally. It is currently **off**:

```bash
node <netlify-cli>/bin/run.js api updateSite \
  --data '{"site_id":"265dfaae-7f3e-48e1-a347-2774e90c8eb8","body":{"built_with_badge_enabled":false}}'
```

Check it after creating any *new* Netlify project.

**This sandbox sets `HTTP_PROXY`/`HTTPS_PROXY`.** Chromium inherits them, so any
network measurement from here is tunnelled. Before blaming the code for a slow
Lighthouse score, re-run with the proxy unset and compare.

**Lighthouse numbers depend on where you measure from.** Localhost measures the
code; the live URL measures the code *plus* the network path. A 5 KiB page scoring
86 on performance is a latency result, not a code result — check
`render-blocking-resources`, `total-byte-weight` and `total-blocking-time` before
optimising anything.

---

## Rolling back

```bash
git log --oneline                      # find the commit
git revert <sha>                       # prefer revert over reset
git push origin main
node tools/build-site.mjs && node <netlify-cli>/bin/run.js deploy --prod
```

Netlify keeps every deploy and can roll back instantly from the dashboard:
Project → Deploys → pick a previous one → "Publish deploy". That is the fastest
escape hatch if a bad deploy goes live.
