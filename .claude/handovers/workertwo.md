Agent: workertwo · Lane: mine throw — bolt-look shot, land, open (#266) · Updated: 2026-09-25

Older versions hold #263, #261, #259 and #257 (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

The owner said: "when i trigger a mine forward, the mine is shot out of the ship flies to the target place, lands
on the ground and then opens up ... we can use same shape, effect that we have used for the bolt". The reason:
"currently when i plant a forward mine i don't know if its placed or not."

## Done

- This commit (#266), client only:
  - `mine-throw.ts`: pure poses (shot, landing spike, body).
  - `mine-shots.ts`: throw source, launch, and the emitters and collectors that feed the bolt and mine sinks.
  - `mine-body-material.ts`: an onBeforeCompile spike fold (aHinge + aOpen).
  - `BoltSink` gets an optional `pitch`.
  - `NetMine` gets bornAt / fromX / fromY / fromZ / dir.
  - `ProjectileField` and `LocalBoltField` also draw mine shots. `noteBolt` stays on.
  - /test-level keeps throws in `localCombat.throws`.

## State

- Timeline:
  - Forward: the shot flies 0–0.25 s on an arc with a 1.5u rise and collapses by 0.30 s. A vertical 8u bolt spike
    shows 0.25–0.45 s. The body squashes 0.25–0.32 s and opens 0.32–0.50 s.
  - Back: the shot flies 0–0.12 s, flat, dir −1.
- Draw calls +0: shots and spikes go into the existing bolt meshes. There is +1 program variant (the mine body
  fold).
- Remote mines: they start from the owner's `Render` group (interpolated) at onAdd. An already-armed mine or an
  unknown owner shows fully open, with no shot.
- The clock is `performance.now()`, the same one bolt interpolation uses.
- Headless taps on /test-level, fired for real at x=14 [measured]:
  - The mine landed 93u ahead (z 423 from a ship at z 330).
  - It projects to the screen centre, just above the ship, near the horizon.
  - Frames: the streak shows at 0.1/0.2 s, the head at landing at 0.25 s, the spike at 0.30 s, the ring sweep at
    0.45 s, and the open mine at 0.6 s.
  - The back drop shows in the rear-view mirror.
  - Evidence: scratchpad `mine-throw-sequence.png`, `mine-throw-full-0.10.png`, `backgrid.png`.
- Gates [measured]: client typecheck clean, client tests 387/387, lint 0 errors (7 warnings, none new).
- The target is small at 90u from the chase camera. The streak and spike are the readable part. [observed]

## Uncommitted

None.

## Held files

None. Released on this commit.

## Next

1. Supervisor: the owner flies it. A browser reload is enough; a pnpm dev restart is not needed (client-only files,
   no shared or server change).
2. Pending with the owner: the fizzle feedback (server `'fizzled'` broadcast on MINE_BURST_MESSAGE).

## Open questions

- Owner: OK the server fizzle broadcast?
- Still open from #261: F = back key; the `checkThreat` audio cue ignores `proj.dir` (workerthree).

## Lessons → memory

- `.claude/memory/fake-performance-now-for-timed-taps.md`
