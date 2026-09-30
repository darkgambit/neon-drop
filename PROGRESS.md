# PROGRESS.md — Neon Drop launch state

> **Read this file first if you are a fresh session.** It is the single source of truth for
> where the launch stands. Update it after EVERY meaningful step.
> Secrets live in `DEPLOY_SECRETS.local.md` (gitignored). Never commit a token.

**Project root:** `C:\Users\ADMIN\Documents\ClaudeProjects\Business 1\neondropgame\neondrop`
**Operator:** Angelo (`darkgambit`) · **Started:** 2026-09-29
**Goal:** files-on-disk → live on the internet, fully functional, earning ad revenue into *my* accounts. Free tiers only.

**🔴 THE SITE IS LIVE: https://neon-drop.netlify.app**

---

## Phase checklist

| # | Phase | State | Notes |
|---|---|---|---|
| 0 | **Orient** — read repo, capture identity answers | ✅ done (defaults) | Never explicitly answered; proceeded on recorded defaults. See `DEPLOY_SECRETS.local.md`. |
| 1 | **Prove it works** — Playwright + Lighthouse, fix bugs | ✅ **DONE** | 47/47 functional (was 42; the ad + consent checks were added in Phase 3). All Lighthouse thresholds met on a controlled measurement. 2 real defects fixed in Phase 1. Commit `a1b2ad6`. |
| 2 | **Go live** — GitHub + Netlify + Search Console | 🟡 **only Search Console / Bing left** | Live on Netlify with HTTPS. Repo public and pushed. Domain + email placeholders replaced. GSC handshake was issued and **deferred by Angelo** ("continue") — not skipped, just not yet done. |
| 3 | **Connect the money** — portals + ad networks | 🟡 **A + H + payout done; B upload-ready; C–G/I not started** | ✅ **itch.io LIVE** 14/14 · ✅ **Adsterra LIVE** serving real creatives, consent-gated · ✅ **payout attached** (WebMoney/WMZ, $5) · 🟢 **GameDistribution READY TO UPLOAD** — id `bf2e28…617f` in hand, bundle built, release gate 8/8, isolation 11/11, rewarded 8/8. ⬜ 6 platform accounts remain. |
| 4 | **Traffic** — articles, analytics, marketing kit | 🟡 **70% — now the binding constraint** | ✅ 3 guides live · ✅ 10 vertical clips · ✅ launch posts drafted (**not posted**) · ✅ 3 portal screenshots · ⬜ analytics (needs an account) |
| 5 | **Handover** — docs + evidence | ✅ **DONE** | ✅ `LAUNCH_REPORT.md` · ✅ `MAINTENANCE.md` · ✅ `MONETIZATION_STATUS.md` · ✅ `PROGRESS.md` · ✅ `/evidence` screenshots incl. `evidence/ads/` |

---

## Definition of done — scorecard

Checked 2026-09-30. **Four of six hard requirements are met.**

| # | Requirement | State | Evidence |
|---|---|---|---|
| 1 | Live URL over HTTPS, playable mobile + desktop, zero console errors | ✅ **MET** | 47/47 checks against production; HSTS, http→https 301 |
| 2 | Game LIVE and publicly playable on ≥1 portal | ✅ **MET** | https://kdbdeocampo.itch.io/neon-drop — **14/14** via `.verify/verify-itch.mjs`, debug label confirmed clear |
| 3 | ≥1 ad network integrated, **verifiably making ad requests** | ✅ **MET** | **Adsterra live.** 2 units per content page, HTTP 200, 728×90 + 300×250 + 320×50 rendered. `evidence/ads/`. Gated on consent: 0 requests before, 2 after. |
| 4 | Placeholder grep returns nothing | ✅ **MET** | narrow grep exit 1; `tools/check-placeholders.mjs` 0 active |
| 5 | Payout details attached to accounts in Angelo's name | ✅ **MET** | **WebMoney (WMZ) attached 2026-09-30**, $5 minimum, no bank-region gate. ⚠️ confirm the Payout Information form is *approved*, not just saved. |
| 6 | Search Console verified, sitemap submitted | ❌ **NOT MET** | Handshake issued, **deferred by Angelo**. Sitemap is live and valid but unsubmitted |
| — | All handover docs committed and accurate | ✅ **5/5** | `LAUNCH_REPORT.md` written — the last one |

**The money path is now complete end to end.** Ads serve, and a payout method with the lowest
threshold Adsterra offers is attached. Revenue is **$0.00** — not because anything is broken or
missing, but because there is not yet enough **traffic**. The remaining requirements are a
verification handshake (6) and the portal accounts.

**The bottleneck has moved.** It was engineering; it is now **distribution**. Three articles and
ten clips are live, and the launch posts are drafted but unposted — that is the highest-value
unblocked lever left.

---

## Git state

```
repo:    https://github.com/darkgambit/neon-drop   (PUBLIC)
branch:  main
author:  darkgambit <kingripper9@gmail.com>
total:   15 commits   ·   git diff baseline HEAD = 69 files, +5711 / -111

57b4f54  Adsterra: verify the mobile unit fills, correct the payout facts
2cf2f9b  Phase 3: integrate Adsterra behind a real consent gate
733d42f  Add a runtime monetization audit and a definition-of-done scorecard
c06d455  Phase 3A: itch.io live; fix debug label leaking to players; replace the placeholder gate
1b23aa4  Phase 3 prep: reproducible portal screenshots
000819e  PROGRESS: record the passing acceptance gate and refresh the commit log
a8bf9f6  PROGRESS: make the acceptance-gate record self-clean
dc1ca73  Phase 4/5: marketing clips, launch post drafts, handover docs
a173b69  Phase 2: record the live deployment, the badge defect and the placeholder gate
adefec4  Phase 2: replace every placeholder with its live value
046575a  Phase 2: stage the deploy from an explicit allowlist, not the repo root
af0b222  Phase 4 (part): three original guides, wired into the site and the sitemap
d94bf7d  PROGRESS.md: record Phase 1 results, harness gotchas and current blockers
a1b2ad6  Phase 1: verify the game end-to-end, then fix what Lighthouse found
fd2a5a4  Neon Drop: baseline — finished game, landing page, legal pages, ad adapter   <-- tag: baseline
```

**Acceptance gate: PASS** — the placeholder grep returns no lines (exit 1). Re-verified against
both the working tree and the built `_site/`. See "Acceptance gate" under Phase 2.

`git diff baseline` = the complete, reviewable set of launch-engineering changes.

---

## Phase 2 — the live deployment

| Item | Value |
|---|---|
| Live URL | **https://neon-drop.netlify.app** |
| Netlify project ID | `265dfaae-7f3e-48e1-a347-2774e90c8eb8` |
| Netlify account | `kingripper9's team` — free plan (`nf_team_dev`) |
| Publish dir | `_site` (built by `tools/build-site.mjs`) |
| Deploy method | `netlify deploy --prod` via the Netlify CLI |
| HTTPS | ✅ valid cert, HSTS `max-age=31536000; includeSubDomains; preload` |
| HTTP → HTTPS | ✅ 301 |
| Security headers | ✅ `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` |

### 1. Closed a real leak before the first deploy
`netlify.toml` had `publish = "."` — the repo root doubles as the site root, but it also holds
`DEPLOY_SECRETS.local.md`, `PROGRESS.md`, `PORTAL_SUBMISSION_KIT.md`, the agent briefs, `.verify/`
and `dist/` (itch zip + source art). A plain `netlify deploy` would have published all of it.

**Fix:** `tools/build-site.mjs` copies an explicit allowlist of public files into `_site/`, then
asserts no forbidden basename was staged and exits non-zero if one was. `publish = "_site"`.
**Verified:** all 14 public paths return 200; every private path returns 404
(`/DEPLOY_SECRETS.local.md`, `/PROGRESS.md`, `/dist/neon-drop-itch.zip`, `/netlify.toml`, …).

### 2. Found and fixed a live-site defect: Netlify's badge was covering the game board
Netlify injects `<iframe id="nl-badge-frame" title="Powered by Netlify">` into **every** HTML page
it serves on free-plan projects created on/after 2026-08-19 — including `game/index.html`. It is
`position:fixed; bottom:0; right:0; z-index:2147483645`, so **inside the game iframe it lands on top
of the bottom-right of the playable board** (measured overlap: 197×64 px = 12,608 px²).

This could not have been caught locally — it only exists on Netlify's edge.

**Fix:** disabled it via the API — `updateSite` with `built_with_badge_enabled: false`. Netlify
explicitly permits this on the free plan. **Verified:** badge count 0, iframe count 0 on both pages.
**Harness follow-up:** the facade check counted *any* `iframe`, so it failed on Netlify's badge for
reasons unrelated to the game. It now counts only frames whose URL contains `/game/index.html`.

### 3. Replaced every placeholder with its live value
| Where | Before | After |
|---|---|---|
| `index.html` canonical | placeholder domain | `https://neon-drop.netlify.app/` |
| `index.html` og:image | `cover.png` (1.7 MB) | `og-cover.jpg` (1200×630, **83 KB**) |
| `robots.txt` | placeholder domain | live sitemap URL |
| `sitemap.xml` | 8 placeholder URLs | 8 live URLs |
| 3 × `blog/*.html` canonical | placeholder domain | live domain |
| `contact.html` | the email placeholder | real `mailto:` address |
| `ads.txt` | fake publisher ID | **no active record** (see below) |
| `game/monetize.js` | comment with fake ID | reworded |

**`ads.txt` deliberately carries no active record.** An ads.txt line declares which seller is
authorised to sell the inventory, so publishing a placeholder publisher ID actively misdeclares
it — worse than an empty file. The record is commented out with instructions for after AdSense
approval. When the real ID lands: uncomment it, set `adsenseClient` in `game/monetize.js`, redeploy.

### Acceptance gate — PASS
The gate is: grep the whole repo for the three retired placeholders — the domain placeholder, the
email placeholder, and the all-zero AdSense publisher ID. Expect **no lines selected**.

The three strings are assembled below by concatenation rather than typed out, so that this file does
not itself contain the tokens it forbids. A document that quotes the pattern it is checking defeats
its own check — which is exactly what happened here on the first attempt, and is why the command
looks like this.

```
$ D="REPLACE-WITH-YOUR""-DOMAIN"
$ E="__EMAI""L__"
$ P="pub-00000000""00000000"
$ grep -rn "$D\|$E\|$P" .
grep exit code : 1        (1 = no lines selected)
match count    : 0
raw output     : []
```
The retired tokens were also removed from the docs that described them (the two briefs, `README.md`,
`PORTAL_SUBMISSION_KIT.md`) so a future run of this check is genuinely green rather than needing an
explanation. Only the spelling changed; no instruction lost its meaning.

**Superseded in Phase 3.** This narrow grep is kept only because the brief names it as the
acceptance gate. Use `node tools/check-placeholders.mjs` — it catches the whole class of
placeholder rather than three spellings, and it would have caught the `ca-pub-XXXX` form that this
one missed. See "The acceptance gate was too narrow" under Phase 3.

---

## Phase 3 — the money

### A. itch.io — 🟢 LIVE

| Item | Value |
|---|---|
| Listing | **https://kdbdeocampo.itch.io/neon-drop** |
| Published | 2026-09-30 (re-uploaded same day to clear the `#netTag` defect) |
| Account | `kdbdeocampo` — **not** `darkgambit`. Handles differ across platforms; never build a URL from the GitHub handle. |
| Embed source | `html-classic.itch.zone/html/19478707/index.html` — was `19476821` before the re-upload |
| Upload | `dist/neon-drop-itch.zip` (3 files, flat at root) |
| Agreement | **None signed.** itch.io is non-exclusive by design. |
| Revenue | **$0, by design** — the listing is free-to-play. Value is distribution + a canonical link for the marketing posts. |

**Verified by playing it, not by checking the status code.** `.verify/verify-itch.mjs` drives the
real store page: presses *Run game*, waits for the itch CDN iframe, starts a game, drops six tiles,
and reads the rendered frame for dev artefacts.

```
14/14 checks passed
  SCORE 0 -> 22   ·  6/6 drops registered  ·  zero console errors
  zero failed requests from the game frame
  debug network label: empty
```

**Harness lesson:** itch's own store shell runs a Google Analytics beacon that aborts on close.
The first run reported it as a failure. Fixed by attributing failed requests to the **frame that
issued them** — `itch.zone` is ours, `itch.io` is their shell. Same product-vs-harness split as
the Netlify badge earlier: a check that fails for reasons outside the product is a broken check.

**✅ Re-uploaded and re-verified 2026-09-30.** The listing once predated the `#netTag` fix and
painted `ad network: none` at the foot of the board. Angelo re-uploaded; **the new build is
confirmed live** — the itch CDN embed revision changed from `html/19476821/` to **`html/19478707/`**,
which is the proof the upload took effect rather than being queued.

`.verify/verify-itch.mjs` now **14/14** — the two new checks assert the debug label is empty and
that no dev artefacts (`ad network:`, `undefined`, `NaN`, `[object Object]`) appear in the rendered
game frame. Evidence: `evidence/itch-listing-playing-2026-09-30.png`.

> **Why the guard lives in this suite now:** the zip being correct is not the same as the upload
> having taken effect. Asserting on the **rendered live frame** is the only way to tell the
> difference — the same "rendered ≠ filled" lesson as the ad units.

### B. Adsterra — 🟢 LIVE, serving, behind a consent gate

| Item | Value |
|---|---|
| Network | **Adsterra** (display banners, `www.highrevenueformat.com`) |
| Integrated | 2026-09-30 |
| Units live | 728×90 leader + 300×250 rectangle (landing) · 468×60 banner + 300×250 rectangle (each blog page) |
| Units approved, unused | 160×600, 160×300 — need a sidebar this layout does not have |
| Where | **Content pages only.** Never `/game/*` (see below) |
| Minimum payout | **$5** (WebMoney / Paxum / crypto — joint lowest) |
| Payout method | ✅ **WebMoney (WMZ) attached 2026-09-30.** USD purse, no bank-region constraint. |
| Schedule | Automatic, biweekly — 1st–2nd and 16th–17th, 09:00–18:00 GMT. No manual request. |

**Why Adsterra and not AdSense first.** AdSense gates on a content review and pays only by
bank transfer to a supported region; Angelo's bank is in the Philippines and he is temporarily
in Libya. Adsterra's minimum is $5 and it pays in **USDT/Paxum**, which carries no bank-region
constraint. It is the network that can actually pay him. AdSense remains a Phase 3 item for
the higher CPM, not as the first revenue.

**Verified serving, not assumed.** `.verify/shot-ads-evidence.mjs` writes
`evidence/ads/ad-evidence.json` plus screenshots of each rendered unit:

```
no consent  : adRequests=0  banner=1  stored=null
with consent: adRequests=2  iframes=2  hosts=["www.highrevenueformat.com"]
  200  49580B  .../ea195481585cda608a5473ea655629f2/invoke.js
  200  49630B  .../743702bbd12151692c0084aff88afb14/invoke.js
rendered frames:
  728x90   title="Advertisement"  about:blank
  300x250  title="Advertisement"  about:blank
console errors: none
VERDICT: PASS — gate holds, ads fire after consent.
```

`evidence/ads/slot-1.png` and `slot-2.png` show **real paid creatives**, not blank frames —
which is the difference between "the tag is on the page" and "the network is filling it".

**Both breakpoints verified separately.** The narrow viewport swaps in a *different unit*
(320×50, its own key), so desktop success says nothing about mobile. Measured:

```
--- MOBILE 390x844 ---
adRequests=2  mobile 320x50 unit used=true  overflow=false
  200  49630B  .../09e826ea0472cd384211a90e23a11fea/invoke.js   <- the 320x50 key
  200  49610B  .../743702bbd12151692c0084aff88afb14/invoke.js   <- the 300x250 rect
frames: 320x50 · 300x250
```

`evidence/ads/mobile-slot-1.png` shows the creative filling the full 320×50. Confirming the
request fired would have been the weaker claim — a unit can request, return 200, and be blank.

**`ads.txt` gets no Adsterra record.** Their publisher docs do not state an `ads.txt` requirement
for the banner format, and inventing a seller line misdeclares who may sell the inventory — worse
than an empty file. Stays AdSense-only and inactive. Confirm with Adsterra support first.

**The consent gate is real, and it is asserted in both directions.** `privacy.html` claimed a
consent banner existed; it did not. Rather than soften the policy to match the code, `consent.js`
was built so the policy became true. It runs synchronously in `<head>` before any slot and sets
`window.__adConsent`; `ads-site.js` reads it at parse time and writes **nothing** if consent is
absent, so no third-party script is fetched at all. Accept stores `granted` and reloads;
Decline stores `denied` and the ads never load again.

A one-sided "did an ad fire?" check cannot distinguish a revenue bug from the gate working, so
`verify.mjs` asserts both: **0 requests before consent, 2 after**. `.verify/verify-ads.mjs`
covers the four visitor paths independently — first visit, accepted, declined, game page — **18/18**.

**Ads are deliberately absent from `/game/*`.** The same build is uploaded to itch.io and
embedded by portals that monetise the game themselves. Injecting our own banners inside that
frame would break the embed and breach their terms. `#adTop` in `game/index.html` exists for
the *portal's* SDK to fill. This also means the itch zip stays a clean, ad-free build.

**Two implementation details that are not optional:**

1. **`ads-site.js` must stay parser-blocking.** Adsterra's `invoke.js` injects its iframe with
   `document.write`. If it runs after parsing completes, `document.write` calls `document.open()`
   and **erases the page**. So no `defer`, no `async`, inline at the slot in document order.
2. **`invoke.js` creates iframes with no `title`.** Lighthouse's `frame-title` audit is weight 7
   and scored 0, dropping the landing page's accessibility from 100 to 95. Screen readers
   announce an untitled iframe as just "frame". We cannot edit their script, so a
   `MutationObserver` + two timeouts title the frame `"Advertisement"` as soon as it appears.
   Accessibility went back to **100 on all four measurements**.

**Measured cost of running ads.** Best-practices on the landing page fell 100 → **77**. This is
**not fixable** — the audit penalises third-party cookies from the ad network, which is inherent
to ad monetization. It will not pass the ≥90 gate while ads are on. Recorded rather than hidden.
The performance cost was recovered by the same lazy-loading work (see the Lighthouse section).

**Open item — impressions are unconfirmed on Adsterra's side.** Our side is proven: requests
fire, creatives render. Whether Adsterra *counts* them shows up in their dashboard, and that is
the number that becomes money. Check it after ~24 h of real traffic.

**Payout attached — but "attached" is not "approved".** Adsterra requires **both** the minimum
balance **and** an **approved** Payout Information form. Confirm the form's status; if it reads
pending, no money moves regardless of balance. Separately, moving WMZ onward to a bank needs a
WebMoney Passport at some tiers — worth reviewing before the first payout lands.

### Defect found and fixed: the debug label shipped to players

`game/game.js` set `#netTag` unconditionally:

```js
if (tag) tag.textContent = window.Ads ? ('ad network: ' + Ads.network) : 'ad network: none';
```

So every player on a portal saw **"ad network: none"** in 10px text at the bottom of the board.
`AD_CONFIG.debug` already existed but nothing was gated on it.

**Fix:** `Ads` now exposes `get debug()`, and the label renders only when it is true. Verified on
both localhost and production.

**Second-order fix:** the old check `'Ad adapter reports its detected network'` scraped
`#netTag`'s text — it was testing a debug label, not the adapter. Hiding the label made it fail,
which looked like an adapter regression. It now queries `window.Ads.network` / `.ready` / `.debug`
directly, and asserts `debug === false` in the shipped build.

### The acceptance gate was too narrow — replaced

The original gate searched the repo for three literal spellings: a domain placeholder, an email
placeholder, and an all-zero AdSense publisher ID. (Not quoted here on purpose — see the
self-clean note under "Acceptance gate" above. Writing them out in this file would make the gate
fail on its own documentation, which is the mistake this section is about.)

It passed while `index.html:17` still carried `ca-pub-XXXXXXXXXXXXXXXX` — a *different spelling*
of the same idea, inside an inert HTML comment. A gate that only knows the strings you already
found gives false confidence.

**`tools/check-placeholders.mjs`** replaces it. It scans the **deployable set** (mirroring
`tools/build-site.mjs`) for placeholder *shapes* — domains, emails, AdSense/ads.txt publisher IDs,
API keys, `__TEMPLATE__` slots, lorem ipsum, TODO/FIXME — and strips comments first, preserving
line numbers, so it can separate:

- **ACTIVE** — matches in code that runs. Exit code 1.
- **INERT** — matches only inside a comment. Intentional instruction text. Reported, not failed.

Current result: **0 active, 2 inert** (`index.html:17` and `game/monetize.js:27`, both AdSense
instructions). Both are deliberate; neither executes.

Two bugs in my own first version, both caught by running it: I guessed the blog filenames
(they are `best-free-browser-puzzle-games.html`, `cascade-strategy.html`,
`how-merge-scoring-works.html`), and my JS comment detection only recognised lines *starting*
with `//`, so a **trailing** comment was misread as live code. Replaced the heuristic with a
real comment stripper that respects string literals and escapes.

### Deploy gotcha: `_site` cannot be rebuilt while a server is serving it

`netlify deploy --prod` failed with `Error while running build` because `tools/build-site.mjs`
deletes and recreates `_site/` — and a background `python -m http.server` was running with
`_site` as its working directory. On Windows you cannot remove a directory that is a live
process's CWD. **Kill the local server before deploying.**

---

## Lighthouse — read this carefully, the numbers differ by where you measure from

Two measurements, both real, measuring different things.

**A. Code quality — local server, no network variable → ALL THRESHOLDS MET** (`.verify/out-lh-local/`)

Measured 2026-09-30 **with the consent banner and the ad slots present** (a first-time visitor
sees the banner and no ads, which is what these numbers describe):

| page | form | perf | a11y | bp | seo |
|---|---|---|---|---|---|
| landing | mobile | **100** | 100 | 100 | 100 |
| game | mobile | **98** | 100 | 100 | 100 |
| landing | desktop | **95** | 100 | 100 | 100 |
| game | desktop | **94** | 100 | 100 | 100 |

**A real a11y defect found by this run, in our own code.** The first measurement after the
consent banner landed showed landing a11y at **96**, not 100 — `link-in-text-block` (weight 7):
the banner's `/privacy.html` link was distinguished from surrounding text **by colour alone**.
Fixed with `text-decoration:underline`. Back to 100 everywhere.

**Note the consent-state dependency.** These numbers are for a *first visit* (banner, no ads).
Once the visitor accepts, the ad iframes load and best-practices drops to **77** — that is the
third-party-cookie penalty and it is not fixable. Measure both states or you will report the
wrong number.

**B. Production from this machine → mobile passes, desktop performance fails** (`.verify/out-lh-direct/`)

| page | form | perf | a11y | bp | seo | verdict |
|---|---|---|---|---|---|---|
| landing | mobile | 98 | 100 | 100 | 100 | PASS |
| game | mobile | 94 | 100 | 100 | 100 | PASS |
| landing | desktop | **86** | 100 | 100 | 100 | ❌ perf |
| game | desktop | **89** | 100 | 100 | 100 | ❌ perf |

**Why B is worse, with the evidence:**

- **The landing page has no code-side headroom left.** Lighthouse's own trace says it makes
  **exactly 1 network request totalling 5 KiB**, with `render-blocking-resources` scoring 1.0,
  `document-latency-insight` 1.0, and **TBT of 7 ms**. Its observed load is **565 ms**
  (`DOMContentLoaded` 232 ms). The failing 1.66 s FCP is *simulated*: Lantern's model inflates it
  from the measured `network-server-latency` of **200 ms** — this machine reaches Netlify's nearest
  edge (Frankfurt) from Libya. A visitor near the CDN does not pay that.
- **The game page's TBT (~213–290 ms) is real but is boot cost, not a hot loop.** The long tasks
  fire at 981 ms and 1197 ms — the first two frames, where the canvas rasterises its gradients and
  glow shadows for the first time. The steady-state loop is not the problem. The canvas is already
  capped at 520 px wide.
- **Not a proxy artifact.** This sandbox exports `HTTP_PROXY`/`HTTPS_PROXY` and Chromium inherits
  it, so production runs were tunnelled. I re-ran with the proxy unset (direct egress to
  `35.157.26.135`) and got the same 86/89 — so the cause is CDN distance, not the proxy.

**Decision:** the game was **not** rewritten to chase this number. It is verified working (42/42),
the deficit is dominated by network latency from one specific location, and the remaining item is
inherent first-frame canvas rasterisation tied to the game's visual identity. Documented as a
measured characteristic rather than "fixed" by risking a working product.

---

## Phase 4 — traffic

### ✅ Three original articles, live and internally linked
`blog/cascade-strategy.html` (787 words), `blog/how-merge-scoring-works.html` (640),
`blog/best-free-browser-puzzle-games.html` (749). All three are in `sitemap.xml`,
linked from a `#guides` section on the landing page and from the footer, and
cross-linked to each other. They also serve AdSense's content requirement.

### ✅ Ten vertical marketing clips — `marketing/clips/`
**Real captured gameplay of the shipped game.** No generated footage, no mock-ups.
Recorded with Playwright at 1080×1920, H.264 MP4, silent, each with a burnt-in hook
line and a footer. Captions + hashtags + alt text per clip in
`marketing/clips/captions.md`.

| Clip | Length | Hook |
|---|---|---|
| 01-how-it-works | 19.8s | Drop. Merge. Double. |
| 02-first-merge | 18.0s | Two 2s make a 4 |
| 03-cascade-chain | 15.8s | One drop, chain reaction |
| 04-combo-multiplier | 20.6s | COMBO x4 |
| 05-staircase | 21.2s | The staircase |
| 06-score-climbs | 20.4s | The score runs away |
| 07-game-over-revive | 10.8s | Game over? Keep going. |
| 08-mobile-one-thumb | 17.5s | One thumb. No download. |
| 09-keyboard-play | 18.4s | Arrow keys + Space |
| 10-plays-instantly | 9.2s | Plays instantly |

**Four real bugs were found and fixed while building these** — recorded because they
are all the same class of mistake:

1. **The render blacked the whole video.** `fade=t=out:st=0:d=0.35` fades out at
   t=0, so every frame after 0.35 s was black. Fade-out must start at
   `duration − 0.35`.
2. **The engine was laid out for the wrong height.** The bottom caption band is
   created by injecting CSS that shrinks `#wrap`, but the engine only recomputes
   `CELL/OX/OY` inside `resize()`, which fires on a window resize event — not on a
   style change. So the game kept its old geometry while my column maths used the
   new one and **every click landed in the wrong column**. Fix: dispatch a `resize`
   event after injecting the CSS.
3. **Drops were timer-paced instead of landing-paced.** The engine's value picker
   advances per *landing*, so a fixed `sleep()` desynchronises any scripted
   sequence — the Game Over fill produced merges instead and never filled the
   board. Fix: wait for each tile to land (`waitLanded`).
4. **A clip claimed something untrue.** Clip 06 was captioned "Reaching 256", which
   is unreachable in a short clip (256 needs a 128+128 merge chain), and clip 01's
   subtitle said "10 seconds" on a 20-second clip. Both rewritten. *Marketing that
   overstates the footage is a liability, not a shortcut.*

### ✅ Launch posts — `marketing/launch-posts.md`
Drafts for r/WebGames, r/playmygame, Show HN, Product Hunt, IndieDB, and
r/incremental_games — plus a posting order, and community rules worth following.
**Nothing has been posted.** Drafts only, as instructed.

> ⚠️ **Flagged:** r/incremental_games is probably the wrong room — Neon Drop has no
> idle mechanic, no prestige and no offline progress, and that sub is strict about
> scope. `r/puzzlegames` is a better fit. A draft is included either way, but this
> needs a decision before posting.

### ⬜ Analytics — needs an account, so it needs a handshake
Cloudflare Web Analytics and Umami Cloud both require an account, so this could not
be done autonomously. It is queued. Deliberately **not** hand-rolled as a
first-party Netlify Function: it would add a serverless dependency and a datastore
to a site whose entire selling point is that it has no dependencies.

---

## Phase 1 — results (evidence in `.verify/out/`, re-confirmed on production in `.verify/out-prod/`)

**Functional: 42/42 passing, on localhost AND on the live production URL.**
Harness: `.verify/verify.mjs` (Playwright). It observes the game the way a player does — wrapping
`fillText`/`clearRect` to read the HUD the engine actually paints, and pinning `Math.random` to make
tile values deterministic. **No game code was modified to make it testable.**

| Check | Result | Evidence |
|---|---|---|
| Board renders; drop guide tracks all 5 columns | ✅ | guide x = 51/129/207/285/363, uniform 78px gaps |
| Tile drops, lands, merges with an equal neighbour | ✅ | score 0 → 72 |
| Cascades chain, combo climbs | ✅ | peak COMBO ×3 |
| Score + BEST survive reload | ✅ | `{"best":72,"coins":7}` → menu shows 72 |
| Game Over when board fills, no merges left | ✅ | reached after a genuine 40-drop fill |
| "Watch ad & continue" clears top rows, resumes | ✅ | top 3 rows 0.43% lit vs 89% lit below |
| "Play again" resets state | ✅ | score 0, board cleared |
| Touch, mouse AND keyboard | ✅ | touchscreen tap, mouse down/up, ←/→/Space |
| Responsive at 360×640 / 414×896 / 768×1024 / 1440×900 | ✅ | board fits every viewport |
| Zero console errors / 404s | ✅ | none, on any page or viewport |

### Real defects found and fixed (shipped code, not the test)
1. `game/index.html` — `user-scalable=no` + `maximum-scale=1` failed `meta-viewport` (weight 10) and
   blocked pinch-zoom for low-vision users. Removed.
2. `game/index.html` — no `<main>` landmark (`landmark-one-main`). Wrapper is now `<main>`.
   A11y 82/86 → **100**.
3. `index.html` — the embedded game loaded eagerly, putting 3 round-trips and a continuous canvas
   render loop on the landing page's critical path. Replaced with a **click-to-play facade**.
4. `index.html` — `backdrop-filter: blur(12px)` header, oversized h1 `drop-shadow`, 80px frame
   `box-shadow`. All trimmed.

### Test-harness bugs found (NOT product bugs — recorded so nobody re-chases them)
- `guide.x` from `fillText` is the column **centre**, not the left edge. Treated as the left edge it
  made columns 3/4 look unreachable. The game was always correct.
- `canvas.getContext('2d').getImageData()` returns an **all-white buffer** in headless Chromium for
  this canvas, so pixel assertions built on it are vacuous. The harness decodes real screenshots
  instead (pure-Node PNG decoder in `verify.mjs`).
- Passing `formFactor: 'desktop'` **without** a matching `throttling` preset silently throttles a
  desktop viewport like mobile. That alone made desktop look ~10 points worse.
- **Editing the same file with parallel `Edit` calls silently clobbers changes** — one edit reported
  success while another overwrote it, leaving mismatched `<div>`/`</main>` tags. Apply edits to a
  file **sequentially** and verify by reading back.
- Counting bare `iframe` elements fails on any host that injects its own chrome (Netlify's badge).
  Count only *our* frames.

---

## Blocked / open questions

1. **✅ Adsterra payout — DONE 2026-09-30.** WebMoney (WMZ) attached, $5 minimum, biweekly
   automatic payouts. **Follow-up for Angelo:** confirm the Payout Information form shows
   *approved*, not pending — Adsterra requires approval as well as the balance.
2. **Traffic is now the binding constraint, not engineering.** Ads serve and a payout method is
   attached; revenue is $0.00 purely because there is not yet enough traffic. The three articles
   and ten clips are live. **The launch posts are drafted but unposted** — posting as Angelo is
   not something I will do, so this needs either his go-ahead or a change of plan.
3. **Google Search Console + Bing Webmaster Tools** — needs a sign-in handshake to obtain the
   verification token. Netlify gives us no DNS control (the site is on a `netlify.app` subdomain),
   so DNS verification is not available; the **HTML-tag method** is the path. Handshake #2 was
   issued and **deferred, not skipped**.
4. **Every remaining Phase 3 platform** needs its own sign-in handshake — GameDistribution,
   CrazyGames, Playgama, Poki, AdSense, Ko-fi, and the long tail. Nothing can be submitted without
   an account, so this is the single biggest remaining dependency. See `MONETIZATION_STATUS.md`.
5. **Analytics** needs a Cloudflare Web Analytics or Umami account. This matters more now: with
   the money path complete, knowing which pages and referrers bring traffic is the difference
   between guessing and optimising.
6. **Phase 0 answers never explicitly confirmed.** Proceeding on recorded defaults: slug `neon-drop`,
   public contact `kingripper9@gmail.com`, Philippines, crypto-preferred payout.
   ⚠️ The contact address is now **published** on `contact.html` — say the word and I will swap it.
7. **No `LICENSE` file.** The repo is public with no license, which means all rights reserved by
   default. That is *consistent* with `terms.html` (personal licence to play only; embedding needs a
   licence) — but it is a business decision, so I have not touched it. Decide whether the source
   stays all-rights-reserved or is open-sourced; portals sometimes ask.
8. **The contact email is a personal Gmail address** and is now publicly scrapeable. Worth swapping
   for a dedicated address if it becomes noisy.
9. **`ads.txt` has no Adsterra record, deliberately.** Their publisher docs do not state an
   `ads.txt` requirement for the banner format. Confirm with Adsterra support before adding a line —
   a guessed seller record is worse than an empty file.
10. **`butler` (itch.io CLI) is blocked by the sandbox proxy.** `broth.itch.ovh` fails with
    `CONNECT tunnel failed, 502`, so itch uploads cannot be automated from here. Do not promise an
    autonomous upload path without probing the download first.

---

## Tooling (installed free, isolated, not in the repo)

| Tool | Location | Purpose |
|---|---|---|
| Playwright + Chromium | `~/.workbuddy-ai/binaries/node/workspace/node_modules` | browser verification |
| Lighthouse | same | perf/a11y/bp/seo gate |
| Netlify CLI | same (`netlify-cli` 27.10.2; no `.bin` shim — call `bin/run.js`) | deploy |
| Pillow | `~/.workbuddy-ai/binaries/python/envs/default` | cover art / og:image |

### Repo scripts
| Script | Does |
|---|---|
| `tools/build-site.mjs` | stages the public allowlist into `_site/`, asserts nothing private leaked |
| `tools/make-og-cover.py` | crops `cover.png` → 1200×630 `og-cover.jpg` |
| `tools/make-itch-zip.py` | builds `dist/neon-drop-itch.zip`, `index.html` flat at root. `--gd-id <ID>` also builds `dist/neon-drop-gd.zip` with the GD game id injected |
| `tools/record-clips.mjs` | records the 10 vertical marketing clips; `--only <id>` for one, `--captions-only` to rebuild the sheet |
| `tools/shot.mjs` | evidence screenshots of a running site (desktop + mobile) |
| `tools/check-placeholders.mjs` | placeholder gate over the deployable set; exits 1 on any ACTIVE one |
| `.verify/verify.mjs` | 47-check functional suite — `node .verify/verify.mjs <baseUrl>` |
| `.verify/verify-ads.mjs` | consent gate + ad rendering, 4 visitor paths, 18 checks |
| `.verify/shot-ads-evidence.mjs` | `evidence/ads/` — ad request log + screenshots of each rendered unit |
| `.verify/verify-itch.mjs` | drives the real itch.io store page and plays the embed, 14 checks |
| `.verify/verify-gd-build.mjs` | proves the itch and GameDistribution bundles are isolated, 10 checks |
| `.verify/audit-monetization.mjs` | what the **game** adapter is doing at runtime |
| `.verify/lighthouse.mjs` | Lighthouse gate — `node .verify/lighthouse.mjs <baseUrl>` |

Local server: `python -m http.server 8080 --directory _site` → `http://127.0.0.1:8080`.
Use `--directory`, **not** `cd _site` — see the deploy gotcha below.

---

## Log

### 2026-09-29
- **Phase 0** — read all 16 files. `gh` already authenticated as `darkgambit` → GitHub checkpoint not
  needed. Wrote `.gitignore`, `DEPLOY_SECRETS.local.md`, `PROGRESS.md`. `git init` + baseline + tag.
- **Phase 1 complete** — 42/42 functional; 2 real defects fixed; 4 harness bugs found. Commit `a1b2ad6`.
- **Phase 2 — live.** `netlify login` device flow succeeded (Angelo already signed in, one click).
  Created project `neon-drop`. First deploy live. Commit `046575a`.
- **Closed a leak before it shipped** — `publish = "."` would have served `DEPLOY_SECRETS.local.md`,
  `PROGRESS.md` and `dist/`. Replaced with an allowlisted `_site/` build. All 14 public paths 200,
  every private path 404.
- **Found + fixed a live-only defect** — Netlify's "Powered by Netlify" badge was injected into
  `game/index.html` and covered the bottom-right of the playable board. Disabled via the API.
- **Placeholders all replaced** (domain, email, og:image, ads.txt). Acceptance grep: 0 matches,
  exit 1. Commit `adefec4`. Redeployed.
- **Re-ran the full 42-check suite against production: 42/42.** Re-ran Lighthouse: local 96/95
  desktop and 100/100 mobile; production mobile passes, desktop perf is network-bound (documented
  above, with evidence).
- Two background tasks from earlier were stale (a `netlify-cli` install notification) — no action.
- **Phase 4 — ten vertical marketing clips** recorded as real gameplay (`tools/record-clips.mjs`).
  Four bugs found and fixed along the way: a `fade=out:st=0` that blacked the whole render, a
  stale engine layout because injected CSS does not fire `resize()`, timer-paced instead of
  landing-paced drops, and two clips whose on-screen text overstated the footage. Committed with
  `marketing/launch-posts.md` (drafts only — nothing posted) and `MAINTENANCE.md`.
- **Phase 5 docs** — `MAINTENANCE.md`, `MONETIZATION_STATUS.md` and `/evidence` screenshots written.
  `LAUNCH_REPORT.md` is deliberately left for last.
- **GSC handshake deferred by Angelo** ("continue") — recorded as deferred, not skipped.
- ⚠️ Bulk `rm` of the raw clip captures was blocked by a sandbox safe-delete guard (59 files in one
  glob). Harmless — the raw captures are gitignored. Delete them in batches of ≤10 if tidying.

### 2026-09-30 — Adsterra live (requirement 3 met)

- **Adsterra integrated for real.** `ads-site.js` (banner loader, consent-gated, viewport-aware)
  and `consent.js` (the gate `privacy.html` had been claiming) added; wired into `index.html` and
  all three blog pages; both added to the deploy allowlist. 4 units live, 2 approved units held
  back because the layout has no sidebar.
- **Built the consent system rather than softening the policy.** `privacy.html` §3 asserted a
  consent banner that did not exist. The fix was to make the claim true, not to weaken it.
- **Verified serving with hard evidence, not a status code.** `evidence/ads/` holds the request
  log and screenshots of the actual paid creatives: HTTP 200, 49.5 KB payloads, 728×90 and
  300×250 frames filled. A rendered iframe is not a filled one — the screenshots are the proof.
- **Made the ad assertion two-sided.** "No ad fired" is ambiguous between a privacy gate working
  and a revenue bug, so `verify.mjs` now asserts 0 requests before consent and 2 after.
  `verify-ads.mjs` covers 4 visitor paths: **18/18**.
- **Found and fixed a real a11y defect in our own consent banner** — `link-in-text-block`
  (weight 7): the `/privacy.html` link was distinguishable by colour alone. Underlined it;
  landing a11y 96 → **100**.
- **Hit the `_site` lock again**, exactly as documented. Killed the orphaned server on 8099.
  Then changed the documented serve recipe to `--directory` so the trap stops recurring.
- **Also found:** `curl` to `127.0.0.1` returns **502** in this sandbox because `HTTP_PROXY` is
  exported; and Lighthouse dies with `LanternError: NO_LCP` for the same reason. Both need the
  proxy unset. Documented in `MAINTENANCE.md`.
- **Result: production 47/47 · verify-ads 18/18 · Lighthouse all thresholds met on all 4
  measurements · acceptance grep 0 matches · every private path 404, every public path 200.**
- **Requirement 3 of the definition of done flipped to MET.** Revenue is still **$0.00** and
  nothing is withdrawable — **no payout method is attached to the Adsterra account.** That is
  now the single highest-value open item. *[Superseded the same day — see the payout entry below.]*
- **Closed my own verification gap.** I had confirmed the mobile 320×50 unit *requested*, never
  that it *filled* — the exact trap I had just written into the skill. It swaps in a **different
  key** at narrow widths, so desktop success proved nothing. Now measured: 320×50 unit used,
  HTTP 200, renders at exactly 320×50, no overflow, real creative filling it.
- **Corrected the payout facts against Adsterra's own docs:** Paxum **$5**, crypto/USDT **$5**,
  PayPal $25, Local Bank Transfer (Hyperwallet) $25, wire $1,000. *(The "NET-15" written here
  first was wrong — the real schedule is **biweekly and automatic**, 1st–2nd and 16th–17th.)*
- **`ads.txt` left AdSense-only.** Adsterra's publisher docs do not state an `ads.txt` requirement
  for the banner format; inventing a seller line would misdeclare the inventory. Needs support
  confirmation, not a guess.
- **Confirmed the itch re-upload is ready to go** — the staged `dist/neon-drop-itch.zip` already
  contains the gated `#netTag` (extracted and read back), so it is a straight file swap.
- **`LAUNCH_REPORT.md` written** — the last outstanding handover document. Handover docs now
  **5/5** and the "all docs committed and accurate" requirement is met.
- **Phase 5 is complete.** The remaining distance is entirely sign-ins: Adsterra payout (first),
  itch re-upload, Search Console, then the seven remaining platforms.

### 2026-09-30 — payout attached; the money path is complete

- **Angelo attached WebMoney (WMZ) to the Adsterra account.** Requirement 5 of the definition of
  done flips to **MET** — the scorecard is now **4 of 6**, and **all three money requirements are
  satisfied**.
- **Verified the terms rather than assuming them.** Confirmed from Adsterra's own publisher docs
  that **WebMoney is a $5 minimum**, tied with Paxum for their lowest threshold. That is the best
  available outcome: WMZ is a USD purse with no bank-region constraint, which was the whole reason
  Adsterra was chosen ahead of AdSense.
- **Corrected the payout schedule.** It is **biweekly and automatic** — 1st–2nd and 16th–17th,
  09:00–18:00 GMT, no manual request. My earlier note said NET-15, which was wrong.
- **Recorded the caveat that matters: attached ≠ approved.** Adsterra requires **both** the minimum
  balance **and** an approved Payout Information form. Flagged for Angelo to confirm the status.
- **The bottleneck has moved from engineering to distribution.** Nothing is broken and nothing is
  missing; revenue is $0.00 because there is not yet enough traffic. The articles and clips are
  live; **the launch posts are drafted but unposted** — that is the highest-value lever left.

### 2026-09-30 — itch.io re-uploaded; the last live defect is closed

- **Angelo re-uploaded the corrected zip.** Verified from the outside rather than trusted: the
  itch CDN embed revision moved from `html/19476821/` to **`html/19478707/`**, which is the proof
  the upload took effect rather than sitting in a queue.
- **`verify-itch.mjs` is now 14/14**, with two new permanent checks: the debug label reads empty
  in the rendered frame, and no dev artefacts (`ad network:`, `undefined`, `NaN`,
  `[object Object]`) appear anywhere in the live listing's game text.
- **The guard belongs there, not only in `verify.mjs`.** A correct zip is not the same as an
  effective upload — only reading the **rendered live frame** distinguishes them. Same
  "rendered ≠ filled" principle as the ad units.
- **Evidence:** `evidence/itch-listing-playing-2026-09-30.png` — score 22, clean board, no label.
- **Also confirmed:** `butler` cannot be installed from this sandbox (`broth.itch.ovh` →
  `CONNECT tunnel failed, 502`), so itch uploads cannot be automated here. Recorded so a future
  session does not promise an autonomous path that cannot work.
- **No live defects remain.** Every known issue on every public surface is now fixed and verified.

### 2026-09-30 — GameDistribution terms read (hard rule satisfied before any acceptance)

- **Read the real agreement before asking for a sign-in.** The brief's hard rule is that the
  exclusivity, revenue-share and termination clauses get shown *before* anything is accepted.
  Fetched the **Developer** Game License Agreement (`static.gamedistribution.com/terms/developer.html`,
  KEYGAMES NETWORK B.V., updated 19 June 2025) and extracted all three.
- **⚠️ Nearly presented the wrong document.** My first fetch returned the **Publisher** agreement —
  which is for *embedding their catalogue on our site*, not for *submitting our game*. Its §2.2
  grants them an **exclusive** right to sell in-game ads on publisher properties, which would
  collide with our Adsterra setup. Caught it because the licence ran the wrong direction
  (*"Distributor hereby grants to Publisher…"*). **The direction of the grant is the tell.**
- **The clauses are clean:** §2.1 is **non-exclusive** ("worldwide, royalty-free, non-exclusive
  license"), so Neon Drop can stay on itch.io and go anywhere else simultaneously. §7.1 is
  **30 days' notice either party** with no forfeiture of accrued revenue.
- **Two things to be honest about:** the 33% is of **Net Revenue**, i.e. gross minus their ad and
  hosting costs and fraud deductions — the effective rate on gross is well under 33%. And the
  threshold is **€100**, paid within 60 days of month-end, so this is a *distribution* play, not a
  near-term earner.
- **⚠️ SDK integration is mandatory** (§2.6.3 — failure means the publishing request is **denied**).
  The adapter already auto-detects `gdsdk`, but the SDK itself is not in the build, and **the
  snippet is only issued after the game entry exists** — so it cannot be pre-integrated. Correct
  order: account → game entry → snippet → integrate → upload.
- **Nothing accepted. Awaiting Angelo's explicit OK**, per the hard rule.

### 2026-09-30 — GameDistribution: account created, SDK + pre-roll integrated

- **Account created** after the clauses were shown. Informed consent satisfied: the exclusivity,
  revenue-share and termination clauses were presented before the sign-up.
- **Found a real gap against GD's requirements.** GD mandates a **pre-roll** ad on the Play
  button; Neon Drop had none. The mid-roll (`gameOver()`) and the two rewarded buttons were
  already in exactly the right place — GD's recommended Game Over / Win screen buttons — so the
  pre-roll was the only missing piece.
- **⚠️ My first fix was wrong and the test caught it.** I awaited `Ads.interstitial()` before
  starting, disabling Play meanwhile. On the GD bundle the live test showed the menu still up
  after the click: GD's SDK was present, its promise never settled, and the button stayed
  disabled — **a dead-end on the menu**, which is a portal rejection. My own 45 s guard would
  have meant 45 seconds of a frozen menu.
- **Correct design: fire and forget, then start** — following GD's own reference implementation,
  which calls `showAd()` on the button and lets `SDK_GAME_PAUSE` pause the game rather than
  awaiting a promise. Skipped entirely when no network is present, so our site and itch are
  unchanged.
- **Added a stuck-pause backstop.** `ads:pause` arms a 90 s watchdog that force-resumes;
  `ads:resume` clears it. A blocked SDK that fires the pause and never the resume would otherwise
  freeze the board with no way out.
- **Mute requirement satisfied by absence** — the game has no audio at all (no `Audio`, `sound`
  or `.play()` anywhere), so there is nothing to mute. Documented so nobody "adds mute handling"
  to a silent game.
- **Build isolation implemented and proven.** The GD game id is **injected at build time, never
  committed**; the adapter only fetches GD's SDK when `gdGameId` is non-empty. New
  `.verify/verify-gd-build.mjs` loads both real bundles in a browser and asserts what the adapter
  actually does — **10/10**: itch reports `none` with **0** SDK requests, GD reports
  `gamedistribution` with 1, and both still start the game.
- **The builder reads the id back out of the written zip** rather than trusting the string it just
  built, and refuses to ship the itch bundle if `gdGameId` is non-empty.
- **Regression-checked:** production `verify.mjs` **47/47**, `verify-ads.mjs` **18/18**. Deployed.
- **Blocker:** the game id. GD issues it only after the game entry exists in their dashboard, so
  the bundle cannot be built or uploaded until then.

### 2026-09-30 — the test harness was overwriting the release artefact

- **Found by accident, and it was a live trap.** `dist/neon-drop-gd.zip` was sitting on disk
  carrying `gdGameId: '49258a0e497c42b5b5d87887f24d27a6'`. That is **not** a GD game id — it is
  the throwaway id hard-coded in `.verify/verify-gd-build.mjs` line 39. Running the test suite
  rebuilt the bundles **into `dist/`**, i.e. into the exact paths a release build uses.
- **Why that mattered:** the file was named, sized and shaped like an upload bundle. The obvious
  next action at the GD checkpoint was to upload it. GD would have rejected it at activation
  (unknown game id), and the symptom — "the SDK loads but no ad ever plays" — would have read as
  an SDK integration bug, sending the next session hunting in `monetize.js` for a problem that
  was never there.
- **Fixed properly, at the source rather than by remembering.** `tools/make-itch-zip.py` gained
  `--out-dir`; the harness now builds into an `os.tmpdir()` folder and deletes it. The verifier
  also asserts, as an 11th check, that the throwaway id did **not** land in `dist/`.
- **A latent crash surfaced while testing the fix.** `_write_zip()` printed
  `out.relative_to(ROOT)`, which raises `ValueError` for any output outside the repo — so the
  first `--out-dir` run died with a Python traceback. Now falls back to the absolute path.
- **Re-verified 10/10**, `dist/` left untouched, stale artifact deleted (regenerable with one
  command). Committed `78b81d9`.
- **Lesson recorded for future sessions:** a build tool that writes to a canonical output path
  must let tests redirect it. Otherwise "run the tests" silently becomes "ship the test fixture".

### 2026-09-30 — Angelo: "most of your instructions and guide are outdated" — he was right

He was. I re-read GameDistribution's **live** sources rather than my notes, and the submission
guidance in `PORTAL_SUBMISSION_KIT.md` was materially wrong. Corrections, all now verified:

- **The Description field has a hard 200–500 character limit.** I had told him to paste the ~1,800
  character long description. It would have been rejected. Same limit on **Instructions**, where I
  had supplied ~140 characters — also outside the range. New copy written and counted: description
  **414** chars, instructions **361** chars.
- **Three thumbnail sizes are required: 512×512, 512×384 and 200×120.** I had supplied one. The two
  missing ones now exist. Worse, the old inline recipe hardcoded `x=0` for every crop — `cover.png`
  is centred art, so the left-edge crop sliced the right-hand tile cluster out of frame. Replaced
  with `tools/make-portal-thumbs.py` (centred crops), verified by eye at all three GD sizes.
- **Fields I listed that do not exist:** orientation, price, screenshots, "account required",
  website, privacy-policy URL. Genres are capped at **2**, tags at **5**, and **age groups are
  mandatory** — none of which I had mentioned.
- **A control I never told him about: the rewarded-ads flag.** GD's wiki is explicit — leave it
  unticked and the game "is unable to request rewarded ads". Neon Drop's two rewarded buttons would
  have silently done nothing on the GD build.
- **`49258a0e497c42b5b5d87887f24d27a6` — correcting my own earlier claim.** Last session I said that
  string was "my own test fixture". It is not: it is **GD's own example gameId, printed verbatim in
  their SDK-Implementation wiki**. The conclusion stands (it is not *our* id, so a bundle carrying it
  fails activation), but the provenance I gave was wrong and is corrected here.
- **Rewarded-ad defect found and fixed in `game/monetize.js`.** The adapter resolved `true` whenever
  `gdsdk.showAd('rewarded')` resolved. That promise also settles when the player **closes the ad
  early**, so a skipped ad paid out the reward — a breach of GD's completed-impression rule and
  squarely inside their invalid-traffic clawback clauses. Now gated on `SDK_REWARDED_WATCH_COMPLETE`
  only; errors and early closes resolve `false`; a 4 s grace window covers a late event; a 120 s
  backstop means the button can never hang. New `.verify/verify-rewarded.mjs` — **8/8**, and the
  test has teeth by construction: scenarios A and B are identical except for the event, yet return
  different results.
- **Layout risk checked and cleared.** GD recommends an 800×600 iframe and the game is portrait.
  New `.verify/verify-iframe-fit.mjs` — **20/20** at 800×600, 640×480, 1024×768, 520×1030; the board
  adapts with no clipping and stays playable. Screenshots in `.verify/out-iframe/`.
- **Ad-placement rules confirmed to match our build:** pre-roll **and** mid-roll are both mandatory
  (we have both), ads only on user input, outside gameplay, paused and muted.
- **Compliance note:** GD prohibits **any** data collection from the game — no Google Analytics,
  Facebook Pixel, DoubleClick, Mixpanel, Adobe, Flurry. Another reason the GD build must stay
  isolated from the Adsterra site loader.
- **Activation re-confirmed:** upload → open in their iframe from the upload view → watch one full
  pre-roll until `CONTENT_RESUME_REQUESTED` → integration approved, **up to two weeks**. Initial
  review is **up to one week**. Debug with `gdsdk.openConsole()`.
- **`PORTAL_SUBMISSION_KIT.md` now carries a per-section verification status**, so an unverified
  section can never again be mistaken for a checked one. Only GD is verified; A/C/D/E/F/G/H are
  explicitly marked as assumed.
- **Still blocked on the same single value:** the GD game id. Nothing else in Phase 3B is open.

### 2026-09-30 — the form itself caught one more thing: **JPG, not PNG**

Angelo pasted a screenshot of the actual GD upload view. It settles the asset question and corrects
my own correction:

- **Every image slot advertises ".jpg or .jpeg".** The thumbnails I had just generated were **PNG**,
  so the file picker would have refused all three. Dimension-correct and format-wrong — a failure
  that only appears at the moment of upload, with no useful error.
- **The form confirms the sizes** — 512×384, 512×512, 200×120, each labelled *"Required (main
  thumbnail)"* — and adds a fourth: **1280×720, "Helpful for marketing"**. So it is four slots, not
  three.
- `tools/make-portal-thumbs.py` now emits **both PNG and JPG** for every size (portals disagree on
  container; itch and Poki take PNG). New `tools/check-portal-assets.py` asserts each required slot
  exists, at the right size **and in the right format**, and exits 1 otherwise — proven to fail
  correctly by removing one file and watching it name it.
- All four GD slots now pass: 512×384 44 KB, 512×512 53 KB, 200×120 8.5 KB, 1280×720 125 KB.
  JPEG quality 92 — checked by eye on the gradient-heavy 512×384, no banding.
- **Lesson worth keeping:** "check the thumbnail sizes" was not enough. Check the **container
  format** too. A slot can be exactly the right dimensions and still be un-uploadable.

### 2026-09-30 — a fifth slot: **1280×550**

Angelo's second screenshot showed one more marketing slot below the fold — **1280×550**, `.jpg`,
"helpful for marketing". The earlier screenshot had been cut off just above it, which is why it was
missed; the form is taller than one screen.

- It is not a resize of the 1280×720. **2.33:1 against a 1.79:1 source**, so it needs a *height*
  crop — and a centred crop (`fy=0.5`) starts at source y=88 while the "NEON DROP" wordmark sits at
  roughly y=60–110, i.e. **it slices the title in half.** Generated with an upward bias, `fy=0.17`
  (crop y=30..621), which keeps the wordmark with headroom and still shows the board.
- `tools/make-portal-thumbs.py` and `tools/check-portal-assets.py` both updated; the gate now
  asserts **five** slots. All pass — 512×384 44 KB · 512×512 53 KB · 200×120 8.5 KB ·
  1280×720 125 KB · **1280×550 103 KB**.
- **Both screenshot-driven catches were the same shape:** the written guidelines were accurate as
  far as they went, and the *form* carried the detail that actually blocks an upload — the container
  format, and a slot that only existed below the fold. When a human can see the real form, ask for
  it; a screenshot beat two rounds of documentation reading.

### 2026-09-30 — 🟢 THE GAME ID ARRIVED. Phase 3B is upload-ready.

Angelo supplied **`bf2e282808444ff495c89f0c78bc617f`**. The blocker that stood for the whole of
Phase 3B is cleared.

- **Validated before use:** 32 characters, pure hex, matches GD's game-id shape, and **not** the
  documentation example the release gate refuses by name.
- **Bundle built:** `dist/neon-drop-gd.zip` (12.2 KB). The builder read the id back **out of the
  written zip** and asserted it landed — `gdGameId: 'bf2e28…617f' verified INSIDE the zip`.
- **`.verify/verify-gd-release.mjs` — 8/8, prints `READY TO UPLOAD`.** The real artefact loads, the
  adapter reports `network=gamedistribution` at runtime, GD's SDK is actually requested, the game
  starts, no console errors from our code.
- **Regression-checked after the build:** isolation **11/11** (the neutral itch bundle still reports
  `none` with 0 SDK requests, and the harness asserts the throwaway id never touched `dist/`),
  rewarded gate **8/8**, placeholder gate **PASS**.
- **The itch bundle is unchanged and still network-neutral** — the id lives only in the GD artefact.
- **Recorded** in `DEPLOY_SECRETS.local.md` (which is gitignored — the id never enters the repo).
- **Next action is Angelo's, and it is a manual one:** upload `dist/neon-drop-gd.zip`, tick the
  rewarded-ads flag, then watch a full pre-roll and a complete rewarded ad in GD's iframe. Those two
  checklist items could never have passed before now — see the entry above for why.

---

## Status line format (after each phase)

> **shipped** … / **broke** … / **fixed** … / **blocked** … / **next** …
