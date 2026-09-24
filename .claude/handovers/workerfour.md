Agent: workerfour · Lane: /song-lab song starts at freighter cruise, #253 · Updated: 2026-09-24 23:59

## Goal

The /song-lab song starts when the replayed ship passes the bundle's song start z (freighter cruise), not at GO.
The song-bar readout uses the same origin, the song bar stops at the last bar, and the class defaults to freighter.

## Done

- `ab88019`: the song plays behind the replay, at 1× only, re-seeking on drift > 80 ms. Mute, volume, M key.
- `fab0267`: the 13-variant bundle (bcbc3d5) passes: 13/13 digests MATCH, 260/260 runs MATCH, load 583–672 ms.
- `9b3ab59`: song start at cruise. The field is LabSong.clock { z0, t0, zPerSecond }, agreed with workerone:
  z = z0 + zPerSecond·(t − t0). Believer: z0 257.3 (freighter cruise, tick 248), t0 0, zPerSecond 124.
  replay.crossTick is the fractional tick where ship z crosses z0, recorded inside replayFlightSystem.
  Song time = t0 + (tick − crossTick)·FIXED_DT. Ship bar = t0 + (z − z0)/zPerSecond. The readout clamps the bar
  to the last bar and shows "ended". The class defaults to freighter.

## State

- tsc clean and song-lab vitest 10/10 against workerone's UNCOMMITTED bundle.ts (LabSong.clock is required
  there). The route reads song.clock structurally (`'clock' in song`), and the test fixture is a variable, so
  it should also compile at HEAD before workerone commits. [unmeasured at HEAD: not built in a scratch copy]
- Live check NOT RUN: workerone has not rebuilt the bundle yet. It will send the SHA.

## Uncommitted

- none.

## Held files

`apps/client/app/routes/song-lab/**`, `apps/client/app/routes/tapper/**`, `apps/client/tapper/tapper-plugin.ts`,
the song-lab line in `apps/client/app/routes.ts`. workerone owns `apps/client/song-lab/**`.

## Next

1. When workerone's bundle SHA lands: replace `bundleSongMap( bundle.song )` in `route.tsx` with the typed
   `bundle.song.clock`, and drop the helper. Re-run tsc and vitest.
2. Headless verify (scratch Vite :5194 via `CLIENT_PORT=5194 VITE_SERVER_PORT=2594 npx react-router dev` in
   apps/client; Chrome :9474 with DPR 1, --mute-audio, --autoplay-policy=no-user-gesture-required). Checks:
   - MATCH counts for all 13 variants.
   - On perfect freighter, the ship-bar vs song-bar drift at bars 8/28/60/96 and at the finish.
   - The song starts silent and begins at crossTick ≈ 248.
   Recreate the drivers in the scratchpad: a CDP driver that reads `main p.whitespace-pre` (the readout) and
   the aside `p` with "track digest", and presses keys through Input.dispatchKeyEvent. To reach bar 96 fast,
   use 8× then drop to 1× near the bar (the song re-seeks on return to 1×).
3. Kill Chrome and Vite by PID, report SHAs + numbers to slur-supervisor, commit this handover.

## Open questions

- none.

## Lessons → memory

`.claude/memory/song-map-runs-at-freighter-speed.md` (from ab88019). This seam: none new.
