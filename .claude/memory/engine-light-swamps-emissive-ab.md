---
name: engine-light-swamps-emissive-ab
description: "An A/B of the ship's engine-core emissive reads flat in the full scene; the EngineLight point light and the plume already saturate the rear faces. Zero both to isolate the emissive"
metadata:
  node_type: memory
  type: feedback
  originSessionId: fd3fdcdf-6a96-4483-86ab-eaa7580c5f89
  modified: 2026-09-25T03:11:46.366Z
---

To measure the ship's engine-core bloom, set `EngineLight.intensity` and `Exhaust.glow` to 0 first.
With them on, an A/B of `Ship.engineCruise` 1.0 against 2.2 moved the halo mean only 77.95 → 78.52.
With both off, the same A/B read core pixels over luma 200 at 0 → 134.

**Why:** 2026-09-25, #195 port (9d45eb3). `EngineLight` (intensity 18, 3.4u behind the ship) lights the
rear faces of the Split Crown, Engine_core included, past `Bloom.threshold` 0.6 whatever the emissive
value is. The plume adds more on top. So an emissive retune can be correct and still hard to see in play.

**How to apply:** in a frozen headless /test-level, set the knobs through the page's own
`/app/dev/tuning.ts` `setNum` (fresh load, no HMR — [[cdp-import-of-tuning-hits-an-hmr-orphan]]), set
`Sim.vz` high for cruise (`exhaustDrive` clamps to 1), and repeat the first setting at the end to prove
the reading returns. There is no ImageMagick: decode the CDP screenshot into an in-page 2D canvas and sum
luma over a crop. `sips -c H W --cropOffset Y X` crops for viewing. Related:
[[freeze-the-sim-to-ab-a-light]], [[probe-by-feature-not-by-pixel]].
