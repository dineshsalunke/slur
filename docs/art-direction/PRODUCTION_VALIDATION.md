# SLUR — production validation and remaining scope

These checks do not reopen the [final art direction](README.md). No passing production test is implied by a generated board or this reconciliation.

## Validate in the game

- Match final materials and light hierarchy under one camera and lighting setup. Check at race speed with bloom on and off.
- Verify track width, block height, ship footprints and gaps against gameplay contracts. Generated rulers and perspective are illustrative.
- Keep gaps distinguishable from seams and reflections. Validate stepped openings and surviving floor tongues before changing collision geometry.
- Test sealed versus broken-contour blocks without labels. Clean and worn non-destructible blocks retain sealed silhouettes at every wear strength.
- Keep procedural track wear stable during camera motion, without shimmer, repeated stamps or route-like bands.
- Check pickups as physical volumes from multiple angles. Test the square four-fin Seeker in actual rear-view output.
- Preserve gameplay contrast across Calm / Balanced / Intense. Progression does not prescribe permanent boost blur or increased blue saturation.
- Measure frame time, draw calls and material costs on target hardware. Numeric material settings remain tuning presets.

## Outside the finalized boards

- Ship-specific designs and orthographic sheets remain separate; existing gameplay footprints still govern.
- HUD styling and content layout are settled by the golden reference. Typeface, responsive sizes, alerts, empty/spectator states and rear-camera correctness still need production detail.
- Finish-line detail, measured track sections, slab thickness and exact pickup dimensions are not certified by these boards.
- The lower-camera/occlusion-fade proposal is not an accepted gameplay change. The local chase camera remains 9u above the ship; changes need gameplay review.
- Breakable-block collision and ramming behavior remain gameplay decisions. The proposed merge of slow and breakable blocks is not approved by art.
- The [nebula panorama](scene-background/experiments/2026-09-19-nebula-panorama/README.md) is a source experiment, not a finished seamless cubemap.

Implementation state belongs to engineering tracking. Old branch tips, lane handovers and checklist boxes are not current proof of a merge, a running task or visual acceptance.
