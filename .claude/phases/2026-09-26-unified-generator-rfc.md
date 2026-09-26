# RFC — #300: one track generator (weave feel + motifs + arenas + power-up set pieces)

Author: workerthree · For: slur-supervisor → owner · Date: 2026-09-26 · Status: **APPROVED with amendments
(owner, via slur-supervisor, 2026-09-26)** · Absorbs: #292 (forks) as a set piece

## Owner rulings on §8

- Q1: 12,000u (600 segments) to start. It may grow. **No code may assume a length**: the sequencer scales
  the section count from `descriptor.length`.
- Q2: grace **45 s**; the 180 s cap is **removed**. Both are #301 (workertwo). This lane does not touch
  `run-sim.ts`, `director.ts` or the race-end constants. With 45 s, the §1.4 spread (33–35 s at w 0.25) fits.
- Q3: yes. Q5–Q9: yes as recommended: gen `'phrase'`, retire `weave`/`score` at S7, the §4 set-piece list,
  fork divider 50/50 wall/gap in acts 2–3.
- Q4: yes, plus an **owner addition**: several patterns side by side on the 96u deck. Folded in as the
  **parallel weave**, a `W` option (§2.3).
- #300 stays open until the build lands.

Scripts cited below (`runtimes.mjs`, `penalty2.mjs`, `weavephrase.mjs`, `model.mjs`) are throwaway files in the
session scratchpad. They import `packages/shared/dist` at HEAD `8d7d798` (clean tree, dist newer than src).

## 0. Summary

- Build a new `TrackGen`, working name **`'phrase'`**, on top of `groove`. The track is a chain of **phrases**:
  weave, motif (teach → repeat → twist), arena, set piece. Difficulty rises over three acts.
- **Length: 12,000u (600 segments)**, not 13–14k. Measured: a clean pilot holds 97–99% of top speed on groove,
  not the 80% the issue guessed. At 14,000u a clean Interceptor needs 168 s, which leaves 12 s for mistakes
  under the 180 s cap.
- **Main finding: groove asks nothing of a pilot that looks ahead.** A late-reacting (200–500 ms) `simulate()`
  pilot finishes groove in the same time as an empty deck, for every class. The owner's "weave feeling"
  is missing. The **weave-phrase band width** is the dial that brings it back: at 16u the Freighter lifts
  from 124 to ~80u/s; at 14u the Phantom lifts to ~76 and the Fighter to 86. The Interceptor holds 84 in every
  band.
- **Blocker for the owner:** the race ends **20 s after the first finisher** (`run-sim.ts:261`). The class
  spread in top speed is already **29 s** on today's 8,000u track (clean pilots). A clean Interceptor DNFs
  behind a clean Freighter today. At 12,000u the spread is 32–45 s. The race-end rule must change, or the
  top speeds, before a longer track ships (§5.4, Q2).

## 1. Measurements

All flights: `simulate()` at 60 Hz, `DEFAULT_SIM_CONFIG`, the groove test's `avoidPilot` (full lookahead,
12-tick reaction delay unless stated, brakes only when blocked). Seeds 1–10, 400 segments (8,000u).

### 1.1 Run time per class and generator (measured)

| gen | class | top u/s | finished | mean s | range s | avg speed (% of top) | deaths | bumps |
|---|---|---|---|---|---|---|---|---|
| groove | Interceptor | 84 | 10/10 | 96.1 | 95.9–97.0 | 83.3 (99.1%) | 0 | 4 |
| groove | Fighter | 96 | 10/10 | 84.2 | 84.2–84.3 | 95.0 (99.0%) | 0 | 2 |
| groove | Comet | 112 | 10/10 | 72.6 | 72.3–74.2 | 110.2 (98.4%) | 0 | 3 |
| groove | Phantom | 90 | 10/10 | 89.8 | 89.8–89.9 | 89.1 (99.0%) | 0 | 2 |
| groove | Freighter | 124 | 10/10 | 66.8 | 66.6–69.0 | 119.7 (96.6%) | 0 | 1 |
| empty deck | each class | — | 5/5 | 95.9 · 84.2 · 72.3 · 89.8 · 66.6 | — | — | — | — |

- Reaction delay 300, 400 and 500 ms: the groove means move by ≤ 0.6 s. Groove costs a lookahead pilot nothing.
- The groove **line pilot** (follows the groove line, jumps each hole) is 3–7 s slower than the avoid pilot
  (Interceptor 99.4 s, Freighter 74.1 s). **The designed line is slower than ignoring it.** A motif that
  is slower to play than to skip teaches nothing (§3).
- `weave` and `score`: the avoid pilot is tuned for groove. On weave it finishes 1 of 50 runs (wedges on
  walls, ~9k bumps per class). On score it finishes 8/10 Freighter and 3/10 Interceptor runs (1,270
  Interceptor deaths, all classes else 10/10 at ~98%). **These rows measure the pilot's limits, not the
  tracks.** Causes not diagnosed.
- 600 segments (12,000u), seeds 1–5: 24/25 finish; times scale linearly (Interceptor 143.6 s, Fighter 125.8 (4 finishers),
  Comet 108.0, Phantom 134.2, Freighter 98.8). The one miss (Fighter, seed 5) stops at z 2306 against a lone
  4u post on an open deck, with 44u of clear floor beside it. Pilot fault (brake + target dither), not a trap
  **[inferred]**.

### 1.2 What a mistake costs (measured, `penalty2.mjs`)

One event at z 2000 on an empty 4,000u deck, time lost against a clean run, seconds:

| class | head-on bump | death | bolt stun 1.2 s (armour-scaled) | mine hit | half speed |
|---|---|---|---|---|---|
| Interceptor | 0.97 | 1.55 | 0.57 | 1.83 | 0.17 |
| Fighter | 1.08 | 1.63 | 0.32 | 1.43 | 0.20 |
| Comet | 1.12 | 1.67 | 0.33 | 1.52 | 0.20 |
| Phantom | 1.13 | 1.65 | 0.28 | 1.30 | 0.20 |
| Freighter | 2.33 | 2.55 | 0.22 | 1.48 | 0.52 |

The Freighter pays twice as much for each bump or death, because its `accel` is 30 (others 52–66).

### 1.3 Weave band width vs class speed (measured, `weavephrase.mjs`)

A synthetic weave phrase: sealed walls both sides of a band that follows `weaveRaw` at the contract caps,
2,400u long, on the 4u authoring rows. A line pilot with perfect knowledge. The value is the highest capped
speed (2u/s steps) with **zero** bumps; five seeds.

| band | Interceptor 84 | Fighter 96 | Comet 112 | Phantom 90 | Freighter 124 |
|---|---|---|---|---|---|
| 32u / 24u | 84 | 96 | 112 | 90 | 124 |
| 20u | 84 | 96 | 112 | 90 | 104–110 |
| 16u | 84 | 96 | 112 | 88–90 | 78–82 |
| 14u | 84 | 84–86 | 102–112 | 64–78 | 60–74 |
| 12u | 66–82 | 54–58 | 72–78 | 0–30 | 0 (cannot pass at 30u/s) |
| 8u | 0 | 0 | 0 | 0 | 0 |

- The weave line itself is gentle. Its caps derive from `TRACK_CONTRACT` (62/65/118), and every class now
  threads it far above those numbers. `weaveThreadSpeed()` today: 122.2 · 108.3 · 108.7 · 104.9 · 98.0 (not
  the ADR-013 figures; the roster was retuned since).
- The band **width** does the work. Long ships (Phantom `halfL` 2.51, Freighter 3.0) fail first; at 12u they
  cannot clear the 4u row steps at all **[cause inferred]**.

### 1.4 Run-time model for a phrase track (derived from 1.1 and 1.3)

`T = ramp + L·(1−w)/top + L·w/v_weave(W)`. `w` = weave share of length; `W` = band width. Clean pilot.

| L | w, W | Interceptor | Fighter | Comet | Phantom | Freighter | spread |
|---|---|---|---|---|---|---|---|
| 8,000 | 0 | 96 | 84 | 73 | 90 | 67 | 29 s |
| 12,000 | 0 | 144 | 126 | 108 | 134 | 99 | 45 s |
| 12,000 | 0.25, 16u | 144 | 126 | 108 | 135 | 112 | 35 s |
| 12,000 | 0.25, 14u | 144 | 130 | 110 | 140 | 116 | 33 s |
| 14,000 | 0.25, 16u | 168 | 147 | 126 | 157 | 131 | 41 s |

A human adds mistakes. Budget example **[guessed rates]**: 10 bumps + 3 deaths + 3 bolt stuns + 1 mine ≈
18 s (Interceptor, Fighter, Comet, Phantom), ≈ 33 s (Freighter). At 12,000u, w 0.25, 16u: Interceptor ~162 s,
Phantom ~153, Freighter ~145, Fighter ~144, Comet ~127. **About 2.5–3 minutes, all under the 180 s cap.**
There is no human run data in the repo to replace the guess. S1 should log real finish times on
/test-level.

## 2. Phrase types and sequencing

### 2.1 Phrase types

| Phrase | Source | Job | Length | Geometry |
|---|---|---|---|---|
| **Weave** `W` | `weave` (ADR-006) | Thread a corridor at speed | 240–480u (hard cap 480u ≈ 3.9 s at 124) | Sealed walls both sides of a band on `weaveRaw`; 2-segment funnel in and out |
| **Motif** `M` | `score` (ADR-020) notes, `groove` obstacles | Learn a pattern | 3–8 notes on the groove beat grid (≈ 180–600u) | Groove islands, holes, smash blocks placed per note |
| **Arena** `A` | `groove` | Open combat space | 240–300u | Full-width floor, no blocks; 2–3 bag pickups |
| **Set piece** `S` | new | A scene for one power | 300–480u + 1.5 s pickup lead | §4 catalogue |
| **Breath** `.` | `score` rest | Space between phrases | 1–2 beats | Nothing |

### 2.2 The run

The run has three **acts** (low, mid, high), two **sections** per act, six sections in all. One section is
about 1,950u:

```
A · M-teach · M-repeat · S · W · M-twist · .
```

- The start keeps `START_SAFE` (6 segments). The last 300u before the finish is an arena (the finish sprint).
- Arena or open set piece at most every 1,200u (target (e), §5.3). `S` sits mid-section so the gap from `A` to
  `S` is ≈ 900u.
- Weave share `w` ≤ 25% of length (one `W` per section, 240–480u → 7–24%).
- Act dials:

| Act | Weave band | Motif pool | Twist allowed | Set pieces |
|---|---|---|---|---|
| 1 low | 20u | 3-note (`n3-*`) | mirror only | boost, shield, bolt |
| 2 mid | 16u | 3–4-note | mirror, one note swap | mine, seeker, fork (portal) |
| 3 high | 14u (floor) | 4–5-note | any one change (§3.3) | tug, blink (after #295), a callback set piece from act 1 |

- The choice at each slot is a seeded roll (`mulberry32(hash2(seed ^ SALT, slot))`), as in groove and score.
  Same seed, same track.

### 2.3 Parallel weave (owner addition) — a `W` option, not a new phrase type

Two weaves side by side in one `W` slot. It is a `W` option because it has the same job (thread at speed),
the same length cap (480u) and the same band dial. Only the band count changes.

- **Layout:** outer wall · band L · divider · band R · outer wall. The divider is a **hole strip 4–8u** wide
  (drift across = fall) or a sealed wall. Each band follows its own `weaveRaw` line (separate salts) inside
  its half of the deck.
- **Clearance:** each band is threadable on its own (GDD §0): each band ≥ the act's band width, checked with
  the contract ship. The divider never counts as floor.
- **Switching:** a 4–8u hole strip is shorter than any jump, so a ship can hop between weaves on purpose. A
  sealed divider allows no switch and hides the other band (as the fork wall does).
- **Act dials:**

| Act | `W` options | Bands |
|---|---|---|
| 1 low | single only | 20u |
| 2 mid | single or parallel (seeded, ~1 in 3) | parallel: one 20u + one 16u, an easy/hard choice |
| 3 high | single or parallel (~1 in 2) | parallel: 16u + 14u |

- **Targets:** the divider is exempt from (d) longestWall, like fork dividers (§5.3).
- **Unmeasured:** a band in half the deck swings through half the amplitude, so it may be gentler at the
  same width **[inferred]**. S3 re-measures the §1.3 table for single and parallel bands.
- Side-by-side **motifs** (two motif lines in the two halves) use the same layout rule. They are deferred to
  S2 as an option, measured before they ship.

## 3. The motif library

### 3.1 Notation and library

- Keep the score notation and module-load validation unchanged: `l r L R < > J JJ S .` and
  `motifFailures()` (`sim/score/motifs.ts`). It already checks every motif by flying it with the contract ship
  at `pacingCruise` and `registerCruise`.
- Seed from today's `MOTIF_LIBRARY` (18 motifs). The owner edits it as data.
- **Per-run vocabulary: 4–6 motifs.** A seed draws its motifs once, at the start. The run teaches each one,
  then brings it back. Eighteen motifs in one run is noise; five motifs is a song.

### 3.2 Emission (note → geometry)

Groove obstacles, not score's corridor band, so the deck stays open:

| Note | Geometry | Existing code |
|---|---|---|
| `l` `r` `L` `R` | An island post on the outside of the move, after the onset | `islandOf` |
| `<` `>` held | A diagonal row of posts along the move | new, from `islandOf` |
| `J` | A hole under the line, width 16–32u | `holeOf` |
| `JJ` | Two adjacent hole segments, 40u (ADR-020 amendment) | `holeOf` ×2 |
| `S` | A fractured block on the line | `smashesOf` |
| `.` | Nothing | — |

Spacing: the groove beat grid (`GROOVE_BEAT_Z` = 59.5u). A teach phrase uses stretch 2 (one rest between
notes). A repeat phrase uses the teach phrase's stretch. A twist may compress to stretch 1.

### 3.3 Teach → repeat → twist

- **Teach:** the motif once. Stretch 2. No filler obstacles. The line starts at deck centre.
- **Repeat:** the **same geometry** relative to the phrase start: same kinds, same x offsets, same depths.
  Only an x translation to fit the deck is allowed. The repeat is what the player learns from.
- **Twist:** exactly **one** change from this list: mirror; one note swapped within its family (`l→L`,
  `J→JJ`, `r→>`); tempo compressed (stretch 2 → 1); one post swapped for a hole on a jump note. Never two.
- **Callback:** act 3 replays one act 1 motif as its twist.
- **The motif line must be the fast line.** §1.1 shows the groove line is 3–7 s slower than skipping it.
  Acceptance (S2): on the motif phrases, the easiest route (`pacing/reference-path.ts`) plays ≥ 75% of
  notes (the ADR-020 adherence floor), and a line pilot is no slower than the avoid pilot. The lever:
  posts on **both** sides of the line (a gate), not only on the outside of the move.

## 4. Set-piece catalogue

Rules for every set piece:

1. **Flyable without its power.** Threadable clearance (GDD §0) holds, no roster pocket, and the avoid pilot
   finishes with 0 deaths without using the power.
2. **One forced pickup** 1.5–2.0 s before the scene at `registerCruise` (186–248u), on a clear lane, giving
   the scene's power (§6.3). It sits outside the 20-pickup bag, so the bag mix stays exact.
3. The power makes the scene **faster** (for the holder) or **hurts a rival**. Never required.
4. Rival powers (bolt, seeker, tug, mine) cannot be seen solo. Verify them with a node bot as a second racer
   (memory `node-bot-as-second-racer`).

| Power | Scene | Geometry | What the power does here | Counterplay | Check (S4–S6) |
|---|---|---|---|---|---|
| **Bolt** | *Breaker gate* | A row of fractured blocks across ~75% of the deck; a 16u sealed-free bypass off the line. A 600u open sightline follows. | One bolt breaks one fractured block (ADR-015) and opens the straight line. The sightline gives long shots at rivals (range 900 × 1.7 = 1,530u). | Take the bypass; smash through at `smashKeep` 0.45. | Bypass pilot 0 deaths; shooting pilot ≥ 0.5 s faster |
| **Seeker** | *Hide and seek* | 600u open sightline (the lock range), then a field of sealed pillars. | Lock a rival in the open (ADR-017: it locks what it can see). | The target ducks behind a pillar to break line of sight. | Node bot: a lock in the open, a lost lock behind a pillar |
| **Mine** | *Choke* | An open run, then the deck narrows to 16–24u for 100–150u. Solid floor only, no holes. | A mine laid back in the choke is hard to strafe past (trigger 3u + hull). | **Jump**: the trigger height is < 2u and every jump clears ≥ 2.8u. | Choke ≥ 16u; node bot jumps a mine in the choke |
| **Boost** | *Long jump* | A hole row across ~70% of the deck, deeper than a single jump at the contract `pacingCruise`; the other 30% is a post slalom. | Boost (+75% for 2 s) + jump clears the row on the straight line. | The slalom side; a double jump. | Slalom side 0 deaths; hole depth ≤ boosted single-jump reach at 84u/s, measured |
| **Shield** | *Kill box* | An arena straight after a choke or a bolt gate, where the pack bunches. | Absorbs one hit (bolt, seeker, mine, tug slow) for 5 s, in the place hits happen. Does **not** absorb block bumps (`absorbHit` runs only in `run/combat.ts`). | Spread out; fire back. | Pack bunching measured with bots |
| **Portal** | *Fork* (#292) | The deck splits into two lanes by a divider: a sealed **wall** (8u high, hides rivals) or an 8u **hole strip** (drift across = fall). Lane A: holes + a pickup. Lane B: a tight post weave. Clear mouth and rejoin. | Place a pair across the divider to switch lanes after you see the content, or throw a pair behind to send a chaser back. | Pick a lane early; both lanes are threadable. | Each lane ≥ 44u; choice readable from the mouth; `route-graph` fork check (memory `fork-choices-can-conflict`) |
| **Tug** | *Ledge* | A 24–32u floor strip beside a long hole row, 150u long. | Tow a chaser back (no jump for 0.8 s, 30% strafe) toward the holes; or tug a rival ahead to slow it (0.6× cap for 1 s). Tug a block face ahead for a kick. | Shield absorbs the tow; hold the centre of the strip. | A towed bot stays alive if it holds the centre |
| **Blink** (#295) | *Skip wall* | A sealed wall across ~80% of the deck with one side gap 16u wide; or a single hole segment on the line. | The 20–30u hop skips the wall or the hole on the straight line. | The side gap. | Waits for #295; side gap 0 deaths |

The Portal fork keeps the #292 plan (slur-supervisor handover): clear mouth → divider → clear rejoin; each lane
threadable on its own; both lanes the same length, so content makes the choice.

## 5. Contract fit

### 5.1 GDD §0: threadable clearance

- Every phrase keeps `MIN_LANE` (8u ≥ `MIN_CLEAR` 7u) open at every z-slice. The weave band floor (14u)
  and the choke floor (16u) are wider.
- The weave floor must derive from `TRACK_CONTRACT`, not the roster. Proposal: verify the band with the
  **contract ship** (`CONTRACT_TUNING`, `shipHalfL` 3, `shipHalfW` 1.3) the way `motifFailures()` already
  flies motifs. A band the contract ship cannot pass at `pacingCruise × WEAVE_MIN_THREAD_FRACTION`
  (27.5u/s) fails at module load.
- `rosterPockets()` = [] on every seed; 5 classes × 30 seeds finish with 0 deaths (the groove bar).

### 5.2 ADR-013: the contract, not the roster

- The generator reads `TRACK_CONTRACT` only. The class speeds in §1.3 are a **consequence**, not an input.
  That is ADR-013's *"conformance, not conformity"*: the Freighter lifts in a 14u weave the same way it
  already should in a tight weave.
- No roster field moves any geometry. Balancing a ship changes run times, never a block.

### 5.3 #255 open-space targets: what changes

The deck is 96u = **12** lanes of 8u since #257 (`fe40718`). The issue's "5 of 8 lanes" is stale; the target
is 5 of 12.

| # | Target today (seeds 1–30) | Proposal for `'phrase'` |
|---|---|---|
| (a) | ≥ 80% of length has ≥ 5 lanes open | Keep ≥ 80% **outside `W` phrases and chokes**; ≥ 60% over the whole track |
| (b) | No slice < 2 lanes | Keep, except inside `W` (band ≥ 14u) |
| (c) | Longest < 4-lane run ≤ 60u | Exempt `W` (cap 480u) and the choke (cap 150u) |
| (d) | Longest wall run ≤ 60u | Exempt weave walls and fork dividers; keep elsewhere |
| (e) | A fully open ≥ 240u stretch every ≤ 1,200u | "An arena **or** an open set piece" every ≤ 1,200u |

`openSpace()` gets the phrase list and measures per phrase kind. `groove` keeps its own targets unchanged.

## 6. Schema, digest and code impact

### 6.1 Schema

- **No schema field changes.** `gen` is already a string guarded by `isTrackGen`; add `'phrase'` to
  `TRACK_GENS`. `length` is `uint16`, so 600 fits.
- `procgenDescriptor()` picks the length per gen (`phrase` → 600, the rest → 400). Changing
  `TRACK_SEGMENTS` would move every weave/groove seed, because groove hashes `length` into its seed.
- `RunState` gets no new field for S1–S6.

### 6.2 Digest

- `track-digest.test.ts`: add a frozen `phrase` row. The `weave` and `groove` rows must stay unchanged. The
  S1 test proves it.
- New code goes in new modules (`sim/phrase/*`). It calls groove's placement functions without changing
  their output.

### 6.3 Forced pickups

- Today the power comes from the pickup id alone: `pickupPower(id)` → bag ordinal (`combat/pickups.ts:35`).
  The server grant (`combat-step.ts:134`) and the client (`seeker-pickups.utils.ts`) both call it.
- Proposal: a set-piece pickup encodes its power in the id (`s<k>.<salt>.<power>`). `pickupPower()` reads
  it when present. One shared function changes; both ends stay in step. Bag ordinals count ordinary pickups
  only.

### 6.4 Other costs

- The client builds rails, deck and pillars once over the whole track (memory
  `blocks-are-the-only-streamed-geometry`). 600 segments is 1.5× that geometry. S1 measures draw calls and
  build time on /test-level **[unmeasured]**.
- Groove's flight tests run 30 seeds × 5 classes; at 600 segments they take ~1.5× longer.

### 6.5 `weave` and `score`

Recommendation: **keep both behind `?gen=` until `'phrase'` is the default and the owner has played it,
then retire both** (S7).

- Rooms pick a random seed each time (`run-room.ts:29`). No stored seed depends on them, only /test-level's
  fixed seed. Retirement is cheap.
- Kept in any case: `weaveRaw()` (the weave phrase's band line), `MOTIF_LIBRARY`, `motifFailures()`,
  `note-move.ts`, `segmentsTrack()` (groove already imports it from `score/emit.ts`).
- The weave and score rows in §1.1 are pilot-limited. Retiring them does not need that diagnosed.

## 7. Slices

Each slice is one commit set with tests. Verify each look on /test-level (owner rule).

| Slice | Content | Done when |
|---|---|---|
| **S0** | Owner answers §8. ADR-023 draft. | Answers in this file |
| **S1** | `'phrase'` gen, per-gen length 600, section sequencer emitting arenas + groove-style motif phrases; digest row; per-phrase `openSpace()` | Determinism; weave/groove digests unchanged; 5 classes × 30 seeds, 0 deaths; draw calls + build ms at 600 segments measured |
| **S2** | Motif library per run (4–6), teach/repeat/twist, gate posts | Adherence ≥ 75%; line pilot not slower than avoid pilot |
| **S3** | Weave phrase, band dial 20/16/14u, 480u cap, contract-ship check; parallel weave option (§2.3) | Contract ship passes each band, single and parallel; class speed table re-measured |
| **S4** | Set pieces batch 1: forced pickup ids; boost, shield, bolt, mine | Each flyable without its power; node-bot checks for bolt and mine |
| **S5** | Fork (#292) + portal; tug; seeker | Fork lanes each threadable; node-bot checks |
| **S6** | Blink set piece | After #295 ships |
| **S7** | Make `'phrase'` the default; retire `weave`/`score` if the owner agrees | Owner look test on /test-level |

The race-end change (Q2) is #301 (workertwo), outside the generator. It should land before S7.

## 8. Owner questions

1. **Length.** 12,000u (600 segments), clean runs 108–144 s, human runs ≈ 2.5–3 min? The issue draft
   (13–14k) leaves a clean Interceptor 12 s under the 180 s cap.
2. **Race end.** The race stops 20 s after the first finisher. Clean pilots are 29 s apart today and 32–45 s
   apart at 12,000u, so the Interceptor DNFs even when flown cleanly. Choose one: (a) grace = a share of
   the leader's time (for example 30%); (b) a fixed longer grace (for example 45 s); (c) rebalance top speeds
   (84 → 124 is a 1.48× spread); (d) accept it.
3. **Weave dial.** Bands 20/16/14u by act, weave ≤ 25% of length. The Freighter and Phantom lift in narrow
   weaves; the Interceptor keeps full speed. Accept that as class identity?
4. **Motifs.** 4–6 motifs per run, teach → repeat (exact) → twist (one change), an act 3 callback. Gate
   posts so the motif line is the fast line?
5. **Forced pickups.** One per set piece, 1.5–2 s ahead, outside the 20-pickup bag?
6. **Open-space targets.** Accept the §5.3 changes for `'phrase'` only?
7. **Name and retirement.** Call the gen `'phrase'`? Retire `weave` and `score` at S7?
8. **Set-piece list.** Anything to cut or add in §4? The Blink scene waits for #295.
9. **Forks (#292).** The old questions still apply: wall/gap divider mix (proposed 50/50), gap jumpable on
   purpose, forks in acts 2–3 only.
