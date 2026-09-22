---
name: blocks-are-the-only-streamed-geometry
description: "TrackBlocks is the single component that rebuilds per frame from a window around the ship; deck, rails, rim, seams and monoliths are all built once over the whole track"
metadata: 
  node_type: memory
  type: project
  originSessionId: 01501cc0-c2f6-49d2-bcff-a133962a31ce
  modified: 2026-09-22T17:43:30.289Z
---

`TrackBlocks` is the **only** scene component that streams. It rebuilds its instances every frame from
`[sim.z - BACK, sim.z + AHEAD]` (`track-blocks.tsx`). `TrackFloor`, `TrackRail`, `TrackRim`,
`TrackSeams` and `Monoliths` all build **once** over the whole track in a `useMemo`, sized by
`segmentCount(track)`.

`BACK` (in `track-instancing.ts`) has exactly one consumer: the block emit loop. `AHEAD` is used by
both the emit loop and `segmentCount`.

**Why:** any camera that is not the forward chase camera — a rearview mirror, a spectator angle, a
replay — sees every other surface at any distance and sees blocks vanish at `BACK`. It reads as "the
blocks are broken" when nothing about the blocks is broken. Raised 80 → 240 for the mirror
(2026-09-22); measured worst case 71 instances against a `BLOCK_LIMIT` of 160, so there is headroom.

**How to apply:** before debugging "X is missing from view Y", check whether X is streamed. If it is
the blocks, suspect `BACK` first. Related: [[instanced-meshes-hide-scene-bugs]].
