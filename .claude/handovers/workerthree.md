Agent: workerthree · Lane: #353 tone-mapping dials — DONE, issue closed · Updated: 2026-09-28

## Goal
#353: dev-panel dials for tone-mapping mode + exposure on every render path; drop the HDRI status row.
Next lane: the parked #344 race-profile run (after #352, awaiting owner time window).

## Done
- 765ab59: #353 shipped, pushed to dev, issue closed with the SHA (8 files).

## State
- Composer path: `ToneMappingEffect` instance in scene-effects; `.mode` from dial, None = `BlendFunction.DST`;
  exposure = `gl.toneMappingExposure` (three fills the effect's uniform).
- Plain path: plain-render sets `gl.toneMapping` when it differs + `toneMappingExposure` each frame.
- Rear view: three's operators by `uToneMode` uniform; exposure is three's `toneMappingExposure`; `uExposure` removed.
- Headless /test-level high + low, 4 modes, exposure 1/2.5: no shader errors; frame changes on both paths.
- Rear-view panel was not in frame at spawn: its visual response is [unmeasured].
- Plain path: the sky (`scene.background`, sRGB) ignores both dials — three design (WebGLBackground.js:208). Pre-existing.
- typecheck, `pnpm lint` (9 pre-existing warnings), client vitest 640/640: green.

## Uncommitted
none

## Held files
none — #353 claim released.

## Next
1. Wait for the go + time window on #344 race-profile.

## Open questions
- Owner: should the plain path tone-map the sky too (it does on the composer path)? Not in #353's scope.

## Lessons → memory
none
