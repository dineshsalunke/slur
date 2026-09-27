---
name: test-level-dials-miss-the-predictor
description: "tunedSimConfig reaches only the loopback server; the client predictor runs DEFAULT_SIM_CONFIG, so dial only fields simulate() never reads"
metadata:
  node_type: memory
  type: project
  originSessionId: e283f8c3-c950-44a3-8f76-d8143776739b
  modified: 2026-09-27T16:47:58.418Z
---

`/test-level` leva dials go through `apps/client/app/routes/test-level/tuned-sim-config.ts`, which is passed
only to the loopback `RunSim`. The client predictor (`net/prediction.ts`, `ecs/net-systems.ts`) always
simulates with `DEFAULT_SIM_CONFIG`.

**Why:** a dial on a field that `simulate()` reads (e.g. `tugEaseS`, `tugGain`, `tugRiseS`, `boostGain`)
makes the server and the predictor disagree, so the local ship rubber-bands. Fields read only on the server,
at fire or latch time (`tugS`, `towS`, `tugRange`, block band, throw times), are safe: the client replays
the timer the server wrote.

**How to apply:** before you add a `Tug.*`-style dial, grep `sim/step.ts` and `sim/tug-status.ts` for the
field. If `simulate()` reads it, wire the tuned config into the predictor first, or do not dial it. (#330,
bf9199f)
