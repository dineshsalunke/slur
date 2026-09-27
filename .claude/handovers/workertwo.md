Agent: workertwo · Lane: tug timeline rework #330 (DONE, closed) · Updated: 2026-09-27

## Goal
Owner timeline: 0.2–0.3 s throw, then a 2 s pull (1 s strong, 1 s ease), rope detaches at 1.5 s and reels in.

## Done
- bf9199f #330:
  - The server holds the throw in a `tugThrows` list on FireContext (run-sim owns it). Messages: 'throw' at fire, then 'latch'/'anchor' at the landing, or 'miss'.
  - TUG_S 2, TOW_S 2 (reduced by armour), TUG_EASE_S 1 with a smoothstep ease. Pull thrust gain×cruise/0.25 s in the strong phase. Towed controls apply only in the strong phase.
  - Block band 250–450u. Rivals stay at 150u. Latch slack 1.25× range.
  - Rope: detaches 0.5 s before the pull ends, or when a block anchor lets go (local Sim tugAnchorZ; remote: owner within 60u of the anchor).
  - Leva Tug.* dials.
  - Closed #330.

## State
- Tests: shared 546/546, server 40/40, client 563/563. Typecheck clean. Lint clean (only warnings that were there before).
- Planning sim (config overrides, split-crown with throttle held): pull 186 u/s at 1.0 s, 156 at 1.5 s, 125 at 2.0 s. That run had no pull thrust; with the thrust the ship reaches 1.5× in about 0.25 s even without throttle (unit test).
- Block gaps, 10 procgen seeds: with the 250–450 band, median gap 307u and no anchor in 28% of samples.
- /test-level visual check not run by me [unmeasured]. Owner checks it.
- Remote ropes: detach timing comes from the latch event `seconds`, and an anchor lets go within 60u [inferred, not measured in a two-client room].

## Uncommitted
none

## Held files
none (lane done)

## Next
1. Await the owner's /test-level check and a new lane from slur-supervisor.

## Open questions
- Leva dials cover only fields the server reads (throw min/max, pull, tow, range, block band, latch slack). The ease, gain and rise times are not dialled: the predictor uses DEFAULT_SIM_CONFIG, so dialling them would make the ship rubber-band.
- Coil ring (r 1.6u) sits mostly under the hull from the chase camera (from #326).

## Lessons → memory
- .claude/memory/test-level-dials-miss-the-predictor.md
