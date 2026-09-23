# Plan — destructible (fractured) blocks

Session of 2026-09-23. **Nothing below is built.** Written at the owner's request as the shot plan,
then saved early because the Claude Code binary under the session was replaced mid-flight.

Owner's art reference: `docs/art-direction/golden-reference/cruise-lighting.png`, plus the owner's
crop of the fractured block in it — dark coated shell, the body split through, marigold energy
recessed inside the break, top and side contours visibly interrupted.

## The decision record already covers this

ADR-009 specifies the feature and is **PROPOSED, not accepted**:

> "Collapse both into **one block family with two material states**: **Sealed** … deadly … **Fractured**
> … breakable — shoot it to clear the path, *or* smash through and pay a speed tax."

ADR-010 §3 sets the art contract:

> "*Sealed mass = avoid; broken-contour shell = shoot to clear.* The distinction must break the **outer
> silhouette**; surface crack texture alone is insufficient. **Red-as-hazard-code is rejected**."

### Two of ADR-009's premises are now stale

1. **Slow blocks no longer exist.** `rg 'SLOW_GRACE|SALT_DRAG'` over `packages/shared/src` returns
   nothing (verified 2026-09-23). ADR-009 reads as a merge of two primitives. There is only one
   primitive to add.
2. **Blocks no longer kill.** ADR-014 (`6678600`, same day) makes contact bounce the ship: push-out
   along the shallowest lateral face, `vz` to `-bounceBack` (9u/s), `stunTimer` to `bounceStun`
   (0.25s). *"A gap is the only death in the game."*

Consequence for this feature, and it is the important one: **ADR-009's readability gate gets softer,
and the speed tax gets harder.** The gate was written against death —

> "at 55 u/s on the real chase camera: **can a player reliably tell sealed from fractured with enough
> time to react?** … roughly half a second."

A misread now costs a bounce, not a life. But the smash tax must now be calibrated against the bounce,
not against dying: **breaking through must be clearly cheaper than bouncing off**, or no player ever
chooses it and the primitive is decoration. The tax knobs belong next to `bounceBack` / `bounceStun`
in `FlightTuning`.

This needs **ADR-015** (ADR-014 is taken) to accept ADR-009 with both amendments.

## Gameplay shape

| | Decision | Why |
|---|---|---|
| HP | One bolt = broken. No per-block HP. | HP is extra synced state and a readability tax for no decision depth. |
| Smash | Pass through; `vz` clamped, plus a short window where throttle does not bite. | An instant clamp is recovered too fast to be a cost. |
| Tax vs bounce | Smashing must beat bouncing on time lost, at every class. | Otherwise the primitive is never chosen. This is the balance gate. |
| Tuning | Smash tax is `FlightTuning` data, per class. | Freighter smashes cheap — the heavy ship gets a thing it is best at. Non-negotiable #6. |
| Bolt vs sealed | Sealed blocks eat the bolt. **Owner confirmation pending.** | Stops bolts flying through walls; makes the shot a skill choice. |
| Persistence | Broken is permanent for the run; cleared on race reset. | Matches `pickupTaken`. |
| Fairness | `passableCorridorWidth` keeps counting fractured blocks as solid. | Free — they stay in `seg.blocks`. No slice may be threadable only by breaking. |

## Art

`docs/ART_MATERIALS.md` on the destructible variant:

> "a few large sections, broad recessed fractures, and **visible interruptions of the top and side
> contours**. Surface crack texture alone is explicitly insufficient … Fracture interior surfaces are
> the same coat pushed to roughness 0.70 – 0.85: a torn face, not a machined one."

So the fractured block is a **second geometry**, not a shader variant of `sealedBlockGeometry`. A
shader-only crack keeps the silhouette intact and fails ADR-010 §3 by construction.

Build: one unit geometry split by a jagged plane into 2–3 chunks, chunks pushed apart about 0.3u,
interior faces carrying a vertex flag that drives M7 emissive plus high roughness. One extra instanced
draw call and one extra `InstancedBufferAttribute`. Variety comes free from mirroring and rotating
through the instance matrix; more split variants only if it reads repetitive.

M2 coat, tint, wear and seam language are reused unchanged from `sealed-block-material.ts` and
`metal.ts`, so the two states stay one family.

Collision stays the full AABB. The 0.3u chunk gap is far below ship width, so it never reads as a
thread.

## Mechanism — how broken state reaches the sim (non-negotiable #13)

| Option | Verdict |
|---|---|
| **`simulate(…, world)` where `world = { broken: Set<string> }`** (chosen) | Pure read, allocation-free, deterministic, replays identically under reconciliation. |
| Mutate the `Track` (cache segments, delete blocks) | Breaks generator purity; rollback replay would read a mutated world. |
| `Track` decorator filtering blocks inside `segmentAt` | Correct, but allocates an array per call on a path hit 2–4 times per ship per tick. |
| Bake breaks into the descriptor and re-resolve | Full regeneration; unusable mid-race. |
| Read Colyseus state inside `simulate()` | Breaks the shared/server split; the client has no such object. |
| A `destroyed` field on `Block` | Needs cached segments to hold the bit, which reintroduces the mutation problem. |

`simulate()` also **writes** into `world.broken` when a ship smashes through, so breaking is a
deterministic consequence of the sim and the client predicts it with no extra machinery. The synced
map exists only so other players' breaks reach you.

Block ids are `"<segIndex>.<blockIndex>"` — stable because `buildSegment` is pure.

Known edge, accepted for now: a local smash the server never confirms leaves a phantom-broken block on
that client. Self-limiting, because your own smash is near-certain to be confirmed.

## Costs

- **Generation:** one hash per block to pick `kind`. Negligible.
- **Sim:** one `Set.has` per overlap candidate. Negligible.
- **Available net win:** `segmentAtZ` rebuilds a segment from scratch on every call — twice per ship
  per tick today, plus the new bolt queries. A small ring cache by segment index in
  `makeProcgenTrack` pays for this whole feature.
- **Render:** one extra draw call. Broken blocks are not emitted, so a run gets cheaper as it runs.
  Emissive interiors add bloom-eligible pixels — measure against issue #17's 12-ship gate.
- **Network:** one map entry per break, sparse, bounded by track length, cleared per race.
- **Bolt vs block:** a bolt moves 15u per tick at 900 u/s, so the query must be a **swept** z-range,
  not a point test. At most 12 bolts in flight.

## Stages

Each is one commit on `dev`, each reversible.

0. **Decide.** ADR-015 accepting ADR-009 with the slow-block and ADR-014 amendments. File the GitHub
   issue — there is no open issue for this (checked `gh issue list`, 2026-09-23).
1. **Art plus the gate, no behaviour change.** `kind: 'sealed' | 'fractured'` on `Block`, seeded by
   intensity; `fractured-block-geometry.ts` and its shader; second instanced mesh in the block lane.
   Fractured blocks still behave as sealed. Run ADR-009's gate at 55 u/s on the real chase camera and
   get the owner's eye on it. Keep this inside `/test-level` — a block that looks breakable and is not
   is a lie to put in front of players.
2. **Sim.** `SimWorld` param, smash-through and the speed tax in `step.ts`, per-class tuning,
   `node:test` coverage for smash, bounce and the fairness floor. Rebase on `6678600` first.
3. **Net and weapon.** `blockBroken` MapSchema generalising `pickupTaken`; swept bolt-vs-block on the
   server; client mirror; break VFX reusing the `explosions.tsx` shard pool.
4. **Balance and perf.** Fracture rate against intensity, smash tax per class, the 12-ship
   measurement, and the tax-beats-bounce check from the table above.

## Open with the owner

1. Do sealed blocks eat a bolt?
2. Freighter-smashes-cheap as a class identity hook, or one tax for the whole roster?

## Lane collisions

Stage 1 touches `track-blocks.tsx` and the `sealed-block-*` files. Another session had both modified
at the time of writing. Claim the lane first, or start on `space.ts` and the new geometry file, which
collide with nobody. See [[claim-the-lane-before-the-first-write]].
