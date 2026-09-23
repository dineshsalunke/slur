---
name: fog-hides-emissive-past-420u
description: "Scene fog is linear 40–420u and swallows emissive glow too; a far signal needs fog:false, and the camera far plane (1000u) is the hard cap"
metadata:
  node_type: memory
  type: project
  originSessionId: 00bb5dba-51a9-47aa-b8e3-50941b767246
  modified: 2026-09-23T14:41:37.262Z
---

The scene fog is linear, near 40u and far 420u, and the camera's far plane is 1000u (both measured in
`/test-level` on 2026-09-23). Three.js fog blends the whole fragment toward the fog colour, emissive
included. So any glow past 420u disappears, however high its `emissiveIntensity` is set. Nothing past
1000u is drawn at all.

**Why:** the #220 finish gate's marigold outline was invisible at 450u, and a force-green probe
proved it. Raising intensity cannot fix this. `fog: false` on the glow material alone did (`c36518a`).

**How to apply:** before judging "does X read from far away", check the distance against 420u and
1000u. For a gameplay signal that must read far, put `fog={ false }` on its emissive material only. A
floor decal at a 4u eye height is a few pixels tall at any distance and never reads from far away.
Related: [[headless-chrome-for-frame-taps]], [[freeze-does-not-stop-asteroid-drift]].
