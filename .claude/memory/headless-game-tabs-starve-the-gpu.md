---
name: headless-game-tabs-starve-the-gpu
description: "Every open tab rendering the game takes an equal GPU share; an agent's headless Chrome halves the owner's frame rate"
metadata:
  node_type: memory
  type: feedback
  originSessionId: b06ba10c-bcbb-4b0f-90a2-8c269ab0fee5
  modified: 2026-09-23T12:15:58.269Z
---

A second tab rendering the game at DPR 2 doubled the frame time of the first one. Measured on
2026-09-23: 20.7 ms alone, 40 ms with one rival, and still 40 ms when that rival was vsync-capped,
because at DPR 2 it never reaches vsync. The owner's "<15 fps regression" was this effect, not code.
Today's commits measured flat at 20–22 ms.

**Why:** at DPR 2 the frame is fill-bound (DPR 1 is 8 ms), so any tab that renders the game
saturates the GPU. Because other tabs come and go, the same code read 20, 40 or 66 ms.

**How to apply:** launch headless Chrome with `--force-device-scale-factor=1 --mute-audio`, unless
the measurement needs DPR 2. Kill it the moment the measurement is done. Before you call anything a
perf regression, list the browsers rendering the game (`ps` for headless and GPU processes). Then
A/B the two builds back to back, alone on the GPU. Related: [[headless-chrome-for-frame-taps]],
[[browser-extension-throttles-fps]].
