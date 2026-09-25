Agent: workerone · Lane: #258 follow-up — arch defects + pit redesign + #4a4d52 · Updated: 2026-09-25

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Fix the owner's monolith-arch defects and the "raindrops on a windshield" pits (arch face and the deck
behind the ship). Set Metal.baseColor to #4a4d52 (owner pick). Send before/after captures at 1:1 to the
supervisor BEFORE the push.

## Done

- No source edits yet. The "before" captures were taken on a clean tree after workertwo's 96u push (fe40718).
- Claims CLEARED by supervisor: game/scene/track-texture.ts (+test), monolith-geometry.ts (+test),
  monolith-group.tsx, track-rail.tsx, world-scene.tsx, metal.ts, docs/ART_MATERIALS.md.

## State (measured unless marked)

- Draw calls on /test-level at spawn: 92 (measured this session). A draw-call condition applies: the leg
  fix must not add draws.
- Before captures (1280×720, DPR 1, frozen, first arch z 2070.66, height 200.4):
  `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/9ca02a71-d600-49aa-8187-69d600538369/scratchpad/shots/before-{approach,face,lintel,up}.png`.
  `before-up` shows the defects best: bead-like pits with tails, vertical streaks, a lighter band.
  The deck close-up (`deck` pose) HUNG and was killed. It is NOT captured. Re-take it before any edit,
  or use the owner's screenshot as the "before".
- Script: `.../scratchpad/arch-shoot.mjs <url> <cdpPort> <outDir> <label> '<extra store json>' <poseName>`
  (the last arg filters to one run). Chrome PIDs were killed. Nothing is left running.
- Verified causes:
  1. **Pit normal sign in v is inverted.** In three 0.185.1 `getTangentFrame`, B follows +v and
     normal-map G maps to +v. `Texture.flipY` defaults to true, so canvas-down = −v.
     `stampPitNormals` sets `ny = … − k·uy`, which is a dent in u but a BUMP in v. Under a key light
     from above it reads as a bead. The transverse groove bevels in `paintJointNormals` have the same
     v-inversion. [inferred; deck grooves were approved, so ask before touching them]
  2. **Arch legs are stretched vertically.** `monolith-frames.tsx` builds the leg geometry with
     `legShape(frame)` at the BASE height, and the UV v uses that sy. `frameParts` scales each leg to
     `legShape(frame, placement.height)`, so arch heights 200/189/173 vs base 150 give a V stretch of up
     to (200−40+60)/170 ≈ 1.29×.
  3. **Vertical streaks.** `paintBrush`/`paintNormalBrush` strokes run long along canvas y
     (1.5–6u), and on walls v = height. Mottle is also stretched 3.5× along y.
  4. **The cavity channel is dead.** No material reads the packed R channel, and no aoMap is set
     anywhere. So `Pit.cavity` and the groove cavity have no visible effect. Pit darkening must go into
     the albedo map.
  5. The tiling and the lighter band: 16u tile, big mottle blobs (MOTTLE_AMOUNT 0.26), and metal
     patches down to metalness 0.5 (they read as lighter diffuse patches) repeat every 16u. [inferred]
- Lint warnings in track-rail.tsx (unused `LocalPlayer, Sim` import, unused `world = useWorld()`) and
  world-scene.tsx (unused `blocks` prop; no caller passes it) are NOT from 37c9d79. That commit does not
  touch those files; they date from #230 (5002032). Clean them anyway, since the claims are held.

## Uncommitted

None of mine. (The tree has other workers' files: apps/server/src/rooms/run-room*.ts and shared tests.)

## Held files

The claims listed under Done.

## Next

1. Re-take `before-deck` on a clean tree (x 6, z ≈ 370, close chase: back 7, height 2.5, lookAhead 4,
   lookAtLift 0.3). If it hangs again, check the favicon navigate first.
2. `track-texture.ts`, the pit redesign (supervisor's brief): replace `pitPlan`'s stamped discs with a
   noise pit field computed once per build. It must be tileable value noise sampled in WORLD units
   (periods 16u × 16u on graphite, 16u × 4u on the deck; lattice cells/u an integer, e.g. 9 and 23, plus a
   3rd octave). Add a low-frequency cluster term (0.5 cells/u). Set the threshold by quantile so coverage
   is exact: coverage = Pit.density × 0.04 (2.5 → 10%). Depth D = clamp((s−thr)/edge). Normal from the
   gradient of D, dent-correct: `nx = +depthU·dD/du`, `ny = −depthU·dD/dy_canvas·(pxPerV)`. Keep it
   shallow (depthU = Pit.tilt × ~0.03, clamp slope ~0.6). Put roughness +Pit.roughness·D (raise the
   default, ~0.3, to kill glints) in G. Put albedo darkening ×(1 − Pit.cavity·D) in the MAP (it was the
   dead R channel). Rewrite the pitPlan tests for the field (determinism, coverage ≈ target, zero at
   density 0, isotropic in world units on both tiles).
3. `track-texture.ts`, jointless grain: a `Grain` constant per set (joints ? DECK : GRAPHITE).
   GRAPHITE: brush strokes rotated to run along x (rot π/2; normal tilt in y — generalise `normalLobe`
   to (nx, ny)), weaker (×0.4); mottle isotropic (stretch 1), smaller (0.6–1.6u), more blobs (~90),
   amount ~0.08; metal patch min ~0.85; finish-patch deltas ×0.5. The DECK keeps its current grain.
4. Leg stretch with no extra draw calls (supervisor condition): in `monolith-group.tsx`, after
   `patchRailGlow`, wrap `onBeforeCompile` to replace `#include <uv_vertex>` with
   `vec2 monolithUv = abs(normal.y) < 0.5 ? vec2(uv.x, uv.y * length(instanceMatrix[1].xyz) / uMonolithSpanY) : uv;`
   `#define uv monolithUv` / `#include <uv_vertex>` / `#undef uv`. Pass uniform `uMonolithSpanY = size[1]`
   per group. Set `customProgramCacheKey` to 'slur-rail-glow-monolith' so the program does not collide
   with the rails. Add a pure helper + test in monolith-geometry.ts if one is useful.
5. metal.ts `METAL_BASE_COLOR = '#4a4d52'`; test fixture `base`. ART_MATERIALS.md §7 item 19: record the
   owner pick, the pit field, the dead cavity channel, and the v-sign fix (no comments in source).
6. Lint cleanup (track-rail.tsx, world-scene.tsx). Gates: `pnpm typecheck`, `pnpm lint`, client vitest.
7. After captures with the same script (label `after`) and the draw count (must stay 92). Send the
   before/after paths to the supervisor, wait for OK, commit by pathspec, push.

## Open questions

- Supervisor/owner: the transverse deck groove bevels have the same v-inversion as the pits
  [inferred]. Fix them too, or leave the approved deck alone?

## Lessons → memory

`.claude/memory/cavity-channel-is-dead.md`
