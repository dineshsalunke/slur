Agent: workertwo · Lane: #341 race always ends (A stall + B cap + C host End race, owner-approved) · #338/#340 open until final deploy · Updated: 2026-09-28

## Goal
A race must always end. Stall rule 30 s (warn 20 s), cap 3 × finishZ ÷ slowest cruise (84), host End race with a two-step confirm. ADR-027.

## Done
- 26cc118 shared helpers: STALL_SECONDS 30, STALL_WARN_SECONDS 20, RACE_CAP_FACTOR 3, DEADLINE_SHOW_SECONDS 60, SLOWEST_CRUISE, END_RACE_MESSAGE, noteProgress, stalledFor, isStalled, raceCapSeconds, raceEndsAt; PlayerState appends progressAt (synced) + bestZ (plain); resetPlayerForRace resets both.
- 4be2e39 docs: ADR-027, GDD round end, TDD.
- 7eb2da0 HUD: IdleWarning, RaceDeadline, roster IDLE (standings-store listens on elapsed); RunState appends raceCap (0 = open-ended); raceShouldEnd treats raceCap 0 as no cap.
- #340 cf922f8 and #338 282428f: leave open until the owner's final deploy, then verify prod and close.

## State
- 7eb2da0: shared 562/562, client 615/615, typecheck 0, biome 0 on my files.
- The HUD is blank until RunSim sets state.raceCap (it is 0 everywhere today). [measured by tests only; not driven live]
- run-sim.ts + run-room.ts RELEASED to me by the supervisor after workerone's fda4814. Keep #339's additions: RunRoom onAuth, seatReservationTimeout, maxMessagesPerSecond 60, onUncaughtException; RunSim.join name typeof check. Do NOT touch apps/server/src/index.ts.
- If shared types look missing: `tsc -b --force` in packages/shared (dist was stale after fda4814).

## Uncommitted
- apps/client/app/game/overlays/end-race/end-race.tsx (host End race, two-step "End race" → "End for all?" / "Cancel")
- apps/client/app/game/overlays/overlays.tsx (mounts <EndRace room={ room } /> first in the top-right cluster)
- apps/client/app/game/overlays/overlays.test.tsx (3 End race tests appended; import END_RACE_MESSAGE)
These wait for run-sim endRace so the button is never dead.

## Held files
run-sim.ts, run-sim.test.ts, run-room.ts, loopback-room.ts, test-level-room.ts, end-race/*, overlays.tsx, overlays.test.tsx, docs/TDD.md, docs/DECISIONS.md.

## Next
1. `git log -3 -- packages/shared/src/run/run-sim.ts apps/server/src/rooms/run-room.ts`; re-read both from HEAD.
2. run-sim.ts:
   - RunSimOptions `raceLimits?: boolean` (default true). Constructor: `this.state.raceCap = raceLimits ? raceCapSeconds( this.track.finishZ ) : 0`.
   - stepRace: for each non-spectator, not-finished racer after stepping: `noteProgress( player, this.state.elapsed )`; if `raceCap > 0 && isStalled( elapsed, player.progressAt )`, count stalledCount. Pass `stalledCount` and `raceCap: this.state.raceCap` to raceShouldEnd.
   - `endRace( sessionId )`: host only, phase countdown|racing → PHASE.finished + refreshMetadata().
   - spawnAt: after the move, `p.bestZ = p.z; p.progressAt = this.state.elapsed`.
3. run-sim.test.ts: AFK solo racer → finished at ~30 s; progress clears stall; 2 racers, one finishes, one idle → ends at once; cap ends race; raceLimits false never ends; endRace host-only + phase-gated.
4. run-room.ts: `this.onMessage( END_RACE_MESSAGE, ( client ) => this.sim.endRace( client.sessionId ) )`.
5. loopback-room.ts: `[ END_RACE_MESSAGE ]: () => this.sim.endRace( id )`. test-level-room.ts: pass `raceLimits: false` (the owner idles on /test-level).
6. TDD: RunState raceCap line + raceLimits note; ADR-027 Consequences: raceCap sync + /test-level exemption.
7. Commit all (incl. the uncommitted end-race trio), push. Live check on :5173: host solo, idle 30 s → results; End race two-click → results. Kill headless Chrome by PID.
8. Comment on #341 with SHAs; leave it OPEN until the owner's final deploy.

## Open questions
none

## Lessons → memory
none new; `git commit -- <dir>` fails on an untracked dir, so `git add -- <files>` first (covered by [[shared-checkout-shares-one-git-index]]).
