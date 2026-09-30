# PORTAL_SUBMISSION_KIT.md

> Every value needed to submit Neon Drop to each portal, prepared **before** any sign-in.
> The point of this file: each platform handshake should be pure copy-paste, with no
> thinking required at the checkpoint.
>
> ⚠️ **Before accepting any platform agreement**, the exclusivity clause, revenue-share
> clause and termination clause must be pasted into the chat and explicitly approved.
> Status of that review is tracked in `MONETIZATION_STATUS.md`.

## Verification status — read this before trusting a section

This file previously mixed **verified** facts with **assumed** ones, and the GD section was wrong
as a result (it quoted marketing copy instead of the submission requirements). Each section now
carries its own status. Do not treat an unverified row as fact — re-check it against the live docs
at that platform's handshake.

| Section | Status | Source of truth |
|---|---|---|
| **B) GameDistribution** | ✅ **verified 2026-09-30** | developers-guidelines.html + GD-HTML5 wiki (URLs in the section) |
| A) itch.io | 🟡 **working** — confirmed by a live submission, but the field list was never re-checked against docs | the live listing |
| C) CrazyGames | ⬜ **assumed** — not yet verified | re-check at handshake |
| D) Playgama | ⬜ **assumed** — not yet verified | re-check at handshake |
| E) Poki | ⬜ **assumed** — not yet verified | re-check at handshake |
| F) AdSense | ⬜ **assumed** — not yet verified | re-check at handshake |
| G/H) Ko-fi, long tail | ⬜ **assumed** — not yet verified | re-check at handshake |

The three rules that have held up across every platform checked so far: **read the clauses before
accepting**, **check whether the form has a hard character limit**, and **check the thumbnail
sizes** — those two bite more often than anything else.

---

## The game — facts to reuse everywhere

| Field | Value |
|---|---|
| **Title** | Neon Drop |
| **Genre / category** | Puzzle · Casual · Merge |
| **Tagline** | Drop. Merge. Chain the combo. |
| **Controls** | Mouse: move to aim, click to drop. Touch: drag to aim, tap to drop. Keyboard: ← → to aim, Space to drop. |
| **Players** | Single player |
| **Orientation** | Portrait |
| **Platforms** | Any modern browser (Chrome, Safari, Firefox, Edge) — desktop, tablet, phone |
| **Tech** | Pure HTML5 + Canvas + vanilla JavaScript. No engine, no dependencies, no build step. |
| **Payload** | ~33 KB uncompressed, ~11 KB zipped |
| **Languages** | English |
| **Age rating** | General audience / all ages |
| **Price** | Free |
| **Account required** | No |
| **Offline capable** | Yes, once loaded |
| **Save system** | `localStorage` (best score + coins), device only |

### Short description (~150 chars)
> A free browser merge puzzle. Drop glowing tiles into five columns, fuse matching numbers, and chain cascades that multiply your score.

### Medium description (~300 chars)
> Neon Drop is a free browser puzzle game. Aim a glowing tile at any of five columns, let it fall, and watch matching numbers fuse and double. After every merge gravity re-applies and the board re-checks itself, so a single drop can trigger a five-link cascade with a climbing combo multiplier. No download, no account.

### Long description
> **Drop. Merge. Chain the combo.**
>
> Neon Drop is a free browser puzzle game about structure, not speed. Aim a glowing tile at any of five columns and let it fall. Tiles that touch and match fuse into one tile of double the value — and merging three or four at once doubles the result again for every extra tile.
>
> The twist is what happens after a merge. The board does not settle once: gravity re-applies, the engine re-checks for matches, and if anything merged it goes round again. That loop is what produces cascades. Set up a descending column — 16, 8, 4, 2 — and a single dropped 2 can chain all the way to the top, with the combo multiplier climbing on every link.
>
> Because of that, patience beats activity. Four merges made separately score 75 points. The same four merges chained in one drop score 109. Every extra link widens the gap.
>
> **Features**
> - Touch, mouse and keyboard controls (← → to aim, Space to drop)
> - Real cascading merges with a compounding combo multiplier
> - Your best score and coins saved locally — no account, no signup
> - Optional rewarded ad to clear the top rows and keep a run alive
> - Under 35 KB of code, so it opens instantly even on a slow connection
> - Works offline once loaded
> - Privacy-first: no login, no email, no personal data collected by the game
>
> Free to play, forever. Supported by optional advertising.

### Tags / keywords
```
merge, puzzle, casual, html5, browser game, drop, 2048, cascade, combo,
hypercasual, one button, mobile, no download, free, neon, numbers, stacking,
match, single player, arcade
```
**Top 10 if the field is limited:** `merge, puzzle, casual, drop, cascade, combo, html5, browser, mobile, free`

---

## Assets

| File | Size | Use |
|---|---|---|
| `dist/art/512x384-gd.jpg` | 44 KB | **GameDistribution 512×384** (required, .jpg) |
| `dist/art/512x512-square.jpg` | 53 KB | **GameDistribution 512×512** (required, .jpg); Poki icon, Playgama |
| `dist/art/200x120-gd.jpg` | 8.5 KB | **GameDistribution 200×120** (required, .jpg) |
| `dist/art/1280x720-16x9.jpg` | 125 KB | **GameDistribution 1280×720** (marketing, optional); itch.io |
| `dist/neon-drop-itch.zip` | 10.4 KB | Upload build — `index.html` at zip root |
| `dist/art/800x450-crazygames.png` | 392 KB | CrazyGames thumbnail (16:9) |
| `dist/art/1920x1080-16x9.png` | 1.7 MB | Large 16:9 where requested |
| `dist/art/630x500-itch-cover.png` | 363 KB | itch.io cover |
| `dist/screenshots/01-combo-cascade.png` | 433 KB | **Screenshot** — live `COMBO x2` + floating `+24` |
| `dist/screenshots/02-building-64.png` | 514 KB | **Screenshot** — gold 64 mid-board, score 421 |
| `dist/screenshots/03-high-scores.png` | 568 KB | **Screenshot** — two 64s, score 699 |
| `cover.png` (1376×768) | 1.7 MB | Source art / social OG image |
| `cover.jpg` (1280×714) | 96 KB | Lighter source art |

Every size above exists as **both** `.png` and `.jpg` — generated by
`tools/make-portal-thumbs.py`. Portals differ on container: **GameDistribution wants `.jpg`**,
others accept PNG. `tools/check-portal-assets.py` asserts the required slots.

**Screenshots are 1040×2060** (portrait 1:1.98), captured from the **live production build** by
`tools/shot-portal.mjs`. Portrait, not letterboxed 16:9, because Neon Drop is a portrait game —
a landscape shot would show a small board floating in empty space. See "Why these numbers" below.

**Note:** `cover.jpg` is 1280×714 rather than a true 16:9 1280×720 — a 6-pixel difference,
harmless for every portal reviewed here, but `dist/art/1280x720-16x9.png` is exact if a
strict validator complains.

### Why these numbers (don't re-derive them)

`#wrap` in `game/index.html` is capped at `max-width:520px`. At any tall viewport the board is
therefore **width**-constrained, and the lower part of the canvas is empty background. 520×1030 is
the tallest viewport at which the board still fills the frame:

```
CELL     = (520 - 24) / 5          = 99.2
needed h = TOPBAR + CELL*1.25 + 8*CELL + 16
         = 96 + 124 + 793.6 + 16   = 1030
```

`deviceScaleFactor: 2` then yields 1040×2060. RNG is seeded (`SEED`, default 777) so the same
boards come back every run — a listing screenshot you cannot reproduce cannot be updated later
without guessing. Drops are **idle-paced**: the engine ignores a drop while a tile is still
falling, so clicking on a timer silently loses most of them and leaves the board nearly empty.

---

## Build command

Regenerate the upload zip (canonical builder — it also asserts the zip contents and integrity):

```bash
node tools/build-site.mjs            # refresh _site/ (not needed for the zip)
python tools/make-itch-zip.py        # -> dist/neon-drop-itch.zip
node tools/shot-portal.mjs           # -> dist/screenshots/*.png
```

`index.html` **must** sit at the zip root — not inside a folder. All three files must be
flat and side by side, because `index.html` loads `monetize.js` and `game.js` by relative path.
`tools/make-itch-zip.py` asserts exactly this and exits non-zero if it is wrong.

Regenerate the cover-art set (needs Pillow; `dist/` is gitignored, so these are build
artifacts, not source):

```bash
python -c "
from PIL import Image
src = Image.open('cover.png').convert('RGB')
def cover(img, tw, th, fy=0.5):
    ta, sa = tw/th, img.width/img.height
    if sa > ta: nw, nh, x, y = int(img.height*ta), img.height, 0, 0
    else:       nw, nh, x, y = img.width, int(img.width/ta), 0, int((img.height-nh)*fy)
    return img.crop((x,y,x+nw,y+nh)).resize((tw,th), Image.LANCZOS)
for name, tw, th, fy in [('512x512-square.png',512,512,.42),
                         ('800x450-crazygames.png',800,450,.5),
                         ('1280x720-16x9.png',1280,720,.5),
                         ('1920x1080-16x9.png',1920,1080,.5),
                         ('630x500-itch-cover.png',630,500,.5)]:
    cover(src, tw, th, fy).save('dist/art/'+name, 'PNG', optimize=True)
"
```

---

## Per-platform field values

### A) itch.io — no approval gate, live same day
| Field | Value |
|---|---|
| Kind of project | HTML |
| Upload | `dist/neon-drop-itch.zip` |
| "This file will be played in the browser" | ✅ checked |
| Embed | Click to launch, or embed in page |
| Viewport | **1280 × 720** |
| Fullscreen button | ✅ checked |
| Mobile friendly | ✅ checked (portrait) |
| Title | Neon Drop |
| Short description | see above |
| Genre | Puzzle |
| Tags | `merge, puzzle, casual, browser, html5, singleplayer, free, arcade` |
| Pricing | No payments / free |
| Cover image | `dist/art/630x500-itch-cover.png` |
| Screenshots | `dist/screenshots/` — all 3 (`01-combo-cascade.png`, `02-building-64.png`, `03-high-scores.png`) |
| Visibility | Public |

### B) GameDistribution — 33% of net revenue, €100 threshold

> **Re-verified 2026-09-30 against the live sources** (the earlier version of this section was
> wrong — it quoted the marketing page, not the submission requirements):
> - Requirements: <https://static.gamedistribution.com/developer/developers-guidelines.html>
> - SDK: <https://github.com/GameDistribution/GD-HTML5/wiki/SDK-Implementation>
> - Rewarded: <https://github.com/GameDistribution/GD-HTML5/wiki/Rewarded-Ads>
>
> **The single most important correction: the Description and Instructions fields each have a
> HARD 200–500 character limit.** The long description used elsewhere in this kit is ~1,800
> characters and would have been rejected. The portal-legal copy is in the block below.

**Order matters — this is the trap.** The GD game id does not exist until the game entry does, and
the SDK snippet is only issued with the entry. So:

```
1. create the game entry (fields below)      -> GD issues the GAME ID
2. python tools/make-itch-zip.py --gd-id <GAME_ID>
3. upload dist/neon-drop-gd.zip  (NOT the itch zip — the itch one has no game id)
4. open the game in GD's preview iframe and watch one full pre-roll  -> integration activated
```

If step 1's form demands a zip before it will show you an id, upload `dist/neon-drop-itch.zip` as a
placeholder to create the entry, copy the id, then **replace** it with the GD build. A bundle
without the id is not the finished article — GD denies publishing when the SDK is not integrated
(§2.6.3).

#### Fields — with the limits that actually apply

| Field | Value | Limit |
|---|---|---|
| Upload | `dist/neon-drop-gd.zip` — `index.html` at root | zipped, `index.html` flat at the root |
| Title | `Neon Drop` | must be distinct; no copyrighted names |
| **Description** | the 414-char copy below | **200–500 chars, hard** |
| **Instructions** | the 361-char copy below | **200–500 chars, hard** |
| Genres | `Puzzle` | **min 1, max 2** |
| Tags | `merge, puzzle, casual, drop, cascade` | **min 1, max 5** |
| Thumbnails | **`.jpg` files**: `dist/art/512x384-gd.jpg`, `dist/art/512x512-square.jpg`, `dist/art/200x120-gd.jpg` | **all three required**; **`.jpg`/`.jpeg` only** — the picker refuses PNG |
| Age groups | select all-ages / general audience | **mandatory** |
| Language | `English` (or `No-Text`) | default should be English |
| **Rewarded ads** | **tick the rewarded-ads flag** | **not a text field — see below** |
| Backlinks | none needed | store links go in the Backlinks tab |

**Not fields on this form** (the earlier version wrongly listed them): orientation, price,
screenshots, "account required", website, privacy-policy URL. Don't go looking for them.

#### ⚠️ The rewarded-ads checkbox — easy to miss, breaks a feature

GD's own rewarded-ads wiki says it outright:

> "**DO NOT FORGET TO CHECK REWARDED ADS FLAG** on developer.gamedistribution.com for your game.
> Otherwise, your game is unable to request rewarded ads."

Neon Drop has two rewarded buttons (Revive, and the coin reward). Leave that flag unticked and they
silently do nothing on the GD build. It is a separate control from the text fields.

#### The 414-char description (paste exactly)

```
Neon Drop is a free browser merge puzzle. Aim a glowing tile at any of five columns, let it fall, and fuse matching numbers into one tile of double the value. After every merge the board settles again, so one drop can trigger a five-link cascade with a climbing combo multiplier. Patience beats speed: four separate merges score 75, but chained in one drop they score 109. No download, no account, works on mobile.
```

#### The 361-char instructions (paste exactly)

```
Mouse: move the pointer across the board to choose a column, then click to drop the tile. Touch: drag to aim, then tap to drop. Keyboard: use the left and right arrow keys to aim, then press Space to drop. Tiles that touch and match merge into one tile of double the value. Chain several merges in a single drop to build a combo multiplier and score far higher.
```

#### The four image slots — **JPG, not PNG**

Confirmed against the live upload form, which advertises *"Choose a .jpg or .jpeg file…"* on every
slot. **A PNG is refused at the file picker.** The generator emits both formats; upload the `.jpg`.

| Slot | File to upload | Required? |
|---|---|---|
| 512 × 384 | `dist/art/512x384-gd.jpg` | ✅ required (main thumbnail) |
| 512 × 512 | `dist/art/512x512-square.jpg` | ✅ required (main thumbnail) |
| 200 × 120 | `dist/art/200x120-gd.jpg` | ✅ required (main thumbnail) |
| 1280 × 720 | `dist/art/1280x720-16x9.jpg` | "helpful for marketing" — optional |

Regenerate all sizes in both formats (also fixes the old left-edge crop, which cut the right-hand
tiles out of frame):

```bash
python tools/make-portal-thumbs.py     # -> dist/art/*.png AND *.jpg
python tools/check-portal-assets.py    # gate: asserts every slot, size and format
```

#### Ad rules GD enforces at review

- **Pre-roll mandatory** — on the Play button. ✅ `preRollThenStart()`.
- **Mid-roll mandatory** — on non-gameplay buttons; best practice is every button on the
  Game Over / Win screen. ✅ `gameOver()`.
- Ads **only on user input**, **outside gameplay**, game **paused and muted**. ✅ no audio exists.
- Reward **only** on `SDK_REWARDED_WATCH_COMPLETE` — never on the `showAd()` promise, never in the
  `catch`. ✅ enforced by `gdRewarded()` and proved by `.verify/verify-rewarded.mjs`.

#### What is prohibited on their platform

- **Any data collection from the game is strictly prohibited.** No Google Analytics, Facebook
  Pixel, DoubleClick, Mixpanel, Adobe Analytics, Flurry. This is another reason the GD build must
  stay isolated from the Adsterra site loader.
- No external hosting (except real multiplayer) — GD hosts the game.
- No outgoing links: social, ads, e-commerce, surveys, affiliate.
- No login requirement, no political/religious/sexual/discriminatory content, no excessive violence.

#### Activation and review timing

- Initial review: **up to one week**.
- SDK activation is a **manual step you perform**: after upload, open the game in their iframe from
  the upload view and **watch one full pre-roll** until `CONTENT_RESUME_REQUESTED` fires. A demo
  VAST tag (99% fill) is pre-enabled, so you click their `showBanner` button in the debug bar.
  Disable ad blockers first. Approval of the integration **can take up to two weeks**.
- Debug any time with `gdsdk.openConsole()` in the browser console.

#### Layout check (done — no action needed)

GD recommends an **800×600** iframe and Neon Drop is portrait, so this was a real clipping risk.
Verified in a browser: the board fits with no clipping at 800×600 (CELL≈54px), 640×480, 1024×768
and 520×1030 — `.verify/verify-iframe-fit.mjs`, **20/20**, screenshots in `.verify/out-iframe/`.
The board simply centres in the wider frame.


### C) CrazyGames — developer.crazygames.com, €100 minimum
| Field | Value |
|---|---|
| Title | Neon Drop |
| Description | long description above |
| Category | Puzzle |
| Tags | merge, puzzle, casual |
| Controls | "Mouse / touch to aim, click or tap to drop. Arrow keys to aim, Space to drop." |
| Thumbnail 16:9 | `dist/art/800x450-crazygames.png` |
| SDK tag | add their `<script>` to `game/index.html` — `monetize.js` auto-detects it |
| Payout | Tipalti profile |

### D) Playgama Bridge — one integration, ~25 platforms, 70–90% tiered
| Field | Value |
|---|---|
| Title | Neon Drop |
| Category | Puzzle |
| Icon 512×512 | `dist/art/512x512-square.png` |
| Integration | Playgama Bridge SDK in `game/index.html` — `monetize.js` already calls `initialize()`, `advertisement.showInterstitial()`, `advertisement.showRewarded()` and `game.setState()` |

### E) Poki — curated, largest traffic
| Field | Value |
|---|---|
| Title | Neon Drop |
| Description | long description above |
| Category | Puzzle |
| Tags | merge, puzzle, casual, 1 player |
| Icon 512×512 | `dist/art/512x512-square.png` |
| SDK | Poki SDK tag in `game/index.html` — `monetize.js` already calls `gameLoadingFinished()`, `gameplayStart()`, `gameplayStop()`, `commercialBreak()` and `rewardedBreak()` correctly |
| Note | Portrait. Poki requires gameplay to start only after `gameLoadingFinished()`. |

### F) Google AdSense — self-hosted, best long-term RPM
| Field | Value |
|---|---|
| Site URL | the live Netlify domain |
| Enable | uncomment the AdSense `<script>` in `index.html` |
| `adsenseClient` | `ca-pub-…` → `game/monetize.js` |
| Ad slots | create 2 responsive units → wire `data-ad-slot` on `#ad-1` and `#ad-2` |
| `ads.txt` | uncomment the record and paste the real publisher ID — see the notes inside the file itself |
| CMP | Google Funding Choices (free) — must block personalised cookies before consent |

### G) Ko-fi / Buy Me a Coffee
Footer button only. Zero fees, five minutes.

### H) Long tail — non-exclusive only
Y8 · GameMonetize · Newgrounds · Armor Games · freegames.io

---

## Standard submission answers

**"How do you control the game?"**
> Mouse: move the pointer across the board to aim, click to drop. Touch: drag to aim, tap to
> drop. Keyboard: left and right arrows aim, Space drops.

**"Does it work on mobile?"**
> Yes. Portrait-first, one-handed. The board scales to the viewport and every column is a
> full-height touch target. Verified in a browser at 360×640, 414×896, 768×1024, 1440×900,
> and in landscape portal frames at 800×600, 640×480 and 1024×768 — the board adapts with no
> clipping in any of them.

**"Does it require an account or collect data?"**
> No account, no login, no personal data collected by the game. Best score and coins are
> stored in the player's own browser via localStorage and never leave the device.

**"Is it exclusive?"**
> No. Neon Drop is offered **non-exclusively**. Any request for exclusivity must be reviewed
> and approved before acceptance.
