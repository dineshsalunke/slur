Agent: workerone · Lane: hosted-room finish fade (#241) · Updated: 2026-09-24

This lane comes before pacing step 2. The pacing lane state is in the version of this file before 383b1d4: `git log -p -- .claude/handovers/workerone.md`. The #236 HUD follow-ups are in the version at `062f7f1`.

## Goal

A hosted room uses the /test-level finish curtain: close at the finish, cut the camera at black, open. Results stay on PHASE.finished (#238, workerfour).

## Done

- `deabca3`:
  - `finish-reset.ts`, `finish-reset.test.ts` and `finish-fade.tsx` moved from `routes/test-level/` to `game/finish/`, unchanged.
  - New `game/finish/finish-watch.ts` + test: a one-shot latch, `localFinished`, and `pickWatchTarget`. The watch target is the leading unfinished racer, held until it finishes.
  - NetLoop steps the curtain and cuts the camera with `CUT_DT = 1`. The fallback is the lobby orbit.
  - `<FinishFade/>` mounts in net-canvas.
  - `selfFinished` added to StandingsSnapshot. NetPilotReadout hides FlightReadout after the finish, and PowerRack stays.
- Issue #241 has a comment with the NN #13 weighing and the live results.

## State

- Client typecheck exits 0. Vitest 271/271. Biome is clean on my paths. ls-lint, canvas isolation and the comment ratchet pass.
- The live check was headless at 1280×720, on a short-course scratch server, with the R3F clock stepped by hand. All three paths ran:
  - **Solo finish:** the curtain closes. At black the camera cuts to the orbit. The results were already mounted.
  - **Early finisher A:** the curtain closes, then the camera follows B at the start gate. The flight readout is hidden, and the roster and rack show. Results mount on PHASE.finished over that view.
  - **Non-finisher B at the 20 s grace deadline:** the curtain runs over the results, and the camera cuts to the orbit.
- Measured curtain ages (stepped clock, the same on every path):

  | t (s) | Curtain |
  |---|---|
  | 0.15 | opacity 0.476 (0.429 at t = 0.150 on B) |
  | 0.35 | black, `phase: in` |
  | 0.55 | opacity 0.556 |
  | 0.8 | idle |

- Stills are in session 3209736f's scratchpad, `shots/` (duo) and `shots/solo/`.
- Results render below the z-30 curtain, so they dim with the fade. That is #238's z-index to set.
- The orbit fallback can clip into a block when the ship stopped against one (seen in a time-cap run).
- Chromes, the scratch server and the client are killed.

## Uncommitted

None.

## Held files

None after this seam. The lane is done pending owner review.

## Next

1. Owner review of the stills.
2. Possible follow-up, owner's call: a higher, pulled-back fallback camera instead of the lobby orbit.
3. Then resume pacing step 2.

## Open questions

- Should the orbit fallback be replaced by a raised camera that cannot clip into blocks?

## Lessons → memory

`.claude/memory/short-course-scratch-server.md`
