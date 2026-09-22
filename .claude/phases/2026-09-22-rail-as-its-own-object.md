# The rail becomes its own object, flush and 2u wide

Branch `feat/test-level`. Continues `2026-09-22-corridor-lighting-bisect.md`.

Uncommitted at handover. `pnpm typecheck`, `pnpm test` (132 client tests) and `pnpm lint`
(biome, ls-lint, canvas-isolation, comment ratchet) all pass.

## What the owner asked for

A 2u-wide box running along each deck edge, **sitting flush with the deck and not rising above
it**, every face metal with the same treatment as deck and monolith, and 80% of the section
emissive marigold — 1.6u lit, 0.2u metal margin each side.

Two clarifications were taken before any code:

1. Emissive on **top + inner face** was chosen first, then withdrawn: a flush top buries the inner
   face against the deck slab, so there is nothing there to light. The owner then chose **flush
   inlay, top strip only**.
2. The owner stopped the first implementation mid-flight to ask whether the rail was being built
   as part of the deck. It was — see below. **The rail is now its own mesh.**

Rail metal takes **its own `SurfaceParams`**, seeded to the deck's current values, not the deck's.

## What shipped

**`apps/client/app/game/scene/track-rail.tsx`** — new. One mesh for the whole track, built from the
same `RailRun` list that feeds the rail emitters, so geometry and lighting cannot drift apart.

Faces: top (three x-strips), outer wall, underside, and an end cap at each end of every run.
**No inner face** — the deck slab's own side wall at ±32 already seals that plane and drawing both
would be coincident geometry. Two geometry groups: 0 metal, 1 marigold.

`track-geometry.ts` now holds the section:

```
SLAB_THICKNESS      = 2      (moved here from track-floor.tsx)
RAIL_W              = 2.0    inner face ±32, outer face ±34
RAIL_EMISSIVE_SHARE = 0.8    -> 1.6u lit
RAIL_MARGIN         = 0.2    RAIL_W * (1 - SHARE) / 2
```

`BOUNDARY_W` and `BOUNDARY_H` are gone. `track-boundary.tsx` and `track-boundary.test.ts` are
deleted; `track-rail.test.ts` replaces the latter.

**The deck stopped lending the rail its faces.** This was the owner's catch. `track-floor.tsx`'s
`emitSpan` used to extend itself outboard at an outer edge — `sideL = x0 - w`, drawing the rail's
outer wall and underside in deck material, while `track-boundary.tsx` drew only the lit top cap and
inner face. So the old rail was half deck mesh, half boundary mesh. `emitSpan` lost `w`, `h` and
the `outer` flag; it now draws the slab from `x0` to `x1` and stops. `buildSpanGeometry` lost two
parameters.

**`RAIL_EMITTER_LIFT` moved** from `buildRailRuns` to the emitter write in `track-floor.tsx`. Runs
now carry pure geometry (`y` = deck top); the 0.5u lift is applied only where the virtual line
light is placed.

**New `rail.*` tunable group** (`metalness 0.9`, `roughness 0.35`, `envMap 1`, `normalScale 0.8`,
`plate 4u`, `plateColor #23272a`) plus `railSurfaceParams()` in `track-texture.ts` and
`railBodySurface()` in `track-materials.ts`. `plateSurface()` gained a `normalScale` parameter —
it previously read `deck.normalScale` for every caller, monoliths included. Monoliths still pass
`deck.normalScale`, deliberately: giving them their own is a separate change nobody asked for.

`monolith-transforms.ts` — `RAIL_OUTER = HALF_WIDTH + RAIL_W`, so monoliths moved 1u outboard
(33 -> 34) as a consequence of the wider rail.

`docs/ART_SCALE_REFERENCE.md` §1/§1a updated: the rail table rows, and a new paragraph recording
that the rail is its own mesh with no inner face and why.

## BUG FOUND AND FIXED — the rail was lighting itself

The owner looked at the result and said the rail still read as raised and **fully** emissive, like the
old object. They were right that something was wrong, and the cause was mine.

**`track-rail.tsx` called `patchEmitterLight( metal )` on the rail's own metal material.** The rail
emitter is a virtual line light standing in for the emissive strip, placed `RAIL_EMITTER_LIFT` =
0.5u above the run and tuned to carry ~30u to the deck centre. Patching it onto the rail's own metal
puts that light **0.5u from the surface it lights**, so `getDistanceAttenuation( 0.5, 690, 2 )`
saturates it. The 0.2u margins came out exactly as bright as the 1.6u strip, and all 2u read as one
solid emissive bar — indistinguishable from the old fully-emissive rail.

Bisected in the browser, both steps decisive:

| Probe | Result |
|---|---|
| `rail.emissive` 2 -> 0 | band **unchanged** — so it was never the emissive strip |
| `emitter.intensity` 10 -> 0 | band **gone entirely** — it was the metal, lit by the emitter |

Fix: `track-rail.tsx` no longer patches the emitter light onto its metal, and the
`emitter-array` import is dropped. **The rail is the light source; it must not be lit by itself.**
The margins now take only IBL and fill, which is the dark-metal-framing-the-glow read that was asked
for. Both sliders were restored (10 / 2) after the probe.

Gates re-run after the fix: typecheck, canvas-isolation and comment ratchet all pass.

**Still not resolved by the fix:** at close range bloom still blows the strip wide enough to swallow
the 0.2u margins. The band is visibly narrower than before, but the metal frame does not yet read
from the chase camera. That is the `RAIL_EMISSIVE_SHARE` / bloom question below, now cleanly
separated from the self-lighting bug.

## The finding that matters more than the code

**A flush rail has no shape from the chase camera.** Verified on `/test-level` this session.

Everything visible of it is the glow line. The top face is the only face pointed at the player;
at chase-cam grazing angle its 2u foreshortens to roughly ten screen pixels at the nearest point.
Bloom then blows the 1.6u strip into a halo wider than the geometry and swallows the 0.2u margins
whole. The outer wall and underside are never in frame.

So **the 2u width, the metal treatment and the margins do not reach the player's only camera.**
The result is visually near-identical to the old 1u raised rail, because the lit part is the same
flat stripe in both. The owner noticed this and asked whether the change had applied at all.

The flush-versus-raised choice was made on a cross-section diagram — a view the player never has.
`ART_MATERIALS.md` M7 records the raised option as a **DEPARTURE** from board 24 panel 02 and the
flush one as the compliant alternative; the compliant one appears to cost the rail its readability.
**This is unresolved and is the first thing to settle next session.** Options, cheapest first:

1. Keep flush, lower `RAIL_EMISSIVE_SHARE` to 0.6 – 0.7 so the margins survive bloom. One constant.
2. Keep flush, let the **outer wall** carry the metal read — it is 2u tall and catches a silhouette
   against space where the top margins cannot. Free; it is already metal.
3. Go back to raised. The vertical inner face is the only surface that stands into the frame.

## Blocker, still unresolved and now confirmed live

The second agent from the previous handover **is still in this tree and editing it right now**.
`track-floor.tsx` was modified at 09:22:21, after my last edit to it — a `Render` trait added to
the ECS import that I did not write — and Vite hot-reloaded the scene every few seconds during the
browser pass. `track-rail.tsx` is untouched by them so far.

`track-floor.tsx` and `track-materials.ts` are now files we are both editing. Take a worktree or
have them stand down before the next pass.

## Still open, inherited

- `ART_MATERIALS.md` M7's departure note now describes the flush alternative as what we build. It
  needs a decisions-and-departures entry per that sheet's section 7. The other agent is editing
  that file; hand it to the owner for Codex rather than editing it here.
- `ART_MATERIALS.md` M3 specifies monoliths as *"rough dielectric ... Metalness 0.0"*; we ship 0.3.
- The corridor lighting rebuild described in the previous handover has **not** started.

## Trap hit this session — reaching the live scene

The previous handover's recipe no longer works:

```js
const fiber = await import('/node_modules/.vite/deps/@react-three_fiber.js');
const st = [...fiber._roots.entries()][0][1].store.getState();
```

`fiber._roots.size` is **0**. The Vite pre-bundled dep is a different module instance from the one
the app holds, so the roots map read through that import is empty. `canvas.__r3f` is also absent —
only `__reactFiber$*` / `__reactProps$*` are on the element. Walking the fiber tree up from the
canvas looking for a store with `.scene` also failed.

Three attempts, then stopped per the rabbit-hole rule. **What worked instead was bisecting with the
tuning panel's own sliders** — zero the suspect, screenshot, restore. That found the self-lighting
bug in two moves after the live-scene handle had wasted five. Prefer it: it needs no handle, it
cannot leave an irreversible probe mutation behind (every slider restores), and it tests the thing
the player actually sees.

**Trap: the panel renders at 1 fps under the extension**, so a screenshot taken straight after a
slider change captures the *previous* frame. A probe looked like it had failed when it had already
worked. Screenshot twice, or read the panel's own value field to confirm the change landed before
judging the image.

**The geometry was also verified by the unit tests**, which is stronger evidence anyway: `track-rail.test.ts` asserts the strip is
exactly `RAIL_W * RAIL_EMISSIVE_SHARE` centred with `RAIL_MARGIN` each side, that nothing sits
inboard of ±`HALF_WIDTH`, that the top never rises above the deck, that the box drops
`SLAB_THICKNESS`, that no inner face is emitted, and that the two groups map to material indices
0 and 1. Do not burn another session on the live-scene handle; find it once and write it down here
if you do.

## Note for whoever edits track-rail.tsx

It exports both `buildRailGeometry` and `TrackRail`, so Vite logs
`Could not Fast Refresh ... consistent-components-exports` and does a full invalidate on every
save. That is the cost of keeping the pure builder testable in the same file as its component;
`track-floor.tsx` has the same shape and the same message. Harmless, but it means every rail edit
rebuilds the whole scene rather than hot-swapping.
