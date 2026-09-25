---
name: cavity-channel-is-dead
description: "The packed surface texture's R (cavity) channel is read by no material — Pit.cavity/Groove.cavity darkening is invisible; darken the albedo map instead"
metadata:
  node_type: memory
  type: project
  originSessionId: 9ca02a71-d600-49aa-8187-69d600538369
  modified: 2026-09-25T04:26:40.288Z
---

`track-texture.ts` packs cavity into R, roughness into G and metalness into B of one texture. The
materials bind it only as `roughnessMap` and `metalnessMap`. No `aoMap` is set anywhere in
`game/scene` (grep verified 2026-09-25). So the R channel reaches no shader. Any darkening written there
(Pit.cavity, Groove.cavity) has no effect on screen.

**Why:** when you tune a cavity knob and see no change, the cause is this dead channel, not a tuning
value that is too small.

**How to apply:** put visible darkening into the albedo `map` canvas, or bind the packed texture as
`aoMap`. An aoMap needs a uv1 channel or `aoMap.channel = 0`, and it only affects indirect light. Also
note that normal-map green is +v and textures flip Y, so canvas-down = −v; a dent's lower wall needs
+ny ([[probe-by-feature-not-by-pixel]]).
