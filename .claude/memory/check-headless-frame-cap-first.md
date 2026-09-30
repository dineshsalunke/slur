---
name: check-headless-frame-cap-first
description: "On 2026-09-30 headless Chrome frame ms on this Mac sat at 16.6-17.0 ms for every page (60 Hz cap), so a GPU-synced frame number was meaningless; time the main menu first to detect the cap"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 6d04acb8-3a53-47e6-b881-cef6c9768020
  modified: 2026-09-30T09:01:51.278Z
---

On 2026-09-30 (#390), the GPU-synced readPixels meter read 16.7–17.0 ms on `/test-level` at `?quality=high`,
and 16.6 ms on the near-empty main menu (45 draws). The cap was the same with `--disable-gpu-vsync
--disable-frame-rate-limit`. A day earlier the same scene read 8.30 ms. So headless was capped at 60 Hz, and
the frame number said nothing about the change. The cause was not isolated.

**Why:** a capped reading looks like a real regression (8.3 → 16.9 ms). Draw counts stayed exact (74), so
use draws for a structural A/B when the cap is on.

**How to apply:** before any frame A/B, time `/` for one rep. If the menu also reads about 16.7 ms, report
frame ms as "not measured (headless 60 Hz cap)", not as a result. Related: [[gpu-timing-without-repo-edits]],
[[force-quality-high-in-headless]], [[headless-game-tabs-starve-the-gpu]].
