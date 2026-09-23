---
name: rear-view-panel-looks-like-geometry
description: "In a /test-level frame tap, the translucent marigold-edged slab at top centre is the rear-view mirror panel, not scene geometry"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 6ff05e3e-08fe-4d71-8c53-11d11ddb53e7
  modified: 2026-09-23T14:18:27.741Z
---

A `/test-level` frame tap shows a translucent slab with marigold edges across the top centre of the
frame. Behind the first pillar pair it looks like a lintel spanning the track. It is the rear-view
mirror (`apps/client/app/game/scene/rear-view-panel.tsx`, mounted by `<RearView />` in
`test-level-canvas.tsx`). It is not scene geometry.

**Why:** on 2026-09-23 it passed for a stray lintel while the pillar still for ADR-018 was being
judged. Tracing it cost a detour through git status and the canvas children.

**How to apply:** ignore the top-centre panel when you judge monolith, gate or arch geometry in a tap.
If a lintel really is in question, look at the band below the panel, or hide the panel before the
tap. See [[headless-chrome-for-frame-taps]].
