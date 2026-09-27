Agent: workertwo · Lane: tug duration + reel-in #328 (DONE, closed) · Updated: 2026-09-27

## Goal
Double the tug (TUG_S 0.6 → 1.2) and tow (TOW_S 0.8 → 1.6, owner via supervisor). Rope reels back onto the coil when the pull ends, instead of fading in place.

## Done
- 8506bc1 #328: tug-constants TUG_S 1.2, TOW_S 1.6. tug-line: reel starts the tick the local Sim tugTimer (towTimer when this client is the tow victim) hits 0 after being seen > 0 and after the latch; else at hold (tugS / towS) + 0.25 s grace. Reel 0.4 s: payout 1 → 0 smoothstep, coil regrows and spins, travelling wave toward the ship, fade in last 25%.

## State
- Tests: shared 533/533, server 40/40, client 557/557 (rope-curve 17). Typecheck clean. Biome + comment ratchet clean on my files.
- /test-level stepped tap, default ship split-crown at ~119 u/s: anchor gap 146u (range edge) → pull 0.72 s; gap 123u → 0.58 s; gap 53u → 0.17 s. Reel starts the same tick the pull ends; rope gone 0.40 s later.
- Node shared sim, same ship at 119 u/s, old 0.6 vs new 1.2: gap 53 → 0.22/0.22; 90 → 0.42/0.42; 123 → 0.60/0.62; 146 → 0.60/0.73; 150 → 0.60/0.75. The tugReleaseS early release, not TUG_S, caps block-anchor pulls.
- Rival latch: 1.2 s (tugTimer = tugS, no anchor). Tow by victim class: interceptor 1.60, comet 1.44, fighter 1.28, phantom 1.12, freighter 0.96 s (armour-scaled).
- Remote clients' ropes are not tied to a pull timer; they reel at the hold time [inferred from code, unmeasured in a two-client room].

## Uncommitted
none

## Held files
none

## Next
1. Lane finished. Await a new lane from slur-supervisor.

## Open questions
- Block-anchor tugs never exceed ~0.75 s at cruise, even with TUG_S 1.2, because the pull lets go tugReleaseS (0.35 s) before the anchor and the range is 150u. To lengthen them: raise TUG_RANGE, lower TUG_RELEASE_S, or both. Owner decision.
- Coil ring (r 1.6u) sits mostly under the hull from the chase camera (from #326).

## Lessons → memory
- .claude/memory/step-the-loopback-room-by-hand.md (updated: start the fake clock at performance.now(); send an input every step)
