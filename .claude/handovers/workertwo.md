Agent: workertwo · Lane: sky review fixes (#227, from #215 / PRs #221 + #224) · Updated: 2026-09-23, ~00:20

## Goal

Fix the review findings in `.claude/phases/2026-09-23-review-pr-221-224.md` on the merged sky work
(`81f9462`). Issue #227.

## Done

- `c99c40d`: rail glow + rock key light in world space, moved to view space in the shader with
  `viewMatrix`, so the rear-view pass is lit from the right place. Rail glow gated to rail runs with a
  per-segment mask texture (`buildRailMask` in `rail-glow.ts`, R/G = left present/y, B/A = right).
  2u ramp at run ends. `nbGlobe` `fwidth` moved above the divergent `cosA` return (the `sinR` return is
  uniform). `ADD.md`: planet/moon counts, missing-rock-map claim, rail-glow paragraph.

## State

- At `c99c40d`: client tsc clean, vitest 241/241, biome clean on the touched files, comment ratchet passes.
- Mask content checked live: 14 segments of 466 lack a rail. Segment 57 (z 1140–1160) lacks both
  rails. That matches a node survey of the `/test-level` track.
- Gating checked live: zeroing mask rows for segments 58–60 darkens exactly the segment 58 cap facing
  the pit and the deck beyond it (26k px). Real mask vs all-ones mask: no visible change from the
  poses I tried. The segment 57 islands are small and hidden behind a tall block. [partial]
- Rear view: the deck glow now shows in the mirror at both rail edges. No numeric before/after of the
  mirror shift. [inferred correct from the viewMatrix mechanism, not A/B'd]
- Bake time (headless Chrome, real GPU: ANGLE Metal Apple M1 Pro, 1600×813, DPR 1): base frame
  7.8 ms. Frame with a `Sky.seed` change (re-bake + relight) median 153 ms (125–156). Frame with a
  look-only change (`Sky.brightness`, relight only) median 15 ms. The first-frame bake includes shader
  compile. [unmeasured]
- Still: `.claude/frame-tap-refs/227-gap-on.png` (git-ignored).
- Scratch vite 5183 and headless Chrome 9338 are killed. CDP helpers are in the session scratchpad
  (`cdp.mjs`, `pngdiff.mjs`, `mask.js`, `bake.js`); they are lost with the session.

## Uncommitted

None.

## Held files

`apps/client/app/game/scene/{rail-glow.ts, track-floor.tsx, rock-field.tsx, asteroid-surface.ts,
nebula-shaders.ts}`, `docs/ADD.md`. Plus the eight #222 files from the last lane.

## Next

1. Before/after darkness still pair (`036645c` vs dev), no fix. BLOCKED: it needs a second checkout.
   A `git archive` export would share `apps/client/node_modules/.vite` with the live dev server, so it
   needs a worktree, which the owner must approve. `036645c`..dev: no dep changes, shared differs only in
   combat-step.
2. Optional: a vitest for `buildRailMask` (layout, run edges, LEAD offset).
3. Tick #227 items, then close the issue.
4. #222 items from the last lane: owner judges stills; one-frame hole; debris `mesh.count`; mend-cancel.

## Open questions

1. Owner: approve a worktree for the `036645c` still pair?
2. A 145 ms bake stall on a tunable change is fine for dev. Is it acceptable on the first race frame, or
   should the bake move behind a loading screen?
3. `.gitignore` `.tmp/`: supervisor said keep it. Dropped from the lane.

## Lessons → memory

- `.claude/memory/place-the-ship-over-cdp.md` (updated: a second placement needs an unfreeze; how to
  reach patched uniforms)
