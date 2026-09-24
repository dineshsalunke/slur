Agent: workerfour · Lane: /song-lab replay viewer, #253 step 3 · Updated: 2026-09-24 20:40

## Goal

A dev-only /song-lab route. Pick a bundle → variant → class → pilot, rebuild the track from bundle data, and replay
the recorded per-tick inputs through simulate() in the /test-level scene. The panel shows the rules, the score, and
every run with a MATCH/DIVERGED verdict. Throwaway, like /tapper.

## Done

- `790c6cb` scaffold (stub type). `bf70803` + `67a2dfa` moved to workerone's `apps/client/song-lab/bundle.ts`.
  The loader runs labTrack + replayRun as a headless check per run and checks the digest. The live view runs
  labStep on the ECS Sim against blockWorld. Runs are keyed by ShipClassId; the model comes from shipForClass.
- `ddf5bfe` shows bumps in results.
- `63b8014` adds a pilot dimension: perfect | pro | club | rookie (from `humanRuns`, f98f9e5). Runs are keyed
  `classId/pilot` and the URL gains `pilot`. The results list is a grid of links, one per run. The aside is 26rem.

## State (verified this session)

- believer-s1.json (16.7 MB, f98f9e5): 200/200 runs MATCH headless, 10/10 digests. The per-skill death sums
  equal workerone's commit message.
- Live MATCH checks: mined×freighter×rookie (10 deaths, 58 bumps), kick-jump×comet×club, plus 6 perfect runs.
- Load: panel shown 0.64–0.71 s after navigate (warm Vite), 1.2 s cold. Bundle fetch 100–155 ms. Node parse
  123 ms. Headless check per variant 50–110 ms.
- One spurious live DIVERGED (tick 0/0) was an HMR orphan from a peer's save. See the memory below.
- vitest song-lab 8/8. Client tsc clean. biome, comment ratchet and canvas isolation pass.
- Scratch Vite :5194 and Chrome :9474 were killed by PID. The scratchpad scripts (check-all.mjs, live2.mjs)
  will not survive a /clear.
- [unmeasured] The camera at the finish looked into a wall (seen with the old stub). Not rechecked.

## Uncommitted

- none.

## Held files

`apps/client/app/routes/song-lab/**`, `apps/client/tapper/tapper-plugin.ts`, the song-lab line in
`apps/client/app/routes.ts`. From the #253 steps 1-2 lane: `apps/client/app/routes/tapper/**`. workerone owns
`apps/client/song-lab/**`.

## Next

1. Wait for the supervisor.
2. Candidates, not started: an intensity strip and note mix per variant (workerone's suggestion); an HMR
   invalidate on replay-state.ts so a peer's save forces a reload.

## Open questions

- none.

## Lessons → memory

`.claude/memory/peer-edit-orphans-a-live-check.md`
