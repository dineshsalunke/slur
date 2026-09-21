---
name: instanced-meshes-hide-scene-bugs
description: When the owner says a stray object is in the scene, audit instance matrices — a traversal that skips InstancedMesh will wrongly "prove" nothing is there
metadata:
  type: feedback
---

A glowing box at the ship spawn was reported across several sessions. Each time the assistant
concluded it was part of the ship and not a scene object, and the owner had to re-open it: *"this box
has been a problem since the start. last time i had waste ages with you to remove it. you never
agreed it was a mesh in the scene last time as well."* It **was** a scene object — 160 unparked
`InstancedMesh` instances stacked at the world origin (`track-blocks.tsx`, fixed 2026-09-21 with
`InstancedMesh.count`).

**Why the wrong answer kept winning:** every check that "proved" the ship's innocence was run on
evidence that structurally excluded the culprit. A `scene.traverse` filtered with
`if ( ! o.isMesh || o.isInstancedMesh ) return`; a GLTF node/material count that says nothing about
what the renderer draws; a bloom-off test that only rules out bloom. Absence of evidence from a
probe that cannot see the thing is not evidence of absence — and an owner repeating a sighting
across sessions is data, not noise.

**How to apply:** when a stray object is reported in an R3F scene, walk `instanceMatrix` per
instance (position + scale, watching for identity matrices and unparked tails) before concluding
anything, and prefer a probe the owner suggested — a pointer raycast hit-test settles it in one
call. Any allocated-but-unwritten instance renders at the origin at unit scale, so the spawn point
is where such bugs surface. State findings as "this probe would not have seen X" rather than
"X does not exist". See [[worktrees-are-for-concurrency]] for the other standing correction.
