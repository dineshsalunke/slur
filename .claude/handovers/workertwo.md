Agent: workertwo · Lane: monolith gate + arch, finish reset (#220); #214 parked · Updated: 2026-09-23, ~20:40

## Goal

#220: the finish is a monolith GATE, ARCHes stand at 25/50/75%, and `/test-level` resets the ship to the start
after the finish with a fade. #214 stays parked on the owner's eyes-on check.

## Done

- `58bb6e6` — owner follow-up: bulkier arches. `ARCH_FRAME` legs 16→32u, depth 16→32u, lintel 20→40u (scaled
  to match; the still looks right). The opening stays 112u, so the legs grow outward (inner face 56u, outer
  88u). A new test in `monolith-frame.test.ts` proves no pillar overlaps an arch leg.
- `921ee24` — #220 steps 1–5 in full: `MonolithGroup` takes transforms, `monolith-frame.ts`,
  `monolith-frames.tsx`, `arch-field.ts`, the gate in `finish-gate.tsx`, and the reset (`finish-reset.ts`,
  `finish-fade.tsx` z-30, `restartRunClock`, `restartLocalCombat`, `restartTestRun` in `local-loop.tsx`).
  The NN-13 weighing is in the commit body.
- `f9248ef` — pillars. Earlier #214 SHAs: `523d63c`, `b6f1f45`, `8c9afaf`, `248096d`, `215159e`.

## State

- At `58bb6e6`: client vitest 221/221, tsc clean, biome clean on the touched files.
- Headless /test-level, scratch port 5186, DPR 1, killed after:
  - Arches stand at z 2071 / 4194 / 6156, heights 200 / 189 / 173u.
  - The arch at z 4194, shot from 260u and 600u: the legs read bulky, seams show on the inner faces, and the
    lintel is in proportion.
- The gate is unchanged (legs 24u, depth 24u, 200u tall). The arches are now bulkier than the gate, and the
  tallest arch (200u) is as tall as the gate.
- There are no `Arch.*` tunables in `dev/tuning-schema.ts`. The sizes are constants.

## Uncommitted

None of mine. (`docs/art-direction/**` untracked files belong to ChatGPT. Never add them.)

## Held files

None. The follow-up claim (`monolith-frame.ts` + test) is released.

## Next

1. Wait for the owner's decision on the gate bump (open question 1). If approved, edit `GATE_FRAME` in
   `monolith-frame.ts`, then take a headless still at finishZ − 450 and finishZ − 900.
2. #214 step 5 whenever the owner plays it.

## Open questions

1. Gate bump proposal, not built: legs 40u, depth 40u, lintel 48u, overhang 8u, height 240u. This keeps the
   gate the boldest and tallest frame.
2. Gate seam: the pillar `EDGE_SEAM` is 0.5u wide. From 450u and farther it is sub-pixel [inferred]. Should it
   be wider or brighter?
3. #214: do sealed blocks stop a bolt (built as yes)? One `smashKeep` for every class? A marigold ember burst
   on a break?

## Lessons → memory

none
