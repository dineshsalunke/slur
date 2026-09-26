Agent: workerthree · Lane: verify #275 pickup listeners + mine glow in a hosted room (verification only) · Updated: 2026-09-26

## Goal

Measure #275 (workerone 0afbef2, 5ded0a4) live on :5173/:2567. Checks:

1. A taken pickup hides and grants its power.
2. A second client sees it taken.
3. Nothing leaks or duplicates across a route remount.
4. Mine bodies still glow after `toneMapped` was removed (fed4ac2).

## Done

- Earlier lanes: #281 e13f35d, power bag 842fd8c / 074ceee.
- This lane: no repo edits. All four checks are measured. Earlier seam: ff7a6f6.

## State

My headless Chrome ran on :9687 (PID 15460). I checked that port was free on IPv4 and IPv6, and that the listener was my PID with my profile. The driver used page target 1011036A… by id. Chrome and the bot are killed.

- **Checks 1 and 2: PASS** (previous seam, room bgingWIWB).
- **Check 3: PASS (measured).** Room z_i4J2iUD, host plus node bot, racing. Each hop: navigate to `/beat-deck`, click Leave, navigate back. That is 3 hops, plus a 4th that checked identity.
  - Lobby: 37 callbacks, pickupTaken add/remove/change 1/1/1, GL 103 geometries / 42 textures / 43 programs.
  - At GO: 41 callbacks. The players map goes 3→4, as in the last run.
  - After hops 1, 2 and 3: 41 callbacks, pickupTaken 1/1/1, players 4/4, blockBroken 1/1, 103/42/42.
  - `session.room` stays the same object. The server and client taken sets match. There was no crash.
  - Every return makes a new canvas and a new R3F root. `_roots.size` stays 1.
- **Check 4: glows (measured).** In the hosted room the pilot wedged at z 1884 and at z 1775, and the one mine it fired fizzled against a block. So I staged a mine on `/test-level`: Held [3,0,0], KeyE, then moved the mine to z 22.
  - Crop 200×90 around the mine. With the mine: max luminance 232–236, 29 px above 200. Without it: max 174, 0 px.
  - Flipping `toneMapped` on the two glow materials changed nothing: A 36.0 mean / 235.6 max, B 36.0 / 237.6, A2 34.7 / 231.9. The renderer runs `toneMapping = 0` (NoToneMapping), so the flag has no effect.
  - b706baa only moves three count/needsUpdate lines into `commitInstances()`, so it changes nothing (read from the diff). HEAD draws body, core and decal. No A/B was needed.
- **Seen once, not reproduced:** on the first host with the bot in the lobby, the game route crashed with "cannot connect to an AudioNode belonging to a different audio context". Stack: `syncEmitters` (remote-engine-audio.utils.ts:27) → `setFilter`. It did not recur in two more loads.
  - Suspect [inferred]: `ensureListener` (audio/positional.ts) runs `new THREE.AudioListener()` before `setListener()` calls `ensure()`. If nothing has created the engine yet, three builds its own AudioContext, and the filter comes from the engine's context.
  - An HMR orphan is also possible: remote-engine-audio.tsx carried a fresh `?t=`.

## Uncommitted

None. Scratch drivers are in this session's scratchpad: `ev.mjs, hop.js, collect.js, arm.js, ab.mjs`.

## Held files

None.

## Next

1. Supervisor decides whether the audio-context crash gets an issue. Repro idea: fresh load, host, a remote joins before any audio has played.
2. Lane done otherwise. Close #275 only if the supervisor or owner says so (workerone owns the fix).

## Open questions

- Supervisor: file the AudioContext-order suspect as an issue?

## Lessons → memory

- `.claude/memory/stage-a-mine-on-test-level.md`
