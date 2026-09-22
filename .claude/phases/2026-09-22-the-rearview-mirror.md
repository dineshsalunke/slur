# The rearview mirror, and why only the blocks were missing from it

**Date:** 2026-09-22
**Branch:** `dev` (primary checkout, shared live with two other agents — `slur-supervisor` and `hud`)
**State:** committed as `980827e`; `dev` 6 ahead of `origin/dev`, **not pushed**

---

## What was asked

Build the rearview mirror. `docs/TDD.md` §Camera describes it as deferred work:

> *"A **rearview mirror** (2nd render pass) was deferred at S5 in favour of a **threat-warning HUD**
> (cheaper; no bloom/render-priority cost); the mirror rides with homing/mines as a fast-follow."*

`.claude/backlog.md:126` gives the intended mechanism:

> *"**Includes the rearview mirror camera** (2nd render pass → RenderTexture on a HUD inset; main Loop
> takes render priority) — needed to see tracking projectiles from behind."*

`docs/ADD.md:158` records that the art package does **not** freeze its treatment:

> *"**Explicitly NOT frozen by the handoff** … final HUD/UI treatment, including the rear-view mirror."*

## The conflict check, and the owner's calls

A second agent was live in this same checkout — `sealed-block-shader.ts` modified uncommitted,
`world-scene.tsx` / `scene-effects.tsx` / `rail-lights.tsx` / `dev/tuning-schema.ts` all written within
the preceding 20 minutes. Two overlaps were identified:

1. **Same working tree.** One git index per checkout (`.claude/memory/shared-checkout-shares-one-git-index.md`).
2. **The render loop.** `@react-three/postprocessing@3.0.4` `EffectComposer` defaults `renderPriority = 1`
   and forces `gl.toneMapping = NoToneMapping` for as long as it is mounted, so a second pass has to slot
   into that ordering — and `scene-effects.tsx` is the file the other agent had just changed.

**Owner chose:** raw mirror pass with no postfx (accepting that the inset reads un-tone-mapped), and
build in this checkout anyway rather than in a worktree.

A cheap-looking alternative was rejected on a verified fact: setting `gl.toneMapping` around the mirror
render and restoring it would recompile every material each time the value changes. Not viable per-frame.

## Mechanism — verified against the installed stack, not recalled

Every number below was read out of `node_modules` this session.

| Fact | Source |
|---|---|
| `EffectComposer` runs at `useFrame(cb, 1)`, default `renderPriority = 1` | `@react-three/postprocessing@3.0.4` `dist/index.js` |
| `EffectComposer` sets `gl.toneMapping = NoToneMapping` while mounted | same file, its `useEffect` |
| r3f sorts subscribers `(a, b) => a.priority - b.priority` — plain ascending, fractions work | `@react-three/fiber@9.7.0` `dist/events-156d8d12.esm.js:1129` |
| auto-render is skipped when any subscriber has `priority > 0` | same file, `:16171` |
| drei `Hud` at `renderPriority !== 1` only does `autoClear = false; clearDepth(); render(hudScene, hudCamera)` — it does **not** re-render the main scene | `@react-three/drei@10.7.8` `core/Hud.js` |
| drei `OrthographicCamera` defaults its bounds to `size.width/±2`, `size.height/±2` → HUD layout in pixels | `core/OrthographicCamera.js` |
| `useFBO` defaults to `HalfFloatType`, `samples = 0` | `core/Fbo.js` |

**Resulting frame order:** `LocalLoop`/`NetLoop` (0) → mirror pass (0.5) → `EffectComposer` (1) → `Hud` (2).

The 0.5 matters: it puts the mirror render *after* the chase-camera update, so the inset shows the
current frame rather than the previous one. Using drei's `Hud` for compositing is what keeps
`scene-effects.tsx` — the other agent's file — completely untouched.

The texture carries `repeat.x = -1, offset.x = 1`: a real mirror's horizontal flip, so a ship
behind-left reads left in the inset.

## The bug the owner caught: "monoliths show up, blocks don't"

This looked like a mirror bug. It was not. It was two independent causes, both measured.

**Cause 1 — blocks were the only streamed geometry.** `TrackFloor`, `TrackRail`, `TrackRim`,
`TrackSeams` and `Monoliths` all build **once** over the whole track in a `useMemo`
(`segmentCount(track)` = `finishZ / SEG_LEN + AHEAD / SEG_LEN`). Only `TrackBlocks` rebuilds per frame
from a window `[sim.z - BACK, sim.z + AHEAD]`, and `BACK` was **80**. So in any backward view, deck,
rails, rim, seams and monoliths were all present at any distance and blocks alone vanished past 80u.
`BACK` has exactly one consumer in the codebase: `track-blocks.tsx:117`.

Measured against the `/test-level` descriptor (seed 20260921, blockDensity 0.6) with a scratch script:

| `BACK` | worst-case instances in window | blocks behind the ship | limit |
|---|---|---|---|
| 80 (was) | 57 | 1–11 | 160 |
| 240 (now) | 71 | 1–19 | 160 |

`BLOCK_LIMIT` was never the constraint — 55% headroom remains at 240.

**Cause 2 — the mirror FOV was a fisheye.** `REAR_FOV` was set to 82, and three's
`PerspectiveCamera` fov is **vertical**. At the panel's 3.2 aspect that is a **140° horizontal** field.
An 8u-tall block came out 9px at 80u in a 160px-tall buffer, then downscaled again into a 110px panel —
present in the render target, invisible to the eye.

At the new 36° vertical (≈92° horizontal) the same block is 49px at 40u and 24px at 80u.

## As built

| File | Role |
|---|---|
| `apps/client/app/game/scene/rear-view.tsx` | FBO, mirror camera, the pass, the `<Hud>` |
| `apps/client/app/game/scene/rear-view-camera.ts` | `updateRearCamera(cam, world)` — placement, mirrors `camera/chase.ts` shape including its fov-guard idiom |
| `apps/client/app/game/scene/rear-view-panel.tsx` | Inset quad + graphite frame + marigold rule |
| `apps/client/app/game/scene/rear-view-frame.ts` | One source for panel size, so panel aspect and texture aspect cannot drift |
| `apps/client/app/game/scene/rear-view-camera.test.ts` | 3 tests — absent player, back-facing placement, FOV stays inside the letterbox |

Mounted as a `<WorldScene>` child from `test-level-canvas.tsx` and `net-canvas.tsx`, because
`WorldScene` already renders `{ children }` — so `world-scene.tsx` was not edited either.

**Edits to files outside the feature:**
- `track-instancing.ts` — `BACK` 80 → 240 (one line; single consumer).
- `dev/tuning-schema.ts` — three knobs **appended** after the `Groove` block, deliberately at the end to
  minimise collision with the other agent's in-flight edits: `RearView.fov` (36), `RearView.lift` (3),
  `RearView.tilt` (4°). Panel width/height stayed as code constants on purpose — they set the camera
  aspect, and `useFBO` memoises its size on first render, so a live-editable aspect would distort.

## Gates

`pnpm typecheck` clean · `pnpm lint` clean (9 pre-existing warnings, none in these files) ·
`pnpm test` 144 client + 95 shared + 4 server passing.

## NOT verified — the one open item

**The mirror has never been seen on screen.** The `/test-level` tab reports
`document.visibilityState === "hidden"`: the browser extension drives it backgrounded, `rAF` never
fires, the canvas stays black, and an `await requestAnimationFrame(...)` probe hung the CDP call
outright. This is the artifact already recorded in `.claude/memory/leave-the-browser-tab-open.md` and
`.claude/memory/browser-extension-throttles-fps.md`.

**Next session: ask the owner to foreground the tab and report the framing** — strip size and height,
and how badly the raw-linear rails clip against the tone-mapped main view. That clipping is the known,
accepted cost of the pass the owner chose, and it is the most likely thing to need a nudge. The three
`RearView.*` knobs exist precisely so that nudge needs no code round-trip.

## Handed to the other agent, not fixed here

On an **HMR** re-render — not a fresh load — the canvas tears down with:

> `TypeError: Converting circular structure to JSON` at `@react-three/postprocessing` `JSON.stringify(a)`

That is the library's `P` effect-wrapper memoising on `JSON.stringify(restProps)`. Under React 19 `ref`
is an ordinary prop, so `<Bloom ref={ ref } mipmapBlur />` in `scene-effects.tsx:24` puts the
`BloomEffect` into that stringify; its internal passes hold a scene, and `scene.children[0].parent`
closes the circle. It reproduces on any HMR re-render of `SceneEffects` and clears on reload. It is not
caused by the mirror, and it lives in the other agent's file, so it was left alone.

## Committed

`980827e` on `dev`, 13 files. `dev` is 6 ahead of `origin/dev` and **not pushed** — nobody asked for
a push, and it is outward-facing.

Committed with `git commit -F - -- <explicit paths>`, so the pathspec bounded the commit even if a
peer staged something between the `add` and the `commit`. Three agents now share this one working
tree (this session, `slur-supervisor` on block/monolith surfaces, `hud` on HUD), on `dev` directly —
no worktrees, no new branches unless the owner asks. Left untouched: `sealed-block-shader.ts`
(supervisor's, uncommitted), `apps/client/public/textures/metal/`, `apps/client/public/fonts/`.

**The `BACK` change lives inside the supervisor's area** — its only consumer is the emit loop in
`track-blocks.tsx:117`, which they own. They were told directly, and told that the constant is now
load-bearing for the mirror. If that loop gets rewritten for `sealed-block-texture.ts`, re-check it.
