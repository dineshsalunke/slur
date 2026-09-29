# SLUR — Decision Log (ADRs)

Append-only record of load-bearing architecture/design decisions. **Never edit a past record in
place** — supersede it with a new one and add a `Superseded-by:` link. Each ADR names the docs it
affects; those docs carry a matching `⚠ SUPERSEDED … (ADR-NNN)` marker and relocate the deprecated
prose to their own `## Superseded` section. The *why* narrative lives in the linked phase note; this
file is the index of *what changed and when*.

Status vocabulary: **Accepted** (in force) · **Superseded** (replaced — see link) · **Proposed** (agreed
direction, not yet built).

## Build sequence (2026-08-10)

Implementation order is dependency-driven, not ADR-number order:

1. **ADR-001** provider decoupling (ADR-004 comment cleanup folds in) — *the unblocker.*
2. **ADR-002** anchors (visual seam frozen) — *depends on 001's landed provider.*
3. **ADR-006** rhythm-paced generation (arrangement envelope + discrete-slalom/flick micro + varied gaps) — **concretizes +
   supersedes ADR-003's macro layer.** The "just gaps & blocks" scope decision fixes the beat vocabulary at the
   3 existing primitives on purpose → the macro layer builds NOW, the old "wait for BC5 beats" gate is void.
4. *(future)* BC5+ beats (boost/slow/launch/fork…) are **feathering** layered on top later, not a prerequisite.
5. **ADR-005** `validateTrack()` — **LAST.** A validator validates a *settled* system; building it before its
   real consumers (authored provider · ADR-006 generator) means validating a moving target. Deferred until the
   generator stops changing shape.

**SHIPPED 2026-08-10:** ADR-001 (PR #46) + ADR-002 (PR #47) merged to `dev`; docs baseline (PR #48). Verify
gate green, **75 tests** (up from 70). **In progress:** **ADR-006** rhythm-paced generator (generator-only;
playtested in a hosted room — `/solo` stays deleted). **Next after:** **ADR-005** `validateTrack()` stays last.

---

## ADR-000 — The load-bearing contract (baseline)

- **Status:** Accepted · **Date:** 2026-08-10
- **Supersedes:** the earlier informal anchor *"a room is a seed + a list of inputs; the track is a pure
  function of the seed."* That phrasing anchored on the *implementation* (seed/procgen); this ADR
  restates it around the *abstraction*.

**Decision — the anchor:**

> A room is a **descriptor** + a list of **sequence-numbered inputs** + a thin slice of **dynamic state**.
> The server never sends geometry and never sends visuals. Both ends materialize an *identical*
> physics-and-anchors `Track` from the descriptor (via a provider — procgen or authored), and the one
> shared `simulate()` runs over that `Track`. Client prediction, collision-networking, deterministic
> pickup/anchor placement, and hazard behaviour are all **consequences of one decision: the sim depends
> on the `Track` *abstraction* + determinism — never on how the track was produced.**

**The four invariants everything else is derivable from:**

1. **Descriptor is synced; the `Track` is materialized locally.** Never sync the `Track` — only the
   small opaque descriptor. (Bandwidth + the whole determinism guarantee.)
2. **`Track` is gameplay-data only — physics + anchors, zero visuals.** Litmus: *"if two clients
   disagreed on this field, would the game desync?"* Yes → in the `Track`. No → client-only. This
   creates the **WYSIWYG-collision obligation** (a content gate for authored levels).
3. **Motion-affecting → shared `simulate()` + synced state; cosmetic → broadcast.** (The bolt/stun vs
   hit-spark split, generalised to every future hazard/effect.)
4. **Determinism:** identical materialization + identical `simulate()` across both JS engines —
   integer/IEEE-754 basic ops only, no transcendentals in the shared path.

**What is synced vs derived (the precise version):**

- **Synced:** descriptor · sequence-numbered inputs · authoritative ship state (a *correction* stream the
  client predicts against, not the source of motion) · per-anchor track-state flags (pickup taken, hazard
  armed) · dynamic entities (bolts/drops/active hazards) · one-shot cosmetic broadcasts.
- **Derived locally, never synced:** all geometry (floors/walls/gaps) · all anchor positions · all visuals.
- **Where the sim runs:** server simulates *all* ships; each client *predicts its own* with `simulate()`
  and *interpolates* remotes from buffered snapshots (remotes are never simulated client-side).

**Affected docs:** `CLAUDE.md` (anchor + non-negotiables) · `docs/GDD.md` §5.2 · `docs/TDD.md` §4/§5/§7 ·
memory `load-bearing-track-contract`.
**Why / narrative:** `.claude/phases/2026-08-10-track-provider-decoupling.md`.

---

## ADR-001 — Seed out of room/track → provider (dependency inversion)

- **Status:** ✅ **Accepted — SHIPPED** (PR #46, merged to `dev` 2026-08-10) · **Date:** 2026-08-10
- **As-built:** `sim/track-provider.ts` (`TrackDescriptor` union + `resolveTrack`); `RunState.seed` → nested
  `TrackDescriptorState` sub-schema; `makeTrack` internalised; `pickupLayout(descriptor)`; `Track.seed` dropped.
  `length`/`tier` reserved unwired. ADR-004 comment cleanup folded in. Geometry byte-identical; +2 tests.
- **Prep:** `.claude/phases/2026-08-10-adr-001-prep.md`. Settled: descriptor = **discriminated union**
  (`procgen` built, `authored` reserved); wire = **nested `TrackDescriptorState`** sub-schema; **`length`/`tier`
  reserved UNWIRED** (wiring `length` is procgen rule-system work → ADR-003). Slice = pure structural refactor,
  geometry byte-identical, one atomic commit, ADR-004 comment cleanup bundled in.

**Context:** `simulate()` already consumes a `Track` interface, not a seed
(`packages/shared/src/sim/step.ts:253`). But the seed leaks *around* that abstraction: `Track.seed`,
`pickupLayout(seed)`, `corridorCenterX(seed)`, client scenery, and `RunState.seed` (the only geometry
key on the wire). That coupling blocks authored levels and conflates "how a track is made" with "what a
track is."

**Decision:** The room's **wire state carries an opaque `TrackDescriptor`**; the room's **runtime holds a
materialized `Track`** obtained from `resolveTrack(descriptor)`. A provider registry resolves the
descriptor — `{kind:'procgen', seed, tier}` or `{kind:'authored', levelId}` — identically on both ends.
Nothing outside the procgen provider mentions a seed. The room and sim depend only on the `Track`
interface (+ the descriptor as an opaque key).

**Consequences:** authored + procgen unify behind one interface · the change is *subtractive* (remove
seed reach-arounds), not a sim rewrite · `RunState.seed: uint32` → a `TrackDescriptor` sub-schema
(append-only wire change) · pickups read `track.anchors`, not a seed.

**Affected docs:** `docs/TDD.md` §5 (schema) · `docs/GDD.md` §5.2 · `.claude/backlog.md` (level-authoring).
**Why / narrative:** the phase note.

---

## ADR-002 — `Track` = physics + anchors; visuals split (3-layer mechanics)

- **Status:** ✅ **Accepted — SHIPPED** (PR #47, merged to `dev` 2026-08-10) · **Date:** 2026-08-10
- **As-built:** `Track.anchors: Anchor[]` emitted by the procgen provider; `corridorCenterX` now
  provider-internal (last seed reach-around gone); pickups = `track.anchors.filter(kind==='pickup')`;
  `pickupTaken` keys unchanged (anchor id = segment-index string → zero wire migration). Visual seam FROZEN —
  renderer untouched; the WYSIWYG rule landed as **ADD.md §12** (not §6; §6 is a pointer). +3 tests.
- **Prep:** `.claude/phases/2026-08-10-adr-002-prep.md`. Settled: **build anchors** (`Track.anchors: Anchor[]`,
  procgen emits them, pickups become `anchors.filter(kind==='pickup')`, `corridorCenterX` internalised — kills
  the last seed reach-around). **VISUAL SEAM FROZEN** — the `resolveVisual`/`VisualTrack` split stays a
  documented rule (`ADD.md` #6) only, unfrozen when authored content / the art pass needs it. `kind:'pickup'`
  modelled; `kind` left open. Wire impact ≈ nil (`pickupTaken` already exists, re-keyed by anchor id).

**Context:** Today physics *is* visual — the client renders the exact collision AABBs
(`track-view.tsx`), a free "what you see is what kills you" guarantee. That breaks the moment an artist
authors a mesh whose collision hull is simpler, and it conflates gameplay data with rendering.

**Decision:** Split game content into three layers:

| Layer | What | Synced? |
|---|---|---|
| **1. Track (data)** | physics geometry + gameplay **anchors** (pickup/hazard/drop/checkpoint placements) | No — materialized from descriptor |
| **2. Track-state** | per-anchor dynamic flags keyed by anchor id | Yes — tiny (`pickupTaken` generalised) |
| **3. Dynamic entities** | runtime-spawned bolts / drops / active hazards | Yes — as entities (`projectiles` today) |

Visuals are resolved *separately*, client-side, from the same descriptor — never in the `Track`, never
synced. The split **replaces** the free WYSIWYG guarantee with an **obligation**: the visual must
faithfully cover the physics hull — a content-validation gate for authored levels (sits beside FIT /
GAP-REACH).

**Affected docs:** `docs/GDD.md` §5.2/§5.7 · `docs/TDD.md` §5 · `docs/ADD.md` (visual-vs-physics note).
**Why / narrative:** the phase note.

### Amendment — pickup ids, spacing and the power bag (2026-09-26, #265)

The owner approved this through slur-supervisor. It replaces the As-built wording *"`pickupTaken` keys
unchanged (anchor id = segment-index string → zero wire migration)"*. It also replaces the ADR-017
bullet *"Each pickup anchor gets a kind from a hash of its id."*

- **Id.** Every pickup id is `${ordinal}.${salt}` on both generators. `ordinal` is the pickup's index
  on the track. `salt` is `pickupSalt(seed)`. Weave used `String(seg)` before, so every weave seed dealt
  the same power order.
- **Spacing.** Rows are 6–9 segments apart (120–180u), hashed from the seed. A row slides up to 3
  segments forward to find a clear lane, or it is skipped.
- **Sideways.** x is hashed across the open lanes within ±40u (`PICKUP_X_MAX`) and within 40u of the
  last pickup. The column must be clear for the widest and longest hull from 20u before the pickup to
  5u after it. If no lane is within 40u, any clear lane is used.
- **Power.** Each run of 20 pickups is one shuffled bag, 6 bolt / 4 seeker / 4 mine / 3 boost /
  3 shield (`SEEKER_RATIO` = `MINE_RATIO` = 0.2, `BOOST_RATIO` = `SHIELD_RATIO` = 0.15). No power comes up 3 times in a row, across bag seams too.
  `pickupPower(id, cfg)` rebuilds the bag from the id, so both ends agree with no new synced state.
- **Wire.** `pickupTaken` keys change with the build. Server and client must run the same shared build.

---

## ADR-003 — Ruleset macro-layer; generate == validate

- **Status:** **Superseded-by ADR-006** · **Date:** 2026-08-10
- **Superseded note:** ADR-003 proposed a beat *grammar* gated on a larger BC vocabulary. ADR-006 supersedes
  its macro-layer design with a concrete, shipped-now form (arrangement envelope + discrete-slalom/flick + varied gaps over
  the 3 fixed primitives). The "generate == validate" idea survives and rolls into ADR-005 (`validateTrack`).

**Context:** The corridor-noise generator (`sim/track.ts`, S6) gives good moment-to-moment texture but
has no semantics: no memory of "have I taught this mechanic," no legality between mechanics, no designed
crescendo. Those are the "issues" a ruleset removes — moving bad patterns from *statistically-rare* to
*unrepresentable*.

**Decision:** Two-layer generation.
- **Macro layer (NEW, materialize-time):** a **1-D grammar of beats** (warmup · weave · jump-gauntlet ·
  slow-slalom · fork · shrink-crescendo · set-piece) with legality constraints, a difficulty budget
  (progression), a no-repeat variety window, and teach-before-test. The straight-ribbon lock makes this
  a cheap 1-D sequencing problem, not WFC. The beat vocabulary *is* the GDD §5.7 BC menu.
- **Micro layer (EXISTS, unchanged):** the corridor-noise weave fills each beat's geometry.

A grammar is **both generator and validator** (like a type system): procgen *generates* a legal
sequence from `{seed, tier}`; authored levels are *validated* by the same rules (FIT/GAP-REACH +
WYSIWYG become part of this check). Build it as a direction-agnostic module.

**Sequencing constraint:** a sequencer's value scales with vocabulary size. Today the vocabulary is
~one (weave). Build the grammar *after* landing 2–3 BC5-family beat types — not before.

**Affected docs:** `docs/GDD.md` §5.2/§5.7 · `.claude/backlog.md`.
**Why / narrative:** the phase note (+ prior `2026-08-10-procgen-weave-width-DRAFT.md`).

---

## ADR-004 — Drop endless Survival → longer finite tracks

- **Status:** Accepted (user decision, playtest-informed) · **Date:** 2026-08-10
- **Supersedes:** the endless-Survival mode (GDD §4 B) and everything justified *solely* by it.

**Context:** Endless Survival was the **sole** justification for "constraint 2" — O(1) random-access
generation, no global solve — which shaped the entire procgen design (value-noise-not-random-walk,
`segmentAt(i)` as a pure hash, "do NOT materialize an array"). After playtesting, endless is dropped in
favour of **longer finite tracks**.

**Decision:** No endless mode. All tracks are **bounded** → **materialize once at load**; the sim queries
flat `Track` data. Track *length* is a descriptor parameter (short → long).

**Consequences (mostly simplifications):**
- **Constraint 2 dies for all tracks.** The `2026-08-10-procgen-weave-width-DRAFT.md` algorithm survey
  (which rejected WFC/CA/Markov/global-solve under constraint 2) **reopens** — stateful materialize-time
  generation is now legal everywhere.
- **ADR-003's endless carve-out is deleted** — the macro grammar is the single, uniform macro layer.
- The `mode: race|survival` plumbing (procgen DRAFT Q2) evaporates; `D(z)` is just the finite ramp.
- A steerable bounded **random walk** is legal again for the racing line (was forbidden as O(i)).
- **New capability:** hash the materialized `Track` at load → assert client == server geometry agreement.
- **Open re-decision:** procgen was "PRIMARY" *because* endless needed it (`procgen-primary` memory).
  That necessity is gone → procgen now competes with authored/hybrid on **content-throughput merit**,
  not necessity. Recommendation: hybrid, grammar as the pivot. **Left open, not silently resolved.**
- **Dead-code-in-waiting:** `shouldSpectateOnJoin`'s planned Survival "drop-in-beside-pack" branch and
  the onJoin spawn-stagger never get built; join policy is Race-always, permanently.
- **Code-comment debt to fix when next touched:** `sim/track.ts` "endless Survival falls out for free —
  do NOT materialize an array" (now inverted) · `race/director.ts` Survival branch comments.

**Affected docs:** `CLAUDE.md` · `docs/GDD.md` §1/§2/§4/§5.2 · `docs/TDD.md` §4/§6 · `.claude/backlog.md`
S7 · memory `procgen-primary`.
**Why / narrative:** the phase note.

---

## ADR-005 — `validateTrack()`: fairness as a shared, property-tested contract

- **Status:** Proposed — **DEFERRED to LAST** (build after its consumers exist) · **Date:** 2026-08-10

**Decision:** Fairness is enforced by ONE shared, pure `validateTrack(track, classes)` — z-monotonic
flood-fill **FIT** (a connected corridor ≥ the widest ship links entry→exit) + per-gap **GAP-REACH** (every
gap ≤ the worst jumper's reach) — run as a property test over descriptors AND reused as the acceptance gate
for authored levels and the **generate == validate** half of the ADR-003 grammar.

**Why deferred to last (user, 2026-08-10):** a validator validates a *settled* system. Its real consumers —
the authored provider and the ADR-003 grammar — are future. Building it now would only guard the *current*
procgen generator (which already has a per-slice corridor assertion in `sim/track.test.ts`), and that
generator is about to grow anchors → beats → grammar-composition. Each new mechanic changes what "fair"
means, so building now = **validating a moving target** and re-extending it at every step. Build it once the
generator stops changing shape. Today's per-slice assertion holds the line until then.

**Affected docs:** `docs/GDD.md` §5.2 · `docs/TDD.md` §8 · `.claude/backlog.md`.
**Why / narrative:** the phase note + ADR-002/003.

---

## ADR-006 — Rhythm-paced generation: arrangement envelope + discrete-slalom/flick micro + varied gaps

- **Status:** Accepted · **Date:** 2026-08-10 (playtest-tuned through 2026-08-11)
- **As-built (playtest-tuned):** the micro model evolved over ~6 rounds — the initial **"banks"** idea (below)
  played as a claustrophobic tube and was **superseded** by **DISCRETE SLALOM + FLICK**: short cube pillars
  (4×8×**8u**, not full-depth walls) placed OUTSIDE a moving corridor by UNCORRELATED noise (sparse, +1-lane
  edge buffer), a 1-lane **flick** pillar that juts into the corridor to force a sharp sidestep, slow
  grace-notes on the line, and **varied gaps** (full-width jump + partial floor-strip). Ships tuned for crisp
  flicks; chase camera raised above the walls; `TRACK_SEGMENTS=400` (~2.5–2.8 min). Full evolution + final
  constants: the phase note. 71/71 shared tests green.
- **As-built 2026-09-23 — the pinch accent is finally built, and the +1-lane buffer is GONE.** The
  buffer above is retired. It made every lane of the weave union unconditionally open, so deadly blocks could
  only ever land at the track edges: measured on seed 20260921, the narrowest non-gap corridor over 420
  segments was **16u** against a 2.6u ship, the median **44u**, and **125 of 420** segments were empty across
  the full 64u. Walking the racing line, **90%** of segments needed no lateral input and the longest coast ran
  **29s**. Owner playtest: *"very boring… I didn't even have to lift any strafing finger for nearly 25% of the
  track."* The corridor is now an **open band** narrowing 48u→24u with intensity, plus the **pinch accent this
  ADR specified and nobody implemented** — a solid gate with one **12u** hole, 2–4 segments, above intensity
  0.45, its hole **frozen** for the gate's length (a weave-following 12u slot has *negative* segment-to-segment
  overlap and is unthreadable) and **funnelled on both sides**, the exit as much as the entry. Gates are built
  at full segment depth, or varied block depths leave two ways through. `WALL_DENSITY_MAX` 0.4→0.9 so the band
  is the widest run. `SECTIONS` 16→10 because ~9.5s phrases swung intensity 0.86→0.05 in nineteen segments.
  Longest coast **29s→10.5–13.8s**; peak lateral demand **110 u/s (above the 80 u/s clamp — unfair) →52–66**.
  The tube warning below still governs: the corridor narrows in **accents**, never permanently.
- **Supersedes:** the S6 value-noise **difficulty model** (monotonic `difficultyAt` ease-out-to-cap + triangle
  pace) and the **noise-wall** hazard placement. **Concretizes + supersedes ADR-003's** macro layer (voids its
  "wait for BC5 beats" gate). Keeps the S6 **weave line + derived `SLOPE_CAP`/`CURV_CAP`/`MIN_LANE` fairness
  backbone**, reused as the difficulty ceiling.

**Context:** The core game is exactly **three primitives — gaps + deadly blocks + slow blocks** (user, this
session); everything else is feathering. Instrumenting the shipped S6 generator (`scratchpad/track-inspect.mjs`)
proved it fails the core: **6/6 gaps full-width** (autopilot jumps), **peak at 30%** then stuck cranked, **80%
blocks / no breathers**, and the weave **buried in a noise tunnel** at high difficulty. Its difficulty model has
no arc and no pacing, and it places the primitives as **independent noise streams** so meaningful combinations
happen only by luck.

**Decision — two-layer, three sub-decisions:**
1. **Arrangement envelope (macro).** Difficulty follows a **staircase of escalating waves** modelled on
   *Imagine Dragons — "Believer"* (125 BPM; `intro·verses·pre-chorus·choruses·…·bridge·final-chorus·outro`):
   tense verse breathers → building pre-choruses → escalating chorus **slams** → a **bridge breakdown valley
   (~75%)** → the **biggest final chorus** → a quick **outro to a plain finish**. The music is **hidden pacing
   scaffolding only** — the surface stays **continuous/organic, never a rhythm game** (no discrete notes, no
   lane-snapping) or the fighting/wrecking essence is lost.
2. **Micro (micro).** ⚠ *AS-BUILT superseded this to DISCRETE SLALOM + FLICK — see the As-built line above.*
   Original idea: deadly blocks as the **corridor EDGES (banks)**. In playtest that read as a claustrophobic
   tube; the shipped model instead places **short discrete cubes OUTSIDE** the corridor (uncorrelated → never
   clumped, +1-lane buffer) and uses a **1-lane flick pillar** intruding into the corridor for the sharp
   sidestep. **Slow blocks = grace-note decisions ON the line** (kept). Difficulty = block density + weave demand
   + flicks + gaps.
3. **Varied gaps (AS-BUILT).** `FULL_GAP_FRAC` of gaps are full-width (must JUMP); the rest are **partial** — a
   floor strip at the weave line + a side hole (strafe across, or jump) → gaps of different widths. *Deferred
   (Slice 2 proper):* offsetting the strip L/C/R with a lateral-reach bound to *force* pre-gap alignment
   (today the strip sits on the already-reachable line, so it's variety + fairness, not forced strafe).

**Fairness (unchanged, now load-bearing):** weave speed clamped by `SLOPE_CAP`/`CURV_CAP` (the "BPM ceiling =
the least-capable ship's strafe reachability"); every corridor narrowing (incl. the chorus **pinch** accent)
clamped ≥ `MIN_LANE`; gaps ≤ `GAP-REACH`, no two in a row. *"How hard can the peak get" = exactly what the
Freighter can just barely thread.*

**Consequences:** `difficultyAt` → `intensityAt` (section lookup); noise-walls → discrete cube pillars + flick + slow-grace;
full-width gaps → positional strips; **materialize-once** (ADR-004 finite tracks) replaces the O(1) per-segment
closure. **Renderer + collision unchanged** (span-based floors + variable-width blocks already handle it —
verified). **Playtested in a hosted room** — `/solo` stays deleted (redundant with the complete S4 room path, which
already materializes + renders + `simulate()`s the track; host starts solo, no min-player gate). So the slice
is **generator-only, zero UI**. Protos: `scratchpad/track-inspect.mjs`,
`scratchpad/rhythm-proto.mjs` (throwaway; production reuses real `hash2`/`mulberry32`, not their hash).

**Affected docs:** `CLAUDE.md` (status + stale `/solo` note) · `docs/GDD.md` §5.2 · `docs/TDD.md` §5 ·
memory `rhythm-paced-generation` (+ `procgen-primary`).
**Why / narrative:** `.claude/phases/2026-08-10-rhythm-paced-generation.md`.

---

## ADR-007 — Obstacle blocks: fixed 8u HEIGHT, arbitrary width/depth

**Date:** recorded 2026-09-17 (the decision itself predates this). **Status:** ACCEPTED.

**Context.** `CLAUDE.md` and GDD §5.5 both cite "ADR-007" for the rule that blocks are *"NOT locked to
1×1 cell"* — but **no such ADR was ever written**; the reference dangled. The rule lived only in GDD §0's
reference table, which is easy to miss, and it *was* missed on 2026-09-17: `4 × 8 × 8u` got written into two
documents as though it were the block spec, with art instructed to draw a 2:1 tall:wide ratio.

**Decision.**

| Axis | Status | Value |
|---|---|---|
| **Height (y)** | **FIXED — load-bearing** | **`BLOCK_HEIGHT` = 8u** |
| Width (x) | **FREE** — any real value | 4u (`CELL`) as generated today |
| Depth (z) | **FREE** — any real value | 8u (`BLOCK_DEPTH`) as generated today |

The 8u height *is* the mechanic: it sits above double-jump reach, which is what makes blocks un-jumpable and
forces "strafe around or destroy, never hop". Vary it and the mechanic breaks. Width and depth are a
**generation artifact** — legal blocks include `5.5 × 5.5 × 8u` and `3.5 × 5 × 8u`.

**Consequences.**
- Art renders the family as *"8u-tall mass cut to arbitrary widths and depths"*, never a canonical cube.
  `/art-gallery` states this per subject.
- Any code or doc restating a block size as fixed is a bug — as is restating a *ship* width. The stale
  `Freighter 3.6u` comment in `sim/track.ts` (wrong: Freighter is 2.5u, widest is Fighter 2.6u) is removed
  in this same change; roster conformance is enforced by the module-load assertion, never by a comment.
- `validateTrack` (ADR-005) must not assume cell-quantized block extents.

---

## ADR-008 — Adopt `art-handoff-v1` as the frozen scene/world art direction (marigold-primary)

**Date:** 2026-09-17 · **Status:** ACCEPTED · **Supersedes:** the 2026-08-12 "full TRON" pivot and the
2026-08-10 cyan×marigold "gainda" duo.

**Context.** An external art-direction package (then `art-handoff-v1`, now consolidated unversioned at
`docs/art-direction/`) was produced with
ChatGPT and delivered as frozen scene/world direction plus twelve concept boards. It is coherent,
implementation-shaped, and correctly respects the GDD §0 continuous-space contract. It also contradicts the
then-current ADD on colour hierarchy.

**Decision.** The handoff package **is** the art direction for environment, track, obstacles, and pickups.
`docs/ADD.md` is rewritten to match and becomes the bridge doc (consequences + costs), not the source.

1. **North star:** *Cold Space. Warm Energy. Minimal forms. Readable gameplay.*
2. **Marigold `#F59A24` is primary** and the only energy colour — boundaries, pickups, projectiles, engines,
   seams, veins, finish, destructible internals. Environment is cold/desaturated. Ratio ≈ 70/20/8/2.
3. **Cyan is demoted** from co-primary to a sparing support accent (`#3BD6FF`).
4. **TRON-influenced, not TRON-literal.** **Issue #117 ("which TRON era") closes as moot.**
5. **Player hue is deferred.** One world colour for everyone; hue-shifting reserved for distinguishing
   opponent ships, only if a playtest demands it. `COLOR_COUNT = 12` remains palette capacity, not direction.
6. **Gameplay outranks the boards on scale.** `docs/ART_SCALE_REFERENCE.md` is authoritative and corrects
   boards 07 and 09, which are 4–10× undersized. Boards 03/04 are correct.
7. **Procedural-first asset pipeline** (ADD §9). Surface/fracture detail via fBm + Worley noise in-shader,
   not image files. Ships remain the authored CC0 models.

**Consequences / costs.**
- The old rule *"colour carries meaning"* is **retired** — under one energy colour, colour cannot
  discriminate object classes. **Discrimination moves to silhouette and material state**, which is a
  strictly harder readability problem and is now ADD §10 OQ7.
- **Edge-glow is a weak navigational guide at true scale** (edges sit 32u off-centre on a 64u track). New
  open problem — ADD §10 OQ6.
- The handoff art-directs five unbuilt mechanics (destructible blocks, homing seeker, mine/shield/boost,
  rear-view mirror). Treated as forward direction, **not** production work.
- Shader-noise surfaces trade texture memory for ALU — must be measured at the 12-ship gate (issue #17).

**Affected docs:** `docs/ADD.md` (rewritten §0–§4, §7, §9–§11) · `docs/ART_SCALE_REFERENCE.md` (new) ·
`docs/GDD.md` §5.2 · `CLAUDE.md` · issue #117 (close as moot).

---

## ADR-009 — Merge slow blocks and destructible blocks into one *breakable block* primitive

**Date:** 2026-09-17 · **Status:** **ACCEPTED with amendments by ADR-015** (2026-09-23). Slow blocks are
gone and blocks bounce (ADR-014). The readability gate below is still open.

**Context.** ADR-006 names three core primitives: gaps + deadly blocks + **slow blocks**, with slow blocks
as "grace-notes on the line". They are live in the generator today (`SLOW_GRACE_START/MAX`, `SALT_DRAG`).
The handoff package deletes them (*"no slow blocks or special floors"*) and instead freezes art for
**destructible blocks** — a §5.7 BC1 candidate that is **not built**. So the art direction removes a shipped
primitive and dresses an unshipped one.

**Decision (proposed).** Collapse both into **one block family with two material states**:

| State | Art | Behaviour |
|---|---|---|
| **Sealed** | solid, monolithic, sparse seams | **deadly** — kills on contact (unchanged) |
| **Fractured** | visibly cracked shell, internal marigold energy | **breakable** — shoot it to clear the path, *or* smash through and pay a speed tax |

The fractured block **replaces** the separate slow-block primitive. Three primitives remain: gaps + deadly
blocks + breakable blocks.

**Why this is better than either alone.**
- One art asset serves two mechanics — exactly the handoff's minimal-forms economy.
- It creates a real in-the-moment decision: **spend your Bolt to keep your speed, or eat the slowdown.**
- It gives the Bolt a **racing** use. Today the Bolt is purely anti-player; this makes it dual-purpose
  without adding a pickup, which serves the north star (more ways to mess with the run) at zero roster cost.
- The deadly/breakable distinction is carried by **silhouette and material**, not colour — which is required
  anyway under ADR-008's single-energy-colour system.

**Costs — none of these are free.**
1. **New sim behaviour.** Collision today either kills or slides. "Pass through with drag" is a third
   response in the shared `simulate()`, and must stay deterministic across both JS engines (basic ops only).
2. **Destroyed state becomes synced.** Slow blocks are currently pure seed-derived track data with **zero**
   sync. A destructible block is mutable shared state — if A shoots it and B doesn't see it gone, B crashes
   into nothing. By the ADR-000 litmus that is gameplay data, so blocks gain a destroyed flag generalizing
   `pickupTaken`. **This is the real price of the merge: it converts a free primitive into a networked one.**
3. **It is a fairness-floor risk.** A breakable block sitting in the only ≥`MIN_CLEAR` corridor must not be
   the thing that makes a slice unthreadable. `validateTrack` (ADR-005) must treat fractured blocks as solid
   when checking FIT.

**The gate (must pass before build).** In the art-lab, at 55 u/s on the real chase camera: **can a player
reliably tell sealed from fractured with enough time to react?** Closing on an 8u block leaves roughly half a
second. If silhouette alone does not carry it, this ADR fails and either (a) the distinction earns a
support colour (`Alert Red #FF4B3E` on sealed), or (b) slow blocks come back as their own primitive with
their own art direction.

**Affected docs (once accepted):** `docs/GDD.md` §5.2/§5.7 · ADR-006 (primitive list) · `docs/ADD.md` §4 ·
`packages/shared/src/sim/track.ts`.

---

## ADR-010 — Adopt `art-handoff-v2`; OQ6/OQ7 answered; low-camera proposal NOT accepted

**Date:** 2026-09-18 · **Status:** ACCEPTED (art direction) + **one item explicitly DEFERRED** (camera).
**Supersedes:** ADR-008's package pointer (v1 → v2). ADR-008's decisions otherwise stand unchanged.

**Context.** v2 of the external art package returned, incorporating the engineering feedback we sent. It
accepts every dimensional correction (64u ribbon, 8u constant block height, free block width/depth, 20u
gaps, real ship footprints) and answers both readability questions ADR-008 left open.

**Decisions.**

1. **v2 is the art direction.** v1 remains for its boards and as the record of what was first frozen.
2. **ADD §10 OQ6 answered — interior cues.** Track edges cannot carry fine positioning across 64u. Low-
   contrast panel divisions, transverse seams, material/reflection variation and hazard contact-shading
   supply it. **A racing line, safe-route glow or emissive seam grid is explicitly rejected** — cues give
   motion feedback without revealing the safe path, which was the exact failure mode we feared.
3. **ADD §10 OQ7 answered — broken contour.** *"Sealed mass = avoid; broken-contour shell = shoot to
   clear."* The distinction must break the **outer silhouette**; surface crack texture alone is
   insufficient. **Red-as-hazard-code is rejected**, so the single-energy-colour system survives intact and
   ADR-009's readability gate now has a concrete design to test rather than an open question.
4. **The boards were NOT reshot** — every v2 board is byte-identical to v1 (SHA-1 verified). The
   corrections are textual. **`docs/ART_SCALE_REFERENCE.md` therefore remains authoritative on dimensions**,
   and boards `07`/`09` still depict the old undersized proportions. See `art-handoff-v2/PROVENANCE.md` (the
package, then separate v1/v2 folders, is now consolidated unversioned at `docs/art-direction/`).

**DEFERRED — the low camera (v2 §8).** v2 proposes a **4–5u** camera (nominal 4.5u) with selective
occlusion fade. **Not accepted here.** It contradicts ADR-006, where the chase cam sits at **+9u**
deliberately so the player can see over 8u pillars and plan a line. v2 itself frames this as a prototype
requiring a 6–8u control camera, and occlusion fade is a substantial rendering feature with collision-
independence requirements. **This is a gameplay change wearing art clothing** — it needs its own ADR, a
prototype in `/art-lab`, and a human feel-gate. It also overlaps the still-open PR #120. Tracking as
ADD §10 OQ8.

**Correction to our own prior claim.** Our feedback stated the passable corridor was "20u at easy,
narrowing to 8u at peak", derived from `CORRIDOR_W_START`/`CORRIDOR_W_MIN` lane counts. **Measured in
`/art-lab` this is wrong**: the true contiguous lethal-free run is **64u at intensity 0, 56u at 0.41, and
24u at 1.00** (100% / 88% / 38% of the ribbon). The designated corridor is not the passable width, because
off-corridor blocks are sparse (`WALL_DENSITY_START 0.14`). The structural point that narrowing the ribbon
*reduces* obstacle density still holds; the percentages do not. v2's §3 does not repeat the bad figures,
so nothing downstream inherited them.

---

## ADR-011 — Lower the chase camera to 7.5u; ADR-010's camera deferral partially superseded

**Date:** 2026-09-20 · **Status:** ACCEPTED (owner-gated live) · **Supersedes:** the *deferral* in
ADR-010's "DEFERRED — the low camera (v2 §8)", and the `height` half of ADR-006's chase-cam constants.
**Does NOT adopt** v2's 4–5u proposal or its selective occlusion fade — both remain unaccepted.

**Context.** PR #120 reframed the chase cam so the player's ship reads big, and a later pass
(`a50cb3f`) raised `lookAhead` 7→14 and `lookAtLift` 2→5 to buy sky. The combination put the ship
**off the bottom of the frame**: at `height 9 / back 11 / lookAhead 14 / lookAtLift 5 / fov 60` the
ship sits `atan2(9,11) − atan2(4,25)` = **30.2°** below the view axis against a **30°** vertical
half-FOV. Two owner complaints — "not enough sky" and "the track ends above centre" — were the same
number, and the fix for one broke the other, because at `height 9` a flat pitch necessarily throws the
ship out of frame.

**Decision.** The chase camera becomes:

| | was | now |
|---|---|---|
| `height` | 9 | **7.5** |
| `back` | 11 | **15** |
| `lookAhead` | 14 | **9.5** |
| `lookAtLift` | 5 | **6** |
| `fov` | 60 | **70** |

Framing at these values: pitch **3.50°**, ship **23.06°** below axis against a **35°** half-FOV —
**11.9° of margin at rest**, widening to **23.0°** at top speed. Both speed terms help and they
compound: `backStretch 3` trails the cam to `back 18` (ship 19.5° below axis) while `fovStretch 15`
opens the lens to `fov 85` (half-FOV 42.5°). The frame is at its tightest parked, which is the safe
direction — margin only grows as the player goes faster.

**How it was decided.** The owner dialled it live on the `/art-lab` tuning panel shipped in `4305a4d`,
which exposes the five constants with a derived in-frame/off-edge readout. That is deliberately two of
the three things ADR-010 required of any camera change — **a prototype in `/art-lab`** and **a human
feel-gate**. This ADR is the third.

**The cost, stated plainly.** ADR-006 put the camera at **+9u so the player can see over 8u pillars and
plan a line**, and ADR-010 fenced any reduction as "a gameplay change wearing art clothing". At 7.5u the
camera eye sits **below pillar height**, so pillars can occlude the view — the precise failure the +9u
vantage existed to prevent. We accept it because the alternative was a ship that is not on screen, and
because the widened FOV and longer `back` recover line-planning distance that raw height was buying.

**Outstanding — this ADR does not claim it.** The feel-gate was flown **without pillars in frame and
from a parked camera**. Nobody has flown 7.5u through the generator's 8u pillar fields with `fly` ON.
Until that happens the occlusion cost is reasoned, not observed. If it reads badly, the levers are
`back` and `fov` — **not** a return to `height 9`, which reintroduces the off-screen ship.

**Not decided here.** Selective occlusion fade (v2 §8) is still unbuilt and unaccepted; ADD §10 OQ8
stays open for the 4–5u question. 7.5u is not a step toward 4.5u, it is the lowest height at which the
ship stays framed.

---

## ADR-012 — The edge rail stands outboard; no drawn element may take playable width

**Date:** 2026-09-20 · **Status:** ACCEPTED (owner) · **Supersedes:** the "boundary embedded in the
slab's top face" reading in `ART_MATERIALS.md` M7 · **Departs from:** board 24 panel 02's exclusion of
*"raised rails or ornamental edge machinery"* — see "The departure", below.

### Decision

**The deck's rendered top face ends at exactly ±`HALF_WIDTH`, always.** The edge rail is a separate
object standing **outboard** of it, spanning `[32, 32+RAIL_W]` and mirrored on −x. As shipped: a **1u ×
1u bar with a 0.15u chamfer on its long edges**, centred pivot at **±32.5**. Its width and height may be
tuned freely; **neither may move where the deck is drawn to end.**

Generalised, because the rail is only the first instance: **no visual element may consume playable
width.** Trim, borders, edge strips and any future perimeter art live outboard of ±`HALF_WIDTH`.

### Why

The sim's floor spans ±`HALF_WIDTH` unconditionally (`packages/shared/src/sim/track.ts:133`) and has no
term for any client-side trim constant. So an inset boundary does **not** narrow the track — it makes
the render disagree with the physics. At the shipped `BOUNDARY_W = 1.0` the deck drew **62u** while the
player flew **64u**: 1u per side of real, solid, flyable floor rendered as border. An edge marker drawn
somewhere other than the edge has failed at its only function, and that is worse than an honestly
narrower track, which would at least be consistent.

### How it was built wrong, and the shape of the mistake

`track-floor.tsx` generated the deck's top face inset by the trim's width —
`deckL = isOuterEdge( x0 ) ? x0 + w : x0` — and `track-geometry.ts` stated the coupling as the design:
*"the deck omits exactly the facets the strip fills, so both must read the same numbers and the same
edge rule."* One constant fed the deck mesh and the boundary mesh, so the width control **shrank the
deck** and repainted the reclaimed strip as trim.

The frame, not the arithmetic, was the error. Because the trim was conceived as *part of the slab's
surface* rather than as an object standing beside it, everything downstream was forced: the inward
inset, the shared width, the wrap, an outboard flare that hid below the sight line, and finally a
three-way A/B comparing three shapes that were all consequences of the same wrong premise. Several
sessions were spent tuning inside the frame. **The owner's fix deleted the frame instead: a 1u box,
chamfered, placed at `track_width/2 + 0.5u`.**

**Generalisable lesson, and the reason this ADR is worded broadly.** When a control's effect is
consistently wrong in the same direction, interrogate what the control is wired to before tuning it.
Here the width slider was believed to size the rail; it sized the deck. Three sessions of shape
variants could not have found that, because no shape was the variable.

### The departure

Board 24 panel 02 excludes *"raised rails or ornamental edge machinery"*, and a 1u bar standing on the
deck is a raised rail. Read as "embedded in the slab's top face", the package's wording is
**unbuildable without taking deck** — the top face ends at ±32, so anything embedded in it extends
inward. The exclusion and the playable-width invariant cannot both hold in that reading.

The owner's position is that the trim must never affect the playable read, and that outranks the
styling of the trim. This ADR therefore accepts the raised bar and records the departure rather than
resolving it silently. **`docs/art-direction/` is read-only for Claude**; the correction goes to Codex
with the package wording quoted. That hand-off note lived in `.claude/art-pass/`, deleted 2026-09-21;
the correction itself — a 1u × 1u chamfered bar outboard at ±32.5, read as a raised rail — stands above.

If Codex holds the exclusion, the fallback is the **same bar at zero height** — a coplanar inlay
outboard of the deck, which satisfies *"must not stand proud of the floor"* literally and still takes no
width. What is not available in any form is the original inboard reading.

### Acceptance

Assert the deck's outer top-face vertex sits at ±`HALF_WIDTH` **for every value of `RAIL_W`**. A test
that checks only the rail's own position passes while the deck moves underneath it — that is exactly how
the original coupling survived a green gate for several sessions.

### Not decided here

The rail's final height, its material tier beyond M7, and whether it breaks over full-width gaps or runs
continuous. Height is exposed on the `/art-lab` panel for the owner to judge.

## ADR-013 — The track is generated from a contract, never from the ship roster

**Date:** 2026-09-23 · **Status:** ACCEPTED (owner) · **Builds:** the fixed-ceiling design GDD §0 already
described for width, extended to speed and agility · **Closes:** `.claude/reports/GDD-DEVIATIONS.md` §1.2
and §1.3

### Decision

The procedural generator reads a single **`TRACK_CONTRACT`** — `pacingCruise 55`, and a reference weaver of
`weaveCruise 62` / `weaveStrafeClamp 65` / `weaveStrafeAccel 118` — and **never reads `SHIP_CLASSES`,
`ALL_CLASS_TUNINGS` or `DEFAULT_TUNING`**. `packages/shared/src/sim/weave.ts` no longer imports the roster at
all; `corridor.ts` and `intensity.ts` take their pacing speed from the contract instead of the Fighter's live
tuning.

The roster is **asserted to conform**, never consulted. `rosterContractFailures()` runs at module load of
`ship-classes.ts` and throws on a class that is too wide (`2·halfW > MAX_SHIP_WIDTH`) or too sluggish to
follow the racing line at half the pacing speed.

### Why

GDD §0 already argued this for width — *"a track seed must generate the **same geometry forever**. If
clearance tracked the live roster, adding/resizing a ship would silently mutate every existing seed's
track"* — but the code did the opposite on two other axes. `weave.ts:15-16` derived both caps as a `min` over
the live roster, and `corridor.ts:32`/`intensity.ts:67` read `DEFAULT_TUNING.maxCruise`, which **is** the
Fighter's tuning object.

The owner's reason is stronger than the determinism one and is the reason this ADR is worded as a general
rule: *"if the tracks are shaped by ship stats then what is the use of asking the user to think about his ship
choice"*. A `min` over the roster draws every course around the **least** capable ship, so no course can ever
reward picking a more capable one. Class choice was being cancelled out by the generator.

The trigger was a one-character request — double the Freighter's `maxCruise` from 62 to 124. Measured before
the change: that edit **halves** `SLOPE_CAP` (0.8387 → 0.4194) and **quarters** `CURV_CAP` (0.0982 → 0.0246),
because the Freighter was the binding class in both. Every existing seed, `/test-level`'s fixed 20260921
included, would have generated a different track as a side effect of a balance tweak.

### Conformance is a floor, not a match

The rejected shape was "every class must meet the contract's agility ratios", which would have **forbidden**
the Freighter change outright: at 124u/s its slope ratio falls to 0.52, well under the contract's 1.05.

That is the wrong answer to the right question. A ship that cannot hold top speed through a weave is not
broken — it **brakes**, which is precisely what GDD §5.5's *"long cruiser — worst weaver (sluggish handling),
gap-tank"* should feel like. So conformance is expressed through a new derived stat:

    weaveThreadSpeed( t ) = min( strafeClamp / WEAVE_SLOPE_CAP, sqrt( strafeAccel · CELL / WEAVE_CURVATURE_CAP ) )

— the fastest speed at which a class can follow the racing line, **independent of its own `maxCruise`**. The
guard requires only `weaveThreadSpeed ≥ pacingCruise × 0.5` (27.5u/s). Today: Interceptor 92.5, Comet 85.6,
Fighter 82.0, Phantom 78.2, Freighter 69.3 — every class currently threads above its own top speed, so
nobody has to lift yet. A 124u/s Freighter would thread at the same 69.3 and simply scrub ~55u/s for the
weave. This number is a good candidate for the ship-select screen.

### The numbers were frozen, not chosen

`TRACK_CONTRACT`'s four values are exactly the values the roster-derived formulas produced on 2026-09-23 —
verified bit-identical (`Object.is`) for both caps, so **not one existing seed moved**. A migration whose first
act was to reshape every track would have contradicted its own purpose. Picking rounder or more generous
numbers remains available as a deliberate, separate reshape.

`sim/track-contract.test.ts` fences that: it pins both caps, `FZ_ROWS`, `WEAVE_PERIOD_ROWS` and an FNV-1a
digest of the racing line over 4000 rows for three seeds. Changing a contract number fails it with "every seed
now weaves differently".

### Not decided here

GDD §0's clearance identifiers (`MIN_CLEAR 7u`, `CLEARANCE_MARGIN`) still do not exist in code; what ships is
`MIN_LANE = 2·CELL = 8u` as an axiom — `.claude/reports/GDD-DEVIATIONS.md` §1.1, untouched here because
correcting 8u to 7u is itself a reshape of every seed and wants its own decision.

Whether the Freighter's `maxCruise` actually doubles is a balance question, now fully decoupled from track
geometry: it is a one-line edit to `ship-classes.ts` that no longer moves a single block.

## ADR-014 — A block is solid, not lethal: contact bounces the ship and stuns it

**Date:** 2026-09-23 · **Status:** ACCEPTED (owner) · **Supersedes:** the swept body-kill half of the
collision rule GDD §5.7 called *"swept body-kill"* · **Leaves standing:** falling below `deathY`

### Decision

Touching an obstacle block no longer derezzes the ship. `resolveCollisions()` pushes the hull out of the
block along the **shallowest** of its four lateral faces, reverses the velocity into that face to
`-bounceBack` (9u/s), and raises `stunTimer` to `bounceStun` (0.25s), which the existing stun path already
turns into frozen control, a blinking hull and the `hit` + `stun` sounds.

Falling is untouched: `y < deathY` still calls `markDead()`, so a **gap is the only death in the game**.

Two new `FlightTuning` fields carry it — `bounceBack` and `bounceStun` — so a class can be given a heavier
or lighter bounce as a data edit (non-negotiable #6). Both are uniform across the roster today.

`applyLongitudinal()` had to stop clamping `vz` at zero, or the knockback would be erased before it moved
the ship: the floor is now `-bounceBack`, coast drag pulls `vz` toward zero **from either side**, and the
brake still bottoms out at 0, so no input can drive a ship backwards.

### Why

The owner's call. A kill-and-reset on every wall touch is the harshest possible answer to the most common
mistake, and it fights the premise in GDD §1: *"Social & chaotic — the fun is the other humans."* A reset
removes a player from the race for `respawnDelay` + a 12u re-approach; a bounce keeps them in it, losing
the thing that actually matters in a race — time and position. It also makes the Bolt read the way GDD §5.4
already wanted it to: *"Getting hit = disruption (stun, spin, brief control loss), rarely instant death"*.

### Mechanism — five candidates weighed

| Option | Verdict |
|---|---|
| **Shallowest-face push-out + velocity reversal** (chosen) | Deterministic, allocation-free, runs inside the existing `resolveCollisions()` pass, and needs no new `SimShip` field — so nothing changes on the wire and prediction reconciles as before. |
| Swept continuous-contact solve (time-of-impact, resolve at the exact face) | The correct answer for tunnelling, and more work than the defect deserves: the body test already runs after a 60Hz integration step and blocks are ≥ 3u deep, so a 124u/s Freighter moves 2.07u per tick and cannot cross one. |
| Reflect the full velocity vector about the face normal (elastic bounce) | Rejected with the owner's "hard stop + small shove" answer — a real ricochet at 124u/s throws a player backwards far enough to read as unfair. |
| Zero the velocity and leave the hull where it is | Leaves the hull *inside* the block: it re-triggers every tick, stun-locking the player against the face. |
| A hit counter that derezzes on the Nth hit | Keeps a death path, but needs a new schema field, a HUD readout and a balance number — a bigger design than the change asked for. Still open if bouncing proves too cheap. |

The push-out picks the shallowest face rather than the swept entry face. The two agree for the cases that
matter — a full-width wall hit head-on has a z penetration of a few centimetres against an x penetration of
33u — and where they disagree, the shallowest face is the *forgiving* reading: a wing that clips 0.3u into
a pillar is nudged sideways and flies on, which is the glance-off the owner wanted from a graze.

### Invulnerability is unchanged, and is now the only phase-through

`invulnTimer` still suppresses the body response for the post-respawn grace window, and is still spent on
the first tick clear of every body. It now suppresses a *bounce* rather than a *death*, which keeps a ship
that respawns overlapping geometry from being stunned in place.

**Removed (#281).** Post-respawn invulnerability no longer exists. See the ADR-016 amendment.

### What this costs

Blocks become cheap. A player who cannot weave can now bulldoze down the track at a cost of roughly
`bounceStun` + the re-acceleration per hit, where before the track demanded the lane. `sim/track.test.ts`'s
fairness caps (threadable clearance, `MIN_LANE`) were written against a lethal block and are unaffected in
letter, but the **pressure** the generator's intensity curve was tuned to apply is now softer everywhere.
Re-tuning intensity against a non-lethal block is not done here.

### As-built — a bounce is not cheaper than a death in time

workerone measured these numbers with bots on scratch scripts, not in playtests (`6efa656`). This note
records them. It does not re-measure them.

| One contact, flat track, 55u/s | Time lost |
|---|---|
| Head-on bounce | **1.45 s** |
| 0.3u graze | 0.97 s |
| The old death + respawn | 1.50 s |

A bot that does not steer finishes 0 of 6 seeds. The concern above that *"blocks become cheap"* does not
hold in time. A head-on bounce costs nearly as much as a death did. **Decision: no intensity retune.**

Two defects came out of the same measurements. Each has its own issue:

- **#231 — the graze outcome is random.** The shallowest-face rule makes glance or hard stop depend on
  the sub-tick phase (0.3u clip: 68% glance, 32% stop). The forgiving reading above holds only about
  two times in three.
- **#232 — the pocket trap.** Two staggered blocks with a z-gap just over the hull (seed 1, z≈6019,
  3.1u gap against a 2.52u hull) bounce a ship that holds throttle 100 times in 10 s.

### As-built — a graze always glances (#231)

The push-out no longer uses the shallowest face. `entryPush()` in `sim/step.ts` uses the previous tick's
position to find the face the hull came through. A hull that comes in through a side face resolves on x.
A hull that comes in through an end face resolves on x when its lateral overlap is less than the new
`FlightTuning.grazeDepth` (0.5u, owner), and on z otherwise. The outcome now depends only on clip depth.
Measured with a 100-phase sweep, Fighter at 55u/s: a 0.3u clip glanced **68%** before and **100%** after.
Clips of 0.1–0.45u glance 100% for every class, and clips of 0.55–0.8u hard-stop 100%
(`sim/graze.test.ts`). A glance still applies `bounceStun`.

### As-built — a hit during a stun is a plain stop (#232)

`bounceOffBlock()` still pushes the hull out. When `stunTimer` is already above zero, it zeroes the
velocity into the face, gives no knockback and does not refresh the stun. Before this, a pocket shorter
than the hull plus one knockback (about 1.0u) held a ship in the stun. On the 8 fairness seeds × 5 classes
there are 1,213 such pockets. With throttle held, **729** kept the stun past `bounceStun` before the
change, and **1** after (0.0005u slack, which no ship can enter). A bolt-stunned ship that drifts into a
block now stops dead with no extra stun (owner). `sim/pocket.test.ts` scans every pocket with slack
≥ 0.01u.

### As-built — a side hit scrapes (#334)

The owner said: *"sidehit should not really reduce the speed; if we want to it should be very less, ~10%
is ok."* Before this change, a side contact stunned the ship like a head-on hit.

- **A side push is a scrape.** `bounceOffBlock()` pushes the hull out on x and keeps the lateral kick. It
  multiplies `vz` by the new `FlightTuning.scrapeKeep` (**0.9**). It does **not** stun, so the throttle
  stays live. A push on z is unchanged: `-bounceBack` plus `bounceStun`.
- **`grazeDepth` is 1.0u** (was 0.5u). A nose-in clip shallower than 1.0u slides off the corner.
- **Only a fresh contact costs speed.** A held strafe floors `vx` at `strafeKick` every tick, so the hull
  re-touches the face every tick. A side contact is fresh only when the previous tick's gap to the face
  was more than `2 × BOUNCE_CLEARANCE`. Flush re-contacts cost nothing and report nothing.
- **Corner entry uses the swept entry fraction.** When the hull was outside the block on both axes last
  tick, the axis it crossed later decides the face.
- **`simulate()` returns the contact** — `{ kind: 'hit' | 'scrape', dir }` or `null`. `bounceContact()`
  places the spark from it, not from a rise in `stunTimer`. A scrape throws a spark only. It has no sound
  and no blink, because both key off `stunTimer`.

Measured on `dist` with `simulate()`, throttle held, all 5 classes:

| Case | Before | After |
|---|---|---|
| 0.8u straight clip | `vz` → -9, stun | `vz` → 0.9 × cruise, time lost 0.006–0.020 s |
| 4 s strafe held into a wall | `vz` → 0 in about 3 s | one 10% loss, back to cruise |
| Head-on (clip ≥ 1.0u) | `-bounceBack` + stun | unchanged |

`sim/scrape.test.ts` and `sim/graze.test.ts` hold these. The pilot harnesses (`avoid-pilot.test.ts`,
`pacing/pockets.ts`) now count a scrape as a bump, so the phrase/weave/groove gates and the track digest
are unchanged.

### Not decided here

The local ship throws the hit spark on a predicted bounce (`afb2642`,
`apps/client/app/game/ecs/bounce-spark.ts`). A remote ship that bounces gets the stun blink and the `hit`
sound, but no spark. #233 tracks that.

Whether a bounce should also scrub *lateral* speed, whether armour should scale `bounceStun` the way
`stunDurationForShip()` scales the bolt stun, and whether breakable blocks (ADR-009) shatter on contact
instead of bouncing, are all open.

---

## ADR-015 — Accept ADR-009 as one fractured block kind, amended for ADR-014

**Date:** 2026-09-23 · **Status:** ACCEPTED (owner, via slur-supervisor) · **Issue:** #214 ·
**Amends:** ADR-009 · **Readability gate:** NOT YET RUN (see below)

### Decision

A block has a `kind`: `'sealed'` or `'fractured'`. `placeBlock()` in
`packages/shared/src/sim/fracture.ts` picks the kind from a hash of the block id. The fracture rate goes
from `FRACTURE_RATE_START` (0.15) to `FRACTURE_RATE_MAX` (0.35) as the track intensity rises. A block wider
or deeper than 12u (`FRACTURE_MAX_WIDTH`, `FRACTURE_MAX_DEPTH`) is always sealed. A pinched wall is always
sealed.

- **Sealed** blocks bounce the ship (ADR-014). They also stop a bolt.
- **Fractured** blocks break. One bolt breaks one block. There is no block HP.
- **Smash:** a ship that flies into a standing fractured block breaks it and keeps `smashKeep` (0.45) of
  its `vz`. There is no stun.
- A broken block stays broken for the run. `RunState.blockBroken` holds the broken ids. A race reset
  clears it.
- The client predicts a smash. `reconcile()` restores the confirmed broken set before it replays inputs.
- On the client, a broken fractured block splits into its two chunks. The chunks fall, then disappear.
  This is VFX only. The sim does not know about the chunks.
  **Amended 2026-09-23 (#222, `2ab2c2c`):** the fractured block is now 12 convex cells split by glowing
  cracks. It glows more as a bolt closes on it. When it breaks, every cell flies out and a flash shows, all
  within about 0.9s. A block that was already broken when you join does not animate. It is still VFX only.
  The look is recorded in `docs/ART_MATERIALS.md` §7 item 15.

### Two amendments to ADR-009

1. **Slow blocks are gone.** ADR-009 merges two primitives. Slow blocks left the sim on 2026-09-22, so there
   is only one primitive to add. The three primitives are now: gaps, sealed blocks, fractured blocks.
2. **Blocks do not kill.** ADR-009 calls sealed blocks *"deadly — kills on contact"*. ADR-014 replaced
   that with a bounce. So the tax is measured against the bounce, not against death. The rule is:
   **weave (free) < shoot (costs a bolt) < smash (about 0.2s) < bounce (about 1.45s, measured in #213)**.
   The smash number is calculated from `DEFAULT_TUNING`. Nobody has played it yet.

ADR-009 cost 3 still holds: `passableCorridorWidth` counts a fractured block as solid. No slice may need a
break to be threadable.

### Why a smash has no throttle-suppression window

The plan wanted a short window after a smash where the throttle does not work. That window is not built.
Keeping 45% of `vz` already costs less than a bounce and more than a clean weave. A window needs a new
`SimShip` field and a new schema field. It adds nothing to the order above.

### Readability gate — open

ADR-009 says: *"at 55 u/s on the real chase camera: can a player reliably tell sealed from fractured with
enough time to react?"* In headless Chrome on `/test-level`, the crack reads at about 20u to 50u. The
owner has not judged it at race speed. The misread cost is now a bounce, not a death, so the gate is
softer than ADR-009 assumed. It still applies. If it fails, the fallback is ADR-009's option (a): a support
colour on one kind. The art package rejects red as a hazard code, so the colour must come from
`docs/ART_MATERIALS.md`.

### Open with the owner

1. **Do sealed blocks stop a bolt?** Built as yes. It is one line in `apps/server/src/rooms/run-room.ts`.
2. **Does the Freighter smash cheap?** Built as one `smashKeep` for all classes. A per-class value is a
   data edit in `FlightTuning` (non-negotiable #6).

### Affected

`packages/shared/src/sim/{space,fracture,step,track,gap-blocks}.ts` ·
`packages/shared/src/combat/projectiles.ts` · `packages/shared/src/schema.ts` ·
`apps/server/src/rooms/run-room.ts` · `apps/client/app/game/block-state.ts` ·
`apps/client/app/game/scene/{track-blocks,block-debris,block-breaks,fractured-block-*}` ·
`docs/GDD.md` §5.2, §5.7. Commits: `523d63c`, `b6f1f45`, `8c9afaf`.

## ADR-016 — A respawn goes to the nearest block-clear point, never into a block

**Date:** 2026-09-23 · **Status:** ACCEPTED (owner, via slur-supervisor) · **Issue:** #216 ·
**Amends:** ADR-014 ("Invulnerability is unchanged")

### Decision

After a gap death, `respawn()` in `packages/shared/src/sim/step.ts` asks `respawnPoint()` in
`packages/shared/src/sim/respawn-point.ts` where to put the ship. The search starts at the old point:
`lastSafeX`, clamped to the deck, and `lastSafeZ - respawnSetback`.

1. At that z, find the open floor runs over the ship's whole footprint, `[z - halfL, z + halfL]`. An open
   run is floor with every block removed. The runs are intersected over every slice in the footprint, across
   a segment seam too. This is the same slice arithmetic as `passableCorridorWidth` in `clearance.ts`.
2. If the hull fits at the anchor x, keep that x. If it does not, move to the nearest x where the hull fits,
   plus 1e-3. On a tie, take the smaller `|x|`, then the smaller x.
3. If no x fits, step z back by one ship length (`2 * halfL`) and try again.
4. The start apron always ends the search. Segments `-LEAD_SEGMENTS` to `START_SAFE - 1` have full floor
   and no blocks. `respawn-point.test.ts` asserts this.

So the old rule *"a respawn keeps its lateral anchor"* becomes *"a respawn goes to the nearest clear point
to its anchor"*. On an open deck the two are the same.

### Why the placement ignores smashed blocks

`respawnPoint()` treats every block as solid, a smashed fractured block too. It reads only the `Track`,
which both ends build from the descriptor (ADR-000). It never reads `world.broken`, because the client's
predicted broken set can differ from the server's for a tick. The cost: a ship can avoid a block that is
already gone. That costs a few units of x. It never costs a desync.

### Why the step-back is a ship length, not `CELL`

The plan said *"step z back by CELL"*. `.claude/rules/track-space.md` says: *"`CELL = 4u` … is not a
runtime unit … The sim never reads it."* The ship length comes from the flight tuning, which the sim
already reads.

### Options that were rejected

- **Step z back only, at the anchor x.** A long block, or a weave that stays over the anchor, can push the
  ship far back.
- **Move x only.** GDD §0 promises a `MIN_CLEAR` run at every z-slice. It does not promise one run across a
  whole footprint. Step 3 covers that case.
- **Keep the point and extend invuln.** This was the old behaviour. The player sees the ship inside the
  block.
- **A ring buffer of safe points.** This adds synced ship state to `schema.ts` for a rare case.
- **Respawn at `lastSafeZ`.** `resolveCollisions()` writes `lastSafe` before the block push, so that point
  can itself be inside a block.

### Amendment to ADR-014

ADR-014 says invuln *"keeps a ship that respawns overlapping geometry from being stunned in place"*. A
respawn no longer overlaps a block, so invuln is not needed for that case.

**Invuln is removed (#281, 2026-09-26, owner decision).** Every respawn point is block-clear, so the first
tick after a respawn is clear of every body, and that tick spent the whole `invulnTime` (1.5 s). The timer
never had an effect. `invulnTime` is gone from `FlightTuning`, and `invulnTimer` is gone from `SimShip`,
`SIM_SHIP_KEYS` and `SIM_FLOAT_KEYS`. `step.ts` now always bounces off a sealed block and always breaks a
fractured one. `PlayerState.invulnTimer` stays in `schema.ts` as a plain dead field that nothing writes.
Removing it or marking it `@deprecated()` would shift the field indexes that the client decodes by
reflection. The gap-death probe in `respawn.test.ts` still asserts that no respawn is stunned on the next
tick.

### Measured

The full-density probe in `respawn.test.ts` covers 6 seeds, every gap edge and every 2u lane. Before: 15 of
1,068 gap-death respawns were inside a block. After: 0 of 1,068. x moves on exactly those 15 respawns, by
0.6u to 6.4u. None of the 1,068 steps z back. A brute-force test over 1,710 points on 3 seeds (365 x moves,
60 z steps) checks that each chosen point is clear. It also checks that no clear x at that z is nearer the
anchor.

### Affected

`packages/shared/src/sim/{respawn-point,step,clearance}.ts` ·
`packages/shared/src/sim/{respawn,respawn-point}.test.ts`. Commit: `5fe5bd8`.

## ADR-017 — The homing seeker: one at a time, locks what it can see, dodged only late

**Date:** 2026-09-23 · **Status:** ACCEPTED and BUILT (#219: sim `5771ee3`, server `dfae252`, client
`cc3debe` and `7fcabd4`). **Amended by #226** (`eae791d`): seekers fire back to back, and the one-in-flight
cap is removed ·
**Issue:** #219 · **Implements:** GDD §5 *"Homing seeker … Locks the nearest ship ahead and chases;
dodge-able"* · **Uses:** BC8 (server distance queries)

### Decision

The seeker is the second held power. It is a slow, visible missile. It locks one target and is hard to
shake. The owner's steer: *"it should be HARDER TO SHAKE."*

- **Pickup kind.** Each pickup anchor gets a kind from a hash of its id. `seekerRatio` (0.25) of pickups
  are seekers. Procgen and authored tracks both work, because only the anchor id is read.
- **One at a time.** At most one seeker exists, held or in flight. `seekerScope` selects the scope:
  `'room'` (default) or `'shooter'`. When the limit is reached, a seeker pickup **grants a bolt**. It does
  not grant nothing, because an empty grab looks like a bug.
- **Target.** At launch the seeker locks the nearest racer **ahead** of the shooter, with
  `0 < dz ≤ seekerLockRange` (600u), that is alive, racing, not finished, and **visible**. If no racer
  qualifies, the fire is **wasted** (owner): the seeker flies straight ahead at `seekerFlyY`, hits nobody,
  and ends at the first standing block in its line or when `seekerTtl` runs out. The fire is not refused.
  The lock does not change after launch.
- **Line of sight.** A deterministic 2D test in `@slur/shared`: the segment from shooter to target in
  x–z against every standing block AABB in the segments between them. Each block is widened by
  `seekerHalf` (1u), so the seeker's whole body fits the line. Broken fractured blocks do not block it.
  Monoliths are not tested: they are client-only scenery outboard of the rail
  (`monolith-transforms.ts`, `RAIL_OUTER = HALF_WIDTH + RAIL_W`), and the segment between two points on
  the deck never leaves the deck. **LOS is checked at launch only.**
- **Flight height (owner, 2026-09-23).** The seeker flies low, among the ships, not above the blocks.
  The owner: *"the seeker has to travel at the same height as the other ships"*, then *"we should use
  something around 2 - 3u"*. It flies at `seekerFlyY` (2.5u) from launch. The renderer draws the seeker
  at its sim `y` with no hover lift, so 2.5u is the height on screen. In the committed window it drops
  at `seekerDropRate` (12 u/s) to `seekerStrikeY` (0.5u), so a jumping ship visibly passes over it.
  Blocks are `BLOCK_HEIGHT` (8u) tall, so the seeker can never overfly one.
- **Flight path: it follows the target (owner-approved plan, 2026-09-23).** Forward speed ramps from the
  shooter's `vz` to its top speed over `seekerRampS` (0.3s). The top speed is `FASTEST_CRUISE` ×
  `seekerSpeedFactor` (1.5, owner 2026-09-24), so no class outruns it and it reaches a Freighter
  launched 500u back inside its TTL (#243). Laterally:
  - *Leg 1* is the LOS line from launch to the target's position at launch. LOS proved it clear.
  - After that, the seeker follows the **target's own flown path**: every tick it records the target's
    `(z, x)` when the target has moved `seekerTrailStep` (1u) since the last sample, at most
    `seekerTrailLen` (1024) live samples. It steers to the path's x at its own z. The target flew that
    path without a crash, so the path is clear of blocks.
  - While the box between the seeker and the target (x from one to the other ± `seekerHalf`, z from the
    seeker to the target) holds no standing block, it homes **direct** on the target's x instead. Any
    path inside an empty box is safe, and direct homing does not lag a strafe the way the path does.
  - The path lives in a `WeakMap` beside the seeker (`combat/seeker-trail.ts`), never on the wire. The
    server and the `/test-level` local sim each build it from the same deterministic inputs.
- **Blocks (owner no-clip rule).** A standing block that the seeker touches **destroys the seeker**, at
  any point in the flight. A fractured block is destroyed with it (`broken.add`, as a bolt does). The
  seeker never draws through a block. Outcome `'blocked'`. The test sweeps z at the old x, then checks
  the box at the new x, in the order that the step moves it.
- **Measured (2026-09-23, 30 procgen seeds, tier 0, launch gaps 60–500u, a scripted target that steers
  around blocks, TTL 20s).** Blocked on 0.5–1.1% of locked shots (3/497 with the target at 90 u/s, 1/238
  at 110 u/s). A plain level seeker with no path following was blocked on 30–93%. The wide LOS refused
  765 of the launch attempts. The zero-width LOS refused 621.
- **Two tracking phases.**
  - *Tracking:* the lateral rate toward the goal x (the target, or its path) is capped at
    `seekerTrackTurn` (240 u/s). That is above every ship's `strafeClamp` (65–95), so an early strafe
    does not lose it.
  - *Committed:* inside the terminal window the cap drops to `seekerTurn` (40 u/s), so a late strafe can
    beat it. Once the seeker commits, it stays committed.
  - `seekerWindowMode` selects the window: `'time'` (time to impact ≤ `seekerWindowS`, 0.35s, with
    time = dz ÷ max(seeker vz − target vz, ε)) or `'distance'` (dz ≤ `seekerWindowU`, 30u).
- **Hit.** The seeker can hit only its target. It uses the bolt's x–z box test plus a y band: the target's
  `y` must be below `seekerHitBand` (1.2u). A full jump (2.8u or more for every class) clears it. A tap jump
  (0.8–0.9u) does not. The band tests the ship's `y`, not the seeker's, so the seeker's flight height
  does not change who it hits.
- **Miss.** The seeker is spent if its target is more than `halfL` behind it, if the target dies,
  finishes or leaves, or if `seekerTtl` (20s, owner 2026-09-23) runs out. A miss broadcasts `seekerMiss`
  (the dodge sound). At 6s the seeker reached only about 180u against a 90 u/s target (closing speed
  30 u/s), far short of the 600u lock range, and most long locks expired.
- **Stun.** `seekerStunS` is 2.0s. The bolt's is 1.2s. Armour scales it through `stunDurationForShip`.
- **Wire.** A new `Seeker` schema class (`x y z vz ownerId targetId ttl committed`) in its own map,
  `RunState.seekers`. `Projectile` is unchanged, so the bolt path (`stepBolts`, the threat HUD's bolt
  scan, `projectile-field.tsx`) is untouched. The server steps seekers. The client interpolates them and
  does not predict them.
- **Tuning (owner).** Every value above is a `SimConfig` field (non-negotiable #6). **Only `/test-level`
  is tunable**: the `Seeker.*` group in `dev/tuning-schema.ts` drives its local sim. Hosted rooms run
  `DEFAULT_SIM_CONFIG`, and no panel values go to the server. This is the decision, not a gap. As of
  2026-09-23 the group does not exist yet. `Seeker.flyY` is the first entry (owner), and the local sim
  must pass a tuned `SimConfig` into `aimSeeker`/`stepSeekers` in `routes/test-level/local-combat.ts`.

### Exactly two dodges

The owner allows two ways to beat a locked seeker: **jump over it**, or **strafe at the last moment**.
LOS is not re-checked. An early strafe does not shake it. Two known exceptions follow. **A block** can
destroy it; that comes from the owner's no-clip rule. Path following makes this rare (about 1% measured),
and it happens mostly in the committed window, where the seeker homes straight at the target and a
target that threads past a block at that moment escapes. **Outrunning it** is the other: the Freighter (`ship-classes.ts:84`, `maxCruise: 124`) is faster than 120 u/s. The
owner accepted this for now.

### Rejected alternatives

- **One turn cap for the whole flight.** An early strafe shakes it. The owner rejected this.
- **LOS re-checked in flight.** It adds a third dodge.
- **Cruise above the blocks and dive at the end** (the first build). The owner wants the seeker among
  the ships.
- **Fly level and straight at the target with no path following.** Measured blocked on 30–93% of shots.
- **Follow the path only, never home direct.** The path lags the target. A strafe just before the
  window then shakes the seeker, and that breaks the early-strafe rule.
- **Keep a path for every racer on the server,** so that leg 1 also follows a flown path. It adds state
  per racer to the room and to the local sim. The wide LOS makes leg 1 safe enough without it.
- **Bolts and seekers in one `Projectile` map with a `kind` field.** Every bolt consumer would need a
  kind filter.
- **Proportional navigation.** It is harder to tune to a clean late-strafe window. The two-phase cap gives
  the window directly.
- **Refuse to fire with no lock.** The owner chose wasted. A refusal also needs the client to predict
  the server's lock for the HUD.
- **Hit any ship in the path.** A lock that hits someone else is not a lock.

### Amendment — three power slots and a fire-time seeker cap (2026-09-23, #223)

The owner approved this through slur-supervisor. It replaces the **One at a time** bullet above, which
says *"At most one seeker exists, held or in flight … When the limit is reached, a seeker pickup
**grants a bolt**."*

- **Slots.** A racer holds up to `POWER_SLOTS` (3) powers, in any mix. Duplicates are allowed. A grab
  fills the lowest empty slot. With 3 full slots the racer skips the pickup, and the pickup stays.
- **Keys.** 1/2/3 select a slot. Q cycles. E fires the selected slot. X drops it, and a dropped power
  is gone.
- **The cap moves to fire time.** Each shooter can have one seeker in flight. Holding seekers has no
  limit. A seeker pickup always grants a seeker. A fire refused by the cap spends nothing, and the slot
  keeps its seeker.
- **Wire.** `PlayerState.slots` is an `ArraySchema<uint8>` appended after `heldPower`. `heldPower` is
  a plain unused `uint8`. It is not `@deprecated()`: the client decodes by reflection, and a deprecated
  field moves `slots` one index down on the client (fixed in `c362fab`). `USE_POWERUP` carries `{ slot }`. A new `DROP_POWERUP` carries `{ slot }`. A message
  with no valid slot is ignored. `seekerScope` and `seekerGate` are removed.

Commit: `eb4c381` (shared + server). The client slice follows.

### Amendment — seekers fire back to back (2026-09-23, #226)

The owner asked for this through slur-supervisor: *"i would like to fire seeker's back to back if
required."* It replaces the #223 bullet above that says *"The cap moves to fire time. Each shooter can
have one seeker in flight."*

- **No seeker cap.** A racer can fire every seeker they hold, one after another. The only fire rule is
  `canFire` (not dead, not stunned, not spectating, slot not empty). `seekerReady()` is removed.
- **Seekers are independent.** Each seeker has its own id. Seekers do not collide with each other.
- **The client draws at most `MAX_SEEKERS` (48) seekers.** This is a render bound only. The server does
  not enforce it. 48 covers 12 racers × 3 slots, with room for refills within the seeker TTL. Seekers past
  48 still fly and hit, but the client does not draw them.

### Affected

`packages/shared/src/combat/{constants,seeker,seeker-trail,pickups,combat-step}.ts` ·
`packages/shared/src/{schema,sim-config,ship-classes}.ts` · `apps/server/src/rooms/run-room.ts` ·
`apps/client/app/game/scene/{pickup-field,projectile-field,seeker-*}` ·
`apps/client/app/game/overlays/{threat-hud,held-power-chip}.tsx` · `apps/client/app/audio/sfx-map.ts` ·
`apps/client/app/routes/test-level/*` · `apps/client/app/dev/tuning-schema.ts` ·
`docs/GDD.md` §5 · `docs/ART_SCALE_REFERENCE.md` §7.

---

## ADR-018 — The columns beside the track are pillars: equal, square, mirrored, evenly spaced

**Date:** 2026-09-23 · **Status:** Accepted (owner, via slur-supervisor) · **Reverses:** the intent of
`568c523` *"every monolith gets its own size, and the two sides stop mirroring"* (no ADR recorded it)

### Decision

The owner: *"we want these monoliths to be of equal width and height (we had decided 50u) both on each
side and evenly place, these are the pillars holding the track, that is the idea."*

- **Size.** Every pillar is the box the owner tuned in `3d724d8`: *"height 50u, width and depth 12u,
  flush to the rail"*. The owner confirmed this reading ("50u" is the height, and the footprint is a
  12u square). There are no per-pillar multipliers and no obelisk.
- **Placement.** Pillars stand in mirrored pairs at the same z. The pitch keeps the decided
  `intensityAt` lerp, *"calm spacing 400, intense 200"* (`3d724d8`). The owner chose this over a
  constant pitch. There is no per-side phase, no jitter, no dropped row and no push off the rail.
- **Variety** belongs to the other props (obelisk, gate, arch, asteroids), never to the pillars. An arch
  (#220) replaces the whole pillar pair nearest its z. It does not move or drop the pairs around it.

### Rejected alternatives

- **Keep `568c523`'s variety.** It read as "alternating and not square, different sizes" (owner). The
  colonnade stopped reading as structure.
- **A 50u × 50u footprint.** Four times the recorded width. A pair of them would be a wall beside the
  deck.
- **A constant pitch.** It was offered. The owner kept the decided intensity lerp.

### Affected

`apps/client/app/game/scene/{monolith-config,monolith-field,monolith-transforms,monolith-group,monoliths}` ·
`docs/ADD.md` §4.

---

## ADR-019 — Close blocks merge into one larger block

**Date:** 2026-09-24 · **Status:** Accepted (owner picked option 5 of the #244 RFC, via slur-supervisor)

### Context

The generator left clusters of 2–3 small staggered blocks close together. On 9 seeds there were 1,577
close pairs: 304 slits (x-gap under `MAX_SHIP_WIDTH`, 4u) inside one segment, and 1,063 pockets (z-gap
under the longest hull, 6u) across a segment boundary.

### Decision

`sim/merge-blocks.ts`, applied in `makeProcgenTrack`:

1. **In a segment,** a close pair (slit, pocket or diagonal) becomes one block, their bounding box. The
   merge repeats until no pair is left. A merge is refused when it drops `passableCorridorWidth` below
   `MIN_LANE` (or below the width the segment already had).
2. **Across a segment boundary,** a block grows to the segment edge when a block in the next or previous
   segment overlaps it in x within a 6u z-gap. The same clearance guard applies. A block never leaves its
   segment, so `step.ts` still reads only `segmentAtZ( z ± halfL )`.

A merged block keeps the lowest member id. It is fractured only when a member was fractured and the result
fits the 12 × 12u fracture cap. `segmentAt( i )` builds segments `i − 1` and `i + 1` too, so it stays a
pure function of the seed and `i`.

Measured on the 8 fairness seeds + 20260921: blocks 4,527 → 4,194, close pairs 1,577 → 176 (slits 0),
narrowest corridor 8u. Fractured blocks 565 → 471 (94 lost to a merge). `FRACTURE_RATE_*` is unchanged;
a re-tune is an open owner call.

### Rejected alternatives

The #244 RFC measured seven options. Option 3 was the other candidate: 29% fewer blocks, but a block
would span segments, so the sim, the client block streamer and pacing would all need cross-segment block
ownership.

### Affected

`packages/shared/src/sim/{merge-blocks,track}.ts` · `sim/pocket.test.ts` (scan floor 1,000 → 300: the
merge removes most pockets it scanned).

---

## ADR-020 — The track is a score: notes first, then geometry

**Date:** 2026-09-24 · **Status:** Accepted (owner approved every recommendation of the R4 RFC rev 2, via slur-supervisor) · **Partially supersedes:** ADR-006 §1 ("never a rhythm game (no discrete notes…)") and ADR-006 §2 (the weave micro layer), for `gen: 'score'` tracks only · **RFC:** `.claude/phases/2026-09-24-r4-score-rfc.md`

### Decision

1. A `'score'` track is generated from a score of notes: `L`/`R` (1 or 2 cells), a held strafe, `J`, `JJ`, `S` (smash), accents and rests. The geometry that forces each note comes second. The sim stays continuous (GDD §0 unchanged).
2. **Register gap.** After every note the player gets `REGISTER_GAP_S` = 0.5 s of calm, measured at `TRACK_CONTRACT.registerCruise` = 124u/s. The calm is counted from the end of the move (settled or landed). Note spacing = `registerCruise × (noteMove + REGISTER_GAP_S)`. `noteMove` is measured for the contract ship with a `simulate()` pilot.
3. `registerCruise` is frozen in `TRACK_CONTRACT`. A roster guard rejects any class faster than it. `FRACTURE_SHADOW_Z` uses it instead of a roster max.
4. Each note has a duration rounded up to `SEG_LEN`: L1 120u, L2 140u, J 140u, JJ 220u, rest 60u.
5. Forcing: a score-steered band (today's corridor band centred on the score line) plus pinch gates on accent notes. Filler that asks for no input: band walls, off-line harmony blocks, and pickups as optional ornaments.
6. Motifs are data: TypeScript objects that hold note strings, validated at module load. The first library is seeded from transcribed n-grams of today's tracks, and the owner edits it.
7. Old seeds are kept: `ProcgenDescriptor.gen?: 'weave' | 'score'`, default `'weave'`.
8. #246 and #248 fold in. The `simulate()` pilot becomes the flyability check. On `'score'` tracks, `sealShadowed` must leave every block unchanged, and a test checks that.

### Consequences

- A track holds ~28–56 notes. The class difference is the length of the calm (Freighter 0.61–0.76 s, Interceptor 1.15–1.47 s). No class slows down for a note.
- Set from S0 data (#250, c24f2bb) by the owner: adherence floor **75%** (the easiest route plays ≥ 75% of the score's notes), accents **100%**; calm tube **±5u** (hull 2u + 3u of measured drift). Today's weave tracks measure 37% adherence, and 54% of their notes breach the register gap.

### Amendment — `JJ` is exempt from "no two gaps in a row" (owner ruling, 2026-09-24)

- ADR-006 *Fairness* says: *"gaps ≤ `GAP-REACH`, no two in a row."* On `'score'` tracks a `JJ` note is two adjacent hole segments (40u). So the rule does not hold by construction. This amendment replaces the earlier claim that it did.
- Ruling (owner, via slur-supervisor): on `'score'` tracks only, two holes in a row are allowed when they are one `JJ` note. Three or more holes in a row are never allowed. `'weave'` tracks keep the ADR-006 rule.
- Tests: `sim/track.test.ts` "weave: no two gaps in a row and none in start-safe" runs on `gen: 'weave'` only. `sim/track-gen.test.ts` "score: the only two gaps in a row are a JJ, never three, none in start-safe" runs on standard `'score'` tracks and on a test library with `JJ`. The standard motif library has no `JJ` today (0 of 200 seeds), so only the test library exercises the exemption.

## ADR-021 — Grounded sci-fi audio: sampled engine, Freesound cues, Ogg Opus

**Date:** 2026-09-26 · **Status:** Accepted (owner picks on #267, comment 5843537599; the five build answers approved via slur-supervisor) · **Supersedes:** `docs/AUDIO.md` §8 item 1 (Neon Laser Horizon, "the SFX layer is zero-attribution") and the synthesized engine hum · **Issue:** #267 (supersedes the cartoon direction of #260)

### Decision

1. **Direction.** Sounds are grounded sci-fi, not cartoon. CC0, CC-BY and CC-BY-SA are accepted. Every CC-BY/SA asset has a required-attribution block in `CREDITS.md` and `apps/client/public/audio/CREDITS.md`.
2. **Format.** New cues ship as Ogg Opus (SFX mono 64 kbps, music stereo 96 kbps). Safari decodes Ogg Opus from 18.4 on ([WebKit Features in Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)). The local ffmpeg has libopus and no libvorbis.
3. **Engine.** One sampled loop (`hover_engine.ogg`, 6.0 s, seam crossfaded) replaces the oscillator hum for every class. Speed `v` in 0–1 drives rate = lerp(0.7, 1.4, v) × pitch, lowpass cutoff = lerp(600, 6000, v) × bright, gain = lerp(0.25, 0.6, v). Per-class `pitch`/`bright` live in client data (`app/audio/engine-voice.ts`), not in `@slur/shared`: interceptor 1.15/1.2, fighter 1.0/1.0, comet 1.08/1.1, phantom 0.95/0.7, freighter 0.78/0.8. Remote ships use the same loop through a `PositionalAudio` filter, with speed taken from their interpolated position.
4. **Cues and hooks.** Bolt fire plays three shots round-robin. Seeker launch, lock (a loop, then a "locked" tone on `committed`), seeker hit and mine burst bind to room state and messages. Jump, double jump (rate 1.12), land (gain from fall speed), brake and pass-by come from a pure edge detector (`app/audio/movement-edges.ts`) that reads the local predicted `Sim` and the input sources without `currentInput()`, which bumps the input sequence. Boost is loaded but unbound until a boost mechanic exists (GDD §5.1).
5. **Music.** The in-run track is Technodono's *Vector Racing* hard loop (CC-BY-SA 4.0). The lobby track is unchanged.

### Consequences

- The retired files are `laser_fire`, `hit_impact`, `boost`, `engine_loop` (Kenney) and `neon_laser_horizon.mp3`. The other Kenney cues stay until their events are chosen (16 events are open on #267).
- Cuts come from the Freesound 128 kbps previews (#267 Q4 open). Cut points and gains are in the #267 thread and `CREDITS.md`.

## ADR-022 — The Portal pickup: BC4 teleport inside the shared simulate()

**Date:** 2026-09-26 · **Status:** Accepted (owner approved the 8 proposals on #289; the loop rule kept, GDD §10 question 8) · **Issue:** #289 · **Rules:** `docs/GDD.md` §5.3 "Portal"

### Decision

1. **Pickup, not level data.** GDD §5.7 listed Teleports as *"Paired portals (level data)"*. The Portal is a pickup instead: a racer places both ends. It is 2 of every 20 pickups (`PORTAL_RATIO` = 0.1).
2. **The hop is sim, not an event.** `hopThroughPortal()` (`packages/shared/src/combat/portal.ts`) runs inside `simulate()` over `SimWorld.portals`. The server runs it for authority. The client runs it in prediction and replays it on reconcile. A hop moves x, y and z in one tick. This is BC4, and it is now LIVE.
3. **Portals are server state.** `RunState.portals` holds one pair per owner. The client mirrors it into `blockWorld.portals`, the same world prediction reads. Placement, the clear-spot search, arming and expiry are server-only (`run/portal-run.ts`).
4. **A hop counter carries the discontinuity.** The ship has `portalHops` (8-bit, wraps). A changed count tells each consumer to snap, not to lerp: the local render sets `Prev`, remote interpolation holds across the hop (`Snapshot.hops`), and the spectator camera snaps on a jump over 12u.
5. **Tap near, double tap far.** A second tap of the same slot and direction within 15 input ticks throws the end just placed 1 s of top cruise away. The server decides the double tap from input sequence numbers, not from wall time.
6. **Messages are cosmetic.** `portalHop` and `portalFizzle` drive sparks, the fizzle shock and audio only. A client that misses one still has the right position.

### Consequences

- Any later teleport, blink or grapple reuses the same path: a pure step in `simulate()` plus a counter that tells render and interpolation to snap.
- Both ends are entries, so a chaser can loop until the pair expires (9 s). The owner keeps this for now (GDD §10 question 8). The candidate fixes are one throw-back per ship per pair, or a per-ship hop cooldown.
- A hop drops any seeker lock on the ship.
- The camera passes through the bright exit ring and the whole frame blooms orange for less than ~150 ms. The owner keeps this as the hop flash (2026-09-26). Do not dim the exit end or cap its pulse.
- **#329 amendment (2026-09-27): the ring is 10u across and 2u into the deck.** Owner values: `portalR` 5 and `portalY` 3. The catch is the ring's circle (#325). A ship on the deck (y 0.8) gets a chord of 8.98u. The top of the catch is ship y 7.2. A single jump catches for all classes. A Comet double jump catches at any timing (apex 6.69). For the other classes, a double jump catches only when the ship crosses the ring below 7.2. The clear window grows to hold the exit hull and the rim: `portalClearHalfL` = R + `portalExitGap` + 2 × the largest halfL (11.5), `portalClearW` = 2 × (R + 1) = 12. On 30 phrase seeds, the placement-null rate changes from 0.69% / 0.76% to 1.64% / 1.52% (Comet / Freighter). The ring band and depth scale with `portalR`. The feet are removed.

## ADR-023 — One phrase generator: weave, motifs, arenas and set pieces in three acts

**Date:** 2026-09-26 · **Status:** Proposed (owner approved the RFC with amendments, via slur-supervisor; S1 built in `8a4f1dd`, S2 built in `0ae9967` and `b90f436`, S3 built in `4ca02e7`, derived pitch built in `afcc66c`, S4–S7 not built) · **Issue:** #300 (absorbs #292) · **RFC:** `.claude/phases/2026-09-26-unified-generator-rfc.md`

### Decision

1. A new `TrackGen` `'phrase'` builds the track as a chain of phrases: weave `W`, motif `M` (teach → repeat → twist), arena `A`, set piece `S`, rest. Code: `packages/shared/src/sim/phrase/`.
2. **Length is data.** `TRACK_GEN_SEGMENTS` sets the fallback descriptor length per gen: `phrase` 600 (12,000u), the others 400. No code assumes a length: `sectionCount()` derives the number of sections from `descriptor.length`. Since `afcc66c`, `phraseSegments(seed)` sets the `phrase` length per seed (see *Derived pitch* below).
3. A section is `A · M-teach · M-repeat · S · W · M-twist · rest`. The sections split into three acts (low, mid, high). The last 300u is an arena (the finish sprint).
4. Motif phrases reuse groove's placement (`placeObstacles`, `segmentOf`) without changing its output. Arenas and rests hold no obstacles.
5. The weave phrase lane width is the difficulty dial, 20/16/14u by act (RFC §1.3). A lane is straight, with sealed walls and a post slalom inside it (S3). A `W` slot can hold two lanes side by side (the parallel weave, RFC §2.3).
6. Set pieces (RFC §4) must be flyable without their power. Each has one forced pickup outside the 20-pickup bag, and its id carries the power (RFC §6.3).
7. `weave` and `score` stay behind `?gen=` until `'phrase'` is the default and the owner has played it (S7).
8. **Obstacle spacing comes from ship physics** (owner rule, 2026-09-26). Slalom posts and motif gates are spaced by a measured lead distance, never a fixed pitch (see *Derived pitch* below).

### Consequences

- The `weave` and `groove` digests stay frozen. `phrase` has its own frozen row.
- S1 (built): the `S` slot is an arena and the `W` slot is a motif phrase. Measured on seeds 1–30 at 600 segments: every groove open-space target holds, every arena is fully open, and 5 classes finish with 0 deaths (mean 99–144 s).
- A longer track needs the race-end change (#301, grace 45 s, no 180 s cap) before `'phrase'` becomes the default.
- S1 cost at 600 segments (measured 2026-09-27, headless Chrome at DPR 1, `/test-level` seed 20260921, two loads each). Draw calls: 127 for `phrase` and 127 for `groove` at 420 segments. JS per frame: 1.3–1.4 ms for both. First scene frame: 1.5 s for `phrase` and 1.6–2.0 s for `groove`. Long tasks: the same for both. In Node, `resolveTrack` plus a walk of every segment takes 2.3 ms for `phrase` and 2.2 ms for `groove`. The longer track adds no draw calls and no measurable build time.
- S2 sizing (owner ruling 2026-09-27, option A): every act uses 3-note motifs. Difficulty rises through the twist (act 1 mirror; acts 2–3 mirror or one note swap; the last section replays the act 1 motif mirrored as a callback), the weave band and the set pieces. Motif notes sit on a half-beat grid: each note gets its move time plus the 0.5 s register calm at 124u/s, rounded up to half a beat. A 3-note motif phrase is 476–536u, so a section is 2,204–2,372u. The section count is the largest count that fits the length: 5 at 600 segments (acts low, low, mid, mid, high) on seeds 1–30. Longer motifs (4 notes ≈ 655u, 5 notes ≈ 833u) would break the ≤ 1,200u open-stretch target, because teach and repeat sit between two arenas.
- S2 acceptance (measured 2026-09-27). With the S2-part-1 gate posts, adherence on motif notes was 0.000 on seeds 1–30. The deck is 96u wide, so the easiest route held x = 22.5 past the 8u posts and 16u holes. Three changes force the line:
  - **Pin:** a 4u-deep wall just before each lateral onset. It runs from `from ± SCORE_PIN_HALF` (2.5u) to the deck edge on the move side, so the route cannot move early. This is the ADR-020 score-generator pin.
  - **Gate:** the near wall runs from the far deck edge to `to ∓ 2.5u`. The far post starts at `MIN_LANE − 2.5u`, so the door stays ≥ 8u. A gate ends before the next note's pin.
  - **Holes:** `J` and `JJ` holes span the full deck width.

  Result: adherence 1.000 (1,350/1,350 notes) on seeds 1–30. A line pilot (motif line on motif phrases, avoid pilot elsewhere) is no slower than the avoid pilot on 5 classes × seeds 1–5 and 17. It was faster in all 30 runs of the measurement, with 0 deaths; `phrase.test.ts` asserts ≤. The avoid pilot finishes all 30 runs with 0 deaths, but the Freighter takes 19–23 pin bumps per run (about 25% slower). The owner will decide this after a playtest. A pure groove-line pilot is still up to 66 ticks slower in the `weave` slot, which is S3 scope.
- **Departures from the RFC (S2).** (1) RFC §3.2 says *"`J` — A hole under the line, width 16–32u"*. Motif holes now span the full deck width, because the route goes round a 16u hole. (2) RFC §3.3 says *"posts on **both** sides of the line (a gate)"*. The near side is now a wall to the deck edge, plus a one-sided pin before the onset. A 1-cell step cannot be forced otherwise: the pacing hull is 4u wide, so two 8u doors 4u apart share a lane. (3) The phrase open-space measure counts a slice with no floor across the whole deck as open deck. A full-width hole is a jump, not a narrow lane. This is an early part of the S3 per-kind exemptions.
- Open: per-kind open-space exemptions for `W` and chokes (RFC §5.3) arrive with S3/S4.

### Amendment — S3 weave lanes and derived pitch (owner rulings via slur-supervisor, 2026-09-27)

**S3 weave (`4ca02e7`).** The owner dropped the curved `weaveRaw` corridor. A weave lane is straight, with sealed walls on both sides, 20/16/14u wide by act. A post slalom inside the lane forces the weave: posts are 4u long and leave an 8u gap (`MIN_LANE`). A parallel weave is two straight lanes, each with its own slalom, split by a hole strip or a wall divider. The avoid pilot now checks its lateral path densely against open runs, so a sidestep at low `vz` does not cross a hole or a divider.

**Derived pitch (`afcc66c`).** The first S3 build used a fixed pitch keyed by lane width (`WEAVE_PITCH` 20u: 52u, 16u: 36u, 14u: 24u). The posts stacked into one dark mass and the next gap could not be read. The owner ruled that spacing must come from ship physics. Code: `packages/shared/src/sim/phrase/pitch.ts`.

- Lead distance for one class: `ACT_SPEED × maxCruise × (REACTION_S + crossSeconds) + 2 × halfL`. `REACTION_S` = 0.3 s. `ACT_SPEED` = 1.0 / 0.9 / 0.75 for acts low / mid / high.
- `crossSeconds` flies the real `simulate()` with the kick-aware `strafeToward` until `isSettled` holds. It is measured, not a formula.
- `leadDistance(act, dx)` takes the maximum over the 5 classes and rounds up to `CELL`.
- Weave pitch = post 4u + `leadDistance(act, lane − 8u)`. The end margin before the weave end is one post (it was one pitch).
- Motif gate start = pin + `leadDistance(|to − from|)`. `noteBeats` spaces step and held notes by the lead. A motif after a weave gets a lead-in of `leadDistance(act, max |lane centre − x0|)`.
- `phraseSegments(seed)` sets the length: 5 sections at minimum length, each with a full 480u weave.

Measured 2026-09-27 at `afcc66c`. These numbers are before #305. See *Re-measured after #305* below for the current values. Lead (u) by lateral offset:

| | 4u | 6u | 8u | 12u |
|---|---|---|---|---|
| Lead, act 1 (low) | 120 | 128 | 132 | 148 |
| Lead, act 2 (mid) | 108 | 116 | 120 | 136 |
| Lead, act 3 (high) | 92 | 96 | 100 | 112 |

| Weave pitch | 20u lane | 16u lane | 14u lane |
|---|---|---|---|
| Act 1 | 152 | 136 | 132 |
| Act 2 | 140 | 124 | 120 |
| Act 3 | 116 | 104 | 100 |

- Posts per lane: 2 (20u), 3 (16u), 3 (14u). With the fixed pitch: 2.4, 4.2 and 7.2.
- Length: 744–768 segments (14,880–15,360u). Always 5 sections: acts low, low, mid, mid, high.
- Flight, 5 classes × seeds 1–30: the avoid pilot and the line pilot both have 0 bumps, 0 deaths and 30/30 finishes. With the fixed pitch, the Freighter took 792 bumps (avoid) and 211 (line).
- Mean speed (avoid pilot, u/s): Interceptor 83.7, Fighter 95.5, Phantom 89.5, Comet 111.3, Freighter 121.7. Every class holds 97–99% of its cap.

**Departures from the RFC and from ADR-023 as first written:**

1. RFC §2.1 says the weave is *"Sealed walls both sides of a band on `weaveRaw`"*, and RFC §2.3 says *"Each band follows its own `weaveRaw` line"*. The lanes are now straight, and a post slalom replaces the curve.
2. The S3 build keyed the slalom pitch by lane width (`WEAVE_PITCH`). The derived pitch replaces that table.
3. The owner rule names four terms: speed while reacting, the cross, the settle and the hull. The build adds the post length (4u) on top of the lead in the weave pitch.
4. Decision 2 and RFC Q1 say *"12,000u (600 segments) to start"*. The `phrase` length is now per seed, 744–768 segments on seeds 1–30. 600 stays only as the fallback in `TRACK_GEN_SEGMENTS`. Scripts must call `phraseSegments(seed)`.
5. The S3 build measured a class split on narrow lanes (14u: Interceptor 84, Fighter 80, Comet 72, Phantom 72, Freighter 60). The derived pitch removes it: the weave no longer splits class speeds. The owner accepted this. Whether class identity needs another lever is an open owner question.

**Re-measured after #305 (`b6e3372`, 2026-09-27).** #305 makes the strafe kick move a fixed 4u step for each press. This changes `crossSeconds`, so the lead and the weave pitch change. The code and the formula are unchanged.

| Lead (u) | 4u | 6u | 8u | 12u |
|---|---|---|---|---|
| Act 1 (low) | 120 (120) | 120 (128) | 140 (132) | 136 (148) |
| Act 2 (mid) | 108 (108) | 108 (116) | 128 (120) | 120 (136) |
| Act 3 (high) | 92 (92) | 88 (96) | 108 (100) | 104 (112) |

| Weave pitch (u) | 20u lane | 16u lane | 14u lane |
|---|---|---|---|
| Act 1 | 140 (152) | 144 (136) | 124 (132) |
| Act 2 | 124 (140) | 132 (124) | 112 (120) |
| Act 3 | 108 (116) | 112 (104) | 92 (100) |

The value in brackets is the value at `afcc66c`.

- The lead no longer rises with the offset. An 8u offset now needs a longer lead than a 12u offset, and a 6u offset needs the same lead as a 4u offset (or less). So a 16u lane (8u offset) has a longer pitch than a 20u lane (12u offset).
- Posts per lane, in weaves of 464–480u on seeds 1–30: single lanes 20u (act 1) 2, 16u (act 2) 2–3 (mean 2.2), 14u (act 3) 4. Parallel lanes: act 2 20u 3, 16u 2–3; act 3 16u 3, 14u 4. At `afcc66c`: 2, 3 and 3 for single lanes.
- Length: 744–766 segments (at `afcc66c`: 744–768). Always 5 sections.
- Flight, 5 classes × seeds 1–30: no change. The avoid pilot and the line pilot both have 0 bumps, 0 deaths and 30/30 finishes. Mean speed (avoid pilot, u/s): Interceptor 83.7, Fighter 95.5, Phantom 89.5, Comet 111.3, Freighter 121.7 (line pilot 121.9). This is 98.2–99.6% of each class's cap.
- `pnpm test` (shared) at `b6e3372`: 521/521 pass.

### Amendment — no weave funnel; the run-up comes from physics (#327, owner ruling 2026-09-27)

The weave entry and exit narrowed over a 40u funnel (`WEAVE_FUNNEL`). The sim has only boxes, so each 4u row got its own box and the funnel drew as a 1u staircase. The owner chose **B: no funnel**. Each lane wall now starts as one straight face across the track at the weave start, and ends the same way.

- **Run-up.** `weaveRunUp(spec)` is the open deck that a weave needs before its face. For each class, a ship starts settled at either deck edge (`±(HALF_WIDTH − halfW)`) and moves to the centre of the nearest lane. The time comes from the real `simulate()` (`crossSeconds` with a start position). Run-up = `ACT_SPEED × maxCruise × (REACTION_S + cross) + 2 × halfL`, the maximum over the 5 classes, rounded up to `CELL`.
- **Plan.** The `set` arena before each weave is `max(PHRASE_ARENA_LEN, weaveRunUp)`. Every run-up is shorter than 280u, so no phrase length changes.

| Run-up (u) | single lane | parallel lanes |
|---|---|---|
| Act 1 (low), 20u | 220 | — |
| Act 2 (mid), 16u / 20+16u | 200 | 180 |
| Act 3 (high), 14u / 16+14u | 168 | 156–160 |

- The posts now run the full weave, so a lane has about one more post. Posts per lane, seeds 1–30: act 1 3, act 2 3, act 3 14u lane 5 and 16u lane 4.
- Weave obstacles on the 5 digest seeds: 1263 → 164. All obstacles: 1730 → 631.
- Flight. A pilot that starts at either deck edge or the centre, and lines up only within the run-up, has 0 bumps and 0 deaths in every lane shape, for 5 classes at act speed (`weave.test.ts`). At 25% of the run-up, 28 of 30 flights bump or die. On phrase seeds 1–30, a band pilot (lane line from the run-up start, avoid pilot elsewhere) has 0 bumps and 0 deaths in weaves for all classes. It has 1 Freighter bump in a twist motif (seed 4, z 8241), and that bump is also present at HEAD `d48a5e4`.

## ADR-024 — 4u fixed-distance strafe step

**Date:** 2026-09-27 · **Status:** Accepted (owner flew it on `/test-level` and approved it, 2026-09-27) · **Supersedes:** the #256 speed-floor kick · **Issue:** #305 · **Built in:** `b6e3372`

### Context

The #256 kick set the lateral speed to at least `strafeKick`, and `strafeAccel` added to it on every held tick. So the distance of a tap followed the tap length. Measured at 60 Hz: a 1-tick tap moved 1.6–2.4u, and a 133 ms tap moved 8.3–10.9u. A human tap lasts 50–130 ms, so one tap moved 3u to 11u. A player could not place the ship on a lane.

### Options

- **A. Retune only.** Set `strafeKick = 4 × strafeDamp` and keep the speed floor. A 1-tick tap moves 4u. A 100 ms tap moves much more (inferred ~15u), because accel still adds to it. It has no state and no schema change.
- **B. Fixed-distance step.** A press starts a step that carries the ship exactly 4u. The ship keeps the step state.

### Decision

1. **B.** Each press moves the ship `kickDistance` (4u, one `CELL`) at `strafeKick`, for every class. The step lasts one kick window, `kickDistance / strafeKick`: 80 ms (Interceptor) to 121 ms (Freighter).
2. **Stop dead on release.** A tap shorter than the window still moves exactly 4u. Then `vx` goes to 0. The ship does not coast past the step.
3. **Hold.** A press held past the window leaves the step at `strafeKick`, and the ramp at `strafeAccel` takes over.
4. **Repeat and reverse.** A second press in the same direction adds 4u. A press in the other direction starts a new step. A ship that already moves faster than `strafeKick` in the press direction gets no step. A stun, a death or a respawn cancels the step.
5. **Analog threshold.** Any strafe past `STRAFE_PRESS` (0.5) is a press and gives the full 4u. A touch pad and a stick give the same step as a key.
6. **No step for a towed ship.** The tow scales strafe by `TOW_STRAFE_SCALE` (0.3). That is below the threshold, so a towed ship keeps the proportional ramp.
7. **A stays the fallback, by config only.** `kickDistance: 0` for a class in `ship-classes.ts` restores the speed-floor kick. Option A then needs only the `strafeKick` retune. There is no code change.

### Consequences

- Tap travel (u) after `b6e3372`, for taps of 1 tick, 50, 83, 100 and 133 ms: 4.00 on every class up to the class window. Past the window the travel grows: Interceptor 4.00 / 4.00 / 4.92 / 5.95 / 8.31, Freighter 4.00 / 4.00 / 4.00 / 4.00 / 5.50. The full table for all five classes is in the `b6e3372` commit body.
- **Held-strafe lag.** A held strafe trails the #256 kick by about one kick window. At 200 / 300 ms: Interceptor 16.73 / 30.60u became 12.85 / 24.28u, Freighter 10.93 / 19.93u became 7.26 / 13.51u. The owner accepted this with B.
- The sim pilot (`strafeToward` in `pacing/pockets.ts`) caps its press at 0.99 × `STRAFE_PRESS` when the error is below `kickDistance`. So a fine correction ramps and does not commit a 4u step.
- **Phrase pacing moved.** The pacing lead (`leadDistance`) comes from pilot cross times, so the phrase digests were re-frozen in `b6e3372` (owner decision). The weave and groove digests did not change. The lead no longer rises with the lateral offset: an 8u offset needs more lead than a 12u offset, so a 16u lane has a longer pitch than a 20u lane. The re-measured lead, pitch, posts and length are in ADR-023, *Re-measured after #305* (`8d3abdb`).
- The track contract did not change. `TRACK_CONTRACT` has no kick term, and `rosterContractFailures` passes.
- The step is ship state (`kickLeft`, `kicking`, `strafeHeld`) and syncs for prediction and replay.

## ADR-025 — Private rooms by default, one public room

**Date:** 2026-09-28 · **Status:** Accepted (owner approved #340, 2026-09-28) · **Supersedes:** the live room list on `/` · **Issue:** #340 · **Built in:** `fcd917b`, `ad95630`, `6b89660`, plus the RunRoom wiring commit

### Context

The home screen listed every live room. On a hosted server, any stranger could see a room and join it. The game is for friends who send each other a link.

### Options

- **A. Keep the list, add a password.** Every host must set and share two things.
- **B. Private rooms with a short code.** A room is hidden. The code is the room id, so the link and the code are the same thing.
- **C. B plus one public room.** A player without friends online can still race.

### Decision

1. **C.** A new room is private. The server hides it from `LobbyRoom` with `setPrivate(true)`.
2. **The code is the room id.** It has 5 characters from `ROOM_CODE_ALPHABET` (`23456789BCDFGHJKMNPQRSTVWXYZ`: no vowels, no 0/1/O/I/L). That gives 28⁵ ≈ 17.2 M codes. `normalizeRoomCode` trims and upper-cases what the player types.
3. **One public room.** Quick play sends `joinOrCreate({ public: true })`. When a public room exists and a second public create arrives, `onCreate` throws 409, and the client says *"Quick play is full. Create a private room."*
4. **Wrong-code limit.** `FailedJoinLimit` allows 10 failed joins per IP per 60 s, then answers 429. There is no global ceiling (owner decision).
5. **`LobbyRoom` stays.** It now carries only the public room, for the live count and phase beside Quick play.

### Consequences

- `joinById` ignores the private flag, so a code and a link both join. `joinOrCreate` skips private and locked rooms. Verified in `@colyseus/core` 0.17.47.
- A bad-shape code fails on the client and never reaches the server.
- Error codes reach the SDK as `MatchMakeError.code`: 522 = no room (the message holds `locked` when the room is full), 429 = too many wrong codes, 409 = public slot taken.

## ADR-026 — Public-server limits: room cap, per-IP quota, message caps, deploy from pushed code

**Date:** 2026-09-28 · **Status:** Accepted (owner approved the numbers for #339, 2026-09-28) · **Issue:** #339 · **Built in:** `fda4814` (server), `e8bb786` (client), plus the deploy.sh commit

### Context

The server runs on one public droplet (s-1vcpu-1gb). Before #339 any client could create rooms without limit, send messages without limit, and send a frame up to the transport default of 4 KiB (`@colyseus/ws-transport` `WebSocketTransport.mjs:19`). A throwing message handler could end the process. `deploy.sh` built from the working tree, so a peer's uncommitted edit could ship.

### Measurements

- **CPU per room.** Node bots at 30 Hz × 2 inputs, groove track, tsx dev, on an M1 Pro. Server CPU: 1 room 4.4%, 4 rooms 9.6%, 8 rooms 10.8–11.8%, 16 rooms 18.0%, 24 rooms 23.5%. The slope is about 0.75% of one core per full room. RSS grew 14 MB for 24 rooms.
- **Droplet factor.** One droplet vCPU is about 3× slower than one M1 Pro core [inferred]. Combat and phrase tracks add about 2× [guessed]. That gives about 4.5% per room.
- **Message sizes (msgpackr).** Keyboard / touch inputs: 2 → 104 / 152 B, 10 → 448 / 688 B, 20 → 880 / 1360 B. 60 touch inputs → 4040 B. The largest chat message is 429 B after the server slices it (569 B before).

### Decision

1. **Room cap.** `MAX_ROOMS` = 12. `RunRoom.onCreate` checks it, and the matchmake gate checks it before a seat is reserved. A full server answers `SERVER_FULL_CODE` (503).
2. **Per-IP quota.** One address may own 3 live rooms (`MAX_LIVE_ROOMS_PER_IP`) and create 10 rooms in 10 min (`MAX_CREATES_PER_WINDOW`, `CREATE_WINDOW_MS`). Past either limit the server answers `CREATE_LIMIT_CODE` (430). The gate is `create-quota.ts`, appended to `installMatchmakeGuard([ new FailedJoinLimit(), createQuota ])`.
3. **Owner address.** `RunRoom.onAuth` records the owner IP when the creator joins. Until then the create holds a pending slot for `SEAT_RESERVATION_SECONDS` (15 s). `onDispose` frees the slot. The WS auth context reads `x-real-ip` first, and the HTTP matchmake reads `X-Forwarded-For`. Behind Traefik both give the client address [inferred].
4. **Message rate.** `maxMessagesPerSecond` = 60. The installed rule is a fixed window, from `@colyseus/core` 0.17.47 `Room.mjs:970–975`:

   > *`if (this.clock.currentTime - client._lastMessageTime >= 1e3) { client._numMessagesLastSecond = 0; … } else if (++client._numMessagesLastSecond > this.maxMessagesPerSecond) { … this.#_forciblyCloseClient(client, CloseCode.WITH_ERROR); }`*

   The count resets 1 s after the message that opened the window. A client over the limit is closed, not throttled. A normal client sends 30 input messages per second.
5. **Payload cap.** The ws `maxPayload` is 2 KiB (`MAX_PAYLOAD_BYTES`), not the 4 KiB default.
6. **Input chunks.** The client sends the newest `MAX_QUEUED_INPUTS` (120) inputs, at most 20 per message (`net/input-chunks.ts`). 20 touch inputs are 1360 B, so a legal client never reaches the 2 KiB cap.
7. **Exception guard.** `RunRoom.onUncaughtException` logs `room.error`. A throwing handler no longer ends the process.
8. **Join name.** `RunSim.join` accepts only a string name. The other inputs (`sanitizeInputs`, `enqueueFire`, `isSlot`, `isShipId`, `isColorId`, chat `post`) already checked type and range.
9. **Deploy from pushed code only.** `scripts/deploy.sh` refuses to run when a tracked file differs from `HEAD`, or when `HEAD` is not on `origin/dev`. It builds from `git archive HEAD` in a temp directory, so an untracked or ignored file cannot ship. `git archive` applies the LFS smudge filter, so the models arrive as content (verified on `bob.gltf`). The script checks SSH first, and never writes `/opt/slur/docker-compose.yml`: the droplet owns that file (it holds the `/metrics` basic-auth hash). Only the owner deploys.

### Consequences

- 12 rooms × 4.5% ≈ 54% of one droplet core. The rest is headroom for Traefik, the OS and spikes.
- An unknown message type closes the client in production (`Room.mjs:94–101`). This was the behaviour before #339.
- In dev and tests the HTTP address is `unknown`. So pending creates share one key and expire after 15 s.
- The flood test takes 20 s: the dropped flooder holds a reconnection seat for `RECONNECT_SECONDS` (20).
- A dirty shared tree blocks a deploy. The owner deploys when every worker has committed.

## ADR-027 — A race always ends: stall rule, course-scaled cap, host End race

**Date:** 2026-09-28 · **Status:** Accepted (owner approved A+B+C for #341, 2026-09-28) · **Amends:** #301 ("no race time cap") · **Issue:** #341 · **Built in:** `26cc118` (shared helpers), plus the RunSim and client commit

### Context

Since #301 a race ends only when every racer finishes, 45 s after the first finisher, or when no racers remain. A connected racer who is AFK or wedged before anyone finishes keeps the room racing forever. The host has no control mid-race. On a public server this holds a room against the room cap.

### Options

- **A. Stall rule.** A racer with no new best z for N s counts as done.
- **B. Cap scaled from course length.** #301 removed the fixed 180 s cap because tracks grow. A cap from `finishZ` grows with the track.
- **C. Host "End race".** Gives control to the host. It needs an attentive host, and the host can be the AFK racer.
- **D. Grace timer after the first drop-out.** Rejected. A dropped racer already leaves after `RECONNECT_SECONDS` (20 s).

### Decision

1. **A + B + C.**
2. **Stall:** `STALL_SECONDS` = 30. The HUD warns from `STALL_WARN_SECONDS` = 20. The rule is reversible: a new best z clears it. A stalled racer keeps flying and stays DNF unless they finish.
3. **Cap:** `raceCapSeconds(finishZ)` = `RACE_CAP_FACTOR` (3) × `finishZ` ÷ `SLOWEST_CRUISE` (84 u/s). That gives 286 s on an 8,000u track and ≤ 546 s on a phrase track (≤ 15,300u).
4. **End race:** `END_RACE_MESSAGE`. It is valid for the host in countdown or racing. The client asks for a second click ("End for all?").

### Why these numbers

- No auto-cruise: with no throttle, `coastDrag` 40 u/s² stops a 124 u/s ship in ≤ 3.1 s. So an AFK racer and a wedged racer both stop making a new best z.
- A death costs about 2 s (`respawnDelay` 1 s + 12u setback at `respawnVz` 20). So 30 s allows about 15 retries at one obstacle.
- Clean runs on 8,000u take 65–95 s. A 286 s cap never cuts a racer who keeps moving.

### Consequences

- `PlayerState` appends `progressAt` (float32, synced). `bestZ` is undecorated and stays on the server.
- The HUD shows "Race ends M:SS" once the grace deadline is set, or in the last 60 s before the cap. The grace countdown was not visible before this change.
- The roster dims a stalled racer and tags it IDLE. The results screen shows DNF, as before.
- `RunState` appends `raceCap` (float32, synced). `RunSim` sets it once from the track. The client reads the cap from state and does not compute it.
- `RunSimOptions.raceLimits` (default true). When it is false, `raceCap` is 0, and the stall rule and the cap do not apply. `/test-level` sets it to false, because the owner idles there.
- `spawnAt` resets `bestZ` and `progressAt`. A teleport does not count as a stall or as progress.

## ADR-028 — Host kick with a browser-token block; server-side word filter

**Date:** 2026-09-28 · **Status:** Accepted (owner approved D1 = C, D2 = B, D3 = A for #342, 2026-09-28) · **Issue:** #342 · **Built in:** the #342 commit

### Context

Rooms are public on the web (ADR-025, ADR-026). A host had no way to remove a player, and chat and call signs had no word filter. Players are anonymous: each connection has its own `sessionId`.

### Options

- **Rejoin block (D1).** A: no block. B: IP block for the room's life; it blocks a whole office behind one NAT address. **C: a random token per browser, blocked for the room's life.** D: C with a 10-minute expiry. E: a room lock.
- **Kick phases (D2).** A: lobby only. **B: lobby, countdown and results.** C: every phase.
- **Word list (D3).** **A: `obscenity` npm.** B: `bad-words` npm. C: the LDNOOBW list with our own normaliser. D: a hand-written list. E: no filter.

### Decision

1. **Kick.** The host sends `KICK_MESSAGE` with the target `sessionId`. The server accepts it only from the host, never for the host itself, and only in `KICK_PHASES` (lobby, countdown, finished). It sends `KICKED_MESSAGE` to the target, then closes it with `CloseCode.CONSENTED` (4000).
2. **Why 4000.** `@colyseus/core` 0.17.47 `Room.mjs:1043` reads *`const method = code === CloseCode.CONSENTED || client.state === ClientState.RECONNECTING ? this.onLeave : this.onDrop || this.onLeave;`*. Any other code goes to our `onDrop`, which holds a reconnection seat for 20 s. The kicked player would come back on their own.
3. **Rejoin block (C).** The client keeps a random 128-bit token in `localStorage` (`slur.joinToken.v1`) and sends it in every join. It uses `crypto.getRandomValues`, because a LAN host on plain HTTP has no `crypto.randomUUID`. `RunRoom.onAuth` refuses a kicked token with `KICKED_CODE` (403). The SDK wraps it as `MatchMakeError` 403 (`@colyseus/sdk` 0.17.43 `Client.mjs:238`), so the menu and a link join both say *"The host removed you from that run."* A private window or cleared site data gets past the block. That is accepted: a kick is not a ban.
4. **Chat purge.** A kick deletes the kicked player's lines from the history, then broadcasts `CHAT_HISTORY_MESSAGE`. The client replaces its whole list with the history, so the lines go on every screen.
5. **Word filter (A).** `obscenity` 0.4.6 (MIT, no dependencies). It runs only on the server (`apps/server/src/moderation/profanity.ts`), so the client bundle does not grow. It uses `englishDataset` (119 patterns and 66 whitelist terms, measured) with `englishRecommendedTransformers` (leet, confusables, repeated letters). `GAME_WORDS` (`slur`, `cockpit`, `cockpits`) adds to the whitelist. The dataset flagged "cockpit" before that.
6. **Chat masks, names fall back.** The server masks a chat match with `*`, and the line still posts. A call sign with a match becomes 'Racer'. Names and chat lose `\p{Cc}` and `\p{Cf}` first, so a zero-width character cannot split a word.

### Consequences

- The kick button is on the lobby roster only, because the roster renders only in the lobby. The server accepts a kick in the countdown and on the results screen too.
- Known gaps, measured: spaced letters ("f u c k") pass, and "Dick Grayson" is masked. Stripping `\p{Cf}` splits emoji ZWJ sequences into their parts.
- Verified with two node clients on the dev server: a bad name joins as "Racer", "gg you sh1t" posts as "gg you ****", the kicked guest gets a 4000 close, its rejoin gets 403, and a new token joins.

## ADR-029 — Brighter track metal and a cool key light

**Date:** 2026-09-28 · **Status:** Accepted (owner approved option 6 for #345, 2026-09-28) · **Issue:** #345 · **Built in:** the #345 commit

### Context

The track read dark and uneven on every tier. All track metal is metalness 1 with base `#4a4d52`, so F0 ≈ 0.07. The metal reflects little of a dark sky, and no light faces the block fronts. Measured at spawn on `/test-level`, high tier: deck luma 15 under 30u, block fronts 14 (0–255 medians).

### Options

The plan listed eight. The measured ones: a hemisphere light or lower metalness alone (+3 to +4 luma). **Option 6: base F0 ≈ 0.2, metalness 1, a cool directional key.** Option 7: metalness 0.6, albedo ×2.5 and the same key. Option 7 was brighter (deck 57 near) but departs from the one-metal rule.

### Decision

1. `Metal.baseColor` is `#7b7f86`. Metalness stays 1.
2. Ship hulls keep `#4a4d52` on a new `Hull.baseColor` (owner: brighter track, not hulls).
3. `KeyLight` (`game/scene/key-light/key-light.tsx`): one `DirectionalLight`, `#cfd8e6`, intensity 2, from (10, 30, −20). World-fixed, no shadows. `KeyLight.*` dials on the panel.

### Consequences

- High tier: deck 15.2 → 43.5 near and 34.4 → 58.0 at 80–160u; block fronts 14.5 → 36.2. Low tier: deck 15.2 → 42.3; block fronts 5.9 → 30.8.
- No draw calls added (124 high, 47 low). GPU time unchanged within noise (high 9.5 ms both, uncapped 1600×900).
- Saved `Metal.baseColor` overrides reset once, because their stored `from` no longer matches the default.
- Details and departures: `ART_MATERIALS.md` §7 item 21.
- **Superseded in part by ADR-030:** the `KeyLight` is removed.

## ADR-030 — Image backdrop and a Poly Haven HDRI replace the procedural sky

**Date:** 2026-09-28 · **Status:** Accepted (owner request and answers, 2026-09-28) · **Issue:** #352 · **Built in:** the #352 commit

### Context

The owner asked for a simpler scene. The procedural nebula (#215) baked a sky cube, a light cube with a ground disc and a marigold band, and a probe for the rock key light. Two scene lights, `KeyLight` (ADR-029) and `NearFill`, sat on top of it.

### Decision

1. **Background:** `public/textures/nebula-backdrop.jpg` (1672×941, restored from before #215) is `scene.background`. It is cover-fitted to the viewport. It does not turn with the camera.
2. **Lighting:** a Poly Haven HDRI is `scene.environment` only. It is not the background. The default is `public/textures/hdri/cyclorama_hard_light_1k.hdr` (CC0; replaced `kloppenheim_02_puresky` in #362 by owner choice), self-hosted so production does not depend on Poly Haven.
3. **Dev panel:** the `Environment` folder has an `hdri` text field. A pasted `https://polyhaven.com/a/<slug>` link, a bare slug or a direct `.hdr` URL loads live. The link resolves through `https://api.polyhaven.com/files/<slug>` to `.hdri[res].hdr.url` on `dl.polyhaven.org`. Both hosts send `access-control-allow-origin: *` (verified 2026-09-28), so there is no proxy. `Environment.rotation` turns the HDRI.
4. **Resolution by tier:** low 1k, medium 1k, high 2k (`QualityProfile.hdriRes`). No 4k: the file is about 20 MB and PMREM uses 256 px faces.
5. **Loader:** three's `HDRLoader` in a module singleton (`game/scene/hdri/hdri.state.ts`). Not `RGBELoader` (deprecated since r180), and not drei `useEnvironment` (it uses the three-stdlib loader and suspends the scene on each swap). The renderer PMREM-converts the equirect texture itself.
6. **Removed:** the nebula sky and its baker, the drei star field, `KeyLight`, `NearFill`, the rock key term, and the `Sky.*`, `Env.*`, `KeyLight.*` and `NearFill.*` dials. The panel's `Tuning` folder (copy changed defaults, reset to schema) is removed too.

### Consequences

- The scene lights are the HDRI and the engine and VFX point lights. Track brightness now depends on `Environment.intensity` and the chosen HDRI. The owner tunes it on `/test-level` [unmeasured].
- The marigold band that the baked env gave to blocks, monoliths and ships is gone.
- The 1k default costs 1.4 MB. A pasted high-tier link costs about 6 MB.
- Details and departures: `ART_MATERIALS.md` §7 item 22.

## ADR-031 — Fake deck reflections: additive streaks under every glowing element

**Date:** 2026-09-29 · **Status:** Accepted (owner approved approach A+B+C for #354, 2026-09-28) · **Issue:** #354 · **Built in:** `3c576aa`, `668df76`, `f0562e7` · **Revised in:** `59aa760` (pickup clear box), `6cb1f36` + `7cb7e05` (seam profile and clearance)

### Context

The golden reference (`docs/art-direction/golden-reference/cruise-lighting.png`) looks good mainly because the glossy deck reflects every glowing thing. Our deck cannot. In three.js an emissive surface is not a light and is not in the environment map. `ART_MATERIALS.md` §7 measured the rail array's share of the deck highlight at *"0% rail array"*. Perf on low-end devices is the top problem, so the fix must cost almost nothing on every tier.

### Options

The owner rejected an emissive-only mirror pass, near-camera area lights, a planar reflector and SSR on cost. The owner chose fake streaks: **A** a rail sheen patched into the deck shader, **B** instanced streak quads for block seams, **C** the same quads for pickups and exhausts.

### Decision

1. **Rail sheen (A).** The deck material adds a marigold band near `±HALF_WIDTH` to `totalEmissiveRadiance` (`deck-reflection/rail-sheen.ts`, through `chainShaderPatch`). No draw call.
2. **Streak quads (B, C).** One shared `ShaderMaterial` (`deck-reflection/deck-reflection.ts`). Each emitter is one quad on the deck plane, `y + 0.015`. The quad points from the emitter base toward the camera. Its length is the mirror image of the emitter's height (`s = d·h / (eye + h)`), times `Reflect.stretch`, capped at `Reflect.length`. Blending is additive, `depthWrite` is off, and the output goes through tone mapping.
   - Block seams: one quad per seam slot, reading the sealed blocks' own `instanceMatrix` and seam attributes. Faces turned away from the camera draw nothing.
     - **Width and blur** (`6cb1f36`). The cross-profile is a Gaussian. Its sigma starts at half the seam width (`SEALED_BLOCK_SEAM_WIDTH` 0.14, so 0.07u) and grows with distance from the seam foot: `sigma = sigma0 + uReflBlur · (0.5 + Deck.roughness) · along`, with `uReflBlur` 0.01. The peak falls as `sqrt(sigma0 / sigma)`. The streak starts as wide as the seam and softens toward its tip, as a rough mirror does.
     - **Straight under the seam** (#365). The quad is wider at its tip than at its foot. A ±1 corner varying bends toward the quad's diagonal across the two triangles, so the glow leaned sideways: 1–7.7 px off the seam axis at `Reflect.blur` 0.01, and 3.9–8.5 px at 0.04. It leaned most when far, where the deck is foreshortened. The vertex shader now passes the along and lateral offsets in world units, and the fragment shader rebuilds sigma and width from them. Both are affine in world space, so perspective-correct interpolation is exact. After: under 1 px, and the axis matches the seam within 0.01°. The camera was not the cause: `cameraPosition` matched `camera.matrixWorld` within 1e-7 in both passes.
     - **Deck interaction** (#365). The fragment shader reads the deck's own maps at the streak's world point. The normal map shifts the profile sideways by `Reflect.warp · along · (n · side)`, so the streak frays over dents and brushed lines. The per-texel roughness sets the blur rate (mixed by `Reflect.roughMix`), and the peak falls as `sqrt(sigma0 / sigma)`, so rough plates spread the streak wider and dimmer. The albedo, relative to its top-mip mean, scales the streak by `Reflect.grime`, so grime and plate grooves break it. Defaults: warp 0.3, grime 0.8. Row-to-row texture along a close streak: 3.5 → 10.3 at grime 1, with the mean brightness held (226 → 235). A Schlick Fresnel term was planned and dropped. With the deck at `#232324` (F0 ≈ 0.017) it matches the existing `pow(1 − cosθ, grazing)` within about 2%, and the tint is neutral grey.
     - **Clearance** (`6cb1f36`, `7cb7e05`). Each seam gets the free deck distance along its face normal to the next standing block (`block-reflections.utils.ts`, `seamFree`). A seam inside a butt joint gets 0 and draws nothing. The streak stops where it meets the next block. `emitWindow` writes the values each frame into the `aSealedClear` attribute and reads the previous and next segments, so a joint across a segment edge counts.
   - Pickups: one quad per pickup anchor, a round spot at the pickup's mirror point. A taken pickup draws nothing.
     - **Clear box** (`59aa760`). Each pickup gets a box (x0, x1, z0, z1): the deck strip under it, extended back and forward to the nearest hole or crack. The box goes in the second instance-matrix column. The shader clips the spot's ray to the box. A z-only extent was not sufficient: lengthwise cracks (seed 1, x −4…4) cut the strip.
   - Exhausts: share `ExhaustField`'s instance buffers. A ship with no floor under it draws nothing.
3. **Look.** Brightness falls with distance (`fadeNear` 40 → `fadeFar` 220), rises at grazing angles and follows the deck roughness map, so worn plates break the streak. Colour is the marigold accent.
4. **No stencil** (owner). Clipping on the CPU-side data does the job instead: the pickup clear box and the seam clearance. The rates are measured below.
5. **Dials:** `Reflect.*` in the dev panel. Defaults: strength 1, stretch 1.5, length 36, width 0.6, rail 1, block 0.6, pickup 1.5, exhaust 0.3.

### Consequences

- **Cost.** Draw calls: low 46 → 49, high 123 → 129 (the rear view draws the streaks again). GPU time, DPR 1, 1728×1080, GPU-synced median: low 3.20 → 3.40 ms. High, three runs each alone on the GPU: best 8.5 ms on, 9.7 ms off, 9.7 ms without the rail patch. The runs are bimodal (8–10 ms or 14–16 ms), so the high-tier cost is below the noise.
- **Streaks over holes.** Measured on `/test-level` tracks, 8 seeds, a chase camera every 2u on 3 lanes, by a CPU copy of the streak vertex maths against `Track.segmentAtZ` floors.
  - Before the clear box (181,140 frames): block-seam streaks 0.05% and pickup spots 5.9% had more than a quarter of their light over a hole. The pickup spot sits at the mirror point, far in front of the pickup, so a hole between the camera and the pickup caught it. On screen it read as a short marigold line across the gap below the pickup.
  - After `59aa760` (seeds 20260921 and 1–7, 180,480 frames): pickup spots 7.06% → 0.00% (this run's own before-value; it differs from 5.9% because the frame set differs). The box keeps 99.44% of the spot light that falls on deck. Block-seam streaks 0.35%, not changed by that commit.
  - Box build: 2–7 ms per track, once.
- **Butt joints.** On seed 20260921, 314 of 429 sealed blocks meet another block end to end. Before `6cb1f36`, their hidden seams drew streaks. Culling against a mirrored camera gives the same result as the camera test for vertical faces [inferred, maths], so only the clearance removes them.
- **#365 cost.** Two more texture reads per streak pixel. The streaks were toggled on and off (GPU-synced median, DPR 2, 1728×1080). Driving on `/test-level`: 0.00 ms before and after. Worst-case close-up with streaks filling the lower screen: 0.1 ms before, 0.0–0.2 ms after. This is within the 0.1 ms timer step.
- **Clearance cost.** 0.011 ms/frame mean, 0.17 ms worst, in node over the full track. GPU time was not measured again after `6cb1f36`.
- **Left rim.** The rim sheen is washed out where the HDRI's white sky lights the deck. The owner accepted this (2026-09-29). No change.
- **Deck wear (part 2a).** Wider `Wear.*` ranges were tapped at two views: valueSpan 0.3 → 0.1, roughSpan 0.25 → 0.6, metalMin 0.7 → 0.2. The wear shows more and breaks the streaks more. The larger measured change is brightness: the deck patch mean luma goes 35.9 → 42.8, the spread only 9.2 → 10.3. The same dials drive the block walls. The owner kept the current values (2026-09-29). No change.
- **Deck anisotropy (part 2b) — dropped.** The deck was tried as `MeshPhysicalMaterial`. Anisotropy along x changed nothing visible. Along z it smeared the planet HDRI lobe toward the camera (deck luma +15 at 0.5, +32 at 0.9). Emissives are not reflected, so it adds no streaks. The owner chose to drop it (2026-09-29): no dials, the deck stays `MeshStandardMaterial`.
- **Albedo defaults.** `Environment.rotation` 0 → 180 and `Metal.baseColor` #7b7f86 → #595c62. This was re-checked under `cyclorama_hard_light` (#362). At rotation 0 the hard light blows a near-white lobe over the deck. Deck luma goes from 122.5 to 78.6; the whole frame from 103 to 67. `Reflect.blur` (`uReflBlur`, default 0.01) is now a dial.
- **Owner's look (#364).** The owner's `/test-level` values are now the defaults: `Metal.baseColor` and `Hull.baseColor` `#232324`, `Environment.rotation` 210, `Environment.intensity` 1 (was 1.2). Tone mapping stays Neutral at exposure 1. Home, lobby and race read the same tuning module, so all canvases match. Luma is not re-measured.
- **Open.** The owner judges the seam streak length and blur rate from taps. `uReflBlur` has no dev-panel dial yet.
- Details and departures: `ART_MATERIALS.md` §7 item 23.

## ADR-032 — One keyboard layout: arrows drive, E/D/S/F/X for powers, B for the mirror

**Date:** 2026-09-29 · **Status:** Accepted (owner decision, 2026-09-29) · **Issue:** #368 · **Built in:** `d65ada3` · **Supersedes:** the #358 Blur layout (GDD §8)

### Context

The #358 layout copied the Blur (2010) PC keys: Q throttle, A or ↓ brake, Right Ctrl or Left Shift fire, Right Shift fire back, Left Ctrl or X drop, ↑ and 1–3 for slots, V mirror. It needed a Mac variant, because a MacBook has no Right Ctrl. It also held Ctrl down during a race, which turned letter keys into browser shortcuts. #363 and #366 unbound W, E, F and R because Ctrl + W closed the tab, Ctrl + R reloaded, and Ctrl + E and Ctrl + F took the focus. `keyboard.ts` blocked Ctrl + a drive key. `power-select.ts` let Ctrl or Shift pass only on a list of chord keys.

### Decision

1. **One layout, no variants.**

   | Action | Key |
   |--------|-----|
   | Throttle · brake | ↑ · ↓ |
   | Strafe | ← / → |
   | Jump | Space (tap / hold / double) |
   | Fire forward · fire back | E · D |
   | Previous · next power slot | S · F |
   | Drop | X |
   | Rear-view mirror | B (kept after a reload, #367) |
   | Mute · leave | M · Esc |

2. **No other key works.** Q, A, S as brake, both Ctrl keys, both Shift keys, V and 1–3 are removed. `fireKeyFor`, `dropKeyFor`, `MAC_*` and `macKeyboard` are deleted.
3. **No modifiers.** A power key pressed with Ctrl, Cmd or Alt does nothing in the game, so the browser shortcut runs. This is the rule M and the mirror key already used. `keyboard.ts` no longer calls `preventDefault`. No key is held with Ctrl, and `html` and `body` are `overflow-hidden` (`root.tsx`), so ↑, ↓ and Space cannot scroll the page.
4. **Gamepad and touch keep their buttons.** They send the new codes. S is a real previous-slot key now, so the touch d-pad's left arm sends S instead of the synthetic `PreviousSlot` code.
5. **The lobby ship picker steps on ← / → only.** A / D were removed too (owner, 2026-09-29).

### Consequences

- The right hand drives and the left hand holds every power key. One layout works on every keyboard, so the controls panel and HUD have one label set.
- The #363/#366 hazard is gone: Ctrl is never held, so no game key becomes a browser shortcut.
- Players who learned Q/A or V must relearn them. The home controls panel and the HUD power hint show the new keys.
