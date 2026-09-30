Agent: workerthree · Lane: exhaust blue-tail probe (investigate only, no issue yet) → next #394 (plan only) · Updated: 2026-09-30

## Goal
Find where the "slight blue tail" on the ship exhaust comes from. No source writes. The owner decides.

## Done
- Probe finished and reported to slur-supervisor (message 2026-09-30). No code changes.
- Earlier: 6acf1345 (#389, CLOSED), on origin.

## State
- Not reproduced. All plume pixels read hue 35–41°, measured by a hide-diff of the plume mesh (headless Metal, DPR 1, quality=high, :5173):
  - Chase view, 75 u/s: 880 px, hue 39°, 0 pixels with b>r.
  - Full cruise: 372 px, hue 39°, 0 pixels with b>r.
  - Mid-jump: 1471 px, hue 38–41° (8 bluish px = rock drift).
  - Landing side view: 0 pixels with b>r under the horizon, 3 frames.
- Landing core in one frame: RGB 166,140,101 (hue 36°, about 39% sat). Beside the ~85%-sat marigold plates it looks grey-lavender (scratch z-land.png, gone after the clear).
- Every colour input is warm.
  - Plume: exhaust-material.ts:38 `mix( uCool, uHot, pow( body, uHeat ) )`. uHot #fff1dc (:50 / Exhaust.hot). uCool is the accent.
  - Deck reflection: deck-reflection.ts:220 `uReflColor * glow` (the accent).
  - Post chain: boost-blur + bloom only.
  - No NaN path: drive values are always >0.
- Causes [inferred]:
  1. A saved `slur.tuning.v1` Exhaust.hot/cool override in the owner's browser. Rule this out first.
  2. Simultaneous contrast: the desaturated white-hot core next to saturated marigold reads cool.
  3. A view not staged here: DPR 2 with MSAA, the mirror, another racer, or boost [untested].
- Candidate fixes for cause 2 (tuning only, dev/tuning-schema.ts:158/203 or exhaust-material.ts:50):
  - Exhaust.hot #fff1dc → about #ffd9a0.
  - Or Exhaust.heat 1 → 2–3.
  - Or both at smaller steps.
  - A/B the core saturation on the landing side view and the chase view.
- Cause 2 belongs in #369, whose scope lists the plume hot/cool ramp. Cause 1 needs no issue. Cause 3 needs its own issue once reproduced.
- No headless Chrome left running.

## Uncommitted
none

## Held files
none

## Next
1. After the clear: #394, plan only. Read the issue, send the supervisor the plan, and write nothing until the owner approves.
2. Exhaust: wait for the owner's answer (which view, a screenshot, any leva Exhaust edits). Then A/B the candidate values under a claim.

## Open questions
- Owner: where is the blue tail seen, and have the Exhaust values been changed in leva?

## Lessons → memory
.claude/memory/probe-by-feature-not-by-pixel.md — new section "Isolate one mesh by a hide-diff in the live page" (hide every match; freeze first).
