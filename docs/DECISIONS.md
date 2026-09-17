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

**Context.** An external art-direction package (`docs/references/art-handoff-v1/`) was produced with
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

**Date:** 2026-09-17 · **Status:** **PROPOSED** — gated on the readability test below. Do not build until
that gate passes.

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
   and boards `07`/`09` still depict the old undersized proportions. See `art-handoff-v2/PROVENANCE.md`.

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
