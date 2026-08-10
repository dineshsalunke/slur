# SLUR — Decision Log (ADRs)

Append-only record of load-bearing architecture/design decisions. **Never edit a past record in
place** — supersede it with a new one and add a `Superseded-by:` link. Each ADR names the docs it
affects; those docs carry a matching `⚠ SUPERSEDED … (ADR-NNN)` marker and relocate the deprecated
prose to their own `## Superseded` section. The *why* narrative lives in the linked phase note; this
file is the index of *what changed and when*.

Status vocabulary: **Accepted** (in force) · **Superseded** (replaced — see link) · **Proposed** (agreed
direction, not yet built).

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

- **Status:** Proposed (agreed; not yet built) · **Date:** 2026-08-10

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

- **Status:** Proposed · **Date:** 2026-08-10

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

- **Status:** Proposed · **Date:** 2026-08-10

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
