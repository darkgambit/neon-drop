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
| 0 | **Orient** — read repo, capture identity answers | 🟡 answers pending | Repo fully read. Identity answers awaiting confirmation (see Blocked #1). |
| 1 | **Prove it works** — Playwright + Lighthouse, fix bugs | ✅ **DONE** | 42/42 functional checks. All 4 Lighthouse categories pass on mobile *and* desktop. 2 real defects fixed. Commit `a1b2ad6`. |
| 2 | **Go live** — GitHub + Netlify + Search Console | 🟡 ready to start | `gh` **already authenticated** as `darkgambit` ✅. Repo initialised, 2 commits, tag `baseline`. Needs: Netlify login checkpoint. |
| 3 | **Connect the money** — portals + ad networks | ⬜ not started | One checkpoint per platform. |
| 4 | **Traffic** — articles, analytics, marketing kit | ⬜ not started | Fully autonomous. |
| 5 | **Handover** — docs + evidence | ⬜ not started | |

---

## Git state

```
repo:    C:\Users\ADMIN\Documents\ClaudeProjects\Business 1\neondropgame\neondrop
branch:  (no commits pushed yet — no remote configured)
author:  darkgambit <kingripper9@gmail.com>   [local repo config only]

a1b2ad6  Phase 1: verify the game end-to-end, then fix what Lighthouse found
fd2a5a4  Neon Drop: baseline — finished game, landing page, legal pages, ad adapter   <-- tag: baseline
```

`git diff baseline` = the complete, reviewable set of launch-engineering changes so far.

---

## Phase 1 — results (evidence in `.verify/out/`)

**Functional: 42/42 passing.** Harness: `.verify/verify.mjs` (Playwright).
It observes the game the way a player does — wrapping `fillText`/`clearRect` to read the HUD
the engine actually paints, and pinning `Math.random` to make tile values deterministic.
**No game code was modified to make it testable.**

| Check | Result | Evidence |
|---|---|---|
| Board renders; drop guide tracks all 5 columns | ✅ | guide x = 51/129/207/285/363, uniform 78px gaps |
| Tile drops, lands, merges with an equal neighbour | ✅ | score 0 → 72 |
| Cascades chain, combo climbs | ✅ | peak COMBO ×3 |
| Score + BEST survive reload | ✅ | `{"best":72,"coins":7}` → menu shows 72 |
| Game Over when board fills, no merges left | ✅ | reached after a genuine 40-drop fill |
| "Watch ad & continue" clears top rows, resumes | ✅ | top 3 rows 0.43% lit vs 89% lit below; play resumed |
| "Play again" resets state | ✅ | score 0, board cleared |
| Touch, mouse AND keyboard | ✅ | touchscreen tap, mouse down/up, ←/→/Space |
| Responsive at 360×640 / 414×896 / 768×1024 / 1440×900 | ✅ | board fits every viewport |
| Zero console errors / 404s | ✅ | none, on any page or viewport |

**Lighthouse: all thresholds met** (perf ≥90, a11y ≥90, bp ≥90, seo ≥95).
Harness: `.verify/lighthouse.mjs`.

| page | form | perf | a11y | bp | seo |
|---|---|---|---|---|---|
| landing | mobile | **100** | 100 | 100 | 100 |
| game | mobile | **100** | 100 | 100 | 100 |
| landing | desktop | **97** | 100 | 100 | 100 |
| game | desktop | **93** | 100 | 100 | 100 |

### Real defects found and fixed (both in shipped code, not the test)
1. `game/index.html` — `user-scalable=no` + `maximum-scale=1` failed the `meta-viewport`
   a11y audit (weight 10) and blocked pinch-zoom for low-vision users. Removed.
2. `game/index.html` — no `<main>` landmark (`landmark-one-main`). Wrapper is now `<main>`.
   A11y went 82/86 → **100** on both form factors.
3. `index.html` — the embedded game loaded eagerly, putting 3 round-trips + a continuous
   canvas render loop on the landing page's critical path (simulated FCP 1.5 s vs observed
   0.28 s). Replaced with a **click-to-play facade**.
4. `index.html` — `backdrop-filter: blur(12px)` on the sticky header; oversized `drop-shadow`
   on the h1; 80px `box-shadow` on the game frame. All trimmed.

### Test-harness bugs found (NOT product bugs — recorded so nobody re-chases them)
- `guide.x` from `fillText` is the column **centre**, not the left edge. Treated as the left
  edge, it made columns 3/4 look unreachable. The game was always correct.
- `canvas.getContext('2d').getImageData()` returns an **all-white buffer** in headless
  Chromium for this canvas. Any pixel assertion built on it is vacuous. The harness now
  decodes real screenshots instead (pure-Node PNG decoder in `verify.mjs`).
- Passing `formFactor: 'desktop'` **without** a matching `throttling` preset silently
  throttles a desktop viewport like mobile. That alone made desktop look 10 points worse.
- **Editing the same file with parallel `Edit` calls silently clobbers changes** — one edit
  reported success while another overwrote it, leaving mismatched `<div>`/`</main>` tags.
  Apply edits to a file **sequentially** and verify by reading back.

---

## Blocked / open questions

1. **Phase 0 identity answers** — awaiting Angelo. GitHub ✅ known (`darkgambit`, already
   authenticated). Need confirmation of: commit email, project slug, public contact email,
   country + payout preference, and which platform accounts already exist.
2. **Netlify login** — needs a handshake checkpoint (browser/device flow). Netlify CLI is
   not installed; will install free into the managed node workspace.
3. Everything in Phase 3 needs a per-platform sign-in checkpoint.

---

## Tooling (installed free, isolated, not in the repo)

| Tool | Location | Purpose |
|---|---|---|
| Playwright + Chromium | `~/.workbuddy-ai/binaries/node/workspace/node_modules` | browser verification |
| Lighthouse | same | perf/a11y/bp/seo gate |
| Pillow | `~/.workbuddy-ai/binaries/python/envs/default` | cover art resizing for portals |
| `node_modules` | junction → managed workspace (gitignored) | module resolution |

Local server: `python -m http.server 8080` from the project root → `http://127.0.0.1:8080`.

---

## Log

### 2026-09-29
- **Phase 0** — read all 16 files. Confirmed `gh` is **already authenticated** as `darkgambit`
  (scopes `repo`, `gist`, `read:org`) → the GitHub checkpoint is not needed.
- Runtimes: Python 3.13.14, Node 22.22.2, git 2.55.0, gh 2.101.0. Netlify CLI absent.
- Wrote `.gitignore` (includes `DEPLOY_SECRETS.local.md`), `DEPLOY_SECRETS.local.md`, `PROGRESS.md`.
- `git init` + baseline commit + tag `baseline`.
- Built `dist/neon-drop-itch.zip` (10,930 bytes; index.html at zip root) — ready for itch.io.
- **Phase 1 complete.** 42/42 functional checks, all Lighthouse thresholds met, 2 real defects
  fixed, 4 test-harness bugs found and corrected. Committed `a1b2ad6`.

---

## Status line format (after each phase)

> **shipped** … / **broke** … / **fixed** … / **blocked** … / **next** …
