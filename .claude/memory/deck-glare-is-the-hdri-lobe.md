---
name: deck-glare-is-the-hdri-lobe
description: "The near-white deck at defaults is the HDRI's bright lobe reflecting, not albedo; Environment.rotation is the main lever"
metadata:
  node_type: memory
  type: project
  originSessionId: 4621d17c-671f-43db-996e-8a7fe59a604e
  modified: 2026-09-28T18:10:55.598Z
---

At defaults (Environment.rotation 0) the near-left deck reads near-white (sRGB p50 203). The cause is the default HDRI's bright lobe reflecting off the metal deck (metalness 1, roughness 0.4). It is not the base colour. Measured 2026-09-28, headless /test-level high, spawn freeze:
- rotation 90/180 removes it (p50 ~48). Rotation 270 floods the right side instead (~237).
- rotation 180 + Metal.baseColor #595c62 matches the golden crop (p10/50/90 26/35/47) to within a few levels.
- The deck stays cool/blue after the match; the blue comes from the HDRI, and a warm base colour removes only part of it.

**Why:** darkening the base colour or Environment.intensity alone cannot fix one bright region without crushing the rest of the deck.
**How to apply:** check Environment.rotation first when a deck region is too bright or has a hot spot, then tune the base colour. Environment.intensity is the only reflection dial ([[scene-env-intensity-overrides-material]]).
