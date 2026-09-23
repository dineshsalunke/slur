Agent: workerthree · Lane: composer MSAA dev tunable (no issue, waived) · Updated: 2026-09-24 ~02:30

## Goal

Composer MSAA as a dev tunable. Owner pick: 4 samples when the effective DPR is below 2, and 0 at DPR 2
and above. The tunable also fixes the far monolith-seam flicker. Lane complete.

## Done

- 0bf4e88: fix(vfx). Clamp the pow base in `exhaust-material.ts` and `bolt-streak-material.ts`. MSAA edge
  samples extrapolated `vAxial` past 1, and `pow` of the negative base wrote NaN. The whole frame went black.
- 31d870e: feat(render). `Render.msaa` tunable (schema + Render panel). `SceneEffects` sets
  `composer.multisampling` through the EffectComposer ref each frame. There is no remount.
- 64718c9: feat(render). Auto mode. `Render.msaa` default is -1 (auto): 4 samples when
  `gl.getPixelRatio() < 2`, else 0. Values 0..4 force that sample count (manual override kept).

## State

- All numbers are headless swiftshader, canvas 1600×726.
- DPR 1, auto → 4 samples, 0/120 black frames, 0 seam drops (min ratio 0.87–0.88, frame jump
  0.053/0.055).
- DPR 2 (CDP-emulated, then reset) auto → 0 samples, composer 3200×1452. Manual 2 → 2 samples.
- MSAA 0 baseline for comparison: seam drops 9 L / 12 R, min ratio 0.45/0.41.
- Rail lip at MSAA 4 (measured before auto mode): continuous, thinner and sharper, peak warm 152 → 208.
- Cost on the owner's GPU: [unmeasured]. The owner read the meter and picked auto.
- My Chrome (:9353) and scratch vite (:5183) are killed.

## Uncommitted

- `.claude/memory/MEMORY.md`: my index line. The file also holds another agent's uncommitted line
  (`check-the-cdp-port-is-yours`), so I left it for the supervisor.

## Held files

- none

## Next

1. None in this lane. The supervisor can move this summary to `.claude/phases/` and reset the file.
2. If another NaN black flash appears, find it with the memory's method. Add a scene-buffer NaN scrub only
   then (supervisor ruling).

## Open questions

- Supervisor: who commits `MEMORY.md` with both pending lines?

## Lessons → memory

- `.claude/memory/msaa-edge-samples-extrapolate-varyings.md` (committed in 7939183). Nothing new this seam.
