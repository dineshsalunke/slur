# 2026-08-10 — Status: current code vs the new baseline (ADR-000..004)

**Type:** read-only audit. No production code touched. Baseline read from `docs/DECISIONS.md`,
the `2026-08-10-track-provider-decoupling.md` phase note, and the `⚠ SUPERSEDED` markers in
`docs/GDD.md` / `docs/TDD.md`. Code claims below are verified against source, not the docs'
"as-built" prose.

---

## 1. Verdict

The **load-bearing contract already holds where it was cheap to hold and is entirely absent
where it was expensive.** `simulate()` genuinely depends on a `Track` *interface*, not a seed
(ADR-000's real win) — but the seed still leaks first-class through the wire, the room, pickups,
scenery, and the `Track` object itself, so **ADR-001 is 0% built**. Physics==visual is still a
hard WYSIWYG identity, not a split (**ADR-002 unbuilt**); there is **no macro grammar / beat
vocabulary** (**ADR-003 unbuilt, correctly — no vocabulary to sequence yet**); and endless-Survival
residue is scattered but **inert** (**ADR-004 is doc-accepted, code cleanup pending**). The gap is
almost entirely *subtractive-then-additive plumbing*, not a sim rewrite — which matches the phase
note's read. 70 tests GREEN, typecheck clean.

---

## 2. What's built & solid (matches or is orthogonal to the baseline)

- **The `Track` abstraction is real and load-bearing.** `simulate()` takes `track?: Track` and
  collision reads only `track.segmentAtZ` / `track.finishZ` / `segmentAt`, never `track.seed`
  (`packages/shared/src/sim/step.ts:203,247,253`). This is the *actual* ADR-000 anchor — already
  satisfied. The seed leaks only *around* it (see §3 ADR-001).
- **One shared `simulate()`, 60 Hz fixed-step, run on the schema instance** — server calls it
  directly on `PlayerState` (`apps/server/src/rooms/run-room.ts:180`); client predicts with the
  same fn. `PlayerState implements SimShip` is the compile-time mirror guard
  (`packages/shared/src/schema.ts:24`). Invariant 4 (determinism) is enforced by design: trig-free
  per-segment path, documented in `sim/track.ts:9-12`, asserted by the byte-identical track test.
- **Invariant 3 (motion-affecting→synced sim / cosmetic→broadcast) is already generalised.**
  Bolt→stun is synced state + shared sim (`step.ts:265-269`, `combat/projectiles.ts`); the hit
  spark is a one-shot `broadcast('hit', …)` NOT state (`run-room.ts:238`, consumed at
  `attach-room-to-world.ts:151`). This is exactly the pattern ADR-000 invariant 3 wants every
  future hazard to follow.
- **Layers 2 & 3 of the ADR-002 mechanics model already exist in the schema.** Track-state =
  `RunState.pickupTaken: MapSchema<boolean>` keyed by slot id (`schema.ts:100`); dynamic entities =
  `RunState.projectiles: MapSchema<Projectile>` (`schema.ts:97`). Only Layer 1's physics/visual
  split is missing.
- **Wire discipline is append-only and documented** (`schema.ts:6-11`) — the ADR-001 note that
  `seed: uint32 → TrackDescriptor` is "an append-only wire change" is consistent with how the
  schema is already maintained.
- **Client root holds zero reactive subscriptions** (`net-canvas.tsx:34` builds the track once via
  `useMemo`, no `room.state` read during render) — non-negotiable #10 respected; orthogonal to the
  baseline but worth noting it won't fight the refactor.
- **Race director is pure + framework-free** (`race/director.ts`) and headlessly tested — the
  ADR-004 join-policy change lands in one function here.

---

## 3. Gaps to the baseline, per ADR

### ADR-001 — Seed out of room/track → provider *(Proposed; 0% built)*
- **Now:** seed is first-class *everywhere*.
  - On the wire: `RunState.seed: uint32` is the only geometry key (`schema.ts:88`).
  - In the `Track` object itself: `Track.seed: number` is a declared interface field
    (`sim/track.ts:84,304`) — the abstraction still carries the implementation detail.
  - `makeTrack(seed)` (`sim/track.ts:301`), `pickupLayout(seed)` (`combat/pickups.ts:27`),
    `corridorCenterX(seed, i)` (`sim/track.ts:282`) all take a raw seed.
  - Room runtime: `this.state.seed = Math.random()…; this.track = makeTrack(this.state.seed);
    this.pickups = pickupLayout(this.state.seed)` (`run-room.ts:85-87`).
  - Client: loader `waitForSeed(room)` (`net/matchmaking.ts:49-51`), `NetCanvas({ seed })` →
    `makeTrack(seed)` (`net-canvas.tsx:34`), `PickupField seed=` (`pickup-field.tsx:12`),
    `Environment seed=` scenery (`net-canvas.tsx:110`, `tube-walls.tsx:24-27`).
- **Target:** wire carries an opaque `TrackDescriptor` (`{kind:'procgen',seed,tier}` |
  `{kind:'authored',levelId}`); runtime holds a `Track` from `resolveTrack(descriptor)`; nothing
  outside the procgen provider names a seed.
- **Delta:** **No `TrackDescriptor`, no `resolveTrack`, no provider registry exist** (grep for
  `descriptor`/`resolveTrack`/`provider` finds only React context providers). `Track.seed` must be
  removed from the interface; pickups must read `track.anchors` instead of re-deriving from seed.
  Purely subtractive + one indirection layer — the sim doesn't change.

### ADR-002 — `Track` = physics + anchors; visuals split *(Proposed; 0% built)*
- **Now:** physics **is** the visual. `TrackView` renders the exact collision AABBs — it iterates
  `track.segmentAt(i).floors` / `.blocks` and instances a box per `Block`/`FloorSpan` with the box
  sized straight from `b.x0..b.z1` (`track-view.tsx:61-78,109-136`). The comment at
  `track-view.tsx:60` states the WYSIWYG *identity* as a feature ("what you see is exactly what the
  ship's footprint tests against"). ADR-002 wants that identity **downgraded from free guarantee to
  content obligation.**
- **Anchors are NOT a first-class Track concept.** Pickups are derived ad-hoc: `pickupLayout`
  re-runs `makeTrack` and samples `corridorCenterX` per segment (`combat/pickups.ts:28-35`) —
  placement is a seed function computed *beside* the track, not stored *in* it. There is no
  `Track.anchors`.
- **The 3-layer split is implicit, not modelled.** Layers 2/3 exist as loose schema maps
  (`pickupTaken`, `projectiles`); Layer 1 has no physics-vs-visual boundary at all.
- **Delta:** introduce `Track.anchors` (pickup/hazard/drop/checkpoint placements) as materialized
  data; move visual resolution to a separate client-side path keyed off the descriptor; add the
  WYSIWYG-cover *validation gate* (beside FIT/GAP-REACH). Blocked-behind / cleanest-after ADR-001.

### ADR-003 — Ruleset macro-grammar; generate == validate *(Proposed; correctly not built)*
- **Now:** micro-layer only. `buildSegment` is pure corridor-noise weave + noise walls + sparse gap
  roll (`sim/track.ts:254-276`), with `difficultyAt(i)` a smoothstep ease + triangle pacing
  (`sim/track.ts:149-154`). **No beats, no legality, no progression memory, no teach-before-test,
  no variety window** — grep for `beat`/`grammar` finds nothing.
- **Live beat vocabulary = ~one-and-a-half:** the weave corridor, **lethal walls**, **drag (amber)
  blocks** (`sim/track.ts:201-215`), and **gaps** (`rolledGap`, `sim/track.ts:170-173`). Pickups
  drop a single **bolt** power (`HeldPower.bolt`).
- **Absent beat mechanics (GDD §5.7 BC menu):** boost pads (BC5), slow/gravity fields, launch pads,
  switches, forks/branches (BC3/BC6) — **none exist** (grep: no boostpad/launchpad/slowfield/fork).
  "boost" appears only as the retired base-stat and the bolt-pickup lineage
  (`combat/constants.ts:11`, `schema.ts:11`).
- **Delta / sequencing:** ADR-003 itself says build the grammar *after* 2–3 BC5-family beats exist.
  With a vocabulary of ~one, **not building it yet is correct.** No action beyond landing beat types
  first.

### ADR-004 — Drop endless Survival → longer finite tracks *(Accepted; code cleanup pending)*
- **Now:** all tracks are already finite (`TRACK_SEGMENTS = 200`, `finishZ = 200·SEG_LEN`,
  `sim/track.ts:92,305`) and there is **no `mode` field on the wire** and **no live Survival code
  path** — so functionally the code is already ADR-004-shaped. But the design was *built around*
  endless: `segmentAt(i)` is O(1)-random-access-by-hash specifically to avoid materializing an
  array, and several comments still promise the endless future. See §4 for the concrete debt list.
- **Delta:** none is *behaviourally* required today; the ADR-004 wins (materialize-once, hash-assert
  agreement, steerable bounded random walk, reopened algorithm survey) are all *enabled* by dropping
  endless but not yet *taken*. Priority is comment/dead-code cleanup so the next author isn't
  designing against a dead constraint.

---

## 4. Stale comments / dead-code-in-waiting (created by ADR-004)

| Location | What's now wrong | Suggested fix |
|---|---|---|
| `packages/shared/src/sim/track.ts:1-7` | Header says the track is O(1) random-access "so endless Survival (S7) falls out for free — do NOT materialize an array, that would force an S7 rewrite." ADR-004 **inverts** this: all tracks are bounded → materialize-once is now legal/preferred. | Rewrite the header: bounded track, materialize-at-load is fine; keep the byte-identical/determinism note (still load-bearing), drop the "don't materialize" injunction. |
| `packages/shared/src/sim/track.ts:142` | `// Difficulty D(i) … (Survival growth deferred to S7)` — no Survival to defer to. | Drop the Survival clause; D(i) is just the finite ramp. |
| `packages/shared/src/constants.ts:211-214` | `D_EASE_CAP = 0.85` justified as "leaves headroom for S7 Survival to grow into"; comment "Survival's unbounded growth is DEFERRED to S7 (no `mode` field yet)". The cap's rationale is now moot (may want to raise it for finite tracks). | Re-justify `D_EASE_CAP` on finite-track feel alone; delete the `mode`/Survival deferral note. |
| `packages/shared/src/race/director.ts:23-28` | `shouldSpectateOnJoin` header promises a Survival branch returning `false` (drop-in-beside-pack) "the one place S7 will branch." ADR-004: join policy is **Race-always, permanently** — this branch never gets built. | Simplify comment to "join once locked ⇒ spectate; permanent, single-mode"; the fn body already returns the right thing. |
| `apps/server/src/rooms/run-room.ts:326` | onJoin comment: "the one place Survival/S7 will branch to drop-in-beside-pack." Same dead branch. | Drop the Survival/S7 reference. |
| `apps/server/src/rooms/run-room.ts:328-332` | The onJoin spawn-stagger is described elsewhere as "kept for exactly" the Survival drop-in (director.ts:24). It's still used for lobby joiners, so the *code* stays — only the *justification* is stale. | Keep code; the stagger is legit for lobby seating. Just don't cite Survival as its reason. |
| `packages/shared/src/sim/respawn.test.ts:92` | Test comment mentions "asserting a survival" loop (minor). | Cosmetic; reword if touched. |
| `apps/server/src/rooms/run-room.ts:71-72` | "ONE seed per room for S4: every round races the same track (per-round reseed is a deliberate later follow-up)." Orthogonal to ADR-004 but intersects ADR-001 — per-round variety becomes a descriptor swap, not a reseed. | Note when ADR-001 lands: this is a descriptor swap point. |

None of these affect behaviour, typecheck, or tests — they are **design-intent debt** that will
mislead the next author into coding against a dropped constraint.

---

## 5. Recommended sequencing — drive **ADR-001** into `/prep` first

**Validated — the phase note's instinct is right, and the code makes it stronger.** Reasons from
what the code actually looks like:

1. **It's the subtractive unblocker with the smallest blast radius.** The sim already depends on the
   `Track` interface, so ADR-001 is "add a descriptor + `resolveTrack` indirection and delete seed
   reach-arounds," not a sim change. The reach-arounds are enumerated and few (§3 ADR-001) — a
   bounded, mechanical refactor.
2. **ADR-002 is *gated behind* it.** You can't cleanly introduce `Track.anchors` (ADR-002) while
   `pickupLayout(seed)` derives placement beside the track from a raw seed; the anchor concept wants
   to live inside the materialized `Track` the provider returns. Do ADR-001's materialization
   boundary first, then anchors slot into it.
3. **ADR-003 is correctly blocked on vocabulary, not on ADR-001.** Grammar work is premature until
   2–3 BC5 beat types exist — that's a *content* track (add boost pad / slow field / fork mechanics
   as new `Block`/anchor kinds), runnable in parallel with or after the ADR-001 plumbing, and it
   also *feeds* ADR-002 (each new mechanic is an anchor type).
4. **ADR-004 cleanup is a cheap pre-req to bundle with ADR-001 prep.** The stale comments
   (§4) live in the exact files ADR-001 touches (`sim/track.ts`, `run-room.ts`, `director.ts`).
   Fix them in the same pass so the ADR-001 refactor starts from honest comments.

**One challenge to the phase-note ordering:** the phase note lists "BC5 beats → then ADR-003
grammar" *after* ADR-001. That's right, but note the **procgen-vs-authored 're-decision' (ADR-004
open item) should be resolved during ADR-001 prep, not deferred** — the descriptor's shape
(`{kind:'procgen'|'authored'}`) bakes in an assumption about which is primary, and ADR-004 explicitly
reopened that as a real choice. Don't let the descriptor design silently re-crown procgen.

**Proposed order:** ADR-004 comment cleanup (bundled) → ADR-001 provider decoupling (prep next) →
BC5 beat mechanics (content, parallel) + ADR-002 anchors → ADR-003 grammar (last, once vocabulary ≥ 3).

---

## 6. Test / typecheck state

- **`pnpm test`: GREEN.** 70 tests, 0 fail. `packages/shared` 66/66 pass; `apps/server` 4/4 pass
  (`@colyseus/testing` room tests: bolt-stun-prune, projectile add/remove parity, pickup grab,
  pickup respawn). `apps/client` has no test script in the `-r` run.
- **`pnpm typecheck`: GREEN.** `tsc -b` clean for shared + server; `react-router typegen && tsc`
  clean for client. No errors.
