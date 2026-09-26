---
name: band-width-is-the-weave-speed-dial
description: Groove costs a lookahead pilot 0 s (same as an empty deck); only a narrow walled band (≤16u) makes long/fast ships lift; class spread 29 s drove the grace to 45 s (#301)
metadata:
  node_type: memory
  type: project
  originSessionId: cc8dd5e7-8b2e-49bd-a9e5-0add0e72490f
  modified: 2026-09-26T18:20:19.765Z
---

Measured 2026-09-26 (#300 RFC, HEAD 8d7d798), `simulate()` avoid pilot, seeds 1–10:

- Groove run times equal an empty deck for every class, even at a 500 ms reaction delay. A clean pilot holds
  97–99% of top speed. Run time ≈ `L / top + ramp` (ramp 0.9–1.2 s; Freighter 2.3 s, accel 30).
- A walled weave band sets class speed. Band 16u: Freighter ~80 (top 124), Phantom ~89. 14u: Fighter 86,
  Phantom ~76, Freighter ~73. 12u: Phantom and Freighter cannot pass. The Interceptor holds 84 in all.
- The weave line at the contract caps is gentle. Every class threads it far above the caps.
- Clean class spread is 29 s on 8,000u. With the old 20 s grace, a clean Interceptor DNFed behind a clean
  Freighter. Since #301 (f811400) the grace is 45 s (`RACE_GRACE_SECONDS`) and there is no time cap.

**Why:** a later track or balance change will re-assume "groove forces speed loss" or "80% of top speed".
Neither is true.

**How to apply:** size track length from `L / top`, add a mistake budget (bump 1–2.3 s, death 1.5–2.6 s).
To make a phrase cost speed, narrow the walled band. Check any length change against the 45 s grace: class spread grows with length.
Full tables: `.claude/phases/2026-09-26-unified-generator-rfc.md` §1. Related: [[measure-a-homing-rule-on-procgen]],
[[song-map-runs-at-freighter-speed]].
