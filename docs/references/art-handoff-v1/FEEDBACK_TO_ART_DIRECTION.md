# SLUR — Feedback on `SLUR_ART_HANDOFF_CLAUDE_v1`

**From:** engineering · **Date:** 2026-09-17 · **Re:** scale corrections + two unsolved readability problems

> **Paste-ready.** This document is self-contained — it assumes no access to the codebase. Every number
> below was read directly from the game's source on 2026-09-17.

---

## 1. Verdict first: the direction is ACCEPTED

The package has been adopted wholesale as the frozen scene/world art direction. The ADD in the codebase was
**rewritten to match it**, not the other way round. Specifically, these are now locked and should **not** be
revisited:

- **Cold Space. Warm Energy. Minimal forms. Readable gameplay.**
- **Marigold `#F59A24` is primary** and the only energy colour. Cyan is demoted to a sparing support accent.
- Cold, desaturated environment; ~70/20/8/2 background/environment/gameplay/highlights.
- A→B→C intensity system. Monolith / asteroid / planet / sector vocabulary. Track and gap language.
- Sealed = deadly, fractured = breakable. Square 4-fin homing seeker.
- TRON-influenced, not TRON-literal.

You also got something importantly right that this project has repeatedly got wrong: **you correctly
refused to turn the authoring grid into a gameplay rule.** The warnings in `00_STATUS_AND_SCOPE.md` are
exactly correct and were appreciated.

**This document asks for two things only:** (A) reshoot several boards at true scale, and (B) solve two
readability problems the package didn't address. Please don't re-open anything in the list above.

---

## 2. The problem: the boards are drawn at the wrong scale

The game's world units (`u`) are fixed in code. Several boards printed scale figures that are **4× to 10×
too small**, and the illustrations follow those wrong figures.

### The single headline error

> **The track is 64 units wide. The widest ship is 2.6 units wide.**
>
> **A ship spans about 1/24th of the track's width — roughly 4%.**

The boards draw the ship at roughly **1/8th to 1/10th** of the track width. So **the real track is about
2.5–3× wider, relative to the ship, than every board shows.**

This is not a nitpick. It changes the composition of every gameplay shot: the real ribbon reads far vaster,
emptier and lonelier than what was drawn. That may well be *better* for "Cold Space" — but it needs to be
drawn, seen, and signed off, not discovered later.

### Which boards are right and which are wrong

| Board | Verdict |
|---|---|
| `03_monoliths_final` | ✅ **Correct.** Uses "SHIP ~2.6u" — that is exactly the Fighter's real width. |
| `04_asteroids_final` | ✅ **Correct.** Size classes are consistent with a 64u track. |
| `07_track_visual_language_final` | ❌ **Wrong.** Panel 8 "SCALE REFERENCE" is 2–10× undersized throughout. |
| `09_small_gap_readability_final` | ❌ **Wrong.** Gap dimensions are 4× / 10× undersized. |
| `10_obstacle_blocks_final` | ⚠️ **Mostly fine**, but uses misleading lane/cell notation — see §5. |
| All gameplay-perspective shots | ⚠️ Track drawn too narrow relative to the ship. |

---

## 3. The authoritative numbers

Everything here is read from source. **These override anything printed on a board.**

### Track

| Thing | Value | Note |
|---|---:|---|
| **Track width** | **64u** | the number most often wrong on the boards |
| Authoring lanes across | 16 | design-time scaffolding only — **never a runtime or visual rule** |
| Segment length (down-track) | **20u** | |
| **Gap length** | **20u** | a gap is exactly one segment long |
| Total track length | **8000u** | 400 segments; ≈2.5 minutes of racing |
| Track thickness (the slab's depth) | **free choice** | *not* a game constant. Board 07's "1u" is perfectly legal. |

### Obstacle blocks

| Thing | Value |
|---|---:|
| Width | **4u** |
| **Height** | **8u** |
| Depth (down-track) | **8u** |

So a standard block is **4 wide × 8 tall × 8 deep** — **twice as tall as it is wide.** Board 07 gives "~2u
wide, ~3u tall", which is both undersized and the wrong aspect ratio.

> **The 8u height is load-bearing gameplay.** Blocks are deliberately taller than a player can jump — you
> must go *around* them, never over. A block drawn short enough to look hoppable is lying about the mechanic
> and will actively mislead players.

### Ships

| Class | Width (u) | Length (u) |
|---|---:|---:|
| Interceptor | 2.00 | 1.84 |
| **Fighter** (the baseline/reference ship) | **2.60** | 2.52 |
| Comet | 2.20 | 1.18 |
| Phantom | 2.40 | 5.02 |
| Freighter | 2.50 | 6.00 |

Two things to note:

1. **All five ships are nearly the same width** (2.0–2.6u, a 30% spread) but wildly different **lengths**
   (1.2–6.0u, a 5× spread). Ships differentiate by length, not width.
2. **Ships are long needles, not squat wedges.** The Freighter is 6u long and 2.5u wide — a 2.4:1 ratio.

### Minimum corridor

| Thing | Value |
|---|---:|
| Guaranteed threadable clearance | **7u** |

At every point down the track there is always at least a **7u**-wide lethal-free route. Never draw a
survivable route narrower than 7u. Equally, never assume a corridor is *wider* than 7u — against a 64u
ribbon, 7u is a genuine slot.

### Environment (from your boards — these were correct, keep them)

| Thing | Size | vs track width |
|---|---:|---:|
| Obelisk | 200–400u | 3–6× |
| Gate | 200–350u | 3–5× |
| Arch | 150–300u | 2–5× |
| Asteroid S / M / L / XL | 10–50 / 50–200 / 200–400 / 400u+ | 0.2× → 6×+ |

### Projectiles (for VFX scale)

| Thing | Value |
|---|---:|
| Bolt speed | **900 u/s** |
| Ship cruise speed | 48–70 u/s |
| Bolt range before expiry | ~1530u (**24 track-widths**) |

The bolt moves at **~16× ship cruise speed**. Your "elongated energy tracer, not a sphere" call is correct —
if anything, push it further. This is a streak that crosses the visible world almost instantly.

---

## 4. What we need reshot

Please regenerate these at true scale. **Same art direction, same palette, same mood — only the
proportions change.**

**Priority 1 — the gameplay perspective shots.** This is the one that matters most. Any chase-camera shot
should show the ship occupying **~4% of the ribbon's width**. Affects `00`, `01` (all three A/B/C panels),
`02`, `07` panel 1, `10` panel 1.

**Priority 2 — `07` panel 8 (scale reference).** Redraw with: track 64u, block 4×8×8u, ship 2.6u. Please
keep this panel — a correct version is genuinely useful.

**Priority 3 — `09` (gap readability).** Gaps are **20u long** and at minimum **4u wide**. Every gap on this
board is drawn far too short; they should read as genuine **chasms**, not seams. The readability treatment
you chose (subtle marigold edge + inner-lip glow + darker cavity) is approved and should be preserved — it
just needs to be applied to a correctly-proportioned hole.

**Priority 4 — `10` block proportions.** Blocks should be **2:1 tall:wide**. Also please drop the "CUBE
(1x1) / WIDE (2x1) / TALL (1x2)" and "LEFT / CENTER / RIGHT LANE" notation — it implies a 3-lane cell grid,
and the game has 16 authoring lanes and a fully continuous simulation. Blocks can be any real-valued size.

---

## 5. Two problems the package didn't solve

These are genuine design problems created by decisions in the package. We'd like your thinking on both.

### Problem A — marigold edge-glow is a weak guide at true scale

The package makes the **marigold track edge the primary navigational read**. That works beautifully in the
boards — because the boards draw a narrow track.

At true scale, **each edge sits 32u from the centreline** — more than 12 ship-widths away. A pilot threading
the middle of the ribbon cannot use the edges for fine positioning. The primary guide is, in practice,
peripheral scenery.

**The question:** what carries the *interior* navigational read on a 64u-wide ribbon? Some candidates,
none chosen:

- a subtle continuous **racing-line** read down the centre or down the safe corridor
- functional lane/panel seams that are legible but clearly subordinate to the edges
- hazard-local cues — each block casting its own ground-read
- letting the environment do it (monolith spacing as rhythm)

Constraint: whatever it is must not violate the package's own minimalism rule, and must not turn every panel
seam into an emissive line.

> **Worth considering honestly:** every board you produced instinctively drew a *narrower* track. That may be
> the art telling us something real about readability. Changing the game's track width is possible but
> expensive — it's tuned and playtested — so the default assumption is that the art matches 64u. But if
> after seeing a true-scale shot you think 64u simply doesn't read, say so explicitly. That's a conversation
> worth having, not a constraint to silently design around.

### Problem B — deadly vs breakable must read from silhouette alone, in half a second

The package makes marigold the *only* energy colour. That's accepted — but it has a consequence: **colour
can no longer distinguish object classes.** The old rule ("colour carries meaning — never use a player hue
for a hazard") is retired, because everything energetic is now the same hue.

So the difference between **a block that kills you** and **a block you can smash through** rests entirely on
*sealed vs fractured* — a silhouette and material-state distinction.

The timing budget: closing on an **8u-tall** block at **55 u/s**, a player has roughly **half a second** to
identify it and react.

**The question:** is "sealed vs fractured" enough at that speed and distance, in your judgement? And if not,
what's the minimum addition that fixes it without breaking the single-colour system? The fallback currently
on the table is spending `Alert Red #FF4B3E` on deadly blocks — which costs some of the palette's purity but
buys unambiguous life-or-death signalling.

A view from you on this would be valuable before we build it — this distinction is the difference between a
fair death and an unfair one.

---

## 6. Things to explicitly NOT change

- **Do not** adjust the palette, the A→B→C system, the monolith/asteroid/celestial vocabulary, or the
  material language. All accepted.
- **Do not** add slow blocks or special floor types. Your call to drop them is being honoured (we're merging
  them into the breakable-block concept instead).
- **Do not** re-open "which TRON era" — TRON-influenced-not-literal settles it.
- **Do not** produce more ship art yet. Ship direction is still in progress separately, as your package
  correctly noted.
- **Do not** treat the 16 authoring lanes as a visual grid. The simulation is continuous; blocks and gaps
  can be any real-valued size and position. The lane count is scaffolding for level design only.

---

## 7. Summary

| | |
|---|---|
| **Accepted** | the entire art direction, unchanged |
| **Wrong** | scale figures on boards `07` and `09`; track-to-ship ratio in all perspective shots |
| **Correct** | boards `03` and `04` — use these as your scale anchor |
| **Need** | reshoots at true scale + your thinking on Problems A and B |
| **The one number to remember** | **track 64u, ship 2.6u — the ship is 1/24th of the track's width** |
