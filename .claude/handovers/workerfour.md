Agent: workerfour · Lane: /song-lab replay viewer, #253 step 3 · Updated: 2026-09-24 20:15

## Goal

A dev-only /song-lab route. Pick a bundle → variant → class, rebuild the track from bundle data, and replay
the recorded per-tick inputs through simulate() in the /test-level scene. Play/pause/restart, speed, and a side
panel with the rules, the score and per-class results with a MATCH/DIVERGED verdict. Throwaway, like /tapper.

## Done

- Scaffold commit (see `git log -- apps/client/app/routes/song-lab`): routes/song-lab/**, two endpoints in
  tapper/tapper-plugin.ts (`/__song-lab/list`, `/__song-lab/bundle?name=`), one line in app/routes.ts.
  It uses a STUB bundle type (`routes/song-lab/lab-bundle.ts`: descriptor + PlayerInput[] + {finished, frames, deaths}).
- Mechanism (supervisor-approved): useFrame + createFixedStep(FIXED_DT, 16) fed delta × speed; selection in
  the URL + clientLoader; playback in the module singleton `replay-state.ts`; readout via addEffect in a ref
  callback. Weighing is in the supervisor message and goes in the PR body.
- #253 steps 1-2 `7f397d0` and the #251 phone lane are unchanged and not pushed.

## State (verified this session)

- vitest song-lab 6/6. Client tsc clean. biome, canvas-isolation and the comment ratchet pass.
- Live: scratch client :5194 and headless Chrome :9474, both killed. A scratch stub bundle (5 classes, procgen
  length 40, sine strafe + periodic jump, deleted afterwards) gave MATCH at 8× for dispatcher, bob,
  executioner and split-crown. The executioner and split-crown MATCHes came after in-page class switches.
- /__song-lab/bundle rejects `../x.json` with 404.
- The stub generator is at scratchpad/stub-bundle.mjs and the CDP driver at scratchpad/drive2.mjs. The
  scratchpad is session-local and will not survive a /clear.
- [unmeasured] The camera at the finish looked into a wall (bob.png). Nothing was checked past that.

## Uncommitted

- none after this seam commit.

## Held files

`apps/client/app/routes/song-lab/**`, `apps/client/tapper/tapper-plugin.ts`, the song-lab line in
`apps/client/app/routes.ts`. From the #253 steps 1-2 lane: `apps/client/app/routes/tapper/**`. workertwo holds
tapper/beat-analysis* and drum-onsets*. workerone owns `apps/client/song-lab/bundle.ts`.

## Next

1. Swap the stub for workerone's `apps/client/song-lab/bundle.ts` (commit 0099d73). Delete `lab-bundle.ts`.
   - Loader: fetch bundle → `labTrack(v)`. Verdict = `sameResult(labResult(replayRun(track, run)), run.result)
     && labDigest(v) === v.trackDigest`, computed once in the loader and shown in the panel.
   - Live loop: `r = newReplay()`, `inputs = expandInputs(run.inputs)`. Each fixed step:
     `labStep(r.ship, inputs[r.tally.ticks], classTuning(id), track, r.world, r.tally)` until `r.tally.done`.
     Mirror r.ship into the ECS Sim (copySimShip), OR step the ECS Sim with labStep and pass
     blockWorld as the world. The second avoids a copy; clearBlockState on restart.
   - The run key is classId (ShipClassId). Map it to a ShipId through SHIPS for the model and Net.shipId.
   - The panel shows `label`, `rules` ({from,to,detail}), `scoreString`, `phraseStrings`, and result
     `time`/`deaths`/`deathZ`. Maybe an intensity strip.
   - Replace replay-step.ts with the bundle.ts helpers. Keep the tests on labView/labHref and add one on
     the classId→ShipId map.
2. Wait for workerone's first real bundle ping, then run the live MATCH check on it.
3. Commit, and report to the supervisor with the SHA.

## Open questions

- none.

## Lessons → memory

none. Nothing new beyond the existing memories on CDP drivers and scratch servers.
