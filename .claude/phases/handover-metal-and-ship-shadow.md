# Handover — one metal, tuneable base colour, ship contact shadow

Date 2026-09-23. Working tree only, nothing committed, nothing staged by this session.

## What the owner asked for

Three things, in one message:

1. A **penumbra shadow below the ships**.
2. **All metal materials at metalness 1.0, roughness 0.25**.
3. A **consistent, tuneable base colour** across the materials.

Two decisions were put to the owner and answered:

- Shadow mechanism → **blob decal per ship** (not shadow maps, not `ContactShadows`, not a
  screen-space pass).
- Metal scope → **deck, rail, monolith, block, ship hull**; asteroids stay stone.

## State: all three land

`pnpm typecheck`, `pnpm lint` and `pnpm test` (177 client, 4 server, shared) all pass. `/test-level`
renders without a console error or a crash.

All three asks are in. The shadow renders; what remained was a defaults problem, now fixed.

### Done — metal consolidation

`apps/client/app/game/scene/graphite.ts` is **deleted**, replaced by
`apps/client/app/game/scene/metal.ts`:

```ts
export const METAL_BASE_COLOR = '#7c8590';
export const METAL_MAP_TINT = '#ffffff';
export const METAL_METALNESS = 1;
export const METAL_ROUGHNESS = 0.25;
```

Every `GRAPHITE_*` import was repointed. `Deck.*`, `Rail.*`, `Monolith.*` and `Block.*` metalness and
roughness now all default off these two numbers, and `Block.roughness` lost its own 0.52 default.

Two latent bugs fixed on the way:

- **`Block.metalness` was a dead key.** Declared in `tuning-schema.ts`, read by nothing —
  `track-blocks.tsx` only ever set `roughness`, `envMapIntensity` and `normalScale`. Now wired.
- **Obstacle blocks *are* the sealed blocks.** `track-blocks.tsx` builds them from
  `sealedBlockGeometry` + `SEALED_BLOCK_SURFACE`. They were presented to the owner as a separate
  option from "block" by mistake; the owner selected "block", so `SEALED_BLOCK_METALNESS` moved
  `0 → 1.0` and `SEALED_BLOCK_TINT` (`#c8dcf0`) folded into the shared tint. **Worth re-confirming
  with the owner** — it removes the deliberate dielectric-vs-bare-metal finish contrast between
  blocks and deck.

### Done — one tuneable base colour

Two keys, because colour reaches the two metal groups by different operations:

- **`Metal.baseColor`** (default `#7c8590`) — literal albedo for the procedurally-drawn metals:
  deck plates, rail plates, ship hulls. Replaces `Deck.plateColor` and `Rail.plateColor`, which are
  gone from both the schema and the panel.
- **`Metal.mapTint`** (default `#ffffff`) — multiplies the `Metal046B` photographic albedo on blocks
  and monoliths, where a mid-grey base colour would darken rather than set the value.

Collapsing them into one key would put two different operations under one name. Both default to what
already shipped, so this change is plumbing, not a look change.

The ship hull now picks the colour up **live** each frame: `ship-model.tsx` collects hull materials
once into a ref (`collectHulls`) and re-applies `col('Metal.baseColor')` in `useFrame`. Previously it
read a constant once at patch time and was not tuneable at all.

### Done — the docs

`docs/ART_MATERIALS.md` is at **revision 7**. §7 gains item 12 and §8 gains a review-log entry. The
substance to know:

- **Metalness 1.0 closes a departure.** §7 item 9 recorded `FLOOR_METALNESS` at 0.75 against M1's
  `| Metalness | 1.0 |`. Now resolved, not extended.
- **Roughness 0.25 opens one.** M1 specifies `| Roughness | 0.35 – 0.50 |` and M2 `0.45 – 0.60`.
  0.25 is below both floors. Recorded as a tuned override, not a new range.
- **§4 criterion 2 now has two ungated changes behind it** — this one and revision 6's monolith move.
  Both erode the hazard-vs-scenery material separation. The re-gate has not been run.

### Done — the ship contact shadow

`apps/client/app/game/scene/ship-shadow.tsx` is new. `ShipShadow` mounts as a **sibling** of the ship
group (not a child — `syncRenderSystem` sets `grp.rotation.z` for bank roll, which would tilt a child
blob). `track` is threaded `WorldScene → Ships → ShipView → ShipShadow` for the floor query. The blob
is a `planeGeometry` + `shaderMaterial` with a radial `pow(1 - d, softness)` falloff; radius grows and
opacity falls with height above the floor, which is the penumbra read. Eight `Shadow.*` tuning keys,
all on the panel.

Verified drawing: forced green, it covers 7462 px, bbox `x 583..816 y 460..523`, correctly
foreshortened under the hull.

**Defaults changed after a look:** `Shadow.opacity` 0.55 → **0.8**, `Shadow.softness` 1.6 → **1.2**.
At the original values the blob was invisible against the deck, which roughness 0.25 made
considerably brighter. This was the only real defect.

**Still to tune, at speed rather than at rest.** `slur-supervisor`'s commit a50049f made `Hover.*`
visibly move the ship: the chase camera used to follow the hover lift 1:1, so the ship stayed pinned
in frame. It now genuinely rises (~1.25u on the Freighter), so `height = y - floor` sees a real range
instead of a near-constant one. `Shadow.spread` and `Shadow.blur` want a flown pass.

## Method notes worth keeping

- **`toneMapped={false}` is banned project-wide** by `.claude/rules/r3f-rendering.md`. I wrote it
  into the shader material and had to strip it.
- **Eyeballing brightness lies, again.** The first frame tap made the deck look blown out white at
  roughness 0.25. It measures `rgb(45,49,56)`. The existing memory note on this was right and I
  nearly reported a regression that does not exist. Measure, always.
- **The frame tap can be answered by the WRONG TAB.** `/__frame-tap` is served by whichever page responds, and `slur-supervisor` also keeps a `/test-level` tab on :5173. Use CDP `Page.captureScreenshot` against the tab you are actually driving.
- **Frame-tap A/B on this scene is contaminated.** Two taps differ across ~188k pixels including the
  sky, because asteroids drift. `KeyP` (`sim-freeze.ts`) holds the sim but **does not stop the
  asteroid drift** — a frozen A/B still differed across the full frame bbox. For presence questions
  use an absurd unmistakable colour and scan for it in a single tap; that is what finally gave a
  clean answer.
- **Driving the live tuning module over CDP is a TRAP after an edit.** Vite HMR serves the module as
  `/app/dev/tuning.ts?t=<ts>`, so `import('/app/dev/tuning.ts')` resolves to a SECOND instance with its
  own state. Every `setNum`/`setCol` goes into the orphan and the page never sees it — this is what
  produced a whole session of false "the shadow does not render" readings. Worse, the orphan's
  `remember()` still writes through to the shared `slur.tuning.v1` localStorage key, so debug values
  leak to every tab on the origin at its next reload. To force a value, grab the object off `window`
  in `useFrame` and pin the uniform against the per-frame overwrite:
  `u.uColor.value.set = () => u.uColor.value` plus an `Object.defineProperty` getter on `uOpacity`.
- **`material.program` is not a "was this drawn" probe.** In three 0.185 it is not a public field —
  all 30 meshes in the scene report it false, including ones visibly drawing.
- A CDP eval helper, a screenshot helper and a dependency-free PNG decoder are in the session
  scratchpad; each is ~40 lines and worth rewriting if useful.
- **The tuning store is `localStorage` per origin**, so the extreme debug values above persist. They
  were reset to defaults at the end of the session, and `simFreeze` was turned back off.

## Left undone

1. **Tune `Shadow.spread` and `Shadow.blur` during a flown pass**, not at rest — see the shadow
   section. Small, and not blocking.
2. **Re-confirm the sealed-block metalness change** with the owner (it was selected under a
   mis-framed question).
3. **Re-gate `ART_MATERIALS.md` §4 criterion 2** — hazard vs scenery in the Monolith Field sector, at
   cruise speed, against both revision 6 and revision 7.
4. **Height fog is still unbuilt.** The owner asked for ground fog whose density varies with world Y,
   not camera distance. Verified this session in three 0.185.1: fog is `vFogDepth = -mvPosition.z`
   only (`fog_vertex.glsl.js`), both `Fog` and `FogExp2` branches consume only that
   (`fog_fragment.glsl.js`), and `WebGLMaterials.js:25-40` feeds exactly four uniforms. So `FogExp2`
   cannot do it and extra uniforms need their own plumbing. Preferred route was patching the four
   `THREE.ShaderChunk` fog chunks globally with the analytic height-fog integral, fallback a custom
   pass in the existing `EffectComposer`. No issue filed yet.

## The tuning store can silently mask a changed default

Verified 2026-09-23. **Changing a default in `tuning-schema.ts` may have no runtime effect**, and the
code looks right while the scene ignores it. Both `Shadow.opacity` 0.55→0.8 and `Shadow.softness`
1.6→1.2 were dead at runtime until purged.

**Mechanism.** `tuning-persist.ts` `restore()` returns the stored value when `entry.from === fallback`
— `from` records the default in force when the value was written, so "same default, different value"
reads as a deliberate override and wins. That is correct. The failure is that a page open across an
HMR schema edit re-registers the panel and writes `from` = the NEW default while leaving `value` at
the OLD one, producing `{value: 0.55, from: 0.8}`. The "the default changed" signal is destroyed, and
the stale value now outranks the schema permanently.

**Two aggravators.** `remember()` does a whole-map `setItem` from a module-level `stored` snapshot
loaded once at init, so an external purge is undone by the next knob move in **any** open page on
that origin. And the store is per **browser profile**, not merely per origin — a headless debug
profile and the owner's Chrome hold independent copies, so purging one proves nothing about the
other. `slur-supervisor` and I each purged our own and each saw the other's as a "resurrection".

**How to apply.** After changing a default, verify at runtime rather than trusting the file: read
`slur.tuning.v1` and check `value === from`. Purge with no other tab open on the origin. Expect every
profile to need it separately.

**Worth fixing properly** (not done, not filed): `restore()` should not treat a rewritten `from` as an
override — e.g. only persist an entry when the user actually moves the control, rather than letting
panel re-registration write back. That would make a schema default change authoritative, which is what
every reader assumes it already is.
