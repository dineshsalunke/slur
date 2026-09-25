---
name: round-lobes-read-as-spots
description: "Round shapes in a surface texture (pits, radial-gradient lobes) read as raindrops or leopard spots; use lines and fBm noise masks"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 781777e4-a44f-4efd-9760-a6edac60c514
  modified: 2026-09-25T13:31:43.585Z
---

Any round primitive in the graphite texture reads as a drop or a spot. This includes stamped discs,
Worley pits at any size, and radial-gradient blotch lobes. The owner rejected three pit rounds as
"raindrops on windsheild" (#258, 2026-09-25). Lobe-cluster blotches then read as leopard spots on a monolith face.

**Why:** the eye groups round, evenly sized marks into droplets. The owner's reference (scratched cast iron)
has straight scratches at every angle and irregular cloud blotches.

**How to apply:** for wear, use thin straight strokes at uniform random angles with log-spread lengths. For
patches, use a tileable fBm mask with a smoothstep band, not radial lobes. Look at a far monolith-face
capture before you send it. Related: [[threshold-noise-makes-worm-pits]], [[cavity-channel-is-dead]].
