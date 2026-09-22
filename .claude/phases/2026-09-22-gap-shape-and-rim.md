# Gap shape and gap rim light

Branch `feat/test-level`, worked in parallel with the lighting rebuild
(`2026-09-22-lighting-rebuild.md`) in a second agent. Files touched here are disjoint from that
work: nothing under `lighting.tsx`, `gradient-ibl.tsx`, `game-environment.tsx` or
`track-materials.ts` was edited, only read.

Owner's two asks, from two reference frames of a stepped opening with a lit rim:

1. Gaps are clean rectangular breaks — give them irregular silhouettes, tiles hanging off.
2. Gaps have no edge or seam emissive.

## 1. Rim teeth — `packages/shared/src/sim/gap-teeth.ts` (new)

`FloorSpan` gained optional `z0`/`z1`. Absent means the span covers the whole segment, which every
pre-existing span does, so nothing on the wire or in any generator changed shape.

A gap segment now grows **teeth**: floor spans that protrude *into* the hole from its front and back
rim, one `CELL` row (4u) deep, or two rows for a spur of at most `TOOTH_SPUR_LANES` (2) lanes wide.
`rimTeeth()` walks each hole's lanes, cuts runs of 2–5 lanes, and rolls `TOOTH_CHANCE` per run. A
lane claimed by the front rim cannot be claimed by the back rim.

**The difficulty argument, which is why teeth protrude and never bite.** A tooth only adds floor.
The lanes without one keep today's full `SEG_LEN` (20u) jump, so the hardest line across a gap is
exactly the line that existed before. A tooth that bit *into* the deck would have lengthened some
lanes past 20u and broken the `every ship class clears a one-segment gap` invariant in
`track.test.ts`. Teeth are real floor in `simulate()` — landable, and fair because they are visible.
Nothing here is visual-only: geometry you can fall through is the one thing a racer must not have.

Sim reads that now respect span z: `floorUnder()` (gained a `z` argument) and `bestFloorInSeg()` in
`step.ts`; `maxOpenAtSlice()` in `track.ts`. `isHole()` changed from "no floors" to "no full-length
span", so a full gap that grew teeth is still a hole and still gets no pickup anchor.

`buildRailRuns()` and `buildBoundaryGeometry()` skip non-full spans: a tooth that reaches
`±HALF_WIDTH` must not sprout a boundary rail across the gap.

Seed 20260921, segment 7:

```
x -32..-16 z 140..144 │ x -16..-8 z 140..148 │ x -8..4 z 140..144
x  16..24  z 140..148 │ x  24..32 z 152..160
```

## 2. Rim light — `apps/client/app/game/scene/track-rim.tsx` (new)

`docs/ART_MATERIALS.md` §M8: *"Rim | thin M7 edge definition + slight inner-lip illumination,
gameplay tier"*.

**First cut was wrong and was replaced.** It painted flat quads: a 0.35u strip inset on the deck top
plus a band on the cut wall. Owner's frame of it: *"the glow seam is on the deck panel top or side,
i was expecting it to be literally on the edge"* — the strips read as bands painted near the edge,
never as the edge. Do not go back to inset strips.

The rim is now what the owner asked for: **the edge traced as a line, extruded as a cylinder**. One
`InstancedMesh` of a `CylinderGeometry` (`CORD_RADIUS` 0.12u, 8 radial segments), one instance per
open run, centred exactly on the corner line where the deck top meets the cut wall, so the cord
spills onto the top face and down the wall at once. Each cord is lengthened by `2 × CORD_RADIUS` so
the corners of a stepped rim close. Emissive is `accent()` at `MARIGOLD_REFERENCE_INTENSITY` with
`toneMapped={ false }` — HDR neon per `.claude/rules/r3f-rendering.md`.

Matrices are composed once in `useMemo`; the mesh is built imperatively and mounted through
`<primitive>`, so no per-frame work and no effect beyond disposal.

No cavity, no rubble, unlike the owner's reference frames — same section: *"Behind the walls |
nothing — do not model a cavity surface, do not fill with a black plane"*. Flagged to the owner as a
deliberate departure from the references, not an oversight. Revisit only through the disagreement
procedure in `CLAUDE.md`.

**The defect worth remembering.** The first cut emitted a rim per span edge. Adjacent teeth abut, and
a tooth can abut the corridor deck of a partial gap, so that version drew a glowing line across
*solid* floor, and a deck's cap rim ran straight over the root of every tooth growing out of it. The
rim now probes the real void: `floorAt()` samples the cell (`CELL/2`) beyond each edge, per row or
per lane, and `openRuns()` merges the open cells into runs. The line follows the stepped silhouette
and stops dead at each tooth root. `track-rim.test.ts` asserts the invariant directly — every cord
has floor on exactly one side.

Edge cases that get a cord on purpose: the back edge of the lead-in apron, and the far edge of the
last segment. Both are real drops.

**Not done: the cord does not emit light.** The owner asked for it to light the deck as well as glow.
The mechanism already exists — `emitter-array.ts` patches capsule lights into a standard material,
and `TrackFloor` feeds it the boundary rails. One thing blocks reuse: every slot shares a single
`uEmitterAxis` uniform, fixed to world +z, and the transverse front/back edges of a gap — the ones
that most need the light — run along x. The fix is to make the axis per-slot (`uEmitterAxes[ N ]`
alongside `uEmitters`/`uEmitterTint`, `STRIDE` already 4) and feed the nearest cords from
`TrackFloor`'s `useFrame` next to `buildRailRuns()`. Deliberately not started here: that is the exact
mechanism the lighting rebuild has temporarily zeroed (`RAIL_EMITTER_INTENSITY = 0`), and the other
agent is live in `track-floor.tsx`. Do it once the lighting branch settles.

## 3. Test level — `routes/test-level/test-level-canvas.tsx`

`TEST_LEVEL_SEGMENTS` 40 → 120 (800u → 2400u) and `gapChance` 0 → 1, on owner's request; blocks stay
off. That seed yields 9 gaps (7 full, 2 partial) carrying 31 teeth, first at z=140u:

```
7@140  16@320  40@800  43@860  57@1140  61@1220(partial)  67@1340  86@1720(partial)  99@1980
```

## State

`pnpm typecheck`, `pnpm test` (90 shared / 4 server / 126 client) and `pnpm lint` all green. Nothing
committed — the tree also holds the lighting agent's uncommitted work, so stage by path.

Not done, in rough order of value:

- **The cord must emit light** — see §2. The owner asked for it in the same breath as the cylinder.
- `CORD_RADIUS` (0.12u) and the tooth rate are unverified guesses; only the flat-strip version has
  been seen in a frame, and it was rejected. Fly `/test-level` past z=140u.
- Rim brightness against criterion 5 in `ART_MATERIALS.md` §7 — *"A gap reads as an opening, not a
  seam ... the rim does not perceptually close it"* — is the one real risk of this change, and is
  only judgeable at the lowest camera height with bloom back on.
- `FULL_GAP_FRAC` is 0.4, yet this seed gave 7 full to 2 partial. Worth a look if partial gaps are
  wanted more often.
- Teeth do not vary in height. A dropped or tilted slab is the other half of the owner's references
  and is still absent.
