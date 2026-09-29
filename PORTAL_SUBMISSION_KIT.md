# PORTAL_SUBMISSION_KIT.md

> Every value needed to submit Neon Drop to each portal, prepared **before** any sign-in.
> The point of this file: each platform handshake should be pure copy-paste, with no
> thinking required at the checkpoint.
>
> ⚠️ **Before accepting any platform agreement**, the exclusivity clause, revenue-share
> clause and termination clause must be pasted into the chat and explicitly approved.
> Status of that review is tracked in `MONETIZATION_STATUS.md`.

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
| `dist/neon-drop-itch.zip` | 11 KB | Upload build — `index.html` at zip root |
| `dist/art/512x512-square.png` | 292 KB | Poki icon, Playgama, GameDistribution thumbnail |
| `dist/art/800x450-crazygames.png` | 392 KB | CrazyGames thumbnail (16:9) |
| `dist/art/1280x720-16x9.png` | 956 KB | itch.io, general 16:9 |
| `dist/art/1920x1080-16x9.png` | 1.7 MB | Large 16:9 where requested |
| `dist/art/630x500-itch-cover.png` | 363 KB | itch.io cover |
| `cover.png` (1376×768) | 1.7 MB | Source art / social OG image |
| `cover.jpg` (1280×714) | 96 KB | Lighter source art |

**Note:** `cover.jpg` is 1280×714 rather than a true 16:9 1280×720 — a 6-pixel difference,
harmless for every portal reviewed here, but `dist/art/1280x720-16x9.png` is exact if a
strict validator complains.

---

## Build command

Regenerate the upload zip from the `game/` folder at any time:

```bash
python -c "
import zipfile, os
with zipfile.ZipFile('dist/neon-drop-itch.zip','w',zipfile.ZIP_DEFLATED) as z:
    for f in ['index.html','game.js','monetize.js']:
        z.write(os.path.join('game', f), f)
"
```

`index.html` **must** sit at the zip root — not inside a folder. All three files must be
flat and side by side, because `index.html` loads `monetize.js` and `game.js` by relative path.

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
| Screenshots | `evidence/` gameplay shots |
| Visibility | Public |

### B) GameDistribution — 33% of net revenue, €100 threshold
| Field | Value |
|---|---|
| Upload | `dist/neon-drop-itch.zip` (index.html at root) |
| Title | Neon Drop |
| Description | long description above |
| Category | Puzzle |
| Tags | merge, puzzle, casual, html5 |
| Thumbnail | `dist/art/512x512-square.png` |
| **After approval** | copy the **Game ID** into `gdGameId` in `game/monetize.js`, re-zip, re-upload, confirm the rewarded button fires a real ad in their preview |

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
| `ads.txt` | replace `pub-0000000000000000` with the real publisher ID |
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
> full-height touch target. Tested at 360×640, 414×896, 768×1024 and 1440×900.

**"Does it require an account or collect data?"**
> No account, no login, no personal data collected by the game. Best score and coins are
> stored in the player's own browser via localStorage and never leave the device.

**"Is it exclusive?"**
> No. Neon Drop is offered **non-exclusively**. Any request for exclusivity must be reviewed
> and approved before acceptance.
