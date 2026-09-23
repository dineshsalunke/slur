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

### What this costs

Blocks become cheap. A player who cannot weave can now bulldoze down the track at a cost of roughly
`bounceStun` + the re-acceleration per hit, where before the track demanded the lane. `sim/track.test.ts`'s
fairness caps (threadable clearance, `MIN_LANE`) were written against a lethal block and are unaffected in
letter, but the **pressure** the generator's intensity curve was tuned to apply is now softer everywhere.
Re-tuning intensity against a non-lethal block is not done here.

### Not decided here

No hit VFX fires on a bounce: `pushHit()` is still only called from the server's bolt-hit message
(`apps/client/app/net/attach-room-to-world.ts:135`), so a wall hit gets the stun blink and the `hit` sound
but no spark. Wiring the predicted bounce into `hit-events.ts` is the obvious follow-up.

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
  its `vz`. There is no stun. An invulnerable ship passes through and does not break the block.
- A broken block stays broken for the run. `RunState.blockBroken` holds the broken ids. A race reset
  clears it.
- The client predicts a smash. `reconcile()` restores the confirmed broken set before it replays inputs.
- On the client, a broken fractured block splits into its two chunks. The chunks fall, then disappear.
  This is VFX only. The sim does not know about the chunks.

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

## ADR-017 — The homing seeker: one at a time, locks what it can see, dodged only late

**Date:** 2026-09-23 · **Status:** PROPOSED (design approved by the owner via slur-supervisor; not built) ·
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
  qualifies, the fire is **wasted** (owner): the seeker flies straight at cruise height, hits nobody and
  expires. The fire is not refused. The lock does not change after launch.
- **Line of sight.** A deterministic 2D test in `@slur/shared`: the segment from shooter to target in
  x–z against every standing block AABB in the segments between them. Broken fractured blocks do not
  block it. Monoliths are not tested: they are client-only scenery outboard of the rail
  (`monolith-transforms.ts`, `RAIL_OUTER = HALF_WIDTH + RAIL_W`), and the segment between two points on
  the deck never leaves the deck. **LOS is checked at launch only.** A check in flight would make every
  block a third way to lose the seeker.
- **Flight.** Forward speed ramps from the shooter's `vz` to `seekerSpeed` (120 u/s) over `seekerRampS`
  (0.3s). The seeker climbs at `seekerClimb` (60 u/s) to `seekerCruiseY` (10u), above `BLOCK_HEIGHT` (8u),
  so it overflies blocks in cruise. Inside `seekerDiveDz` (40u) of the target it descends linearly to
  `seekerStrikeY` (0.5u).
- **Blocks in the dive (owner).** Inside `seekerDiveDz`, a standing block in the seeker's path
  **destroys the seeker**. A fractured block is destroyed with it (`broken.add`, as a bolt does). The
  seeker never draws through a block. Outcome `'blocked'`.
- **Two tracking phases.**
  - *Tracking:* the lateral rate toward the target's x is capped at `seekerTrackTurn` (240 u/s). That is
    above every ship's `strafeClamp` (65–95), so an early strafe does not lose it.
  - *Committed:* inside the terminal window the cap drops to `seekerTurn` (40 u/s), so a late strafe can
    beat it. Once the seeker commits, it stays committed.
  - `seekerWindowMode` selects the window: `'time'` (time to impact ≤ `seekerWindowS`, 0.35s, with
    time = dz ÷ max(seeker vz − target vz, ε)) or `'distance'` (dz ≤ `seekerWindowU`, 30u).
- **Hit.** The seeker can hit only its target. It uses the bolt's x–z box test plus a y band: the target's
  `y` must be below `seekerHitBand` (1.2u). A full jump (2.8u or more for every class) clears it. A tap jump
  (0.8–0.9u) does not.
- **Miss.** The seeker is spent if its target is more than `halfL` behind it, if the target dies,
  finishes or leaves, or if `seekerTtl` (6s) runs out. A miss broadcasts `seekerMiss` (the dodge
  sound).
- **Stun.** `seekerStunS` is 2.0s. The bolt's is 1.2s. Armour scales it through `stunDurationForShip`.
- **Wire.** A new `Seeker` schema class (`x y z vz ownerId targetId ttl committed`) in its own map,
  `RunState.seekers`. `Projectile` is unchanged, so the bolt path (`stepBolts`, the threat HUD's bolt
  scan, `projectile-field.tsx`) is untouched. The server steps seekers. The client interpolates them and
  does not predict them.
- **Tuning (owner).** Every value above is a `SimConfig` field (non-negotiable #6). **Only `/test-level`
  is tunable**: the `Seeker.*` group in `dev/tuning-schema.ts` drives its local sim. Hosted rooms run
  `DEFAULT_SIM_CONFIG`, and no panel values go to the server. This is the decision, not a gap.

### Exactly two dodges

The owner allows two ways to beat a locked seeker: **jump over it**, or **strafe at the last moment**.
LOS is not re-checked. An early strafe does not shake it. Two known exceptions follow. **A block inside
the last `seekerDiveDz` (40u)** destroys it; that comes from the owner's no-clip rule, and a target that
threads past a block at that moment escapes. **Outrunning it** is the other: the Freighter (`ship-classes.ts:84`, `maxCruise: 124`) is faster than 120 u/s. The
owner accepted this for now.

### Rejected alternatives

- **One turn cap for the whole flight.** An early strafe shakes it. The owner rejected this.
- **Block collision in cruise, or LOS re-checked in flight.** Each one adds a third dodge.
- **Bolts and seekers in one `Projectile` map with a `kind` field.** Every bolt consumer would need a
  kind filter.
- **Proportional navigation.** It is harder to tune to a clean late-strafe window. The two-phase cap gives
  the window directly.
- **Refuse to fire with no lock.** The owner chose wasted. A refusal also needs the client to predict
  the server's lock for the HUD.
- **Hit any ship in the path.** A lock that hits someone else is not a lock.

### Affected

`packages/shared/src/combat/{constants,seeker,pickups,combat-step}.ts` ·
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
