# Monoliths parameterized; corridor lighting started

Branch `feat/test-level`. A second agent is working in the same tree on track art —
`track-geometry.ts`, `track-texture.ts`, `test-level-canvas.tsx` and earlier `env-config.ts`
are theirs. Do not stage them.

## Shipped (commit `c0d2dd0`)

Monoliths are parameterized. Five modules under `apps/client/app/game/scene/`:

- `monolith-config.ts` — `MonolithShapeConfig` = taper, chamfer, width, depth, height, below,
  gap, surface, seam. `MONOLITH_SHAPES` holds `box` and `obelisk`; obelisk differs from box by
  taper alone. `MONOLITH_FIELD.shapes` is `[ 'box' ]`, so the field is uniform until someone
  opts in. Box is 12 x 12 x 50u, 60u skirt below the floor, chamfer 0.45u.
- `monolith-geometry.ts` — extrudes a cross-section ring (4 points plain, 8 chamfered) from a
  bottom ring to a top ring scaled by taper. Taper and chamfer are one mechanism. Cached per
  profile on a module singleton.
- `monolith-transforms.ts` — pure body/seam math, plus `shapeAt` (deterministic hash picker).
- `monolith-group.tsx` — one shape's instanced body + seam.
- `monoliths.tsx` — buckets placements by shape.

Seam is configurable: `face` inner|outer, `align` center|near|far. On a corner align it rides
the chamfer face, inset chamfer/2 from both planes and rotated 45 degrees about Y. On a taper
it leans with the face. Verified on screen: seam placement and the chamfer both read correctly.

30 monolith tests, all green.

## Uncommitted

`corridor-light.tsx` (new) and `lighting.tsx` (modified). Two cheap mechanisms, chosen over the
accurate one after weighing five candidates:

- `hemisphereLight` — `#2b3a4d` sky over `#b2650f` ground at 1.2. Fakes floor bounce. Limit worth
  remembering: it lights by surface NORMAL, so it cannot produce a vertical gradient on a
  monolith face; it only separates up-facing from down-facing.
- Four marigold point lights at `x = +/-HALF_WIDTH`, `y = 1.5`, riding the player at `z + [0, 55]`.
  Fixed count at module scope so three never recompiles shaders mid-race. Positions move in one
  `useFrame` off the existing `LocalPlayer/Sim` query. three 0.185.1 has no `useLegacyLights`:
  intensity is candela and falls off inverse-square, so numbers are in the thousands, not units.

`AMBIENT_INTENSITY` (was 0, doing nothing) was removed with its only use.

## What the screen showed

Verified in Chrome against `localhost:5173/test-level`:

- Near monolith faces now carry a warm bottom-up gradient and read as dark graphite. The
  mechanism works. Before the corridor light they were pure black.
- The first attempt at monolith material (metalness 0.82) rendered black. A near-metal has no
  diffuse term and this scene gives it nothing to reflect: `game-environment.tsx` passes
  `light={ false }` to `DeepSpaceSky`, and the drei `Environment` is a deep-space map. Now 0.3.
- Fog is NOT crushing the midground. Distant monoliths lift toward the fog colour and read as
  silhouettes, close to the reference. Earlier suspicion about `fog.far` was wrong.

## Next, in order

1. **The sky backdrop is the brightest large area in frame.** In both golden references the
   backdrop sits below the track in value; here the eye goes to the galaxy, not the corridor.
   Start at `DEEP_SPACE.backdrop.gain` in `sky-config.ts`. This is the biggest single gap.
2. **Rails blow out and flood the floor.** The floor reads mid-grey mush instead of dark with
   tight specular streaks. `RAIL_EMITTER_DECAY = 1` over `RAIL_EMITTER_RANGE = 600`
   (`track-materials.ts`) spreads light thinly and evenly; the reference wants a short, strong
   gradient. Try decay 2 and a much shorter range.
3. **New artifact from the point lights:** a V-shaped hotspot on the glossy floor beside each
   rail, where a point source hits a roughness-0.4 metal. Either drop
   `RAIL_GLOW_INTENSITY`, raise `RAIL_GLOW_LIFT`, or move the stations outboard of the rail.
4. **`ColdKey` is still in the scene** at intensity 1, bearing 0 / elevation 45 — a sun the
   references do not appear to have. Left deliberately so its removal can be judged on its own.
   Try 0 once the above settle.
5. The seam reads thicker and more saturated than the reference's restrained amber. `EDGE_SEAM`
   width/proud are both 0.5u; intensity 2.

## Open departure to record

`docs/ART_MATERIALS.md` M3 specifies monoliths as "rough dielectric ... Metalness 0.0". We ship
0.3 for a graphite-metal sheen. Noted in `c0d2dd0`'s body, not yet folded into the sheet. That
sheet is Claude-owned, so the fix is a decisions-and-departures entry quoting the wording it
changes, per `ART_MATERIALS.md` section 7.
