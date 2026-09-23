---
name: agent-headless-chrome-starves-the-owner
description: "Agents' headless Chrome game tabs share the GPU with the owner's browser; launch at DPR 1, muted, and kill immediately"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 9510520b-595a-4c60-9aba-692fe0097207
  modified: 2026-09-23T12:16:17.740Z
---

Every headless Chrome an agent launches must use `--force-device-scale-factor=1 --mute-audio`, and it must be
killed as soon as the measurement ends. Never leave a game tab rendering while the owner plays.

**Why:** on 2026-09-23 the owner fell below 15 fps. workerone bisected it and found no code regression. /test-level at
DPR 2 alone ran 20.7 ms; with ONE other uncapped headless tab it ran 40 ms. Each extra game tab takes an equal share of
the GPU, and the frame is fill-bound (DPR 1 → 8 ms, DPR 2 → 20 ms). An agent's headless tab also played game audio
through the owner's speakers.

**How to apply:** put the flags in every headless launch. Before blaming code for an fps drop, run
`ps -Ao pid,command | rg 'Chrome.*--headless'` and check for extra dev stacks. Related:
[[headless-chrome-for-frame-taps]], [[browser-extension-throttles-fps]].
