# 2026-08-10 — Rhythm-paced track generation (BRAINSTORM → ALIGN)

Design converged this session. Supersedes the S6 value-noise difficulty model. Backing ADR: **ADR-006**
(`docs/DECISIONS.md`). This note is the *why* + the agreed **diff shape** before code lands.

## The decisions (locked)

1. **Scope = three primitives, nothing else.** The whole moment-to-moment game is **gaps + deadly blocks +
   slow blocks**. Everything else (combat, pickups, forks, launch pads, BC5–BC8) is *feathering on top*, not
   core. We anchor the foundation on these three and playtest them.

2. **Two hard verbs + one decision:**
   - **deadly block** → strafe around it (no choice; touch = death),
   - **gap** → jump it (no choice; different axis),
   - **slow block** → eat it *or* dodge it (**passable → the only soft one → the risk/reward economy**).
   Depth lives in the *decision* (slow) and in *combinations* (slow-before-gap, deadly-funnel-into-slow), not
   in the primitives alone.

3. **Continuous, NOT a rhythm game.** The weave stays **smooth and organic** — no discrete lane snapping, no
   visible notes, no bars to read. The music/beat math is **hidden scaffolding for PACING only**; if the
   player perceives "a rhythm game" we've failed and lost the fighting/wrecking essence. What they feel is
   *flow that has shape* (tension/release), the way a well-paced level breathes.

4. **Banks model — deadly = the corridor edges, not scatter.** The play space is a **clean corridor** between
   **solid deadly banks**. "Harder" = **corridor tighter + weave faster** (a fast precise riff), NOT more junk
   on screen. Slow blocks are **grace-note decisions ON the line**; positional gaps are **percussive jump
   accents**. This fixes the S6 generator's failure (at peak it collapsed into an unreadable noise field).

5. **Envelope = "Believer" (Imagine Dragons) arrangement.** Verified 125 BPM, 4/4, structure
   `intro·verse·verse·verse·chorus·chorus·verse·verse·chorus·chorus·bridge·chorus·end`. Dynamics: verses
   **pared-back/percussive/tense**, choruses **slam**, pre-chorus **builds & drops**, a **bridge breakdown**
   before the **biggest final chorus**. So the difficulty envelope is a **staircase of escalating waves** —
   intro hook → tense verses (breathers, but *tense*) → building pre-choruses → escalating chorus slams →
   **bridge breakdown valley (~75%)** → biggest final chorus → quick outro to a plain finish. NOT the S6
   monotonic ease-out-to-cap (which peaked at 30% and stayed cranked). The bridge valley makes the final peak
   hit harder by contrast.

6. **Positional gaps.** Kill the full-width autopilot gap (S6: 6/6 gaps were full-width → hold-jump, no
   challenge). A gap gets a **partial-floor safe strip** at **L / C / R**, cycling — forcing *strafe-to-lane
   + jump*. **Collision already supports this** (span-based: over a strip lane = grounded, off it = fall —
   verified `step.ts` `floorUnder`/`bestFloorInSeg`). A few **full-hole must-jump gaps** stay as accents
   (heavy in the bridge). Renderer already handles partial floors + variable-width blocks (verified
   `track-view.tsx`) → **zero renderer changes**.

7. **Fairness backbone is unchanged and now load-bearing.** The proto cheated on fairness and it showed
   exactly where the *existing* derived caps become the ceiling:
   - **weave speed** is clamped by `SLOPE_CAP` / `CURV_CAP` (already derived from the least-capable class) →
     "harder = faster" has a HARD CEILING; past it, difficulty comes from tightness + gaps + slow, never more
     speed. (This is the "BPM ceiling = the Freighter's strafe reachability" — and it self-guards the future
     audio idea.)
   - **corridor width** clamped ≥ `MIN_LANE` **including the pinch accent** (proto's downbeat pinch dropped to
     1 lane — a fairness violation; must clamp).
   - **gaps** ≤ `GAP-REACH`, no two in a row (forced landing pad).
   > "How hard can the peak get?" = **exactly what the Freighter can just barely thread.** Not a guess.

8. **This resolves ADR-003's gate.** ADR-003 deferred the macro grammar until "≥2–3 beat types exist —
   vocabulary too small." The **"just gaps and blocks" decision fixes the vocabulary at these three on
   purpose** → the macro layer (arrangement envelope + phrasing over the 3 primitives) builds NOW, no BC5
   gate. ADR-006 concretizes + supersedes ADR-003's macro-layer plan.

## Validated headlessly (throwaway protos, kept in `scratchpad/`)

- `track-inspect.mjs` — ASCII-dumps the REAL generator. Proved S6's problems: 6/6 full-width gaps, peak@30%
  then stuck cranked, 80% blocks / no breathers, weave buried in a tunnel at peak.
- `rhythm-proto.mjs` (v2) — Believer-envelope + banks model + positional gaps. Reads as the song: verses
  breathe, choruses slam with a clean whipping corridor, bridge breakdown, biggest final chorus, outro eases.
  Also exposed the two fairness cheats (weave too fast, pinch < MIN_LANE) that production must clamp.

## Diff shape (the ALIGN — what actually changes)

**`packages/shared/src/constants.ts`** — retire the monotonic-D constants (`D_EASE_CAP`, `D_RAMP_SEGMENTS`,
`D_PACE_*`) in favour of:
- a **SECTION envelope table** (`{name, char, weight, I0, I1}` per Believer section; weights normalized to
  track length; intensity ramps within a section) — commented, intuitive.
- **banks tuning:** corridor-width curve `w(I)` (wide → `MIN_LANE`), **weave-frequency curve `freq(I)`
  CLAMPED so realized slope ≤ `SLOPE_CAP` and curvature ≤ `CURV_CAP`**, slow-grace probability `slowP(I)`,
  chorus **pinch** amount (clamped ≥ `MIN_LANE`).
- **positional-gap tuning:** per-char gap probability (bridge-heavy, chorus-punctuation), strip width
  (`MIN_LANE`), full-hole vs bridge mix.

**`packages/shared/src/sim/track.ts`** —
- replace `difficultyAt(i)` (monotonic ease-out) with `intensityAt(i)` (section-envelope lookup + in-section
  smooth ramp).
- replace the noise-wall model with the **banks model**: clear the `w`-wide corridor around the (existing,
  phase-continuous) weave line; fill OUTSIDE with **solid deadly banks**; sprinkle **slow** inside the
  corridor at `slowP`; chorus-downbeat **pinch** (clamped ≥ `MIN_LANE`).
- **positional gaps:** emit a partial-floor `FloorSpan` strip at L/C/R (not `floors: []`); reserve full-hole
  gaps as bridge accents; keep the no-two-in-a-row lookback (forced landing pad).
- keep the weave **bounded by the existing `SLOPE_CAP`/`CURV_CAP`** (do NOT crank freq past them).
- **materialize-once** is now legal (ADR-004, finite tracks) — simpler than the O(1) per-segment closure, but
  keep `segmentAt`/`segmentAtZ` signatures (renderer + collision depend on them).
- `pickupAnchors`: gaps are no longer `isHole` (they have a strip) — place pickups on the corridor line as
  today, still skipping full-hole accent segments.

**`packages/shared/src/sim/track.test.ts`** — determinism byte-identical (two builds, across seeds); envelope
peak location + per-section monotone ramp; **per-slice corridor ≥ MIN_LANE incl. pinch**; weave slope ≤
`SLOPE_CAP` & curvature ≤ `CURV_CAP`; positional-gap strip ≥ `MIN_LANE` & ≤ `GAP-REACH`; no two gaps in a row.

**Renderer** — **no changes** (span-based floors + variable-width blocks already handled — verified).

**Playtest in a hosted ROOM — no `/solo`.** `/solo` was deleted in `52f5a04` and stays deleted: the complete
S4 room path (`/game/:roomId`) already materializes the procgen track, renders it (`TrackView`), and runs
`simulate()` **with** the track (server-authoritative + client prediction). Hosting a room and racing alone
tests the REAL path — and doubles as a live client==server determinism check. Verified no min-player gate on
`startRace()` (run-room.ts:296) — a host starts solo. So this slice is **generator-only, zero UI work**;
playtest = host a room → GO → race.

## Risks / watch-items
- **Weave-speed ceiling** — the single most important clamp; the proto's peak was unthreadable without it.
- **Pinch < MIN_LANE** — clamp every corridor-narrowing (incl. accents) to the fairness floor.
- **Bridge-strip vs must-jump** — a partial-floor gap you can *strafe along* isn't a jump; tune the
  mix (bridge accents = full holes; positional = strip) at the feel-gate.
- **Determinism** — stay trig-free (smoothstep/tri/value-noise); reuse `hash2`/`mulberry32` (protos used a
  throwaway hash — do NOT port it).
- ~~/solo scope creep~~ — dropped; playtest in a hosted room (the real path), no new route.

## Open (feel-gate tunables, not blockers)
Section lengths/intensities, corridor start/floor widths, gap density per char, slow-grace rate, pinch depth.
Tune live in a hosted room (`pnpm dev` rebuilds `shared` on save → both ends pick it up).

## AS-BUILT — Slice 1 (envelope + banks) · 2026-08-10

**Landed (generator-only):** `constants.ts` (SECTIONS envelope + banks/slow-grace tuning; retired the
monotonic-D + noise-wall + drag-classification constants) · `sim/track.ts` (`difficultyAt` → `intensityAt`
section lookup; noise-walls → BANKS model — solid lethal outside the union corridor, coherent slow grace-notes
inside; `corridorCenterX`/`rolledGap` threaded `length`). `.gitignore` now excludes `scratchpad/` (throwaway
protos were failing local lint; biome `useIgnoreFile` picks it up).

**Verify gate:** `pnpm build` (tsc -b + client) ✓ · **71/71 shared tests** ✓ — incl. the load-bearing
*"widest-hull ship can always thread the corridor (REACH+FIT)"* → the banks model is fair by construction at
peak. Source lint-clean (1 pre-existing formatter error in `apps/client/app/app.css`, unrelated + untouched).

**Inspector (`scratchpad/track-inspect.mjs`, seed 12345):** reads as the Believer arc — intro hook (0.50),
tense verse breathers (~0.26 wide corridor), escalating chorus slams, **bridge valley segs 145–163 (0.18,
wide)**, **final chorus segs 164–184 (0.96–1.00, 1–2-lane thread + gap accents)**, outro eases to plain.
Weave line readable throughout (banks fixed the S6 peak-mush). Peak at seg 184 (92%); shift earlier by raising
the `outro` weight if a longer ease-out is wanted.

**Deferred to Slice 2:** positional gaps (still 25/25 full-width) + their lateral-reach fairness bound; the
chorus downbeat **pinch** accent (needs section `char`, not just intensity).

### CORRECTION (playtest #1, screenshots) — BANKS → DISCRETE SLALOM
The banks model (solid lethal outside the corridor) **played as a claustrophobic tube** — 8u-tall solid slabs
foreshorten into a wall-in-your-face canyon; difficulty was **bimodal** (open = too easy, tight = unreasonable
slot). The ASCII inspector couldn't reveal this (it showed a "clean corridor"). **Fix (still generator-only):**
deadly blocks OUTSIDE the corridor are now **DISCRETE** (`wallDensity` 0.3→0.55 coherent-noise, holes =
dodge-space) with **`BLOCK_MAX_LANES=3`** width cap (no giant slabs); corridor kept **moderate** (`CORRIDOR_W`
7→3, not a 2-lane slot) so the *moving weave line* is what forces strafing, not a shrinking tube. Difficulty =
block density + weave demand + gaps. `laneState` reverted to noise-density-outside + small slow-grace-inside;
re-added `SALT_WALL`/`WALL_*` constants + `wallDensity`. Envelope (Believer) unchanged. 71/71 tests still green.
**Lesson:** the ASCII inspector is blind to the 3D tube/height effect — the human screenshot is the real gate
([[instrument-dont-theorize]] / [[prototype-first-for-visual-decisions]]).

## AS-BUILT FINAL (playtest-tuned 2026-08-10/11) — the model that shipped this session

The micro model evolved across ~6 playtest rounds: **banks (tube) → discrete-noise walls (still clumped) →
uncorrelated sparse cubes → + flicks → + short cubes/buffer/varied gaps.** Final = **DISCRETE SLALOM + FLICK**
(the word "banks" is retired). All generator-only; 71/71 shared tests green throughout.

**The model, as built:**
- **Macro — Believer arrangement envelope** (`SECTIONS` → `intensityAt`): the escalating-waves staircase.
  Peak lands ~90% then eases (outro). Unchanged from the design.
- **Micro — discrete slalom + flick:**
  - A **moving safe corridor** (the weave line) you continuously track — the weave *is* the baseline strafing,
    sharpened via `WEAVE_CARRIER_BUDGET` (0.88), bounded by `SLOPE_CAP`/`CURV_CAP`.
  - **Discrete cube pillars** OUTSIDE the corridor, placed by **UNCORRELATED** noise (`WALL_NOISE_FZ_LANE=1`)
    so they're isolated 1-lane cubes (sparse, holes = dodge-space), **never clumped walls**. `BLOCK_MAX_LANES=3`.
  - **`CORRIDOR_BUFFER=1`** — a clear lane each side of the corridor; no pillar may crowd the edge → kills the
    "frame-perfect / unreasonable" tight spots (the seg-188 complaint).
  - **FLICK pillars** — a **1-lane** pillar (`FLICK_WIDTH=1`) juts from one corridor edge (alternating,
    no-two-in-a-row) → a sharp DISCRETE sidestep. This is not curvature-limited, so it's the "keep flicking L-R".
  - **Slow grace-notes** — small passable drag cells inside the corridor (eat-or-dodge).
  - **Varied gaps** — `FULL_GAP_FRAC=0.4` are full-width (jump); the rest **partial** (floor strip at the weave
    line + a side hole) → gaps of different widths. Partial floors "just work" (collision is span-based).
  - **BLOCK dims = 4u × 8u × `BLOCK_DEPTH=8`u** — SHORT cubes centered in the 20u segment, NOT full-depth walls
    (the user caught this: 20u-deep slabs read as walls you can't flick past). Same block count → renderer-safe.
- **Fairness = the ceiling** (unchanged): weave ≤ SLOPE_CAP/CURV_CAP; corridor ≥ MIN_LANE (+buffer); gaps ≤ GAP-REACH.
- **Track = `TRACK_SEGMENTS=400`** (8000u ≈ 2.5–2.8 min — the 2–3 min target). Speed is **u/s** (1 cell = 4u).

**Beyond the generator (this session):**
- **Ships tuned for crisp flicks** (`ship-classes.ts` + Fighter in `constants.ts`): `strafeAccel` + `strafeDamp`
  raised across all 5 (damp is the "continuous-but-discrete" lever — ship stops on release), weaver-ordering
  (Interceptor→Freighter) preserved so the armour-inverse test stays valid.
- **Camera raised** (`apps/client/.../camera/chase.ts`): sits `p.y+9` (above the 8u walls) + looks further
  ahead — you can see over pillars and plan. (Was `p.y+5`, below the walls → couldn't see.)

**Tools (scratchpad, gitignored):** `track-inspect.mjs` (ASCII per-segment) · `render-map.mjs` → `track-map.html`
(top-down map for spotting irritating stretches).

**Deferred:** the partial-gap strip currently sits ON the reachable weave line (variety + fairness, but no
forced pre-gap strafe) — **Slice 2 proper** = offset the strip L/C/R with a lateral-reach bound to *force*
alignment. **ADR-005** `validateTrack` still last. **Red-bloom readability** (walls flood the view pink) is a
renderer follow-up if it still bugs. Docs/memory reconciled to this as-built (below).
