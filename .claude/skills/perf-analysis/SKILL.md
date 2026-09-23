---
name: perf-analysis
description: Measure and bisect a SLUR frame on the GPU. Use when the owner asks for an fps target, when a render change might cost frame time, when a number from requestAnimationFrame looks too good, or before claiming a perf win. Covers the GPU-synced meter, the subsystem bisect, the noise sources on a shared Mac, and the levers that have already been weighed.
---

# perf-analysis

How to get a frame number that is true, find which subsystem owns it, and not repeat the mistakes
that cost sessions 2 and 4 of the nebula stream.

## 1. The meter: readPixels every frame, median, warm-up, best of two

`requestAnimationFrame` timing does not track the GPU under ANGLE Metal. It reported 2.2 ms for a
full DPR 2 frame with the post chain removed, and it swung 2× between identical runs. `gl.finish()`
does not sync either. What works:

- One `gl.readPixels( 0, 0, 1, 1, … )` on the default framebuffer after each frame. It blocks until
  the GPU has drained, so the rAF period becomes CPU plus GPU, serialized. An upper bound, but a stable
  one, and deltas between toggles are real.
- **Median** of the frame deltas over 3 s, not the mean. Block streaming and GC add hitches.
- **Warm-up load first.** The first page load after the browser launches pays shader compilation for
  every material variant it meets while driving, and was always the slowest toggle in the run.
- **Best of two page loads per toggle**, baseline first and last, so drift inside the run is visible.
- **Drive.** Hold `W` for 1.5 s before measuring. A parked ship shows an empty deck.

`scripts/perf.mjs` does all of this. It needs the dev server up and a handle on the R3F store.

## 2. The store handle: seven lines, never committed

The scripts toggle subsystems by traversing the scene from the page, which needs the R3F store on
`globalThis`. Window globals are outside the house style, so this file lives only while measuring:

```tsx
// apps/client/app/dev/store-expose.tsx
import { useThree } from '@react-three/fiber';

export function StoreExpose() {
    const get = useThree( ( state ) => state.get );
    ( globalThis as { __slurStore?: unknown } ).__slurStore = get;
    return null;
}
```

Mount `<StoreExpose />` inside `<WorldScene>` in `apps/client/app/routes/test-level/test-level-canvas.tsx`.
Delete the file and the two lines before committing. `git status` will show both.

## 3. Running it

```
export E=$HOME/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-mac-arm64/chrome-headless-shell
cd .claude/skills/perf-analysis/scripts
REPS=2 T=baseline,allmesh,rails,points,backfill,sky,stars,rocks,deck node perf.mjs
```

`E` is the headless Chromium; `PW` overrides where `playwright-core` is found when it is not
resolvable from the repo (an `npx` cache path works). Env: `W`/`H` viewport (default 1728×1080), `DPR` (default 2, so 3456×2160), `URL`, `REPS`, `STORE`
(a `slur.tuning.v1` JSON to preload tunables). `T` is the comma list of toggles; each hides one
subsystem by traversing the scene, and `allmesh` hides everything drawable, which leaves the post chain,
rear view, HUD and present as the floor. Add a toggle by adding a line to the `toggles` map.

To see a look rather than time it, `scripts/tune.mjs` screenshots `/test-level` with a set of tunables
preloaded through localStorage, resolving each key's schema default so `restore()` accepts it:

```
TUNE='{"RailLight.intensity":10}' node --import <tsx loader> tune.mjs name 2500
```

The loader is `node_modules/.pnpm/tsx@*/node_modules/tsx/dist/loader.mjs` in the worktree. The second
argument is how long to hold `W` before the shot; `0` parks the ship. `S` is the output folder.

## 4. Reading the numbers

- Compare **within one run**. The machine is usually shared with the owner's own browser tab on the
  same dev server, and absolute numbers drifted 2× across runs while the deltas held.
- Individual savings do not add up to the total. Hiding one light class can lower the cost of every
  other shader branch through register pressure and occupancy on Apple GPUs. Measure the combination
  you intend to ship, not the sum of parts.
- `allmesh` is the floor. If the floor is over half the budget, the scene is not where the next
  millisecond is.
- With the post chain removed the synced meter still reported 2.7 ms for the full scene, which the
  per-toggle deltas inside the composer path contradict. Unresolved. Measure the shipped path.

## 5. What has already been weighed (do not re-derive)

| lever | verdict |
|---|---|
| `RectAreaLight` | LTC runs per light on every fragment of every standard material. Six lights were 8 ms of a 17.7 ms DPR 2 frame. Replaced by an analytic line light in the deck material (`scene/rail-glow.ts`). Do not bring them back for a glow. |
| Canvas `antialias`, `alpha` | Both off (`scene/canvas-gl.ts`). The composer's final quad gains nothing from MSAA; an opaque canvas skips the compositor blend. About 1 ms. |
| Rear view | Half-scale rear view changed nothing measurable. Not a target. |
| Sky pass | 1.4 ms at DPR 2 for four cube reads, three volume reads and two star hashes per pixel. Freezing motion saves nothing; the cost is the reads. Next step if needed: render the sky at half res, which softens stars. |
| Rocks | 0.9 ms. The far-plane dither discard disables early-z on the rock shader; shrinking rocks at the far plane instead would restore it. Not yet worth it. |
| Point and directional lights | 0.5 ms combined. Removing the directional fill saved nothing measurable. |
| DPR 1.5 | Meets any target instantly and is the last resort; it is the only lever here that spends quality. |

## 6. Frame budget as of 2026-09-23

M3 Pro, 3456×2160, GPU-synced medians while driving on `/test-level`: 10.0 ms with everything,
5.4 ms with every mesh hidden, deck 2.1, sky 1.4, rocks 0.9, point lights 0.5. History in
`.claude/phases/2026-09-23-planets-sky-lighting-and-the-rail-line-light.md`.
