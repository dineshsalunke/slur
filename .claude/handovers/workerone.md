Agent: workerone · Lane: none (#365 done) · Updated: 2026-09-29

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Lane clear. Waiting for a new assignment.

## Done

- `3f6f791` #365 (CLOSED): seam streaks stay in line with the seam and read the deck. Exact world-affine
  varyings (`vReflAxis`) replace the ±1 corner varying. The fragment shader samples the deck
  normal, roughness and albedo maps. New dials `Reflect.warp` 0.3 and `Reflect.grime` 0.8. Docs:
  ADR-031 (two bullets + a cost line), ART_MATERIALS §7 item 23.
- `40df323` investigation handover and memory `trapezoid-quad-varyings-skew.md`.

## State

- [measured] Glow centroid vs seam axis: before 1–8.5 px, after under 1 px (blur 0.01 and 0.04).
  Exception: a foot at the frame edge.
- [measured] GPU, streaks on vs off, DPR 2, 1728×1080: driving 0.00 ms before and after. Close-up
  worst case: 0.1 ms old, 0.0–0.2 ms new, within the 0.1 ms timer step.
- [measured] Row-to-row texture along a close streak: 3.5 → 10.3 at grime 1. Mean brightness
  226 → 235.
- [unmeasured] The owner's own chase-camera view. The taps used a fixed camera beside the first
  pillar.
- Departure: I dropped the planned Schlick Fresnel. At F0 0.017 it matches `pow(1−cosθ, grazing)`
  within about 2% [inferred, maths].
- Scratchpad `14c7e25b…/scratchpad/streak/` holds probe5 (lean), gpu.mjs, stress.mjs and
  variant-old.mjs (serves the old shader). No headless Chrome is running.

## Uncommitted

- none.

## Held files

- none. Released all #365 claims.

## Next

1. Take the next lane from the supervisor.

## Open questions

- Owner: are the warp 0.3 and grime 0.8 defaults right on /test-level? Both dials are in the dev
  panel under Reflect.

## Lessons → memory

- `.claude/memory/trapezoid-quad-varyings-skew.md` (written at the investigation seam).
