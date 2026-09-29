---
name: force-quality-high-in-headless
description: Headless /test-level without ?quality=high drew no rear-view mirror; force the high tier or a perf/look capture measures the wrong game
metadata:
  node_type: memory
  type: project
  originSessionId: 508671a5-aaa3-4a24-a270-4f6517bb4a5b
  modified: 2026-09-29T04:50:04.326Z
---

A Playwright headless Chrome on `/test-level` with no quality override showed **no rear-view mirror** while
racing (2026-09-29, #360 captures). With `?quality=high` plus `localStorage['slur:quality'] = 'high'` the
mirror drew. The low tier (`apps/client/app/quality/quality.constants.ts` `PROFILES.low`) turns off
`rearView`, `post`, `rocks` and MSAA and caps DPR at 1. So a capture without the override can measure a
different game from the owner's. That the probe picked `low` is inferred from the missing mirror.

**Why:** the tier auto-picks from the WebGL renderer string (`quality.utils.ts`); headless can report a
software or unknown renderer.

**How to apply:** every perf or look capture loads `/test-level?quality=high` and sets `slur:quality`.
Confirm with one screenshot that the mirror panel is at top centre. Toggle the mirror with
`localStorage['slur.rearView'] = 'on' | 'off'` before load. Related: [[headless-chrome-for-frame-taps]],
[[rear-view-panel-looks-like-geometry]], [[headless-game-tabs-starve-the-gpu]].
