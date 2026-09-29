# Neon Drop — launch posts (DRAFTS)

> **Nothing here has been posted.** These are ready-to-paste drafts. You post them,
> under your own accounts, when you choose. I never post as you.

**Game:** Neon Drop — https://neon-drop.netlify.app
**One-liner:** a free browser merge puzzle: drop tiles into 5 columns, matching
neighbours merge and double, chains multiply your score.

## Read this before posting anything

1. **Post one community per day, not all at once.** Dumping the same link into five
   subreddits in an hour is what gets accounts flagged as spam. Spread them over a week.
2. **Be present for the first two hours.** On Reddit and HN, replies in the first hour
   decide whether the post lives or dies. If you can't sit with it, post another day.
3. **Answer every critical comment honestly.** "The board feels too random" is useful,
   not an attack. Agreeing with a critic buys more goodwill than defending.
4. **Don't ask for upvotes** anywhere. It's against the rules on all of these and it
   is the fastest way to get a ban.
5. **Disclose that it's yours.** Every one of these communities requires it, and they
   can tell anyway.

### ⚠️ One flag on the brief's list

**r/incremental_games is probably the wrong room.** Neon Drop has no idle mechanic, no
prestige, no offline progress — it's a session-based puzzle. That sub is strict about
scope and a mismatch gets removed and remembered. I've drafted it anyway (below) since
it was on your list, but **r/puzzlegames** is a much better fit and I'd post there
instead. Your call.

---

## 1. r/WebGames

**Flair:** `[Game]` · **Title:**

```
[Game] Neon Drop — a merge puzzle in 33 KB of vanilla JS, no frameworks, no build step
```

**Body:**

```
I built a browser merge puzzle and deliberately kept it tiny: ~33 KB of source,
about 11 KB over the wire, no framework, no bundler, no dependencies. Plain
canvas and vanilla JS. It loads on a bad connection.

How it plays: a tile sits above 5 columns. Drop it into any column. Tiles with
the same number that touch each other merge into one tile worth double. Any
merge that lands triggers gravity, which can set off another merge, which can
set off another — that chain is where the score is. Merges inside one chain
raise a combo multiplier, so a single well-placed drop is worth far more than
four careful ones.

It works with mouse, touch, and keyboard (arrows + space). Best score is kept
locally, no account, no signup.

Play: https://neon-drop.netlify.app

It's mine, so I'll say that plainly. Happy to answer anything about the engine —
the cascade resolution loop was the interesting part to get right.
```

---

## 2. r/playmygame

**Title:**

```
Neon Drop — a cascading merge puzzle. Does the combo system read clearly, or is it invisible?
```

**Body:**

```
Neon Drop is a free browser merge puzzle. Drop tiles into 5 columns; touching
tiles of the same value merge and double. The hook is cascades: one landing can
trigger a chain of merges, and each link in that chain raises a score
multiplier.

Play: https://neon-drop.netlify.app

Specifically, the feedback I want:

1. **Is the combo multiplier legible?** It shows as "COMBO x3" while it's
   active, but I'm not sure a first-time player connects that to the score
   jump. Does it need to be louder, or is it fine?
2. **Does the difficulty curve feel fair?** New tile values enter the random
   pool as your highest tile grows. I can't tell from my own play whether that
   reads as "escalating" or as "arbitrary".
3. **Where did you stop playing, and why?** The most useful thing anyone can
   tell me is the moment they got bored.

I'll be here to reply. No account needed, nothing to install.
```

---

## 3. Show HN

**Title:**

```
Show HN: Neon Drop – a merge puzzle in 33 KB of dependency-free JavaScript
```

**Body:**

```
Neon Drop is a browser merge puzzle. Drop a tile into one of 5 columns; tiles of
equal value that touch merge into one tile worth double. Merges trigger gravity,
which can trigger more merges, and each link in a single chain raises a score
multiplier.

Play: https://neon-drop.netlify.app

The part I think is interesting here is the constraint rather than the game. The
whole thing is ~33 KB of source (about 11 KB compressed) with no framework, no
bundler, no dependencies and no build step — one HTML file, two JS files. The
"build" for deployment is a file copy.

Two things I'd point at specifically:

- The cascade resolver. It merges one connected group per pass, applies gravity,
  then re-checks, looping until stable with a 200-iteration guard. That loop is
  what produces the chained combos, and getting it to feel good rather than
  merely correct took longer than the rest of the game.
- I wrote a Playwright harness that verifies the game without touching it: it
  wraps CanvasRenderingContext2D.fillText to read the HUD the engine actually
  paints, and pins Math.random to make tile values deterministic. That's how I
  can drive a real game to a real game-over in a test.

Source: https://github.com/darkgambit/neon-drop

Happy to answer questions about any of it.
```

**HN notes:** post on a weekday morning US Eastern. Don't use marketing language.
Answer every technical question with specifics — that's what HN rewards.

---

## 4. Product Hunt

**Tagline (60 chars max):**

```
A cascading merge puzzle that loads in under a second
```

**Description:**

```
Neon Drop is a free browser merge puzzle. Drop a tile into any of five columns.
Touching tiles with the same number merge and double. When a merge lands,
gravity pulls everything down — which can set off another merge, and another.
Each link in that chain raises your combo multiplier, so one good drop can be
worth more than a dozen careful ones.

No download. No account. No signup. It runs in the tab you already have open,
on your phone or your desktop, with mouse, touch or keyboard.

The whole game is ~33 KB of hand-written JavaScript with zero dependencies —
smaller than a single photograph, and it works on a bad connection.
```

**First comment (post this yourself, immediately):**

```
Maker here. I set out to build something that loads instantly on a bad
connection, which is why there's no framework, no bundler and no dependencies —
just canvas and plain JavaScript. The whole game is about 11 KB compressed.

The bit I'm proudest of is the cascade resolver: it merges one group per pass,
drops everything with gravity, then re-checks, so merges chain into each other.
That loop is where the game's whole feel lives.

If you play it, the most useful feedback is where you got bored — that's the
part I can't see from the inside. Thanks for looking.
```

---

## 5. IndieDB

**Title:** Neon Drop
**Short description:**

```
A free browser merge puzzle with chained cascades and a combo multiplier. ~33 KB,
zero dependencies, no download, no account.
```

**Full description:**

```
Neon Drop is a session-based merge puzzle that runs in a browser tab.

A tile hovers above a five-column, eight-row board. Drop it into any column.
Tiles with matching values that touch merge into a single tile worth double.
Crucially, every merge applies gravity — and gravity can create new adjacencies,
which triggers another merge, and another. That cascade is the game: a single
drop can chain across the whole board, and each link in one chain raises a score
multiplier, so a well-set board pays out far more than a safe one.

Players aim with a mouse, a finger, or the arrow keys, and drop with a click, a
tap, or the space bar.

Design constraints: no framework, no bundler, no dependencies, no build step.
The entire game is roughly 33 KB of source and about 11 KB over the wire, so it
starts near-instantly even on a slow connection. Progress (best score and coins)
is stored locally; there is no account and no personal data collected.

Neon Drop is supported by advertising on the web version. It is available for
non-exclusive embedding on other portals — get in touch.
```

---

## 6. r/incremental_games — **probably off-topic, see the warning above**

**Title:**

```
Neon Drop — a cascading merge puzzle (session-based, not idle — tell me if this doesn't belong)
```

**Body:**

```
Before anything else: Neon Drop is not an incremental game. There's no idle
progress, no prestige loop, no offline earnings. It's a session-based merge
puzzle, and if that's out of scope for this sub I'd rather hear it than have it
quietly removed — I'll take the post down myself.

Play: https://neon-drop.netlify.app

If it is close enough to be interesting: drop tiles into 5 columns, equal
touching tiles merge and double, and every merge applies gravity that can chain
into further merges. The chain raises a score multiplier, so the whole game is
about engineering a board where one drop pays out several times over.

The reason I thought of this sub at all is that the *number* growth scratches
the same itch — 2 becomes 4 becomes 8, and the board slowly stops being readable
— even though there's no persistent progression behind it.

If it belongs, I'd love feedback on the difficulty curve. If it doesn't, no hard
feelings, just say so.
```

---

## Posting order I'd suggest

| Day | Where | Why this order |
|---|---|---|
| 1 | r/WebGames | Most receptive to a finished browser game, and fastest feedback. |
| 2 | r/playmygame | Feedback-focused; cheap to post, low risk. |
| 3 | r/puzzlegames | Better fit than r/incremental_games for this genre. |
| 4 | Show HN | Needs you present for hours. Pick a weekday morning US time. |
| 5 | Product Hunt | Needs a launch-day push; only worth it once you have some traffic. |
| 6 | IndieDB | Evergreen page — a slow burn, not a spike. |

**Also worth considering later:** itch.io has its own discovery feed, and the
portals in `MONETIZATION_STATUS.md` (CrazyGames, Poki, GameDistribution) each
have their own player base that can drive traffic on their own — often more than
a Reddit post will.
