---
name: react-dev-tracks-walk-typed-array-props
description: React 19.2 dev Performance Tracks enumerate every index of a typed-array prop on re-render; big report props cost seconds in dev
metadata:
  node_type: memory
  type: project
  originSessionId: 26ad019c-5433-4eed-8b8b-67a21a702d0e
  modified: 2026-09-24T08:19:29.295Z
---

React 19.2 dev builds log changed props of function components to the Performance Tracks
(`addObjectToProperties` in `react-dom-client.development.js`). The logger walks objects to depth 3.
A `Float32Array` is not an `Array` to it, so it lists every index. On `/pacing`, passing the
`PacingReport` to about 12 components made one seed change a 5.8 s main-thread task in dev only.
Production is not affected.

**Why:** a CPU profile of the seed change showed `addObjectToProperties` / `addValueToProperties` and a
native `run` taking almost all of the 5.8 s (2026-09-24, #245, `20caf85`).

**How to apply:** do not pass big data objects as props through many components. Provide them once
through a context (providers are not logged; only fiber tags 0/11/15 are) and read them in the leaves.
If a dev-only interaction is slow, profile before blaming your own code. See
[[svg-polyline-raster-per-tile]].
