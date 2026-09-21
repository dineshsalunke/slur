# Camera framing to the action reference, and the origin-block bug

Date: 2026-09-21. Branch: `feat/test-level`. Uncommitted.

## What changed

| File | Change |
|------|--------|
| `apps/client/app/game/camera/chase.ts` | `CHASE` retuned: `height 7.5 → 4.7`, `back 15 → 7.3`, `backStretch 3 → 1.5`, `lookAtLift 6 → 1.35`. `lookAhead 9.5` and `fov 70` unchanged. |
| `apps/client/app/game/scene/track-blocks.tsx` | Drops `park` + the `prevLethal`/`prevDrag` high-water refs; sets `lethal.count = li` / `drag.count = di` each frame; both `<instancedMesh>` start at `count={ 0 }`. |
| `apps/client/app/game/scene/track-instancing.ts` | `park()` and `_hidden` removed — `track-blocks` was the only consumer. |

`pnpm typecheck` passes. Biome is clean on all three. Repo-wide `pnpm lint` fails on
`test-level-canvas.tsx` (formatting, owner's WIP) plus 6 pre-existing warnings in untouched files —
none from this work.

## The origin-block bug (the "glowing box at the spawn")

Long-standing, reported repeatedly, previously misdiagnosed as part of the ship.

`TrackBlocks` allocates two `InstancedMesh` of `BLOCK_LIMIT = 160`. Three.js initialises every
instance matrix to identity — a 1u cube at the world origin. The old `park( mesh, from, until )`
hid only indices `from → until`, where `until` was **last frame's** count. Instances that had never
been used were therefore never parked, and stayed at the origin for the life of the scene. The ship
spawns at the origin, so the pile sat exactly on it. On `/test-level` (`blockDensity: 0`) all 160 of
both piles were there.

The drag pile is `DRAG_SURFACE` — `emissive #ffa51f`, `transparent: true`, `depthWrite: false`.
Stacked 160 deep it reads as one solid marigold block, and `depthWrite: false` is why it drew
through the hull.

Fix is `InstancedMesh.count`, three.js's own mechanism for "render the first N": it makes the
high-water bookkeeping unnecessary and cannot leave an unparked tail.

**Evidence, if it is ever questioned again:** a scene traversal that filters out `isInstancedMesh`
will miss it — that is the mistake that produced the wrong answer twice. Walk instance matrices
instead. After the fix, the two meshes report `count 0` and a raycast through that pixel returns no
instanced hit. Bloom is *not* involved; the artifact survives `bloom.intensity: 0`.

**Unverified:** whether `hit-spark.tsx` / `explosions.tsx` can leak the same way. Their own
per-slot `park` looked correct and their instances all sat at `y=-9999`, but they were not audited.

## Camera: why these numbers

Measured off `docs/art-direction/golden-reference/action-lighting.png`. FOV is **not** recoverable
from that image: for a level camera over a flat deck every on-deck ratio cancels `f`, so FOV and
camera-height/track-width are indistinguishable. The image is also not a consistent projection —
its verticals are parallel (pitch ≈ 0) while its deck vanishing point sits 215 px above centre
(pitch ≈ 11° down). It is the AI-generated attachment described in `ACTION-LIGHTING.md`.

What *is* measurable, and what actually reads as "wider":

| Cue | Reference | Was | Now (B) |
|---|---|---|---|
| Deck-edge slope from VP (= `height / HALF_WIDTH`, FOV-invariant) | 0.147 | 0.234 | 0.147 |
| Horizon height in frame | 35.8% | ~46% | 37% |
| Ship position | 78% down | 79% | 79% |

`fov` was never the lever — a wider lens leaves the deck-edge angle identical and only shrinks the
ship. Height and pitch are the levers.

`back` is forced, not chosen: the slope pins `height = 0.147 × 32 = 4.7`, and holding the ship at
78% pins `height / back = 0.642`. Hence `back 7.3`. **Known cost:** 7.3u behind a ship up to 6.0u
long is nearly on the tail, because the reference is drawn on a deck ~127u wide against the spec's
64u (`ART_SCALE_REFERENCE.md:33`) — its ship is ~1/50 of deck width where spec is 1/24. All three
cues cannot hold on spec geometry.

Rejected alternative (kept for the record): `height 4.7 / back 15 / lookAtLift 0.2` matches both
deck cues but puts the ship at 58% — the "tiny speck" regression of `ADD.md:138`.

`lookAhead`/`lookAtLift` are one equation in two unknowns; only their implied pitch matters, so
`lookAhead 9.5` was kept and `lookAtLift` solved from it.

## Next steps

- Commit. `docs/DECISIONS.md` ADR-011 still documents the old `height 9 → 7.5` framing and the
  `fov 60 → 70` table at `DECISIONS.md:476`; it needs a follow-up entry for this retune and for the
  reasoning that FOV is not the lever. Not written yet.
- Owner has not yet seen B at speed — `fovStretch 15` opens the lens to 85° at cruise, which walks
  the horizon from 35.6% toward 40%. The match is exact parked and loosest at top speed.
- Decide whether `back 7.3` is acceptable or whether to take the `back 11 / lookAtLift 0.9`
  middle (same horizon and slope, ship at ~65%).
- The origin-block fix deserves its own issue/PR separate from the camera retune.
