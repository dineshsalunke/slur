---
name: block-render-cap-drops-silently
description: "TrackBlocks drops blocks past its instance cap with no error; an editor-saved level can hold 5x the blocks of the generated one, so a block the ship still hits goes invisible"
metadata:
  node_type: memory
  type: project
  originSessionId: bc84f310-6260-4659-8ea3-f86ec90cc664
  modified: 2026-09-27T08:09:45.601Z
---

`put()` (`game/scene/track-instancing.ts`) returns without writing once the instance index reaches the
limit. The sim keeps every block, so the symptom is "an invisible block I still crash into". Emit
starts 240u behind the ship, so the cut can land close ahead (110u was measured) and it moves as the ship flies.

An editor save is not the same as the generated track. `normalizeLevel` (`editor-shapes.utils.ts`) turned
generated phrase (596 blocks, worst window 134) into 3007 blocks, worst window 889. The level looks
identical, and the URL becomes `?level=<gen>-<seed>`, so the owner calls it "the generated track".

**Why:** #318 (2026-09-27). The first repro on generated phrase showed nothing, because the owner had flown
the editor-saved copy.

**How to apply:** for "a block is invisible but solid", compare the drawn instance count
(`window.__sealed.count` via an `onBeforeRender` hook) with the track's blocks in `[z-240, z+900]`,
and ask for the exact URL (`?level=` vs `?gen=`). Related: [[blocks-are-the-only-streamed-geometry]],
[[instanced-meshes-hide-scene-bugs]], [[webglrenderer-render-is-an-instance-method]].
