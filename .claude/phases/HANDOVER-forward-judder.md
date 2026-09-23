# Handover — the ship judders forward but not sideways

Session of 2026-09-23. Open bug, not fixed. Two commits landed that serve the hunt; the cause is
narrowed to frame-time variance but **not yet measured on a real GPU**.

## The symptom, as the owner described it

Strafing is smooth. Other animation is smooth. Moving forward, the ship "keeps juddering back and
forth". Started some time after 2026-09-22 22:00 — it was fine the previous night.

## What is ruled out, with the measurement

**The simulation.** 900 fixed steps at full throttle down the `/test-level` descriptor
(seed 20260921, 420 segments, blockDensity 0.6, gapChance 1):

```
final z=787.6  vz=55.00  alive=true
backward z steps: 0 (worst 0.000u)
vz drops >0.01: 0 (worst 0.000)
```

`vz` is pinned at 55.00 the whole way. Nothing oscillates in `simulate()`.

**The interpolation and the camera, at a steady frame rate.** Driving the real `createFixedStep`
through the same lerp and the same `1 - Math.exp( -20 * delta )` camera smoothing, measuring the
ship-to-camera gap:

```
60Hz exact                 swing 0.000u
120Hz (ProMotion)          swing 0.000u
50fps steady               swing 0.000u
59.94Hz (display)          swing 0.000u
```

The rate does not matter. A steady 50fps is as smooth as a steady 120.

**Block-instance overflow.** Worst streaming window is 124–129 blocks against `BLOCK_LIMIT` 320
across seeds 1234 / 12345 / 7.

**Segment generation cost — the owner's own hypothesis, tested twice.** `makeProcgenTrack` never
caches — `packages/shared/src/sim/track.ts:168`, *"const segmentAt = ( i: number ): Segment =>
buildSegment( seed, i, length, density );"* — so `TrackBlocks` regenerates all 58 window segments
every frame. The first pass reported only a mean (0.154 ms/frame), which would have hidden GC
spikes. Re-measured on the real `/test-level` descriptor over 3000 frames, with the tail:

```
mean 0.135   p50 0.123   p99 0.237   max 0.328 ms
frames over 2ms: 0, over 5ms: 0
heap grew 1.6 MB across the run
```

No spikes, no GC cliff, almost no garbage. Not the judder. Caching `segmentAt` is still worth doing
one day on principle, but it will not fix this.

**The rest of the track path.** Floor, seams, rails, rim, monoliths and asteroids all `useMemo` their
geometry on `[ track ]` — built once, never per frame. Consistent with
[[blocks-are-the-only-streamed-geometry]]. The generation work of 2026-09-22/23 made the track
*content* heavier (more and larger blocks to draw) but did not add per-frame CPU.

## What is left, and why the axis split does not rule it out

Frame-time **variance**, same harness:

```
hitch: 16.7ms, 50ms/12f    swing 0.446u
vsync beat: 45fps@60Hz     swing 0.123u
heavy jitter +-6ms         swing 0.186u
```

The swing appears only in Z, because of the camera's axis asymmetry
(`apps/client/app/game/camera/chase.ts:31`):

```
cam.position.x = p.x;                                   ← exact copy
cam.position.y += ( p.y + CHASE_HEIGHT - cam.position.y ) * k;
cam.position.z += ( p.z - back - cam.position.z ) * k;  ← smoothed, so it lags
```

X jitter is structurally invisible: the camera copies the ship's X exactly, so the ship never moves
sideways in view. Z is smoothed, so the camera lags and every wobble reads as the ship sliding back
and forth. **"Strafe smooth, forward juddering" is the signature of frame-time variance in this
camera, not evidence against it.** This session initially read the axis split the other way and was
wrong.

## Suspects in the regression window (2026-09-22 22:42 → now)

Everything here is a per-frame cost that did not exist the night before:

- `980827e` **the rearview** — `apps/client/app/game/scene/rear-view.tsx:44` does
  `state.gl.render( state.scene, camera )` into a 4× MSAA FBO **every frame**. A second full scene
  render, plus drei `<Hud>`'s own pass, plus bloom. Three scene renders and a postprocess where
  there was one. Loudest suspect, and one `if` away from an A/B.
- `a2c4f8d` rail area lights + one bloom pass.
- `3b82790` real Metal046B maps on blocks, sampled in world space.
- `bb2d9f5` + `c671f37` two instanced asteroid fields.
- `fbd1165` / `7e27250` / `568c523` continuous block and monolith sizes.

## Landed this session

- `1294cca` — backtick toggles the tuning panel, as a real mount/unmount. Also takes leva out of any
  measurement.
- `4945b38` — mounts `FpsReadout` top-centre in `/test-level`. It and `frame-meter.ts` both already
  existed; the meter had been running its `addEffect`/`addAfterEffect` pair every frame and
  reporting to nobody. Shows `fps · cpu · max`, where **`max` is worst frame in the last 500ms** —
  the number that separates "steady 45" from "60 with spikes".

## Next

1. Fly `/test-level` and read `max` against the mean. Steady ⇒ look elsewhere. Spiky ⇒ it is this.
2. A/B the rearview pass. It is the single biggest per-frame item added in the window.
3. Only if 1 and 2 clear it: instrument per-pass GPU time rather than guessing further.

**Do not measure this in headless Chrome.** SwiftShader is a software rasteriser, so its frame times
say nothing about the real GPU — see [[headless-chrome-for-frame-taps]], which is for *look*
judgements only. This needs the owner's own browser, focused, not the extension-driven tab
([[browser-extension-throttles-fps]]).

## Unrelated bug noticed, not fixed

`createFixedStep` does `if ( n === maxSteps ) acc = 0` — any frame slower than 5 × 16.7 = 83ms
silently discards the accumulated time, so the ship falls behind real time. A position
discontinuity on a severe hitch, not the judder.

## Also parked this session

Playwright cannot drive Zen. Verified against Zen 1.22.2b: BiDi connects, `session.new` and
`browsingContext.create {type:"tab"}` both succeed, but `{type:"window"}` fails with
*"openWindow() not supported in Zen"*, and Playwright's BiDi layer always asks for a window. A thin
raw-BiDi driver would work; the owner was asked whether to build it and had not answered when the
judder came up.
