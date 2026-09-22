# Owning the BloomEffect, and blocks get their real maps

**Date:** 2026-09-22 · **Branch:** `dev` (commit `6726322`)

Picks up [[2026-09-22-block-surface-and-the-fresnel-trade]]. Its Next #1 (judge the chamfer and the
seam flicker) is **still not done**. Its Next #2 (issue #166) is **done and verified**. Its Next #3
(the block texture) changed shape on owner direction and is **written but not yet looked at**.

## The tab freeze, measured instead of guessed

Two previous handovers reported the backgrounded-tab freeze. This session **measured** it, which is
cheaper than another black screenshot:

```js
{ hidden: true, visibility: "hidden", focus: false, frames: 0 }   // 0 rAF frames in 1.2s
```

Foregrounded, the same probe gives `{ hidden: false, frames: 26 }` — ~52fps. **Run that probe before
any screenshot.** A black canvas with a blank per-frame HUD readout and a clean console is the
freeze, not a rendering bug, and no amount of scene debugging will move it.

The constraint is structural and worth stating plainly: **the owner cannot read chat and hold the
Chrome window in front at the same time.** Art judgement by a driven tab needs the owner to
foreground the window and then stay out of the terminal. Budget for that, or hand the judgement to
them.

Driving the ship from the tool works — the keyboard module listens on `window`, so synthetic events
reach it:

```js
dispatchEvent( new KeyboardEvent( 'keydown', { code: 'KeyW', bubbles: true } ) );
```

`apps/client/app/game/input/keyboard.ts` keys off `e.code`, so `code` is the field that matters.

## Landed: `6726322` — issue #166, fixed and verified

`@react-three/postprocessing@3.0.4/dist/index.js`, the `wrapEffect` factory:

> `const s = ee.useMemo( () => [ ...t?.args ?? [], ...a.args ?? [ { ...t, ...a } ] ], [ JSON.stringify( a ) ] );`

`a` is the rest props. Under React 19 `ref` is an ordinary prop, so `<Bloom ref={ ref } mipmapBlur />`
fed the live `BloomEffect` into that stringify on every render after mount; its passes hold a scene
whose `children[ 0 ].parent` closes the cycle. Hence `TypeError: Converting circular structure to
JSON` on any HMR edit that re-rendered the Canvas subtree.

**Fix:** construct the effect in `SceneEffects` and hand it to `<primitive>`. That is the same route
the library's own `DepthOfField` takes (`w( "primitive", { ...m, ref: v, object: u, target: g } )`),
so it is an idiom the library supports, not a workaround. No ref ever reaches the memo.

**The look is bit-identical.** The wrapper built Bloom as `P( Ie, { blendFunction: 0 } )`, and
`postprocessing@6.39.4/build/postprocessing.js:2414` maps `ADD: 0`. Note the trap: that package's
`build/types/index.d.ts:3918` declares `enum BlendFunction { SKIP, SET, ADD, … }` — a **different
order from the runtime object**. It is a regular `enum`, not `const enum`, so nothing is inlined and
`BlendFunction.ADD` resolves correctly at runtime; but **never read a numeric blend constant off that
.d.ts.**

`<primitive>` objects are not disposed by R3F, so disposal is explicit, in the house
`useEffect( () => () => x.dispose(), [ x ] )` idiom already used by `track-seams.tsx` and four others.

**Verified:** three consecutive HMR updates to `scene-effects.tsx` with the canvas live throughout
(26 frames / 500ms, `isContextLost() === false`), bloom visibly intact, no circular-structure error.
Scene-code iteration no longer costs a hard reload per edit.

## The block surface: real maps, not a procedural lookalike

**Owner reversed the handover's plan.** The previous session specified a procedural
`sealed-block-texture.ts` in the `track-texture.ts` idiom. But the owner had dropped the real
AmbientCG set into `apps/client/public/textures/metal/` at 21:46 — `Metal046B_1K-JPG_` Color,
NormalGL, Roughness, Metalness, Displacement — and `public/` is the served-static folder. Asked, and
the answer was **load the real maps**. The procedural generator is not written and is not planned.

### Committed as `3b82790`, green, and NOT YET SEEN

`pnpm typecheck` clean · `pnpm lint` clean (9 pre-existing warnings, comment ratchet passed) · 95
shared + 4 server + 155 client tests pass. **No pixel of it has been looked at.** That is the first
job for whoever picks this up.

**`sealed-block-texture.ts` (new).** Loads the four maps with drei's `useTexture`, the same hook
`game-environment.tsx:14` already uses for the nebula backdrop. Sets wrap, `anisotropy = 8` and
colour space. Suspense means the textures always exist before the material is built — which the
shader depends on.

**`sealed-block-shader.ts` — no `uv` attribute was added, deliberately.** The handover planned one.
It is the wrong tool here: blocks are **one unit cube instanced at every size**, so a unit-cube UV
stretches with each instance and texel density varies with block width. Instead the vertex patch
projects world position onto the face axis and writes three's own UV varyings:

```glsl
vec3 sealedAxis = abs( objectNormal );
vec2 sealedUv = sealedAxis.y > max( sealedAxis.x, sealedAxis.z )
	? sealedWorld.xz
	: ( sealedAxis.x > sealedAxis.z ? sealedWorld.zy : sealedWorld.xy );
sealedUv /= max( uSealedTexSpan, 1e-3 );
vMapUv = sealedUv;
vNormalMapUv = sealedUv;
vRoughnessMapUv = sealedUv;
vMetalnessMapUv = sealedUv;
```

Constant texel density at any block size, by construction. World space also means neighbouring blocks
get different regions of the texture instead of the same stamp.

Three facts it rests on, all read in the installed `three@0.185.1` this session:

- `ShaderLib/meshphysical.glsl.js` orders `uv_vertex` (27) → `beginnormal_vertex` (33) →
  `project_vertex` (44). The patch injects at 44, so `objectNormal` is in scope and the assignment
  lands **after** three's own.
- `ShaderChunk/uv_pars_vertex.glsl.js` declares `vMapUv`, `vNormalMapUv`, `vRoughnessMapUv` and
  `vMetalnessMapUv` as **separate** varyings, each behind its map's `#define`. **All four maps must
  stay set or the shader will not compile** — drop one map and its varying vanishes while the patch
  still assigns it.
- `ShaderChunk/normal_fragment_begin.glsl.js:30` builds the tangent frame with
  `getTangentFrame( - vViewPosition, normal, vNormalMapUv )` when there is no tangent attribute. So
  the normal map works with no tangents generated and no `uv`.

**Consequence worth knowing:** `tex.repeat` and `tex.offset` now do nothing on these maps. Three's
`mapTransform` is applied inside `uv_vertex`, which the patch overwrites. Scale lives in
`Block.textureSpan`.

**`sealed-block-material.ts` — tint `GRAPHITE_ALBEDO` → `#ffffff`.** With a `map`, three multiplies
texture × colour, so any tint darkens the reference. Blocks only; deck, rail, monolith and ship still
use `GRAPHITE_ALBEDO`. **But see the open decision below — this quietly settles half of it.**

**`track-blocks.tsx` + `tuning-schema.ts` + `tuning-panel.tsx` — a `Block` leva group.**
`textureSpan`, `normalScale`, `roughness`, `metalness`, `envMapIntensity`, `seamEmissive`, `wear`.
The three hardcoded constants (`BLOCK_SEAM 6`, `BLOCK_WEAR 0.6`, `BLOCK_ROUGHNESS 0.52`) became
schema defaults, so values are unchanged. **`textureSpan` starts at 2 world units per tile — a guess,
not a derivation.** It is the first knob to move.

### The GRAPHITE_ALBEDO decision is now half-made by accident

The previous handover left this open (its Next #4): revert `GRAPHITE_ALBEDO` into M1's band and fix
the Fresnel ramp environmentally, or amend M1. Blocks now take their value from a `#3a3a3a` texture,
which **is** inside M1's band, while the deck stays at `#7c8590`. So blocks read dark and the deck
reads bright — the split arrived at through the texture rather than through a decision. **Still the
owner's call for the other four surfaces, and it should be made deliberately rather than inherited.**

### The texture files, ~3.4 MB of them

Four maps committed with the code, because the code 404s without them. `Displacement.jpg` is left
untracked — nothing samples it. Size is still worth revisiting: WebP, or 512 for the
roughness/metalness pair. Metalness is the one that earns its bytes up close — mostly white with a
fine dark speckle that is most of the cast-metal character.

## Peers: three sessions in one tree

`rearview-mirror` and `hud` were both live. Ownership held: no cross-contamination on staged files.
`hud` closed the HUD (shipped at `7996fc5`; the `/game/:roomId` reconcile half of #209 is parked) and
moved to **ship exhaust plume + engine light**, in `ship-*` and a new exhaust module.

**`tuning-schema.ts` and `tuning-panel.tsx` are the shared files.** Every surface wants knobs, so
every agent ends up in them. They are append-only in practice — add your group after the existing
ones — but check before editing and stage by explicit pathspec.

## A mistake to not repeat

**I ran repo-wide `pnpm format` while `rearview-mirror` had uncommitted work in the tree**, and biome
reformatted three of their in-flight `rear-view*` files. Whitespace only, nothing lost, nothing of
theirs staged — but it was avoidable. **With peers live, format only your own paths:**

```
pnpm exec biome check --write <your paths>
```

## Next

1. **Foreground `/test-level` and look at the block maps.** Probe `document.hidden` first. Check:
   does the shader compile (blocks visible at all), is `Block.textureSpan` 2 sane, does the normal map
   read at speed, and do the marigold seams still sit right on a textured surface. Committed unjudged on the
   owner's instruction, so `git revert 3b82790` is the fallback if the patch does not compile.
2. **Judge the 0.2u chamfer and the seam flicker** — still outstanding from two handovers ago, still
   needs the owner's eye. The chamfer needs a mid-distance silhouette; flicker is temporal and a still
   cannot show it.
3. **Decide the texture file sizes** — the four maps are committed at full 1K JPEG.
4. **The `GRAPHITE_ALBEDO` decision for the other four surfaces** — see above.
5. **Monolith cap-edge chamfers**, and widen the vertical ones. `monolith-geometry.ts` chamfers only
   the vertical edges; `crossSection()` builds an 8-point ring and the caps meet the sides at a hard
   90°.
6. **`ART_MATERIALS.md` §7 departures entry, now eight items** — the seven from the previous handover
   plus the block tint moving to `#ffffff` with a dark map.
7. **File the three mechanics issues** once approved, and fix the `track.ts:415` clearance sampler
   before any block-geometry variation lands.

## Related

- [[2026-09-22-block-surface-and-the-fresnel-trade]] — the handover this picks up.
- [[2026-09-22-the-rearview-mirror]] — `rearview-mirror`'s work in the same tree.
