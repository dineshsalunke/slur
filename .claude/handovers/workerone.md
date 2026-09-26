Agent: workerone · Lane: #288 one run path · Updated: 2026-09-26 (slice 4 code committed, live verify pending)

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

/test-level and hosted rooms differ only in netcode. Shared `stepCombat()`, and no `Local*` duplicates.

## Done

- dab29d4 slice 1, 268dcb2 slice 2 (shared RunSim), d39de1c slice 3a (RunRoomLike + stateCallbacks), a79bfc3 slice 3b (LoopbackRoom). Pushed: b38e236..759f165.
- 5336f7e: slice 4 code. NOT pushed. NOT verified live.
  - RunSim `{ countdownSeconds }` option (3rd ctor arg; default 3 s; 0 = straight to racing). Test in run-sim.test.ts.
  - `LoopbackRoom(descriptor, { name, countdownSeconds })`; `run(paused?)` skips step while paused() is true.
  - routes/test-level/test-level-room.ts: `openTestLevelRoom(gen)` (module singleton; stops the previous room's addEffect; resets autoRestart + finishWatch; sends START; `run(() => simFreeze.on)`). The route clientLoader calls it. shouldRevalidate only on a ?gen change.
  - routes/test-level/test-level-dev/: TestLevelDev (inside the Canvas via the NetCanvas children slot): KeyP freeze, Shift+1-5 → `restartRun(room, shipId)` (sim.resetToLobby + SET_CLASS + START), useFrame `stepAutoRestart` (on finishWatch.cut → restartRun; resetFinishWatch once the decoded phase is racing and localFinished is false).
  - TestLevelCanvas = RoomProvider + NetCanvas{TestLevelDev, FrameTap} + FpsReadout DOM strip.
  - NetLoop honours simFreeze; camera choice moved to `updateNetCamera` in net-loop.utils.ts.
  - Local* files deleted (list in the commit body).

## State

- Measured at 5336f7e: typecheck + lint clean (6 pre-existing warnings); shared 422/422, server 38/38, client 437/437.
- Owner conditions: loopback room is normal game code (not dev-gated); dev extras in a separate layer (done: test-level-dev/).
- [unmeasured] Nothing in slice 4 has run in a browser. Risks to check first:
  1. Auto-restart: the finish-camera frame between the cut and the next patch; a re-triggered curtain while the decoded phase is still `finished`.
  2. Shift+1-5 mid-race: the predictor snaps to the reset grid; check no streak or stuck `Prev`.
  3. KeyP freeze: run() pauses the sim and NetLoop pauses the render; the addEffect `last` timestamp keeps moving, so unfreeze does not catch up (intended).
  4. The HUD hides in PHASE.finished (ON_TRACK_PHASES = countdown, racing). Old /test-level HUD never hid.
- The CDP memories are STALE after 5336f7e: place-the-ship-over-cdp, koota-universe-reaches-the-page-world, stage-a-mine-on-test-level (they use localCombat.seekers and direct Sim writes). New hooks: the room is the loaderData / `openTestLevelRoom`; server-side state is `room.sim.state` (write x/z/slots there; the client ship reconciles on the next 50 ms patch).

## Uncommitted

None.

## Held files (claim CLEARED by slur-supervisor)

routes/test-level/**, game/net-canvas.tsx, game/net-loop/net-loop.tsx + net-loop.utils.ts, net/loopback-room/*, packages/shared/src/run/run-sim.ts + test, memories place-the-ship-over-cdp / koota-universe-reaches-the-page-world / stage-a-mine-on-test-level.

## Next

1. Verify on /test-level (owner rule) against the owner's stack :5173. Use headless Chrome, `--force-device-scale-factor=1 --mute-audio`, on your own free CDP port, and kill it by PID afterwards. Supervisor checklist: flight, pickups, bolts, seekers, mines, boost + blur, shield, rear-view, HUD, audio, touch pad. Plus the auto-restart, Shift+1-5 and KeyP from State risks 1–3. Fix what fails, re-run the gates, commit.
2. Update the 3 stale CDP memories to the loopback hooks.
3. Push (fast-forward only; if it is not a ff, tell the supervisor), then `gh issue close 288 -c "<summary + SHAs>"`.

## Open questions

- None.

## Lessons → memory

none this seam (the CDP memory updates are Next step 2).
