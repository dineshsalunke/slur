---
name: a-sweep-that-hits-its-bound-fakes-a-reading
description: "When a measured window equals the sweep's own range, the sweep was clipped; also a scripted jump pilot must never re-press from the floor"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 506b305a-47bc-47c7-ae96-b52206356d8f
  modified: 2026-09-23T20:46:38.339Z
---

When a sweep's result equals its own range, the sweep was clipped. The number measures the sweep, not the track. On the pacing board (2026-09-24), every gap first read a 1.05s takeoff window. That is exactly the scan's 56u at 55u/s. Two causes produced the same number:
- A hull that rolls over a short hole needs no jump at all.
- The scripted double-jump pilot pressed again after it had landed, which made a fresh coyote jump from the floor.

**Why:** a clipped or cheating probe gives a stable, plausible number. It passes review and survives into design decisions. See [[measure-a-homing-rule-on-procgen]].

**How to apply:**
- Before trusting a swept window, check `from`/`to` against the scan bounds.
- Assert in a test that the window starts inside the bound.
- A scripted pilot presses its second jump once, in the air, and stops when it lands.
- Test "does it pass with no input?" before measuring any window.
