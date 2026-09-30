# MONETIZATION_STATUS.md — Neon Drop

> Every platform we are pursuing, what state it is in, and — critically — **what
> the agreement actually says before anything is accepted.**

**Last updated:** 2026-09-30
**Live game:** https://neon-drop.netlify.app
**itch.io listing:** https://kdbdeocampo.itch.io/neon-drop
**Current revenue: $0.00 accrued.** Adsterra is **live and serving real creatives** on the content
pages, and a **payout method (WebMoney / WMZ, $5 minimum) is attached**. The full money path is now
wired end to end — what it needs is **traffic**.

---

## ⚠️ The hard rule on agreements

Before accepting **any** platform agreement, these three clauses get pasted into
the chat and Angelo gives an explicit OK:

1. **Exclusivity** — can the game be published elsewhere at the same time?
2. **Revenue share** — what percentage, of gross or net, and what deductions?
3. **Termination** — how do you get out, and what happens to revenue already earned?

**No agreement is accepted, and no exclusivity is opted into, without that.** A
portal asking for web exclusivity means Neon Drop can never appear on any other
portal — that is a business decision, not a technical one.

---

## Status table

| # | Platform | Type | State | Blocker |
|---|---|---|---|---|
| A | **itch.io** | Portal | 🟢 **LIVE** — verified playable | Nothing. Free game ⇒ $0 revenue by design. |
| B | **GameDistribution** | Portal + ads | 🟡 **account created · integration ready · needs the game id** | Exclusivity **non-exclusive** ✅ · 33% of net · €100 threshold · SDK + pre-roll + mid-roll done · id injected at build time · **submission copy rewritten to their 200–500 char limits**, 3 thumbnails generated · rewarded gate fixed (8/8) · ⚠️ **rewarded-ads flag must be ticked in the dashboard** |
| C | **CrazyGames** | Portal | ⬜ assets ready | Needs account + review |
| D | **Playgama Bridge** | Portal + ads | ⬜ assets ready | Needs account |
| E | **Poki** | Portal | ⬜ assets ready | Needs account + review |
| F | **Google AdSense** | Self-hosted ads | ⬜ not started | Needs account + approval (requires real traffic) |
| G | **Ko-fi / Buy Me a Coffee** | Donations | ⬜ not started | Needs account |
| H | **Adsterra** | Self-hosted ads | 🟢 **LIVE — serving verified creatives · payout attached** | Nothing. First payout due after the $5 minimum. |
| I | **Long tail** (Y8, GameMonetize, Newgrounds, Armor Games, freegames.io) | Portals | ⬜ not started | Non-exclusive only |

**Definition-of-done progress: all three money requirements are satisfied.** ✅ game live on
≥1 portal (itch.io) · ✅ ≥1 ad network verifiably making ad requests (Adsterra) · ✅ payout details
attached (WebMoney/WMZ, $5 minimum). What remains is *traffic* and the remaining portal accounts —
not plumbing.

---

## Two separate money paths — do not conflate them

This is the most important distinction on this page, and getting it wrong will cause you to
"fix" something that is not broken.

| | **Site pages** (`/`, `/blog/*`) | **Game build** (`/game/*`, the itch zip) |
|---|---|---|
| Monetised by | **Us, with Adsterra** | **The portal that embeds it** (their SDK) |
| Ad state | 🟢 **live, serving** | ⬜ intentionally none |
| `Ads.network` | n/a — plain HTML pages | `'none'` **by design** |
| Why | These are our pages; we own the inventory | The same zip is embedded by portals who monetise it themselves. Injecting our own banners inside that frame would break the embed and breach their terms. |

So `network: 'none'` on the game page is **correct and deliberate**, not a failure. If you ever
see a real ad network name there, something has gone wrong.

---

## Site pages — Adsterra, verified serving

Run it yourself: `node .verify/shot-ads-evidence.mjs https://neon-drop.netlify.app`. It walks both
consent paths, records every third-party request, and screenshots each rendered unit.

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

`evidence/ads/slot-1.png` and `slot-2.png` show **real paid creatives** filling those frames. A
rendered frame is not the same as a filled one — a blank iframe would still be a 200 — so the
screenshots are the part that matters.

| Unit | Size | Where |
|---|---|---|
| leader | 728×90 desktop / 320×50 mobile | `index.html` — above the fold, `#ad-1` |
| rect | 300×250 | `index.html` — mid-content, `#ad-2` |
| banner | 468×60 desktop / 320×50 mobile | each `blog/*.html` — before the first `<h2>` |
| rect | 300×250 | each `blog/*.html` — before the last `<h2>` |

Approved but deliberately unused: **160×600** and **160×300** — they need a sidebar this layout
does not have, and stacking every approved size on one page is both slow and hostile.

**Both breakpoints verified, not just the wide one.** The narrow viewport swaps in a *different
unit* (320×50, its own key), so desktop success says nothing about it. Measured separately:

```
--- MOBILE 390x844 ---
adRequests=2  mobile 320x50 unit used=true  overflow=false
  200  49630B  .../09e826ea0472cd384211a90e23a11fea/invoke.js    <- the 320x50 key
  200  49610B  .../743702bbd12151692c0084aff88afb14/invoke.js    <- the 300x250 rect
frames: 320x50 "Advertisement" · 300x250 "Advertisement"
```

`mobile-slot-1.png` shows a real creative filling the full 320×50. Confirming the request fired
would have been the weaker claim — a unit can request, return 200, and still be blank.

**`ads.txt` carries no Adsterra record, deliberately.** Adsterra's own publisher documentation
does not state an `ads.txt` requirement for the banner/iframe format, and publishing a guessed
seller line would misdeclare who may sell this inventory — worse than an empty file. The file
stays AdSense-only and inactive. **Confirm with Adsterra support before adding anything**; do not
invent a line to fill the gap.

### The consent gate is real, and asserted in both directions

`privacy.html` claimed a consent banner existed. It did not. Rather than weaken the policy to
match the code, `consent.js` was built so the policy became true.

```
first visit  -> banner shown, ZERO ad scripts fetched
Accept       -> stored 'granted', reload, ads render from first paint
Decline      -> stored 'denied', no ads ever again
/game/*      -> neither banner nor ads
```

Because "no ad fired" is ambiguous on its own — it is either a privacy gate working or a revenue
bug — `verify.mjs` asserts **both directions**: 0 requests before consent, 2 after. And
`.verify/verify-ads.mjs` covers the four visitor paths independently: **18/18**.

**Two implementation constraints that must not be "optimised" away:**

1. **`ads-site.js` must stay parser-blocking** — no `defer`, no `async`. Adsterra's `invoke.js`
   injects its iframe via `document.write`; running it after parsing completes triggers
   `document.open()` and **erases the page**.
2. **The ad iframes are titled by our code.** `invoke.js` creates them with no `title`, which
   fails Lighthouse's `frame-title` audit (weight 7) and, more importantly, makes a screen reader
   announce them as just "frame". A `MutationObserver` + two timeouts set `title="Advertisement"`.

**Measured cost:** running ads drops landing-page best-practices from 100 to **77**, because the
audit penalises the ad network's third-party cookies. This is **inherent to ad monetization and
not fixable**. Recorded rather than hidden.

### Payout — ✅ **ATTACHED 2026-09-30** (WebMoney / WMZ)

| Method | Minimum | KYC | |
|---|---|---|---|
| **WebMoney (WMZ / WMT)** | **$5** | no | ✅ **ATTACHED** |
| Paxum | $5 | no | available |
| Crypto / USDT (Tether) | $5 | no | available |
| PayPal (via Hyperwallet) | $25 | — | available |
| Local Bank Transfer | $25 | **yes** — ID documents | available |
| Wire transfer | $1,000 | **yes** — ID documents | available |

**WebMoney at $5 is the joint-lowest threshold Adsterra offers**, and WMZ is a
**USD-denominated purse** — so it carries **no bank-region constraint**. That was the entire
reason Adsterra was chosen ahead of AdSense: AdSense pays by bank transfer to a supported region,
Angelo's bank is in the Philippines, and he is temporarily in Libya. A $5 floor means the first
payout arrives after a few thousand impressions rather than after a $100 threshold.

Confirmed from Adsterra's own publisher documentation:
> "The smallest amount to withdraw is $5 (for Paxum and WM)."

**Payment schedule: biweekly and fully automatic** — no manual request. Paid in 2-day windows on
the **1st–2nd** and **16th–17th** of each month, 09:00–18:00 GMT, shifted to the nearest business
day on weekends. Reaching the minimum between the 1st–15th ⇒ paid the 1st–2nd of the next month;
after the 16th ⇒ paid the 16th–17th. Payout fields lock ±3 days around each window.

> ⚠️ **Attached is not the same as approved.** Adsterra requires **both** conditions: the balance
> must reach the minimum, **and** the Payout Information form must be filled in and **approved**.
> Check the Payout Information page for an approval status. If it reads pending, money will not
> move no matter what the balance says.

> ⚠️ **On the WebMoney side:** moving WMZ onward to a bank requires a WebMoney Passport at some
> tiers. That is separate from Adsterra and worth reviewing before the first payout lands.

**This closes definition-of-done requirement 5** — payout details are attached to the account, in
Angelo's name.

---

## Runtime audit on the GAME build — still `none`, and that is correct

Run it yourself: `node .verify/audit-monetization.mjs`. It loads the live **game**, starts a game,
exercises both ad paths, and records every request to a known ad host.

```
=== adapter state on the LIVE build ===
{ "hasAds": true, "network": "none", "ready": true, "debug": false,
  "sdkPresent": { "CrazyGames": false, "PokiSDK": false,
                  "playgamaBridge": false, "gdsdk": false } }

=== ad API calls ===
{ "interstitial": "undefined", "rewarded": "true" }

=== requests to known ad/tracking hosts ===
(NONE — no ad request fires)
```

Read it carefully, because two lines look like good news and are not:

- `"rewarded": "true"` — the rewarded button **grants the reward without showing an ad**. That is
  the adapter's designed safe stub: it means the game never breaks when no SDK is present. It is
  **not** evidence of monetization. There is no ad.
- `"interstitial": "undefined"` — the interstitial path resolves without ever calling a network.

This is the **portal** path, and it stays empty until a portal embeds the game and supplies its
SDK. The site's own revenue comes from the Adsterra path above, which is a different mechanism on
different pages.

**Live game config, verified over HTTPS:** `network: 'auto'`, `gdGameId: ''`, `adsenseClient: ''`.
`ads.txt` has **0 active records**. `/game/index.html` loads **0** ad SDKs. The landing page's one
`googlesyndication` match is the inert commented-out instruction block.

### What that means, plainly

The site now earns from its own pages. The **game** earns nothing on its own — it earns when a
portal that has its own ad network embeds it, which needs those accounts (B–E, I).

| Ready now (built + verified) | Missing (needs an account) |
|---|---|
| ✅ Adsterra live and serving on content pages | Adsterra payout method |
| ✅ Consent gate verified 18/18 across 4 paths | Accounts for B–E and I |
| Multi-network adapter with a tested safe fallback | A real `gdGameId` / `adsenseClient` |
| Per-portal field values for 8 platforms | Analytics (Cloudflare / Umami) |
| Upload bundle, cover art, 3 screenshots, 10 clips | Search Console verification |
| Legal pages, 3 guides, launch-post drafts | Any portal beyond itch.io |

**Recommended order: A ✅ → H ✅ → payout ✅ → B → F → C → D → E → G → I.**

Rationale for deviating from the brief's order: **Adsterra (H) was pulled forward.** Most ad
programs gate payment on the *bank account's region*, which is a problem for a Philippine
account. Adsterra pays **WebMoney/Paxum/crypto from a $5 minimum** with no bank-region constraint,
making it the fastest route to actually receiving money. The brief's original order is otherwise
preserved.

---

## Per-platform detail

### A. itch.io
| | |
|---|---|
| Type | Portal (hosts the playable game) |
| State | 🟢 **LIVE** — https://kdbdeocampo.itch.io/neon-drop |
| Published | 2026-09-30 |
| Cost | Free — you choose the revenue split (default is a 10% platform fee) |
| Revenue | **$0, by design.** The listing is free-to-play, so itch.io earns nothing directly. Its value is distribution + a canonical link for the marketing posts. |
| Upload | `dist/neon-drop-itch.zip` — `index.html` flat at the zip root |
| Cover art | `dist/art/630x500-itch-cover.png`, `dist/art/1280x720-16x9.png` |
| Review | None — published immediately |
| Exclusivity | **None.** itch.io is non-exclusive by design. No agreement was signed. |
| Embed | Served from `html-classic.itch.zone/html/19478707/index.html` (revision `19476821` before the 2026-09-30 re-upload) |
| Field values | `PORTAL_SUBMISSION_KIT.md` § A |

**Verified playable, not just "page returns 200".** `.verify/verify-itch.mjs` drives the real
store page in a real browser — presses *Run game*, waits for the itch CDN iframe, starts a game
and drops six tiles. **14/14 checks pass**, including `SCORE 0 → 22`, zero console errors, zero
failed requests from the game frame, and **no developer artefacts in the rendered frame**.

> The harness deliberately separates **our** failed requests from **itch.io's own page shell**.
> itch's store page runs a Google Analytics beacon that aborts on close; attributing that to the
> game would have produced a permanent false failure. Requests are attributed by the frame that
> issued them (`itch.zone` = ours).

**✅ The "one revision behind" defect is CLOSED (2026-09-30).** The listing originally predated
the `#netTag` fix and painted `ad network: none` at the foot of the board. Re-uploaded, and the
new build is **confirmed live** — the itch CDN embed revision changed from `html/19476821/` to
**`html/19478707/`**, which is the proof the upload took effect rather than sitting queued.

> The suite gained a permanent guard for this. **A correct zip is not the same as an effective
> upload**, so the assertion reads the **rendered live frame** — the only way to tell the
> difference. Same "rendered ≠ filled" principle as the ad units.

---

### B. GameDistribution
| | |
|---|---|
| Type | Portal + ad network — they syndicate your game across their partner network |
| Revenue share | **33% of Net Revenue** (§3.1) — *net*, not gross |
| Payout threshold | **€100** (§3.3), accumulates below that, paid within 60 days of month-end |
| Upload | `dist/neon-drop-gd.zip` (the id-injected build — **not** the itch zip) |
| Thumbnails | **five `.jpg` slots** (PNG is refused by the picker): `512x384-gd.jpg`, `512x512-square.jpg`, `200x120-gd.jpg` (required) + `1280x720-16x9.jpg`, `1280x550-banner.jpg` (marketing) |
| Exclusivity | ✅ **NON-EXCLUSIVE** (§2.1) — "worldwide, royalty-free, non-exclusive license" |
| Termination | **30 days' notice, either party** (§7.1). Accrued revenue is **not forfeited** |
| SDK | ⚠️ **MANDATORY** (§2.6.3) — failure to integrate ⇒ **publishing request denied** |
| Governing law | Netherlands / Amsterdam courts (§9.14) |

#### Submission requirements — re-verified against live sources 2026-09-30

Source: `static.gamedistribution.com/developer/developers-guidelines.html`. An earlier version of
this file quoted the marketing page instead and got several things wrong; corrected below.

| Requirement | Detail |
|---|---|
| **Description** | **200–500 characters, hard limit.** The long description elsewhere is ~1,800 — it would have been rejected. New copy: **414** chars. |
| **Instructions** | **200–500 characters, hard limit.** Previous answer was ~140. New copy: **361** chars. |
| Genres / tags | **1–2 genres**, **1–5 tags** |
| Thumbnails | **three required as `.jpg`** (the form refuses PNG) **plus two optional marketing images**: 1280×720 and **1280×550**. The 1280×550 is 2.33:1 against a 1.79:1 source — it needs a height crop biased upward, or the wordmark gets sliced. |
| Age groups | **mandatory** to select |
| Language | English (or `No-Text`) |
| **Rewarded-ads flag** | ⚠️ **must be ticked** or "your game is unable to request rewarded ads" — a dashboard control, not a text field |
| Not fields on this form | orientation, price, screenshots, "account required", website, privacy URL |
| Review | initial assessment **up to one week**; SDK activation approval **up to two weeks** |
| Debug | `gdsdk.openConsole()` in the browser console |

**Ad rules they enforce:** pre-roll **and** mid-roll both **mandatory**; ads only on user input and
outside gameplay; game paused **and muted** during ads; reward granted **only** on
`SDK_REWARDED_WATCH_COMPLETE`.

**Prohibited:** *any* data collection from the game — no Google Analytics, Facebook Pixel,
DoubleClick, Mixpanel, Adobe Analytics or Flurry. No external hosting (except real multiplayer).
No outgoing social/ad/e-commerce/affiliate links. No login requirement.

**Layout:** GD recommends an 800×600 iframe; the portrait board was verified to fit without
clipping at 800×600, 640×480, 1024×768 and 520×1030 (`.verify/verify-iframe-fit.mjs`, 20/20).


#### Clauses verified against the real agreement — 2026-09-30

Read from **`static.gamedistribution.com/terms/developer.html`** (Developer Game License Agreement,
KEYGAMES NETWORK B.V., last updated 19 June 2025).

**1. Exclusivity — clear. ✅ No problem.**
> §2.1 — *"Developer hereby grants to Distributor a worldwide, royalty-free, **non-exclusive**
> license…"*

Nothing prevents Neon Drop from being published on itch.io, Poki, CrazyGames or anywhere else at
the same time. This is the clause that mattered most and it is clean.

**2. Revenue share — 33% of NET, and the deductions are real.**
> §3.1 — *"the Developer is entitled to a revenue share of 33% (thirty three percent) of the
> **Net Revenue**"*
> *"In-Games Ads Revenue" means the gross revenues … **less**: (i) In-Game Ads and Hosting costs;
> (ii) any applicable Invalid Traffic / Fraud deductions and reservations."*

So 33% is of an already-reduced figure. The effective rate on gross will be **well under 33%** —
"Net Revenue" is defined as gross minus their ad-platform costs, hosting costs, fraud deductions,
and (for purchases) payment-provider costs and VAT. There is no cap published on those costs, which
is the clause to watch if the numbers ever look wrong.

**3. Termination — clean. ✅**
> §7.1 — *"indefinite duration … with each Party able to terminate this Agreement with
> **thirty (30) days' notice** at any time."*

No forfeiture of accrued revenue on termination (§7.5 is a standard survival clause). The €100
threshold still applies after termination, so a small balance can in principle never be paid out —
worth remembering before pulling the game early.

**4. ⚠️ The SDK is mandatory — and this changes the plan.**
> §2.6.3 — *"before uploading the Games, **implement the SDK in the Games** as instructed by the
> Distributor; failure to do this will result in a **denied request for publishing**"*

`game/monetize.js` **already auto-detects `gdsdk`** and routes interstitials and rewarded video to
it, so the adapter side is done. But the SDK itself is not in the build — `game/index.html`
currently loads **0** ad SDKs. **The SDK snippet is issued per-game from their dashboard after the
game entry is created**, so this cannot be pre-integrated. Order: create the account → create the
game entry → take the snippet → integrate → *then* upload.

**5. Two risks worth naming before accepting.**

- **Distribution ≠ control.** They serve the ads inside the game and report the revenue. §3.6 lets
  them withhold or claw back payments on *"reasonable suspicion"* of invalid traffic, and §9.1
  permits recalculation within 90 days. Standard for the industry, but it means the reported number
  is the only number you get.
- **Do not confuse the two agreements.** The **Developer** agreement above is for *submitting our
  game*. The separate **Publisher** agreement is for *embedding their catalogue on our site* — and
  §2.2 of that one grants them an **exclusive** right to sell in-game ads on our properties. That
  would collide with our Adsterra setup. **We are not signing the Publisher agreement**, and the
  §2.2 exclusivity in it is exactly why.

**Status: clauses read and clean. Account created 2026-09-30. Awaiting the game id.**

#### Integration — prepared, awaiting the game id

The mandatory SDK work is done **except** the id itself, which their dashboard only issues after
the game entry exists.

**How the two builds stay isolated.** `game/monetize.js` loads the GD SDK **only when
`AD_CONFIG.gdGameId` is non-empty**. That single condition does all the work:

| Build | `gdGameId` | Adapter reports | GD SDK fetched? |
|---|---|---|---|
| Our site (`/game/*`) | empty | `none` | **no** |
| itch.io bundle | empty | `none` | **no** |
| GameDistribution bundle | set | `gamedistribution` | yes |

So the id is **injected at build time, never committed**. If it lived in the shared source, every
build would fetch GD's SDK — including our own pages, where it would slow the site down and
collide with the Adsterra setup.

```
python tools/make-itch-zip.py               -> dist/neon-drop-itch.zip
python tools/make-itch-zip.py --gd-id <ID>  -> also dist/neon-drop-gd.zip
```

The builder refuses to ship the itch bundle if `gdGameId` is non-empty, and reads the id back
**out of the written zip** rather than trusting the string it just built.

**Verified at runtime, not just in the file** — `.verify/verify-gd-build.mjs`, **10/10**:

```
── itch bundle ──
  network=none · GD SDK requests=0 · gdGameId="" · game starts · no console errors
── gamedistribution bundle ──
  network=gamedistribution · GD SDK requests=1 · game starts · no console errors from our code
```

#### The pre-roll requirement — and a bug the test caught

GD requires a **pre-roll** ad on the Play button (§ "Before you submit, make sure that your game
includes a pre-roll"). Neon Drop had none: `gameOver()` fires a mid-roll and the two rewarded
buttons are on the Game Over screen, which is exactly GD's recommended placement — but the Play
button started the game silently.

**My first fix was wrong, and a live test proved it.** I awaited `Ads.interstitial()` before
starting the game, disabling the Play button meanwhile. On the GD bundle the test showed the menu
still showing after the click: GD's SDK was present, its promise never settled, and the button
stayed disabled — **a dead-end on the menu**, which is a portal rejection. The guard I had added
(45 s) would have meant 45 seconds of a frozen menu.

**Correct design: fire and forget, then start.** This follows GD's own reference implementation,
which calls `showAd()` on the button and lets the SDK pause the game through `SDK_GAME_PAUSE`
rather than awaiting a promise. `game.js` now:

```js
function preRollThenStart() {
  if (window.Ads && Ads.network !== 'none') Ads.interstitial();
  startGame();
}
```

The game is always reachable, and the ad pauses it via the event. Skipped entirely when no network
is present, so our own site and the itch build behave exactly as before.

**Backstop added:** a stuck pause can no longer freeze the board forever. `ads:pause` arms a 90 s
watchdog that force-resumes; `ads:resume` clears it. A blocked SDK that fires the pause and never
the resume would otherwise leave the game frozen with no way out.

**Mute requirement: satisfied by absence.** GD requires the game to be muted during ads. Neon Drop
has **no audio at all** — no `Audio`, no `sound`, no `.play()` anywhere in `game.js` or
`index.html` — so there is nothing to mute. Recorded explicitly so a future session does not
"add mute handling" to a silent game.

---

### C. CrazyGames
| | |
|---|---|
| Type | Portal |
| Upload | `dist/neon-drop-itch.zip` |
| Thumbnail | `dist/art/800x450-crazygames.png` (16:9) |
| Review | Yes — manual, typically days to weeks |
| Exclusivity | ⚠️ **Verify.** They have historically offered a higher share for exclusivity. |

`monetize.js` already detects `window.CrazyGames.SDK` first in its `detect()` chain.

---

### D. Playgama Bridge
| | |
|---|---|
| Type | Portal + ad bridge (wraps many portals behind one SDK) |
| Upload | `dist/neon-drop-itch.zip` |
| Icon | `dist/art/512x512-square.png` |
| Exclusivity | ⚠️ **Verify.** |

Already in `detect()`.

---

### E. Poki
| | |
|---|---|
| Type | Portal |
| Upload | `dist/neon-drop-itch.zip` |
| Icon | `dist/art/512x512-square.png` |
| Review | Yes — they are selective and take time |
| Exclusivity | ⚠️ **Verify — Poki has historically asked for exclusivity.** Read this one carefully. |

Already in `detect()`.

---

### F. Google AdSense
| | |
|---|---|
| Type | Self-hosted display ads on the landing page and game page |
| Revenue share | 68% to the publisher on content (standard AdSense terms) |
| Payout threshold | $100 |
| Payout method | Bank / wire — **check region eligibility** |
| Where | Two ad slots already in `index.html` (`#ad-1`, `#ad-2`), commented-out script block |
| Also needed | `ads.txt` (currently intentionally empty — see below), and a consent banner (Google Funding Choices, free) |

**Honest expectation:** AdSense approval is not automatic, takes days, and they
generally want to see a real site with real traffic and real content before
approving. There are three original articles live and legal pages present, which
helps, but do not expect approval on day one.

**`ads.txt` currently has no active record, on purpose.** Publishing a placeholder
publisher ID misdeclares which seller is authorised to sell the inventory, which
is worse than an empty file. Once AdSense approves: uncomment the record, paste the
real ID, set `adsenseClient` in `game/monetize.js`, redeploy.

---

### G. Ko-fi / Buy Me a Coffee
| | |
|---|---|
| Type | Donations / tips |
| Cost | Free (they take a small cut, or 0% on Ko-fi with a paid tier) |
| Exclusivity | None |

Low effort, low ceiling. Worth having, not worth prioritising.

---

### H. Adsterra — 🟢 **LIVE** ⭐ pulled forward
| | |
|---|---|
| Type | Self-hosted ad network (display banners) |
| State | 🟢 **Live and serving real creatives** on `/`, `/blog/*` |
| Ad host | `www.highrevenueformat.com` |
| Minimum payout | **$5** |
| Payout method | **USDT / Paxum — no bank-region requirement** |
| Payout attached | ❌ **No** — the one remaining blocker |
| Units live | 728×90, 300×250 (landing) · 468×60, 300×250 (each blog page) |
| Units approved, unused | 160×600, 160×300 — need a sidebar this layout lacks |
| Consent | Required. No ad script loads until the visitor accepts. |
| Exclusivity | **None.** Adsterra is a self-serve ad network; it makes no claim on the game. |
| Where | **Content pages only** — never `/game/*` |

**Why it was pulled to the front.** Many ad programs gate payment on the **bank account's
region**, not on where the person lives — so moving country does not unlock a payout method.
Amazon Associates needs a bank account in the marketplace's own region; its cross-border option
needs an IBAN/BIC, which Philippine accounts do not have. Adsterra's **$5 minimum and USDT/Paxum
payout carry no such constraint**, which makes it the most reliable path to actually receiving
money and the correct first network rather than the last.

**Why not AdSense first:** AdSense pays by bank transfer to a supported region and wants a real
traffic history before approving. It remains on the list for its higher CPM — it is simply not
the network that can pay *first*.

**Impression counting is unconfirmed on Adsterra's side.** Our side is proven — requests fire,
HTTP 200, creatives render (see § Site pages). Whether Adsterra *counts* those impressions shows
up in their dashboard, and that number is what becomes money. Check it after ~24 h of real
traffic before drawing conclusions.

---

### I. Long tail — non-exclusive only
Y8, GameMonetize, Newgrounds, Armor Games, freegames.io.

**Non-exclusive submissions only.** Same rule as above: the exclusivity clause gets
pasted into the chat and approved before anything is accepted. These are cheap to
submit and each adds a little traffic, but they will not move the needle alone.

---

## What "earning" realistically looks like

Stated plainly so there are no surprises:

- **The money path is now complete.** Ads serve, and WebMoney/WMZ is attached at a $5 minimum.
  Nothing is broken and nothing is missing — **the only thing standing between this and money is
  traffic.** Ads on a page nobody visits earn nothing.
- **Payouts are automatic and biweekly** (1st–2nd and 16th–17th). No manual request, no invoicing.
- **Nothing here pays on a schedule you control.** Portal review takes days to weeks. AdSense
  takes days and wants real traffic.
- **The first money is small.** At a $5 minimum and typical display CPMs, that is a few thousand
  impressions — real traffic, not a formality.
- **Traffic is the whole game.** That is why Phase 4 (the articles, the clips, the launch posts)
  matters more than the number of logos on this page. **The three articles and ten clips are live;
  the launch posts are drafted but not posted**, because posting as Angelo is not something I do.
  That is the single biggest remaining lever.
- **Portal revenue shares are on net, not gross**, so the headline percentage is never what lands.

---

## Integration checklist (per platform, once approved)

1. Paste the exclusivity, revenue-share and termination clauses into the chat → get OK.
2. Put any required ID into `game/monetize.js` (`gdGameId`, `adsenseClient`, …).
3. Rebuild the upload bundle: `python tools/make-itch-zip.py`.
4. Rebuild the site: `node tools/build-site.mjs`, then `netlify deploy --prod`.
5. **Verify an ad request actually fires** — not just that the SDK loaded.
6. Record the result in the table above and in `PROGRESS.md`.
