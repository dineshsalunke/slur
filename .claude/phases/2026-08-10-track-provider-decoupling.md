# 2026-08-10 — Track provider decoupling + load-bearing baseline (BRAINSTORM)

**Status:** design agreed by user; docs/memory updated as the load-bearing baseline. Codified as
`docs/DECISIONS.md` ADR-000..004. No production code written this session.

This note is the *narrative* — how we reached the decisions. The *what* is in the ADRs; the docs carry
`⚠ SUPERSEDED (ADR-NNN)` markers pointing here.

## Trigger
Reviewing the codebase top-to-bottom to establish a load-bearing baseline before deeper quality work.
The initial anchor stated to the user was: *"a room is a seed + a list of inputs; both ends run the same
`simulate()` over a track that is a pure function of the seed; everything else is a consequence."* The
user asked to validate that anchor against **custom/authored levels** before committing to it.

## The evolution (why the anchor changed)

1. **Validate against authored levels.** `simulate()` already takes a `Track` interface, not a seed
   (`sim/step.ts:253`); collision reads only `track.segmentAtZ`/`finishZ`, never `track.seed`. So the
   load-bearing part is the **`Track` abstraction + determinism**, not "pure function of seed." The seed
   leaks only *around* the abstraction (pickups, scenery, wire key). → anchor must be phrased on the
   abstraction. (**ADR-000**.)

2. **User directive — seed out of room/track.** "The room/track should only care about data; how it's
   generated or loaded is someone else's concern." Agreed — with one sharp boundary: there are **two
   datas**. The **descriptor** is synced (tiny, opaque); the **`Track`** is materialized *locally* on
   each end from that descriptor. Never sync the `Track` (that would be syncing geometry — the founding
   sin). Dependency inversion: room/sim depend on the `Track` interface + descriptor. (**ADR-001**.)

3. **User directive — sim needs physics + metadata, not visuals; encode that in the track.** Right for
   *placement*; but a global hazard is runtime state, not track data. Resolved into a **3-layer model**:
   Track (physics + anchors, materialized) / Track-state (per-anchor synced flags — `pickupTaken`
   generalised) / Dynamic entities (synced runtime entities — `projectiles` generalised). Physics/visual
   split creates a **WYSIWYG-collision obligation** (content gate). Hazard rule: motion-affecting →
   shared sim + synced state; cosmetic → broadcast. (**ADR-002** + invariant 3 of ADR-000.)

4. **User direction — ruleset-based procgen for progression.** Reframed: the provider boundary moves
   generation *off* the O(1)-per-tick hot path, so **stateful, rule-based generation becomes legal at
   materialize-time** — reopening the algorithm survey the `procgen-weave-width-DRAFT` closed under
   "constraint 2." Proposed a **macro grammar of beats** (legality/progression/variety/teach-before-test)
   over the existing **micro corridor-noise**, with the grammar doubling as the authored-level validator
   (generate == validate). Pushback: build the grammar *after* there's a vocabulary (2–3 BC5 beats) to
   sequence. (**ADR-003**.)

5. **User decision — drop endless Survival, replace with longer finite tracks.** Playtest-informed. This
   **kills constraint 2 entirely** → materialize-once for *all* tracks; deletes ADR-003's endless
   carve-out; evaporates `mode` plumbing; reopens the algorithm survey for everything; and turns
   "procgen is PRIMARY" back into a real (open) choice rather than a necessity. (**ADR-004**.)

## Consistency check (done with user)
All four threads compose. Every change is either subtractive (remove seed reach-arounds) or a clean layer
on top. Layers 2/3 of the mechanics model already exist in the schema. The only non-derivable open item is
"is procgen still primary?" — deliberately left **open** in the docs, not resolved silently.

## Follow-ups (not this session)
- Code-comment debt (ADR-004): `sim/track.ts:6-7`, `race/director.ts` Survival branch.
- Pick a thread to drive into `/prep`. Natural first: **ADR-001 provider decoupling** (subtractive,
  unblocks the rest). Then BC5 beats → then ADR-003 grammar.
- Status review of current codebase vs the new baseline (background agent, kicked off end of this session).
