# 🎮 Neon Drop — a free, monetizable HTML5 game + landing page

A complete, zero-dependency browser puzzle game with a marketing landing page, legal pages,
and a multi-network ad adapter already wired in. Built to be published free, hosted free,
and monetized free.

**▶ Play it: <https://neon-drop.netlify.app>** — also on [itch.io](https://kdbdeocampo.itch.io/neon-drop).
No download, no account, ~11 KB over the wire.

---

## What's in the box

```
neondrop/
├── index.html              Landing page — SEO tags, JSON-LD, FAQ, 2 ad slots, embedded game
├── game/
│   ├── index.html          Standalone game build ← this is what you upload to portals
│   ├── game.js             Full engine: drop, gravity, cascading merges, combos, particles
│   └── monetize.js         Ad adapter: GameDistribution / CrazyGames / Poki / Playgama / AdSense
├── privacy.html            GDPR + AdSense-compliant privacy policy
├── terms.html              Terms of service
├── contact.html            Contact page (AdSense requires one)
├── ads.txt                 Authorized sellers file — put your pub ID here
├── robots.txt  sitemap.xml SEO
├── netlify.toml            One-click free deploy config
├── cover.png               Store / portal cover art
└── AI_AGENT_PROMPT.md      ⭐ The master prompt that takes this live end-to-end
```

**Total game payload: ~30 KB. No frameworks, no build step, no npm install.**

---

## The game

Drop a glowing numbered tile into any of 5 columns. Tiles that touch and match fuse into
one tile of double the value — merge 3 or 4 at once and it doubles again per extra tile.
After each merge gravity re-applies and the board re-checks, so one drop can trigger a
five-link cascade with a climbing combo multiplier. The run ends when the board fills with
no merges left.

- Touch, mouse and keyboard (← → + Space) controls
- High score + coins persist in localStorage — no account needed
- Rewarded-ad "continue" clears the top 3 rows; rewarded "double coins" on the game-over screen
- Pauses correctly for ad breaks and when the tab loses focus

**Verified:** a 212-drop automated playthrough reached a natural game over with correct
scoring, saving, revive and restart, and zero errors.

---

## Run it locally

```bash
cd neondrop
python3 -m http.server 8080
# open http://localhost:8080
```

---

## Ship it (free)

1. Push this folder to a public GitHub repo.
2. Connect the repo to **Netlify** or **Cloudflare Pages** → free hosting, free HTTPS, free subdomain, auto-deploy on push.
3. Replace the domain and email placeholders with real values — already done in this repo (canonical URL, og:image, robots.txt, sitemap.xml and contact.html all carry live values).

---

## Turn on the money

| Channel | What to do | Notes |
|---|---|---|
| **itch.io** | Zip `game/`, upload as playable-in-browser | No approval gate — live the same day |
| **GameDistribution** | Upload zip, paste the Game ID into `gdGameId` in `monetize.js` | Publishes 33% of net revenue, €100 threshold |
| **CrazyGames** | Submit via developer portal, add their SDK tag | €100 minimum, monthly payouts |
| **Poki** | Apply at developers.poki.com, add their SDK tag | Curated; adapter already calls their lifecycle API |
| **Playgama Bridge** | One integration → ~25 platforms | Tiered 70–90% on partner-site revenue |
| **Google AdSense** | Uncomment the script in `index.html`, set `adsenseClient`, fill `ads.txt` | Self-hosted page ads; needs content + traffic |
| **Ko-fi / BMAC** | Footer button | 0 monthly fee, instant |

These stack. Non-exclusive portal distribution and your own self-hosted ads can run at the
same time — just never sign an exclusivity clause without reading it.

### Switching ad networks

You never touch the game code. Open `game/monetize.js` and edit `AD_CONFIG` at the top:

```js
network: 'auto',        // auto-detects whichever portal SDK is present
gdGameId: '',           // paste your GameDistribution ID
adsenseClient: '',      // paste 'ca-pub-...'
```

With no network present the adapter falls back to a safe stub, so the game stays 100%
playable everywhere — which is exactly what portal reviewers check for.

---

## Next

Open **`AI_AGENT_PROMPT.md`** and paste it into an AI agent with browser/terminal access.
It runs the whole launch: verify → deploy → submit to every portal → wire up payouts →
SEO → traffic → handover docs.
