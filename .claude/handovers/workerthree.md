Agent: workerthree · Lane: composer MSAA dev tunable (no issue, waived) · Updated: 2026-09-24 ~02:05

## Goal

Make composer MSAA a live dev tunable (`Render.msaa` 0/2/4, default 4). The owner reads the frame meter at
DPR 2 on their own GPU and then picks the default. The tunable also fixes the far monolith-seam flicker.

## Done

- 0bf4e88: fix(vfx). Clamp the pow base in `exhaust-material.ts` and `bolt-streak-material.ts`. MSAA edge
  samples extrapolated `vAxial` past 1, and `pow` of the negative base wrote NaN. The whole frame went black.
- 31d870e: feat(render). `Render.msaa` tunable (schema + Render panel). `SceneEffects` sets
  `composer.multisampling` through the EffectComposer ref each frame. There is no remount.

## State

- All numbers are headless swiftshader, DPR 1, canvas 1600×726.
- Composer target at MSAA 4: `RGBA16F` + `DEPTH_COMPONENT24`, 4 samples, 1600×726. Measured with a
  `renderbufferStorageMultisample` hook.
- Before 0bf4e88, at MSAA 4: 77/120 live frames black; 0/120 at MSAA 0. Black frame ⇔ NaN in the scene
  buffer (24/24 frames). Bisect → the instanced exhaust plume mesh (4 instances).
- After 0bf4e88, at MSAA 4: 0/120 black frames.
- Seam, 41 stepped frames, 380→340u from z 494.23:
  - MSAA 0: L 9 drops, R 12 drops, min ratio 0.45/0.41, frame jump 0.139/0.136.
  - MSAA 4: 0 drops, min ratio 0.87, frame jump 0.053/0.055.
- Rail lip, frozen at z 60, MSAA 0 → 4: peak warm 152 → 208 near, 177–184 → 211–213 far. Warm sum
  −13 to −15%, lit px −25 to −28%. By eye it is continuous, thinner and sharper. Intact.
- Cost on the owner's GPU: [unmeasured]. Swiftshader timings are not the cost answer (supervisor ruling).
- My Chrome (:9353) and scratch vite (:5183) are killed.

## Uncommitted

- `.claude/memory/MEMORY.md`: my index line for the memory below. The file also holds another agent's
  uncommitted line (`check-the-cdp-port-is-yours`, file untracked), so I did not commit it.

## Held files

- none. scene-effects.tsx, tuning-schema.ts, tuning-panel.tsx, exhaust-material.ts and
  bolt-streak-material.ts are released.

## Next

1. The owner reads the frame meter at DPR 2 with Render → msaa at 0, 2 and 4, then picks the default.
2. If the owner picks a value other than 4, make a one-line change in `tuning-schema.ts` (`Render.msaa`
   value).
3. If another NaN black flash appears, find it with the memory's method. Add a scene-buffer NaN scrub only
   then (supervisor ruling).

## Open questions

- Owner: the MSAA default after reading the meter.
- Supervisor: who commits `MEMORY.md` with both pending lines?

## Lessons → memory

- `.claude/memory/msaa-edge-samples-extrapolate-varyings.md`
