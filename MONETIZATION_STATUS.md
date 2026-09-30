# MONETIZATION_STATUS.md — Neon Drop

> Every platform we are pursuing, what state it is in, and — critically — **what
> the agreement actually says before anything is accepted.**

**Last updated:** 2026-09-30
**Live game:** https://neon-drop.netlify.app
**itch.io listing:** https://kdbdeocampo.itch.io/neon-drop
**Current revenue: $0.00.** No ad network is integrated yet. Nothing has been paid out.

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
| B | **GameDistribution** | Portal + ads | ⬜ assets ready | Needs account; then Game ID into `monetize.js` |
| C | **CrazyGames** | Portal | ⬜ assets ready | Needs account + review |
| D | **Playgama Bridge** | Portal + ads | ⬜ assets ready | Needs account |
| E | **Poki** | Portal | ⬜ assets ready | Needs account + review |
| F | **Google AdSense** | Self-hosted ads | ⬜ not started | Needs account + approval (requires real traffic) |
| G | **Ko-fi / Buy Me a Coffee** | Donations | ⬜ not started | Needs account |
| H | **Adsterra** | Self-hosted ads | ⬜ not started | Needs account — **pays crypto from $5** |
| I | **Long tail** (Y8, GameMonetize, Newgrounds, Armor Games, freegames.io) | Portals | ⬜ not started | Non-exclusive only |

**Definition-of-done progress:** "game live and publicly playable on ≥1 portal" is now
**satisfied** by itch.io. Still outstanding: an ad network making verifiable ad requests,
and payout details attached in Angelo's name.

---

## Runtime audit — is anything actually monetizing? **No.**

Run it yourself: `node .verify/audit-monetization.mjs`. It loads the live game, starts a game,
exercises both ad paths, and records every request the page makes to a known ad host.

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

**Live config, verified over HTTPS:** `network: 'auto'`, `gdGameId: ''`, `adsenseClient: ''`.
`ads.txt` has **0 active records**. `/game/index.html` loads **0** ad SDKs. The landing page's one
`googlesyndication` match is the inert commented-out instruction block.

**Revenue to date: $0.00.** No ad network is connected. No payout method is attached to anything.
`itch.io` is free-to-play and cannot earn.

### What that means, plainly

The *plumbing* is done and tested. The *connections* are not. Nothing can earn until an account
exists on at least one network and its ID is pasted into `game/monetize.js`.

| Ready now (built + verified) | Missing (needs an account) |
|---|---|
| Multi-network adapter with a tested safe fallback | Any ad-network account |
| `Ads.network` / `.ready` / `.debug` public state | A real `gdGameId` / `adsenseClient` |
| Per-portal field values for 8 platforms | Payout details in Angelo's name |
| Upload bundle, cover art, 3 screenshots, 10 clips | Analytics (Cloudflare / Umami) |
| `ads.txt` scaffold with instructions | Search Console verification |
| Legal pages, 3 guides, launch-post drafts | Any portal beyond itch.io |

**Recommended order: A → B → H → F → C → D → E → G → I.**

Rationale for deviating from the brief's order: **Adsterra (H) is pulled forward.**
Per Angelo's notes, most ad programs gate payment on the *bank account's region*,
which is a problem for a Philippine account. Adsterra pays **USDT/Paxum from a $5
minimum** with no bank-region constraint. That makes it the fastest route to
actually receiving money, so it should not sit at the end of the queue. The brief's
original order is otherwise preserved.

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
| Embed | Served from `html-classic.itch.zone/html/19476821/index.html` |
| Field values | `PORTAL_SUBMISSION_KIT.md` § A |

**Verified playable, not just "page returns 200".** `.verify/verify-itch.mjs` drives the real
store page in a real browser — presses *Run game*, waits for the itch CDN iframe, starts a game
and drops six tiles. **12/12 checks pass**, including `SCORE 0 → 10`, zero console errors, and
zero failed requests from the game frame.

> The harness deliberately separates **our** failed requests from **itch.io's own page shell**.
> itch's store page runs a Google Analytics beacon that aborts on close; attributing that to the
> game would have produced a permanent false failure. Requests are attributed by the frame that
> issued them (`itch.zone` = ours).

**Open item:** the live listing was uploaded *before* the `#netTag` fix (see below), so it still
shows the developer label `ad network: none` at the foot of the board. A re-upload of the rebuilt
zip clears it. Tracked in `PROGRESS.md`.

---

### B. GameDistribution
| | |
|---|---|
| Type | Portal + ad network (they monetise the game with their own ads) |
| Revenue share | ~33% of net revenue *(re-verify against their current terms at signup)* |
| Payout threshold | €100 |
| Payout method | Bank / PayPal — **check region eligibility before relying on it** |
| Upload | `dist/neon-drop-itch.zip` |
| Thumbnail | `dist/art/512x512-square.png` |
| After approval | Paste the **Game ID** into `gdGameId` in `game/monetize.js`, re-zip with `python tools/make-itch-zip.py`, re-upload, confirm a real ad fires |
| Exclusivity | ⚠️ **Verify before accepting.** Some portals in this space ask for web exclusivity. |

The adapter is already wired for this — `game/monetize.js` auto-detects the
GameDistribution SDK and routes interstitials, rewarded video and banners to it.
With no network present it falls back to a safe stub, which is why the game never
breaks when the SDK is absent.

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

### H. Adsterra ⭐ pulled forward
| | |
|---|---|
| Type | Self-hosted ad network |
| Minimum payout | **$5** |
| Payout method | **USDT / Paxum — no bank-region requirement** |
| Why it matters | See below |

Per Angelo's standing notes: many ad programs gate payment on the **bank account's
region**, not on where the person lives — so moving country does not unlock a
payout method. Amazon Associates needs a bank account in the marketplace's own
region; its cross-border option needs an IBAN/BIC, which Philippine accounts do not
have. Programs that pay crypto have no such constraint.

**That makes Adsterra the most reliable path to actually receiving money**, and the
$5 minimum means the first payout arrives after trivial traffic rather than after
a $100 threshold. It should be treated as the primary near-term earner.

---

### I. Long tail — non-exclusive only
Y8, GameMonetize, Newgrounds, Armor Games, freegames.io.

**Non-exclusive submissions only.** Same rule as above: the exclusivity clause gets
pasted into the chat and approved before anything is accepted. These are cheap to
submit and each adds a little traffic, but they will not move the needle alone.

---

## What "earning" realistically looks like

Stated plainly so there are no surprises:

- **Nothing here pays on a schedule you control.** Portal review takes days to
  weeks. AdSense takes days and wants real traffic.
- **First money is small.** Adsterra pays from $5; AdSense and GameDistribution
  need $100 / €100 first.
- **Traffic is the whole game.** No traffic means no revenue regardless of how many
  networks are integrated. That is why Phase 4 (the articles, the clips, the launch
  posts) matters more than the number of logos on this page.
- **Portal revenue shares are on net, not gross**, so the headline percentage is
  never what lands.

---

## Integration checklist (per platform, once approved)

1. Paste the exclusivity, revenue-share and termination clauses into the chat → get OK.
2. Put any required ID into `game/monetize.js` (`gdGameId`, `adsenseClient`, …).
3. Rebuild the upload bundle: `python tools/make-itch-zip.py`.
4. Rebuild the site: `node tools/build-site.mjs`, then `netlify deploy --prod`.
5. **Verify an ad request actually fires** — not just that the SDK loaded.
6. Record the result in the table above and in `PROGRESS.md`.
