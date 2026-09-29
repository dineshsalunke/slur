Agent: workerone · Lane: seam streaks lean + look fake (#365) · Updated: 2026-09-29

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

The owner says block-seam deck streaks slant when far and turn vertical when near, and look fake.
INVESTIGATE + PLAN ONLY. Build nothing until the owner approves.

## Done

- Filed #365.
- Cause measured (below). Plan sent to slur-supervisor.

## State

- [measured] The camera hypothesis is refuted. `gl.getUniform(cameraPosition)` on the streak program
  equals `camera.matrixWorld` to within 1e-7, in both main-scene passes (chase camera and rear view).
  viewMatrix equals `matrixWorldInverse` to within 2e-7.
- [measured] The quad axis is correct. The projected foot → toCam axis is collinear with the projected
  seam to within 0.01° at every camera tested.
- [measured] The cause is trapezoid varying interpolation. The quad widens with along
  (`sigma = sigma0 + blur·(0.5+clean)·along`). `vReflQuad.x` (±1 per corner) bends along the triangle
  diagonal, so the glow sits to the right of the axis. Glow centroid versus axis: current build
  +1…+7.7 px (blur 0.01) and +3.9…+8.5 px (blur 0.04). An exact variant (world-affine
  `vReflAxis = (along, 0.5·width·position.x)`, width rebuilt in the fragment shader): −0.3…−0.9 px, and one
  frame-edge case at +4.4.
- [measured] Visually (taps `base-b0.04-*` versus `fix-b0.04-*`): the current build leans cones right,
  and a low eye gives a large diagonal wedge. The fix gives symmetric straight cones.
- [inferred] Near is more vertical because the along direction covers more screen, so the fixed
  lateral kink subtends a smaller angle.
- Scratchpad: `14c7e25b…/scratchpad/streak/` (probe1 camera uniform, probe4 A/B + `variant-fix.mjs`
  route rewrite, PNG taps). No headless Chrome running.

## Uncommitted

- none.

## Held files

- none yet. Claim requested: `deck-reflection/deck-reflection.ts`, `dev/tuning-schema.ts`,
  `dev/tuning-panel/tuning-panel.tsx`, `docs/DECISIONS.md` (ADR-031), `docs/ART_MATERIALS.md` (§7 item 23).

## Next

1. Wait for owner approval through the supervisor.
2. Build (a) the exact lateral varyings, then (b) the material interaction: normal warp,
   roughness spread with energy conservation, albedo/groove mask, Schlick shape. Then add dials
   `Reflect.warp` and `Reflect.grime`.
3. Re-run probe4 (offset < 1 px), take taps on /test-level, and update the docs. Commit, then close #365.

## Open questions

- Owner: approve the (b) mix and the two new dials?

## Lessons → memory

- `.claude/memory/trapezoid-quad-varyings-skew.md`
