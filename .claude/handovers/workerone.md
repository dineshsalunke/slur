Agent: workerone · Lane: hosted-room finish fade (#241) · Updated: 2026-09-24

This lane comes before pacing step 2. The pacing lane state is in the version of this file before 383b1d4: `git log -p -- .claude/handovers/workerone.md`. The #236 HUD lane is done (`b255460`). Its open follow-ups (the Leave tone, the countdown readout check) are in `git log -p` of this file at `062f7f1`.

## Goal

A hosted room uses the /test-level finish curtain: close at the player's own finish, cut the camera at black, open. Results stay on PHASE.finished (#238, workerfour).

## Done

- Filed issue #241.
- Sent the plan and file claims to slur-supervisor. Hand-off: AGREE with workerfour. Results mount on PHASE.finished with their own entrance and do not read the curtain.

## State

- Nothing built. Waiting for the owner to clear the plan through the supervisor.
- Plan in brief:
  - Move `finish-reset.ts`, `finish-reset.test.ts` and `finish-fade.tsx` from `routes/test-level/` to `game/finish/`, and add a one-shot mode.
  - Step the curtain in NetLoop's useFrame.
  - At black the camera follows the leading unfinished racer (`updateSpectatorCamera`), or cuts to the lobby orbit when no racer is left.
  - A new file `game/finish/finish-watch.ts` picks that racer.

## Uncommitted

None.

## Held files

Claimed, not yet cleared:
- `routes/test-level/{finish-reset.ts,finish-reset.test.ts,finish-fade.tsx,local-loop.tsx,test-level-canvas.tsx}`
- `game/net-loop.tsx`
- `game/net-canvas.tsx` or `game-shell.tsx`
- new `game/finish/*`

## Next

1. Wait for the supervisor to clear the plan.
2. Build it. Run typecheck, test and lint.
3. Capture a timed still sequence in a hosted room (solo and two clients): t = 0, 0.15, 0.35, 0.55, 0.8 s, then results.
4. Commit by pathspec and report.

## Open questions

- Should the own-flight readout (speed, rank line) hide after the local finish while the player watches?

## Lessons → memory

none
