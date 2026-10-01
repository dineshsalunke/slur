Agent: workertwo · Lane: #400 env black in hosted room (done) · Updated: 2026-10-01

## Goal
#400: the deck, rocks and hull rendered near-black in a hosted room while /test-level was lit.

## Done
- 745fc30b #393, 7a90abc6 #392, c8d31137 #398 (meteor polish, all closed).
- f3a0d370 #400 (closed). `env-band.state.ts` now keys the band render target on the renderer and
  disposes plus rebuilds it on a change. A unit test (stub renderers) covers reuse and the redraw.

## State
- Cause: the landing canvas drew the band. The next canvas got a cache hit on a target never drawn in
  its own GL context, so the environment was black. A direct load was lit.
- Verified headless on :5173, quality high: /test-level direct lit; / → navigate('/test-level') black
  before, lit after; / → host room lit, and lit again after leave + re-host (lobby view; GO not clicked).
- Render-target dispose counts match per round (+41 enter, +32 leave), so nothing accumulates. Live GPU
  memory per renderer [unmeasured]; the renderer wrap in the probe did not catch.
- Prod [unmeasured]; it uses the same code.
- Owner checks of #392, #393, #398 and #400 [unmeasured].

## Uncommitted
none.

## Held files
none — env-band.state.ts (+ test) released.

## Next
1. Wait for the supervisor's next lane.

## Open questions
- Owner (from #373): an incoming-bolt button on /test-level? A phone tick/seeker overlap fix?
- Owner: spectator shake (asked by the supervisor).

## Lessons → memory
- .claude/memory/module-gpu-caches-must-key-on-renderer.md (new, indexed).
