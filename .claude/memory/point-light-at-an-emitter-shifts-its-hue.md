---
name: point-light-at-an-emitter-shifts-its-hue
description: A point light within ~0.5u of an emissive face blows it out and shifts its hue red; bisect by zeroing each light before touching colours
metadata:
  node_type: memory
  type: project
  originSessionId: dce8336e-2b94-4cfa-a55d-1450c62165a2
  modified: 2026-09-29T02:17:28.682Z
---

A marigold emitter that reads red-orange is often lit by a nearby point light, not mis-coloured. In #359
the EngineLight sat 0.41u behind the split-crown nozzle faces: orange light × orange base → red, then
Neutral tone mapping blew the faces out pink-white. Hue 16° vs 40° target.

**Why:** a black base colour did not help (the specular term at that range still blows out), and a
marigold light colour moved it only to 22°. Only distance fixed it. Fix `0bb4b5b`: the offset counts from
`exhaustPorts` (rearmost port z), not the ship centre.

**How to apply:** bisect by zeroing each source over `slur.tuning.v1` (see
[[tune-headless-captures-via-own-localstorage]]). Measure the mean hue of saturated pixels in a crop, not
by eye. Anchor any light near geometry to the model's own data, never a fixed offset from the centre;
hull `halfL` runs from 0.59 to 3.0.
