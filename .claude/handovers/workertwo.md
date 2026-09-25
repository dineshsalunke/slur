Agent: workertwo · Lane: mine throw + open animation (no issue yet) · Updated: 2026-09-25

Older versions hold #263, #261, #259 and #257 (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

The owner said: "when mine is placed it should play an animation like the mine is thrown in front and then when it
settles is opens up", because "currently when i plant a forward mine i don't know if its placed or not." The
animation is feedback. The dropper must see the forward mine land 70–102u ahead. A fizzle must read as lost.

## Done

- Plan sent to slur-supervisor (2026-09-25). Nothing built.

## State

- Forward drop z = ship.z + halfL + 3 + 0.8·vz. Back drop = tail − 4u. Arm = 0.5 s [measured from source].
- At arm the mine is ~0.3·vz (25–40u) ahead of the nose. The ship reaches it at ~0.8 s [derived].
- A fizzle returns silently at `apps/server/src/rooms/room-combat.ts:69`, and no message is sent [read].
- OWNER REDIRECT: the in-flight mine uses the bolt look. Revised plan sent. The shot is extra instances in
  `BoltStreaks` (`game/scene/bolt-streaks.tsx:38`), fed by a new `collectMineShots` from ProjectileField and
  LocalBoltField. BoltSink gets an optional `pitch = 0`. Shallow arc (≤1.5u rise) lands at 0.25 s, the streak
  collapses by 0.30 s, a vertical bolt spike flashes at the landing point, and the mine opens 0.32–0.50 s
  (aHinge + aOpen). Back drop: a short dir −1 shot, 0.12 s. +0 draw calls.
- Pending with the owner: the fizzle broadcast, and other players' mines (now default identical, since bolt
  meshes have no per-instance colour).

## Uncommitted

None.

## Held files

None yet. Claims are listed in the plan and wait for approval.

## Next

1. Wait for owner approval via the supervisor (fizzle broadcast OK? other players' trail full or dimmed?).
2. File the issue unless waived. Send claims. Build `mine-throw.ts` + tests first, then the shader patch, streaks,
   net wiring, and fizzle.
3. Timed headless taps at 0.1/0.2/0.3/0.45/0.6 s. Count trail/ping pixels at the landing distance.

## Open questions

- Owner: OK the server fizzle broadcast? Trail and ping full or dimmed for other players' mines?
- Still open from #261: F = back key; the `checkThreat` audio cue ignores `proj.dir` (workerthree).

## Lessons → memory

none
