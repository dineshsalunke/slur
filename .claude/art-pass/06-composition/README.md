# Task 6 — Composition: everything together, one final validation

**Status:** not started
**Depends on:** tasks 1–5, all accepted in isolation.

---

## 1. What this task is

Not new art. This is the gate where the five accepted ingredients are judged **as one frame** — because every
prior gate judged one variable, and a scene can fail on balance while every ingredient passes alone.

## 2. The acceptance checks

From `HANDOVER.md` §9 — measured in the **real renderer with the real camera**, never from a painting:

1. Inspect coordinates and bounds to verify dimensions. **Never validate a dimension from pixels.**
2. Approach at the representative **55u/s** and across the supported speed range. At 55u/s, half a second is
   27.5u of travel — obstacle height does not establish the detection window.
3. **Gap edges stay distinct** from panel seams and from reflected light.
4. Marigold reads golden under final tone mapping and exposure — **no reddish edge spill**.
5. The same reads hold across **A / B / C**, with bloom **enabled and disabled**.
6. Environmental scale (monoliths, asteroids) is never confusable with 8u gameplay hazards.
7. Hierarchy holds: ship / threats / pickups read first, then track boundaries and gaps, then framing, then
   far scale.
8. Frame time and draw-call / material cost measured on target hardware.

**Return measured screenshots and clips, the actual camera settings, actual geometry values, and every failed
read.** A pass is not asserted without observation. If a constraint conflicts with the code, flag it — never
silently change the art or the gameplay.

## 3. What is deliberately NOT in this arc

Carried forward as separate work, so it does not quietly expand this one:

- **Obstacle blocks** — sealed vs destructible, and the joint readability test. `OQ7` is answered
  (destructible needs **broad fractures interrupting the outer contour** plus internal marigold energy;
  surface cracks alone are insufficient) but no lane has built them.
- **Pickups and weapons** — v2 adds volumetric treatment to the frozen family sheet (`11_pickups_weapons_final`).
- **Ships** — five gameplay footprints exist; final art and orthographic sheets are not frozen.
- **HUD / UI** — minimal graphite-marigold direction only; typography, layout, motion, rear-view all open.
- **Camera** — ADR-010 defers it. `HANDOVER.md` §8's 4–5u proposal plus selective occlusion fade is approved
  **to prototype**, not frozen. It needs its own change and its own feel-gate, and it is a **gameplay**
  decision, not an art one.
- **Finish line** treatment.

## 4. Result

*(filled in after the gate)*
