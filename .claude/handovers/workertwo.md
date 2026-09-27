Agent: workertwo · Lane: boost glides over gaps #319 (DONE) · Updated: 2026-09-27

## Goal
While Boost is on (and 0.3 s after), a ship holds deck height over gaps instead of falling.

## Done
- b3965f7 #316 lobby engine hum (earlier lane, closed).
- 59feea6 #319: `glideTimer` sim field (wire + SIM_SHIP_KEYS + SIM_FLOAT_KEYS), set to boostTimer + BOOST_GLIDE_S (0.3) in tickStatus, cleared by clearStatus. resolveCollisions holds y = 0 inside the deck while glideTimer > 0 and prevY + stepTol >= 0; grounded, jumps reset, lastSafe untouched. GDD §5.3 Boost paragraph added.

## State
- Shared tests 526/526 (5 new in boost.test.ts), server 40/40, client 513/513, typecheck + lint clean.
- /test-level live (headless, scratch gap-check.mjs): full gap z 1617–1636 at x=0; no boost → died at z ~1636; boost → y 0 over the gap, alive to z 1696; client state has glideTimer.
- Whether the owner's server (tsx watch, pid 68209) reloaded the new shared dist [unmeasured]; a hosted room may need a server restart.

## Uncommitted
none

## Held files
none

## Next
1. Lane finished. Await a new lane from slur-supervisor.

## Open questions
- No visual cue for "boost deck" over a gap; owner may want one (follow-up issue if so).

## Lessons → memory
none
