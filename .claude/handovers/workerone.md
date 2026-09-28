Agent: workerone · Lane: #354 fake deck reflections (owner-approved A+B+C) · Updated: 2026-09-28 23:30

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#354: warm additive streaks on the deck under rails, block seams, pickups and exhausts, like
`docs/art-direction/golden-reference/cruise-lighting.png` (LOOK only). Every tier, near-zero cost.
Then, as a SEPARATE commit with its own measurement: stronger deck Wear maps + deck anisotropy.

Owner decisions (via supervisor): approach A+B+C approved. v1 has NO stencil: measure and report
how often a streak floats over a gap lip. Exhausts are IN v1. Do not touch canvas-gl.ts or
scene-effects.

## Done

- `3c576aa` part 1, **typecheck + lint + 318 scene tests pass, NOT verified on screen**:
  - `deck-reflection/deck-reflection.ts`: shared uniforms, `updateReflection( u, deckMat )`,
    `streakMaterial( shared, emitterGlsl, extra )`, `streakQuads( slots )`. Each source provides
    GLSL `bool reflEmitter( out vec3 base, out float h0, out float h1, out float power, out float point )`.
    Streak length is the mirror geometry `d·h/(H+h)`. Fragment: line/spot profile, distance fade,
    grazing, deck roughness fetched per plate via `deckTileUv`.
  - `deck-reflection/rail-sheen.ts`: deck patch (chainShaderPatch, tag `rail-sheen`), injected after
    `#include <emissivemap_fragment>`, uses `roughnessFactor`. Wired in `track-floor.tsx`.
  - `deck-reflection/deck-reflection.state.ts`: `reflection` singleton, updated in TrackFloor useFrame.
  - `block-reflections/`: InstancedMesh sharing the sealed blocks' instanceMatrix + aSealedSeams +
    aSealedVariation; count and matrix synced in `onBeforeRender`; `dispose={null}`. Mounted in
    `track-blocks.tsx`. Culls seams on faces turned away from the camera.
  - `deck-breakup.ts` now exports `DECK_HASH_GLSL` and `DECK_TILE_GLSL` (same emitted text).
  - `Reflect.*` dials in `tuning-schema.ts` (strength, stretch, length, width, falloff, fadeNear,
    fadeFar, grazing, roughMix, railSpread, rail, block, pickup, exhaust).

## State

- workertwo #350 (committing soon): aSealedSeams layout unchanged, count can be 4, extra seams on
  the front face. The block emitter decodes every slot, so it is compatible [inferred from code].
- Default dial values are guesses. Tune them on screen.
- Draw cost: +1 draw so far (blocks); rails +0 [unmeasured].

## Uncommitted

- none of mine. The tree shows workertwo's #350 files as modified (sealed-block-variation*,
  track-blocks.utils*). Not mine, do not commit them.

## Held files

- Claimed and cleared: `deck-reflection/*`, `block-reflections/*`, `pickup-reflections/*` (new),
  `exhaust-reflections/*` (new), `track-floor/track-floor.tsx`, `track-blocks/track-blocks.tsx`,
  `pickup-field.tsx`, `exhaust-field/exhaust-field.tsx` + `exhaust-field.utils.ts`,
  `dev/tuning-schema.ts`, `deck-breakup.ts`, `docs/DECISIONS.md`, `docs/ART_MATERIALS.md`.
  Part 2 adds `track-materials.ts` (claim it when you get there).

## Next

1. **Pickups:** `pickup-reflections/pickup-reflections.tsx` (+ `.utils.ts`, `.constants.ts` GLSL).
   Use a plain `<mesh>` with an `InstancedBufferGeometry` (streakQuads(1)) plus an instanced
   `aPickup` vec4 (x, deckY = anchor.y, z, alive), built once from `pickupsOf( track )`. Per frame,
   loop the anchors, set alive = !isPickupTaken(id), and set needsUpdate only when a value flips.
   Emitter: point = 1, h0 = h1 = PICKUP_HOVER (combat-look.ts, 3.2). Gain = Reflect.pickup. Mount it
   in `pickup-field.tsx`. Add a utils test.
2. **Exhausts:** add an `aDeckY` InstancedBufferAttribute(MAX_PLUMES). In `writeShip` (pass track),
   compute `floorBelow( track, x, y, z )` once per ship (`ship-shadow/ship-shadow.utils.ts`); use
   -1e5 when there is no floor. `exhaust-reflections.tsx`: InstancedMesh sharing ExhaustField's
   instanceMatrix + aDrive + aDeckY via onBeforeRender, `dispose={null}`. Emitter: origin =
   instanceMatrix[3].xyz, h = origin.y − aDeckY, skip if h < 0 or h > ~6, power = aDrive.z.
   Gain = Reflect.exhaust.
3. Verify on /test-level in headless Chrome (DPR 1, muted, kill it afterwards): look against the
   golden crop, then tune the defaults. Check that the rail sheen shows and that the block streaks
   point toward the camera.
4. Measure (perf-analysis skill, `scripts/perf.mjs`): `?quality=low` and `?quality=high`, reflections
   off vs on, count draws. Count gap-lip artefacts over a drive.
5. ADR in `docs/DECISIONS.md` + ART_MATERIALS note. Commit. Close #354 with SHAs after part 2.
6. **Part 2 (separate commit):** (a) widen Wear ranges (metalMin/metalMax, roughSpan, valueSpan),
   with before/after taps. (b) Deck anisotropy. The supervisor verified that in three 0.185.1,
   Standard and Physical compile ONE 'physical' program (WebGLPrograms.js:36-37), and anisotropy
   compiles only when > 0 (WebGLPrograms.js:140). So use MeshPhysicalMaterial with the extras at 0.
   Do NOT hand-copy chunks. Check that `#define PHYSICAL` (ior/specularIntensity) is a no-op at
   metalness 1. Measure the low tier before excluding it. Dials Deck.anisotropy +
   Deck.anisotropyRotation (along the track); consider anisotropyMap for brushed scratches. Check
   that chainShaderPatch/deck-breakup still work. workerthree may send Metal.baseColor/roughness
   values to fold in.

## Open questions

- none new. RFC-349 §8 Q1–Q10 are still with the owner.

## Lessons → memory

- `.claude/memory/share-instance-buffers-via-onbeforerender.md`
