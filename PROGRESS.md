# PROGRESS.md — Neon Drop launch state

> **Read this file first if you are a fresh session.** It is the single source of truth for
> where the launch stands. Update it after EVERY meaningful step.
> Secrets live in `DEPLOY_SECRETS.local.md` (gitignored). Never commit a token.

**Project root:** `C:\Users\ADMIN\Documents\ClaudeProjects\Business 1\neondropgame\neondrop`
**Operator:** Angelo (`darkgambit`) · **Started:** 2026-09-29
**Goal:** files-on-disk → live on the internet, fully functional, earning ad revenue into *my* accounts. Free tiers only.

---

## Phase checklist

| # | Phase | State | Notes |
|---|---|---|---|
| 0 | **Orient** — read repo, capture identity answers | 🟡 in progress | Repo fully read. Identity answers pending Angelo's confirmation. |
| 1 | **Prove it works** — Playwright + Lighthouse, fix bugs | ⬜ not started | No credentials needed. Can run fully autonomously. |
| 2 | **Go live** — GitHub + Netlify + Search Console | ⬜ not started | `gh` already authenticated ✅. Netlify needs a checkpoint. |
| 3 | **Connect the money** — portals + ad networks | ⬜ not started | One checkpoint per platform. |
| 4 | **Traffic** — articles, analytics, marketing kit | ⬜ not started | Fully autonomous. |
| 5 | **Handover** — docs + evidence | ⬜ not started | |

---

## Repo inventory (Phase 0 — read & understood)

```
neondrop/
├── index.html          11.5 KB  Landing: SEO, JSON-LD VideoGame, FAQ, 2 ad slots (ad-1, ad-2), iframe embed
├── game/
│   ├── index.html       5.1 KB  Standalone build — THE thing portals receive
│   ├── game.js         19.7 KB  Engine: 5x8 grid, gravity, flood-fill merge, cascades, particles
│   └── monetize.js      8.2 KB  Ad adapter — auto-detect GD / CrazyGames / Poki / Playgama / AdSense
├── privacy.html         4.9 KB  GDPR + AdSense compliant
├── terms.html           3.6 KB
├── contact.html         2.2 KB  contains __EMAIL__ placeholder
├── ads.txt              212 B   contains pub-0000000000000000 placeholder
├── robots.txt           78 B    contains REPLACE-WITH-YOUR-DOMAIN
├── sitemap.xml          600 B   5 URLs, all REPLACE-WITH-YOUR-DOMAIN
├── netlify.toml         325 B   publish = ".", security headers, /game/* cache
├── cover.jpg            96 KB   portal cover art (1280x720 target)
├── cover.png            1.7 MB  social/OG image
├── README.md            seller-facing docs
├── AI_AGENT_PROMPT.md   the master prompt
└── CLAUDE_CODE_PROMPT.md  this task, verbatim
```

### How the code actually works (so a fresh session doesn't have to re-derive it)

- **Grid:** `grid[r][c]`, 5 cols × 8 rows. `r=0` is the TOP row.
- **Merge:** `neighborsSame()` flood-fills orthogonally-connected equal values; a group of
  `n` collapses to `v * 2^(n-1)` in the lowest-then-leftmost cell. One merge per pass, then
  gravity, then re-check → that loop is what produces cascades (`settle()`, guard 200).
- **Score:** `newV * (1 + combo * 0.25)`, `combo++` per merge, resets to 0 in `afterLanding()`.
- **Game over:** `boardFull() && !anyMergePossible()` — all 5 top-row cells occupied, no adjacent equal pair.
- **Persistence:** `localStorage['neondrop']` = `{best, coins}`. Note: `score` is NOT persisted, only `best`.
- **Rewarded continue:** `Ads.rewarded()` → clears rows 0-2 → `settle()` → `spawn()`. Once per run (`usedContinue`).
- **Ad stub:** with no network detected, `rewarded()` resolves `true` and `interstitial()` is a no-op.
  That is deliberate — portals reject games that break without their SDK.
- **Lifecycle hooks:** `Ads.gameplayStart/Stop/loadingFinished` + `ads:pause` / `ads:resume` window events.
- **Config knob:** `AD_CONFIG` at the top of `game/monetize.js` (`network`, `gdGameId`, `adsenseClient`).

### Placeholders that MUST be gone before handover

| Placeholder | Files | Replace with |
|---|---|---|
| `REPLACE-WITH-YOUR-DOMAIN` | `index.html` (×2), `robots.txt`, `sitemap.xml` (×5) | live domain |
| `__EMAIL__` | `contact.html` | Angelo's contact email |
| `pub-0000000000000000` | `ads.txt` | real AdSense publisher ID |

---

## Blocked / open questions

1. **Phase 0 identity answers** — awaiting Angelo (GitHub ✅ known, email/domain/country/payout/account list to confirm).
2. **Netlify login** — will need a handshake checkpoint (device/browser flow).
3. Everything in Phase 3 needs a per-platform sign-in checkpoint.

---

## Log

### 2026-09-29
- **Phase 0** — read all 16 files. Confirmed `gh` is **already authenticated** as `darkgambit`
  (scopes: `repo`, `gist`, `read:org`) → the GitHub checkpoint is not needed.
- Confirmed runtimes: Python 3.13.14, Node 22.22.2, git 2.55.0, gh 2.101.0.
  Netlify CLI is **not installed** — will install into the managed node workspace (free).
- Local server up on `http://127.0.0.1:8080`. All 11 routes return **200**.
- Wrote `.gitignore` (includes `DEPLOY_SECRETS.local.md`) and `DEPLOY_SECRETS.local.md`.

---

## Status line format (after each phase)

> **shipped** … / **broke** … / **fixed** … / **blocked** … / **next** …
