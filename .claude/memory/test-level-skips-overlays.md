---
name: test-level-skips-overlays
description: "/test-level never mounts <Overlays> (ThreatHud, countdown, results); in-race HUD for the owner to test must go in NetHud"
metadata:
  node_type: memory
  type: project
  originSessionId: a7220a92-7bff-4b1a-a795-9e57bad7a899
  modified: 2026-09-29T06:11:01.750Z
---

`/test-level` renders `TestLevelCanvas` → `NetCanvas`, which mounts `NetHud`. It never mounts
`game/overlays/overlays.tsx` — only `game-shell.tsx` and `mount-overlays.tsx` do. So anything under
`<Overlays>` (the bolt `ThreatHud`, countdown, results, spectator gate) is absent on /test-level
(verified 2026-09-29, #372).

**Why:** the owner tests every change on /test-level ([[owner-tests-on-test-level]]). A first
mount of the seeker warning in `overlays.tsx` rendered nothing there; a headless check caught it.

**How to apply:** put in-race HUD that the owner must see in `game/net-hud.tsx` (inside
`PhaseGate ON_TRACK_PHASES`). Before trusting a mount point, query the element in a headless
/test-level run. Open question for the owner: the bolt ThreatHud is still missing on /test-level.
