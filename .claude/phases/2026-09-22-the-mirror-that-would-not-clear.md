# The mirror that would not clear, and the band in the golden reference

**Date:** 2026-09-22
**Branch:** `dev` (primary checkout, shared live with `slur-supervisor` and `hud`)
**State:** committed as `7faf414`, **not pushed**
**Preceded by:** `2026-09-22-the-rearview-mirror.md` (the build); this note is the pass that made it
visible and re-treated it against the art package.

---

## What was asked

The owner ran `/test-level` and reported the mirror across four turns:

1. *"things in the mirror are not visible really. if passing by a block its shows in mirror but has
   artifacts and keeps on disappearing, i feel something related to clip plane"*
2. *"the mirror in the artboard doesnt have sharp edges instead is blurs into the scene. also the
   lighting in the mirror is very different than actual scene"*
3. *"the bloom and other effects are in now, just the rear view mirror still doesn't blur or blend
   into the scene"*
4. *"lets reduce the feather a bit and increase the size of mirror a bit"*

This closes the open item the previous note left: **the mirror had never been seen on screen.**

## Three defects, three unrelated causes

Every fact below was read out of `node_modules` this session.

### 1. The buffer was never cleared — this is what read as a clip plane

`postprocessing@6.39.4` `build/index.js:1002`, inside `EffectComposer.setRenderer`:

> `renderer.autoClear = false;`

It is set once when the composer takes the renderer and **never restored**. The mirror pass did
`setRenderTarget( target )` → `render(...)` with no explicit clear, so the FBO carried **stale
depth from every prior frame**. Geometry that had moved farther than a leftover depth value failed
the depth test and vanished; colour accumulated on top. Because the effect is distance-gated, it
presents exactly as a near/far clip problem — which is why the owner's instinct pointed there. Near
and far were never involved.

Fix: `state.gl.clear( true, true, true )` before the render. `WebGLRenderer.clear()` is
unconditional, so it is immune to whatever the composer leaves `autoClear` at.

**Checked and ruled out first:** drei's `Hud` does restore the flag (`core/Hud.js` saves `oldCLear`
and puts it back), so the Hud was not the leak. The composer was.

### 2. The buffer was magnified — the soft edges

The panel is sized in **CSS pixels**: drei's `OrthographicCamera` derives its bounds from
`state.size` (`core/OrthographicCamera.js`), so a 352-wide panel covers `352 × dpr` device pixels.
The buffer was a fixed `REAR_TEXTURE_WIDTH = 512`. At dpr 2 that is a 512→704 upscale through
`LinearFilter`. Plus `samples = 0`, drei's `useFBO` default — no MSAA on a pass that is nothing but
distant geometry.

**The previous note's stated reason for hardcoding the size is wrong and should not be repeated:**
it claimed `useFBO` memoises its size on first render. `core/Fbo.js` memoises only *target
creation*; a `useLayoutEffect` calls `target.setSize( _width, _height )` on every width/height
change. The size tracks. That single fact is what unlocks a live `scale` knob.

Fix: buffer is `REAR_PANEL_WIDTH/HEIGHT × dpr`, with `samples: 4`.

### 3. The tone curve did not match

Main view: `scene-effects.tsx` `<ToneMapping mode={ ToneMappingMode.NEUTRAL } />`, which
`postprocessing` `build/index.js:13481` compiles to
`this.defines.set( "toneMapping(texel)", "NeutralToneMapping(texel)" )` — three's own Khronos
curve. The inset was `meshBasicMaterial … toneMapped={ false }` over a raw-linear buffer, and
`gl.toneMapping` is forced to `NoToneMapping` by the composer regardless. So darks matched and
everything above ~0.76 clipped hard instead of rolling off.

**Rejected:** setting `gl.toneMapping` around the pass and restoring it — recompiles every material
on each change, not viable per-frame. That was already rejected in the previous note and still is.

**Chosen:** apply the curve in the panel's own fragment shader
(`rear-view-surface.ts`), copied from three 0.185.1 `tonemapping_pars_fragment.glsl.js`
`NeutralToneMapping`, with `uExposure` fed from `gl.toneMappingExposure` each frame. No renderer
state is touched, nothing recompiles, and `scene-effects.tsx` — the supervisor's file — stayed
untouched for the second session running.

Output encoding is free: `WebGLProgram.js:778` always emits `colorspace_pars_fragment` +
`linearToOutputTexel` into the non-raw fragment prefix, and `:798` runs `resolveIncludes` on every
fragment shader, so a plain `ShaderMaterial` can just `#include <colorspace_fragment>`.

## The treatment was wrong, not just the rendering

Turn 2 was misread as a bug report ("it blurs, make it sharp") and the fix went the wrong
direction. Turn 3 corrected it: **"the artboard"** meant the art package, not our render.

`docs/art-direction/golden-reference/scene-and-hud.png`, top-centre band: the rear view there is
**not an inset**. No frame, no border, no rule. The dark deck is nearly transparent — nebula and
asteroids read straight through it — only the marigold rails carry, and it tapers to nothing at both
ends.

So the mechanism is a **composite into the sky**, not an opaque rectangle with soft corners:

- graphite frame plate and marigold rule **deleted**;
- `THREE.AdditiveBlending`, `depthTest: false`, `depthWrite: false` — dark pixels contribute
  nothing, bright rails add;
- `smoothstep` edge feather on all four edges.

**Reading the board is a two-step:** the band is ~120px tall in a 1672×941 image and unreadable at
full-frame scale. `ffmpeg -vf "crop=900:200:400:10,scale=1800:400:flags=neighbor"` into the
scratchpad makes it legible. `sips` cannot do an origin-anchored crop (its `--cropOffset` is
centre-relative and undocumented); do not fight it.

## Knobs, and why `scale` is one

`dev/tuning-schema.ts`, appended after the existing `RearView.*` block:

| Knob | Default | Note |
|---|---|---|
| `RearView.gain` | 1 | overall contribution of the composite |
| `RearView.featherX` | 0.22 | was 0.35; owner asked for less |
| `RearView.featherY` | 0.18 | was 0.30 |
| `RearView.scale` | 1 | `rebuild: true` |

Base panel 352×110 → **448×140**. Both are exactly 3.2, so `REAR_ASPECT` did not move and the
mirror camera's aspect never had to be touched.

`scale` is `rebuild: true` because `num()` is read imperatively in `useFrame`, but `useFBO` needs
React-rendered width/height — so `RearView` calls `useRebuildToken()` to pick up the
`bumpRebuild()` broadcast, the same path `track-floor`, `track-rail` and `monolith-group` already
use. **One factor drives geometry, FBO resolution and placement together**, which is the whole
point: the 3.2 aspect cannot drift between the panel quad and the mirror camera, which was the
previous note's stated reason for keeping size out of the panel.

## As built

| File | Change |
|---|---|
| `rear-view.tsx` | explicit clear; DPR+MSAA buffer; `useRebuildToken` + `scale`; feeds the 4 uniforms |
| `rear-view-surface.ts` | **new** — Neutral tone map, edge feather, additive blending |
| `rear-view-panel.tsx` | frame plate and accent rule deleted; takes `width`/`height` |
| `rear-view-frame.ts` | 352×110 → 448×140; texture constants removed |
| `dev/tuning-schema.ts` | 4 appended lines, nothing else |

## Gates

`pnpm typecheck` clean · `pnpm test` 155 client + 95 shared + 4 server passing · `pnpm lint` has
**6 findings, none in these files** — `track-rail.tsx` (unused `useWorld`/traits import),
`track-texture.ts` (566 lines vs a 300 cap), `world-scene.tsx`, `monolith-field.test.ts`,
`landing-scene.tsx`. All the supervisor's in-flight work. Left alone.

**Caveat on the gates:** they ran against the working tree, which also holds the supervisor's
uncommitted block-map work. `7faf414`'s own files reference only knobs that commit introduces, so
it should stand alone, but that was not verified in a clean worktree.

## Committing out of a shared tree, partially

`dev/tuning-schema.ts` held **two independent uncommitted hunks** — the supervisor's `Block.*`
group and this session's `RearView.*`. A `git commit -- <path>` takes working-tree content and
would have stolen their work.

What was done: confirmed the index was empty, wrote a patch containing **only** the `RearView` hunk
into the scratchpad, `git apply --cached --recount`, staged the four rear-view files, verified
`git diff --cached` showed zero `Block.*`, then `git commit` with **no pathspec** (a pathspec would
have re-read the working tree). Verified afterwards that their hunk survived untouched.

`git add -p` is not available — interactive flags do not work in this harness. The hand-written
patch is the substitute. This extends
`.claude/memory/shared-checkout-shares-one-git-index.md`: an explicit pathspec is **not** enough
when two agents share a *file*, only when they share a *tree*.

## Open — for the owner

**The reference band is also flipped vertically.** In `scene-and-hud.png` the deck is at the bottom
of the band and recedes *upward*; the ships hang inverted. It reads as a reflection in a ceiling,
not a rearview mirror. **Not applied.** Inverted threats behind you is a gameplay-readability
change, not a look change, and the owner asked about blending. `docs/ADD.md:158` —
*"Explicitly NOT frozen by the handoff … final HUD/UI treatment, including the rear-view mirror"* —
leaves it open. It is one character in the shader: `1.0 - vUv.y`.

**Still no bloom in the inset.** The composer owns priority 1, so the mirror gets no postfx. Rails
glow in the main view and read flat behind. Owner-accepted when the pass was designed. If it starts
to matter, the cheap route is a thresholded blur-add inside `rear-view-surface.ts` driven by the
existing `Bloom.*` knobs — not a second composer, which would fight over `gl.toneMapping` and
`autoClear`.

## Handed to `hud`

`hud` announced an exhaust plume + engine light for the Split Crown. They were told, with sources:

1. The mirror is a **second render of the same scene graph**, so their plume renders twice from two
   cameras with no opt-in. Anything billboarded must read the `camera` argument of
   `onBeforeRender`, never `useThree( s => s.camera )`, or it will be right ahead and edge-on
   behind. A small or origin-anchored bounding volume will cull inconsistently between the two
   cameras — `frustumCulled={ false }`, as `track-blocks.tsx` does.
2. No postfx in the mirror, so **do not tune `emissiveIntensity` by how it looks in the inset**.

They were also told lint is red from the supervisor's files, not theirs.
