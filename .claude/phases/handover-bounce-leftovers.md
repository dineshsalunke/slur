# Handover — block-bounce leftovers (#213)

**Date:** 2026-09-23 · **Session:** workerone · Follows [[handover-block-bounce]].

## Landed

| Commit | What |
|---|---|
| `7928739` | `sim/respawn.test.ts`: second probe runs a ship into every gap edge on full-density tracks (6 seeds, 2u lateral steps, 1,068 deaths); same respawn invariants + no bounce one tick later; respawn-inside-a-block must phase out under invuln. |
| `afb2642` | `game/ecs/bounce-spark.ts`: `sparkIfBounced()` called around the live `simulate()` in `netFlightSystem` and `localFlightSystem`. Replay never runs it, so no double-fire. |
| `8b4d950` | `hit-spark.tsx`: marigold (`ACCENT_ANCHOR`), energy-core `#FFFBE7` → marigold over life, streaks stretched along velocity. `docs/ADD.md` §5 no longer says cyan. |

Tree left clean for my files. `pnpm lint` has 1 error in workertwo's uncommitted
`bolt-streak-material.ts` (format only) — not mine.

## Waiting on the owner — generator retune

Measured this session (scratch scripts, bots; not playtests):

- One contact on a flat track at 55u/s: **head-on bounce 1.45s** vs **old death 1.50s**; a 0.3u graze
  0.97s vs 1.50s. A no-steer bot cannot finish any of 6 seeds. So ADR-014's *"Blocks become cheap"*
  does not hold in time terms — **recommend no intensity retune**; record the numbers in ADR-014.
- **Graze outcome is random.** Glance vs hard stop depends on sub-tick phase (0.3u clip: 68% glance /
  32% stop; 0.5u: 48/52). Fix in `step.ts`: a clip shallower than a threshold always glances.
- **Pocket trap.** Two staggered blocks with a z-gap just over the hull (seed 1, z≈6019, gap 3.1u vs
  2.52u hull) ping-pong a throttle-holding ship: 100 bounces in 10s, stun refreshed each time.
  Strafing or braking escapes. Fix in the generator (ban that z-gap) or the sim.
- 15/1,068 gap respawns land inside a block; invuln phases them out (now pinned by a test).

Proposed next step, pending owner yes: ADR-014 as-built note + file two issues (graze randomness,
pocket trap). ADR number if a new one is needed: **ADR-016** (ADR-015 reserved by #214) — re-check.

## Not done

- Remote ships get no bounce spark (needs a server broadcast; `run-room.ts` is workertwo's).
- Spark `WIDTH` 0.045 / `BRIGHT` 4 read thin and dim at chase distance — owner look pending.
- `explosions.tsx` death burst is **cyan `#00e5ff` / magenta `#ff2bd6`** — off-palette per ADD §4,
  reported to the supervisor, untouched.

## Method notes

- Holding W on `/test-level` finds gaps, not blocks; a speed-drop filter caught **deaths**. To look
  at sparks, `import('/app/game/scene/hit-events.ts')` over CDP right after an `ignoreCache` reload
  and `pushHit()` in front of the parked ship.
