Agent: workertwo · Lane: mine pickup + forward/back fire (#261, child of #20) · Updated: 2026-09-25 19:10

Older versions hold the plan, #259 and #257 (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

Build the Mine, and make every power (bolt, seeker, mine) fire FORWARD (E) or BACK (F). Done and pushed.

## Done

- `71b64c4` — the whole lane: shared mine + fire-dir, schema `dir` fields, server lay/trigger/clear/burst,
  client mine pickup/body/decal/pulse/burst, E/F/gamepad B/touch Back, /test-level mines, and docs
  (GDD §5.3, ADD §5, ART_SCALE_REFERENCE §7a + the 64u → 96u width fix).

## State

- Gates at `71b64c4` in the shared tree: typecheck clean; shared 360/360, server 24/24, client 364/364.
  One earlier recursive `pnpm test` run failed in the server step; a re-run passed. Inferred: a transient
  from a concurrent build. [cause unmeasured]
- `pnpm lint`: 0 errors from my files. 7 line-count warnings. Three are mine: `run-room.ts` 314,
  `seeker.ts` 315, `seeker.test.ts` 345 (limit 300). One error remains in workerfour's
  `sim/groove/groove.test.ts` (format), which appeared after my first lint run.
- Headless /test-level (DPR 1, muted, Chrome PID 70226 killed): laid mines show the spoke + ring decal,
  dim while arming, bright once armed; the burst ring and the clear spark show; the HUD gem shows the mine
  star and the rack reads MINE · BOLT · SEEKER. Captures: `.claude/frame-tap-refs/261-mine/v2-laid.png`,
  `v2-laid-pulse.png`, `v2-burst.png` (gitignored).
- NOT confirmed: the mine PICKUP star up close. Two placements landed in block geometry (a debris field,
  then a white-out). The back-bolt streak is at the edge of one frame and is not clearly read. [unmeasured]
- Doc fix found in review: a mine laid over a gap wastes the power (`room-combat.ts:47` spends before
  `layMine`). The GDD says so. Whether that is wanted is an owner call.

## Uncommitted

None.

## Held files

None. Released on this commit.

## Next

1. Supervisor: relay the open questions. Split `seeker.ts`/`run-room.ts` under 300 lines if the owner wants
   the warnings gone.
2. If asked: a closer look at the mine pickup and the back-bolt streak (stage the ship at spawn, place the
   entries in `localCombat` directly; a teleport into the track hits blocks).

## Open questions

- The owner must confirm F = back and mineDropAhead 8u.
- Should a mine laid over a gap refund the power? Today it is lost.
- For workerthree / audio: `audio/bind-room-audio.ts` `checkThreat` assumes bolts fly +z. A back bolt from
  a ship ahead gets no threat cue. It should use `proj.dir`.

## Lessons → memory

none
