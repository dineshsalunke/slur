Agent: workerfive · Lane: boost blur fix #269 · Updated: 2026-09-26

## Goal
Make the #269 radial boost blur visible on /test-level. The owner said it was not visible.

## Done
- 16bc5ef: `boost-blur.constants.ts`. Reach 0.08 → 0.25, mask 0.12–0.6 → 0.05–0.45, 12 → 16 taps with
  per-pixel jitter. Pushed.
- #269 comment with the numbers. It stays OPEN for the owner's /test-level feel test.

## State (measured this session, /test-level, headless DPR 1, 1600×900, frozen at vz 217)
- BoostBlur is in the live EffectPass. Its strength reaches 1.000 at full boost.
- Deck pixels changed by more than 8 luma: noise 0.0%, old 1.5%, new 11.9%. Sky: noise 22.2%, old 27.3%, new 45.4%.
- Median frame time mid-boost: off 8.4–8.7 ms, on 8.7–8.8 ms.
- Biome and tsc pass on the client. The comment ratchet passes. The full test suite was not rerun (constants only) [unmeasured].
- Owner's stored `slur.tuning.v1` Boost.blur [unmeasured]: the Chrome extension was not connected.
- No headless Chrome left running.

## Uncommitted
- none from this lane.

## Held files
- none. Release all.

## Next
- Idle. Wait for the owner's feel verdict. To retune, use `Boost.blur` (0–2) or `BOOST_BLUR_REACH`.

## Open questions
- Owner: is the new blur strength right, or too strong?

## Lessons → memory
- `.claude/memory/measure-a-post-effect-by-region-change.md`
