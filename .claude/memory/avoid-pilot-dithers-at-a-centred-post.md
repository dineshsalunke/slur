---
name: avoid-pilot-dithers-at-a-centred-post
description: A delayed avoid pilot centred behind a post flips between two equal escapes and brakes to a stop; a commit bias fixes it
metadata:
  node_type: memory
  type: feedback
  originSessionId: a18434e6-58e4-4eed-8666-34c351d03b6e
  modified: 2026-09-26T18:29:16.367Z
---

A late-reacting avoid pilot (12-tick delay) that sits dead centre behind a post sees two escapes at the same
cost. Its choice flips every replan, so it strafes back and forth, brakes and stops. The result reads as
`finished: false, deaths: 0, bumps: 0` with the tick budget used up. Phrase seed 17 (Fighter) did this at a
12u post on a 96u deck; the RFC's "groove seed 5 lone post" miss is the same shape **[inferred]**.

**Why:** a no-finish with 0 deaths and 0 bumps looks like a trap. It is a pilot fault, and "fixing" the
generator for it would bend geometry around a test artefact.

**How to apply:** the shared pilot `sim/avoid-pilot.test.ts` now adds `COMMIT × |x − lastChoice|` to its cost
(since `8a4f1dd`). Before calling a stall a trap, trace x, target and brake per tick near the stop. A target that
alternates between two values means the pilot is dithering. See [[escape-sweep-pilot-must-stop]] and
[[delay-the-perception-not-the-loop]].
