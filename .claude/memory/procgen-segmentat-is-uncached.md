---
name: procgen-segmentat-is-uncached
description: procgen Track.segmentAt rebuilds the segment on every call; a brute-force test must memoise it or it runs 100x slower
metadata:
  node_type: memory
  type: project
  originSessionId: 265c088a-b9fd-4381-9187-a403ae34e6fd
  modified: 2026-09-23T15:00:15.041Z
---

`resolveTrack({ kind: 'procgen' })` returns a `Track` whose `segmentAt(i)` calls `buildSegment()` each
time (`packages/shared/src/sim/track.ts:171`). Nothing is cached. A test that scans a grid of points and
calls `segmentAt`/`segmentAtZ` per point pays the full generator cost every time.

**Why:** in #216, a brute-force scan over 1,710 respawn points took 26.8 s. Wrapping the track in a
`Map<number, Segment>` memo made it 0.26 s. `respawn-point.test.ts` has the `cachedTrack()` wrapper.

**How to apply:** in any test or probe that queries the same segments many times, wrap the track in a
memo first. Do not add a cache to the sim `Track` itself without a plan: it runs in the shared
`simulate()`. See [[blocks-are-the-only-streamed-geometry]].
