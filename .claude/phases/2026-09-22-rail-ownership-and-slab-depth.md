# The rail owns its own light, and the deck gets depth

Branch `feat/test-level`. Picks up `2026-09-22-rail-as-its-own-object.md` and
`2026-09-22-owner-numbers-and-the-ship-glow.md`. Uncommitted at handover.

`pnpm typecheck` · `pnpm test` (96 shared + 128 client + 4 server) · `pnpm lint` all green. The 7 lint
warnings are pre-existing and in files this session did not touch.

## The question that opened the session

Owner: *"i am pretty sure the rails is still generated as part of the deck. i tried keeping only the
TrackFloor component in the TrackView component and expected the rails to vanish, but surprisingly the
rails still showed up."*

The observation was right, the diagnosis was not. Three measurements settled it.

1. **The shared descriptor has no rail.** `grep -rn "rail\|boundary" packages/shared/src/` returns
   nothing. A `FloorSpan` is `[ x0, x1, y ]`; a `Segment` is
   `[ index, z0, z1, blocks, isFinish, kind, floors ]`.
2. **Generated spans never leave ±32.** Built a real procgen track through `resolveTrack(
   procgenDescriptor( 1 ) )` and walked 61 segments: 76 floor spans, x range exactly `-32 .. 32`,
   nothing outboard.
3. **One file draws geometry outboard of ±32.** Every client use of `HALF_WIDTH` accounted for:
   `track-rail.tsx:34-37` is the only geometry in `[32, 34]`. `track-rails.ts:42` is an emitter
   position, `monolith-transforms.ts:14` is placement, `finish-gate.tsx` is the gate posts,
   `track-geometry.ts:22` is a predicate.

**What the owner was actually seeing was the light, not the rail.** `TrackFloor` owned the rail
emitters — `patchEmitterLight` on its own material *and* `feedEmitters`. Unmounting `TrackRail` left a
full-length marigold line light at x = ±33, y = +0.5, with the deck slab's own 2u side wall at ±32 a
single unit away from it. That lit wall is the band.

## The emitter feed moved to TrackRail

Owner: *"move the emitter feed into TrackRail."*

**`track-rails.ts`** now owns it, next to `RailRun` and `railRunDistance`, so the runs and the light
that stands in for them cannot drift apart:

- `feedRailEmitters( uniforms, runs, z, camera, intensity, range )` — the old `feedEmitters` verbatim
- `selectNearest` and the `_view`/`_axis`/`_near`/`_dist` scratch, now module-private
- `RAIL_COLOR = accent()` and the `RAIL_EMITTER_LIFT` import came with them
- **`clearRailEmitters( uniforms )`** — new; parks all 12 slots and zeroes `uEmitterCount`

**`track-rail.tsx`** calls it. The existing `useFrame` took a `{ camera }` parameter and gained three
lines: `uEmitterDecay`, the `LocalPlayer`/`Sim` z lookup, and the feed. Plus the piece that actually
answers the owner's complaint:

```tsx
// The emitter uniforms are a module singleton outside React: unmounting must park the slots this rail owns.
useEffect( () => () => clearRailEmitters( railEmitters ), [] );
```

Without it the uniforms keep their last-written values forever and unmounting the rail leaves a frozen
glow on the deck. **Unmounting `TrackRail` now removes the rail *and* its light** — which is what the
owner expected in the first place.

`TrackRail` still does **not** patch the emitter shader onto its own materials. Feeding the uniforms
and being lit by them are separate; the self-lighting bug in the previous handover was the latter.

**`track-floor.tsx`** kept only `patchEmitterLight( mat, railEmitters )` and lost ~40 lines: `useWorld`,
`LocalPlayer`/`Sim`, `buildRailRuns`, the `runs` memo, the emitter tunables, `accent`. `THREE` became a
type-only import. It is now the slab, lit by the rail, knowing nothing about where the light comes from.

## Bloom on the rail strip — the double tone map

Owner: *"lets bring back the bloom on the emissive."* The strip was flat clipped yellow with no halo,
while the gap rims and monolith seams glowed.

**Verified-this-session against the installed package.** R3F 9.7.0 sets
`gl.toneMapping = ACESFilmicToneMapping` unless `flat` is set —
`@react-three/fiber/dist/events-156d8d12.esm.js:15903`:

```js
gl.toneMapping = flat ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
```

Nothing in this repo overrides it. So the pipeline is **double tone-mapped**: every material
ACES-compresses in its own fragment shader, `SceneBloom` then thresholds at `bloom.threshold` 0.9 on
that already-compressed value, and `ToneTuning` applies AGX on top. ACES is asymptotic to ~1.0, so an
`emissiveIntensity` of 2 lands just under 0.9 and never crosses.

Every other marigold emissive escapes this. `track-rim.tsx:117` sets `toneMapped: false`;
`mono.seam` brute-forces intensity to 10. `BOUNDARY_SURFACE` was the only one doing neither.

Fix, one line in `track-materials.ts`:

```
 export const BOUNDARY_SURFACE = {
     emissive: MARIGOLD_EMISSIVE,
     emissiveIntensity: MARIGOLD_REFERENCE_INTENSITY,
     color: '#15171a',
+    toneMapped: false,
 } as const;
```

**`rail.emissive` will want re-dialling.** It sat at 2 against a ceiling it could never cross, so the
same number is a genuinely different brightness now.

### The larger wart, deliberately not fixed

The clean fix is `<Canvas flat>` — renderer at `NoToneMapping`, composer does the one tone map, which
is how `postprocessing` expects to be driven. It re-grades **every** surface in the scene at once, and
the owner is mid-way through settling deck and fill numbers. Left for a session of its own. Until then
`toneMapped: false` is the per-material escape hatch and every emissive needs it.

## Numbers the owner changed, and the ones that followed

**`RAIL_EMISSIVE_SHARE` 0.8 → 0.5**, by the owner, after the rail read as a wide raised kerb. Note this
is *not* `RAIL_W`: the rail box is still 2u, inner face ±32, outer ±34. The lit strip went 1.6u → 1.0u
and `RAIL_MARGIN` is derived, so the metal margins went 0.2u → 0.5u. Monoliths did not move
(`RAIL_OUTER = HALF_WIDTH + RAIL_W`), collision untouched. This is the cheap version of the
"rail top face far wider than the reference's cord" item the previous handover left open.

On the "raised" complaint: the rail **is** flush, asserted by `track-rail.test.ts:45-55`
(`expect( highest ).toBe( 0 )`). What reads as raised is the 2u outer wall visible past the strip plus
the unlit margin reading as a shadow line at the base of a step.

**`SLAB_THICKNESS` 2 → 24**, this session, at the owner's ask (*"a big number of something like
20 - 32u"*), after establishing the deck was 2u and not the 1u they remembered. The 1u is Board 07's
number, which `ART_SCALE_REFERENCE.md:36` explicitly declines to adopt: *"not a sim constant. The sim
floor is a plane; thickness is pure art."*

**Verified that claim rather than trusting it:** `SLAB_THICKNESS` appears nowhere in `@slur/shared`;
the sim's floor is the plane `f.y` (`step.ts:85-90`, `134-140`). Raising it is one constant with zero
sim consequence. `track-rail.test.ts:54` asserts `lowest === -SLAB_THICKNESS`, so it tracked the change
on its own and rail and deck still present one flush underside.

### `deathY` is the one thing that interacts

`packages/shared/src/constants.ts:80` — `deathY: -6`. A ship in a gap dies at y = −6.

- At the old 2u it cleared the slab underside and fell 4u through open space first.
- At 5u (tried this session, then superseded) there was 1u of clearance — nearly nothing.
- At **6u** the underside sits exactly at `deathY`; the ship would die level with the slab bottom,
  flanked by wall the whole way down. **Do not use 6.**
- At **24u** death happens a quarter of the way down a trench, which reads as falling into a pit. No
  change made. If it feels too quick, `deathY` is server-authoritative and lengthens every gap death —
  the owner's call, not a quiet edit.

## Files touched

| File | Change |
|---|---|
| `track-rails.ts` | gained `feedRailEmitters`, `clearRailEmitters`, `selectNearest`, scratch vectors |
| `track-rail.tsx` | feeds the emitters, parks them on unmount, `{ camera }` in `useFrame` |
| `track-floor.tsx` | lost the feed and ~40 lines; keeps only `patchEmitterLight` |
| `track-materials.ts` | `BOUNDARY_SURFACE` gains `toneMapped: false` |
| `track-geometry.ts` | `SLAB_THICKNESS` 2 → 24 |
| `track-view.tsx` | restored all four children; `biome format` for `{track}` → `{ track }` |
| `docs/ART_SCALE_REFERENCE.md` | rows 41-43: slab depth 24u, emissive share 50% / 1.0u, margin 0.5u |

`RAIL_EMISSIVE_SHARE` in `track-geometry.ts` was changed by the owner, not this session.

## Next, in order

1. **Look at 24u live.** The underside is now a large `DOWN`-facing quad at −24 with nothing lighting
   it — near-black. Fine against space, but it may read as a void rather than a solid. If it is wrong,
   the cheap fix is the gap-edge walls, not the underside.
2. **Re-dial `rail.emissive`** now that the strip actually blooms.
3. **`deathY`** — leave or lower, per the trench read.
4. The `<Canvas flat>` tone-mapping cleanup, as its own session.

## Still open, inherited and untouched

- **Inboard amber deck seams.** `cruise-lighting.png` carries marigold across the full track width;
  our floor only has `isOuterEdge` rails. Content, not a dial.
- `ART_MATERIALS.md` §7 decisions-and-departures entries — now ten. Hand to the owner for Codex; never
  edit `docs/art-direction/` directly.
- `ART_MATERIALS.md` M3 specifies monoliths as *"rough dielectric … Metalness 0.0"*; we ship 0.3.
- Panel is `/test-level` only.
- **Revert before merge**: fog (`game-environment.tsx`) and the sim freeze on `P` (`dev/sim-freeze.ts`).
- Nothing committed. The tree also holds gap-teeth/rim work from a parallel agent — stage by path.

## Trap avoided, worth keeping

The previous handover burned a session hunting a live-scene handle (`fiber._roots` is empty because the
Vite pre-bundled dep is a different module instance). **This session used measurement instead**: a
node script against `packages/shared/dist` to walk a real track's spans, and `grep` over every
`HALF_WIDTH` use. Both were decisive in one shot and neither needed the browser. Prefer building the
descriptor in node over probing the running scene when the question is about geometry.
