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
