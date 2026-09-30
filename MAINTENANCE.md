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

**Deploy gotcha — `_site` is locked while a server serves it.** `tools/build-site.mjs`
deletes and recreates `_site/` on every run, and `netlify deploy` runs that build first. If a
local server is running **with `_site` as its working directory**, Windows will not let the
directory be removed and the deploy dies with `Error while running build`:

```
[build-site] failed: Error: [safe-delete] 操作失败: ... _site
```

Kill the local server before deploying. Starting it from the repo root and pointing it at
`_site` still holds the handle — stop it, don't just stop using it.

---

## Tests

| Command | What it does |
|---|---|
| `node .verify/verify.mjs <baseUrl>` | 47 functional checks (accepts localhost or the live URL) |
| `node .verify/verify-ads.mjs <baseUrl>` | consent gate + ad rendering across 4 visitor paths (18 checks) |
| `node .verify/shot-ads-evidence.mjs <baseUrl>` | writes `evidence/ads/` — request log + screenshots of each rendered unit |
| `node .verify/audit-monetization.mjs` | what the **game** adapter is doing at runtime |
| `node .verify/verify-itch.mjs` | drives the real itch.io store page, plays the embed, and reads the rendered frame for dev artefacts (14 checks) |
| `node .verify/verify-gd-build.mjs [gameId]` | rebuilds both portal bundles and proves they are isolated — itch stays `none` with 0 SDK requests, GD loads the SDK (10 checks) |
| `node .verify/lighthouse.mjs <baseUrl>` | perf/a11y/best-practices/SEO gate |
| `node tools/check-placeholders.mjs` | placeholder gate over the deployable set; exits 1 on any ACTIVE one |
| `node tools/shot.mjs <url> <outDir>` | evidence screenshots, desktop + mobile |
| `node tools/shot-portal.mjs [url] [outDir]` | 3 store screenshots at 1040×2060, seeded and reproducible |
| `node tools/build-site.mjs` | stage `_site/` from the allowlist; refuses to stage a forbidden file |

**Serve the staged build, not the repo root.** `_site` is what actually deploys, so testing the
repo root can pass while production differs:

```bash
node tools/build-site.mjs
python -m http.server 8080 --directory _site --bind 127.0.0.1   # then stop it before deploying
```

> **Use `--directory`, do not `cd` into `_site`.** `cd _site && python -m http.server` makes
> `_site` the server's **working directory**, and Windows will not let `tools/build-site.mjs`
> delete a directory that is a live process's CWD. The deploy then dies with
> `Error while running build`. `--directory` keeps the CWD at the repo root and sidesteps it
> entirely.

> **Localhost + a proxy.** This sandbox exports `HTTP_PROXY`/`HTTPS_PROXY`, so `curl` to
> `127.0.0.1` can return **502** and Lighthouse can fail with `LanternError: NO_LCP`. Run with
> `HTTP_PROXY= HTTPS_PROXY= NO_PROXY=127.0.0.1,localhost` (or `curl --noproxy '*'`).

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

# ALSO build the GameDistribution bundle with its game id injected
# -> dist/neon-drop-gd.zip
python tools/make-itch-zip.py --gd-id <GD_GAME_ID>

# social preview image -> og-cover.jpg (1200x630, ~83 KB)
python tools/make-og-cover.py

# the ten vertical marketing clips -> marketing/clips/
node tools/record-clips.mjs https://neon-drop.netlify.app

# just one clip
node tools/record-clips.mjs --only 03-cascade-chain
```

Re-run `make-itch-zip.py` **after any change to `game/`** — the zip is a snapshot,
and a stale zip is how a portal ends up serving an old build.

### Why the GD game id is injected, not committed

`game/monetize.js` fetches the GameDistribution SDK **only when `AD_CONFIG.gdGameId` is
non-empty**. That one condition keeps the platforms apart: our own site and the itch.io bundle
leave it empty, so they never load the SDK and stay ad-neutral with Adsterra as the only ad
system. Committing the id would make *every* build fetch it.

The builder enforces this — it **refuses to ship the itch bundle** if `gdGameId` is non-empty, and
reads the id back **out of the written zip** rather than trusting the string it just built. If
`game/monetize.js` ever changes the shape of that line, the build fails loudly instead of shipping
a bundle with no game id (which GD denies).

Verify the split with `node .verify/verify-gd-build.mjs` — it loads both real bundles in a browser
and asserts what the adapter *does*, not what the file says.

### The pre-roll and the stuck-pause backstop

GD requires a pre-roll on the Play button. `preRollThenStart()` fires `Ads.interstitial()` and
then starts the game **immediately** — it deliberately does *not* await the promise. Awaiting it
was the first implementation and it dead-ended: with the SDK present but its promise never
settling, the Play button stayed disabled and the player was trapped on the menu. GD's own
reference implementation doesn't await either; it relies on `SDK_GAME_PAUSE` to pause the game.

`ads:pause` also arms a **90 s watchdog** that force-resumes, cleared by `ads:resume`. Without it,
an SDK that fires the pause and never the resume freezes the board permanently.

Both are skipped when `Ads.network === 'none'`, so our site and the itch build are unaffected.

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

## Ads and consent

**Two separate money paths. Do not conflate them.**

| | Site pages (`/`, `/blog/*`) | Game build (`/game/*`, the itch zip) |
|---|---|---|
| Monetised by | Us, with **Adsterra** | The portal that embeds it (their SDK) |
| Files | `consent.js` + `ads-site.js` | `game/monetize.js` |
| State | 🟢 live | ⬜ none, **by design** |

`Ads.network === 'none'` on the game page is **correct**. The same zip is embedded by portals
that monetise it themselves; our own banners inside that frame would break the embed and breach
their terms.

### Adding or changing an ad unit

1. Add the key to `UNITS` in `ads-site.js` (keys are public — they appear in page source by design).
2. Put a slot in the HTML: `<div class="adslot adslot--leader"><script src="/ads-site.js" data-ad="leader"></script></div>`.
3. `node tools/build-site.mjs` → deploy → `node .verify/verify-ads.mjs <url>`.

### Two constraints that must not be "optimised" away

- **`ads-site.js` stays parser-blocking.** No `defer`, no `async`, inline at the slot. Adsterra's
  `invoke.js` injects its iframe with `document.write`; if it runs after parsing completes it
  calls `document.open()` and **erases the page**.
- **The iframe `title` is set by our code.** `invoke.js` creates untitled iframes, which fails
  Lighthouse's `frame-title` (weight 7) and makes screen readers announce "frame". A
  `MutationObserver` + two timeouts set `title="Advertisement"`.

### Consent

`consent.js` runs synchronously in `<head>`, **before any slot**, and sets `window.__adConsent`.
`ads-site.js` reads it at parse time and writes nothing if it is absent — so no third-party
script is fetched at all. Accept stores `granted` and reloads; Decline stores `denied` and ads
never load again. `/game/*` loads neither file.

**`privacy.html` §3 states this gate exists. If you change the gate, change the policy.** The
policy was originally aspirational; `consent.js` was written so it became true. Don't let that
invert again.

**When testing, assert both directions.** "No ad fired" is ambiguous — it is either the gate
working or a revenue bug. `verify.mjs` checks 0 requests before consent and 2 after.

---

## Periodic checks

| How often | What |
|---|---|
| After every deploy | the 200/404 curl loop above |
| Monthly | `node .verify/verify.mjs https://neon-drop.netlify.app` |
| Monthly | `node .verify/verify-ads.mjs https://neon-drop.netlify.app` — an ad slot can silently die |
| Monthly | Search Console → check for indexing errors |
| Monthly | **Adsterra dashboard → confirm impressions are non-zero.** Our side serving is not proof they count it. |
| **Monthly (1st–2nd and 16th–17th)** | **Payout window.** Adsterra pays automatically on these dates at 09:00–18:00 GMT, $5 minimum, to WebMoney (WMZ). Payout fields lock ±3 days around the window — don't try to edit them then. |
| **Once, now** | Confirm the Adsterra **Payout Information form is APPROVED**, not just saved. Adsterra needs both the minimum balance and an approved form; without approval money will not move. |
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
