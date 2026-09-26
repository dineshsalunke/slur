---
name: avoid-pilot-sidestep-needs-dense-check
description: "The avoid pilot's per-slice reachability samples only the endpoint at vz≈0; a sidestep then crosses a hole or divider wall"
metadata:
  node_type: memory
  type: project
  originSessionId: c8c3d3dd-402e-4427-bd36-1def8c1a8fe7
  modified: 2026-09-26T19:46:54.638Z
---

The avoid pilot (`packages/shared/src/sim/avoid-pilot.test.ts`) checks a candidate x once per 2u slice. After a
bump, vz ≈ 0, so the whole sidestep falls inside one slice and only the endpoint is tested. The pilot then
strafed from standstill across a weave hole divider (death, seed 1) or pushed into a divider wall forever
(880 bumps, seed 17). Fix (4ca02e7): `sidestep()` samples the lateral path every 0.5u against
`openRunsAtSlice` + `floorAt`, and the fallback prefers a sidestep-safe candidate over `ranked[0]`.

**Why:** any new divider/post geometry (portal fork, parallel weave) triggers it; unit tests of the generator miss it.
**How to apply:** when the avoid pilot wedges or dies next to a divider, trace x/z/vz/target per tick before touching
the track — see [[measure-a-homing-rule-on-procgen]] and [[avoid-pilot-dithers-at-a-centred-post]].
