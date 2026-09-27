---
name: block-render-cap-drops-silently
description: "put() drops instances past its limit with no error; TrackBlocks now sizes its cap per track (4b17a2e), but any other instanced renderer with a fixed limit can still hide a solid block"
metadata:
  node_type: memory
  type: project
  originSessionId: bc84f310-6260-4659-8ea3-f86ec90cc664
  modified: 2026-09-27T08:19:56.757Z
---

`put()` (`game/scene/track-instancing.ts`) returns without writing once the instance index reaches the
limit. The sim keeps every block, so the symptom is "an invisible block I still crash into".

**Fixed for blocks (#318, 2026-09-27).** In 4b17a2e, `blockCapacity(track)` sizes the sealed and fractured
meshes to the worst `[z-240, z+900]` window of the track. `emitWindow` emits ahead-first, so an overflow
can only drop blocks behind the ship. In fc85cd7, the editor's `normalizeLevel` keeps walls whole: a phrase
round trip is 596 blocks, where the old grid slicing made 3007 (worst window 889).

**Why:** #318. The owner flew an editor-saved copy of phrase (`?level=phrase-20260921`) and called it "the
generated track". The first repro on `?gen=phrase` showed nothing.

**How to apply:** for "invisible but solid", ask for the exact URL (`?level=` vs `?gen=`). Compare
`mesh.count` with `mesh.instanceMatrix.count` (capacity) through an `onBeforeRender` scene grab. The sealed
mesh has `aSealedSeams`. The fractured mesh has capacity ≥ 160: debris meshes also carry `aBlock`/`aFractureGlow`
but have capacity 12. To test a dense level without writing `tracks/`, stub `/__tracks/<id>` with Playwright
`page.route` (driver `verify318.mjs`, workerone #318 scratchpad). Related:
[[blocks-are-the-only-streamed-geometry]], [[instanced-meshes-hide-scene-bugs]],
[[webglrenderer-render-is-an-instance-method]], [[preview-a-constant-by-route-rewrite]].
