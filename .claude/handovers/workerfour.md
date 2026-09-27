Agent: workerfour · Lane: URGENT perf regression (owner saw 5–12 fps), diagnose only; #295 Blink on hold · Updated: 2026-09-27

## Goal

Find why the owner saw 5–12 fps in the game: measure, name the subsystem or commit, and send the supervisor
the cause, a fix plan and a file claim. No edits. #295 Blink waits for the owner's approval of the plan.

## Done

- 1ef88f0 — ADR-022: the exit-ring bloom is kept as the hop flash.
- #295 plan sent to the supervisor: 4 slices, 5 questions, S1 claim. No approval relayed yet.
- dfdbecf — memory `three-devtools-hook-gives-the-scene.md` (scene handle with no repo edit).
- Perf verdict sent to the supervisor: not reproduced in Chrome. The owner's repro was requested.

## State

- Headless Chrome with Metal, readPixels GPU wait per frame, driving W, /test-level [measured]:
  - DPR1: default gen, ?gen=phrase and ?level=phrase-20260921 all ~17.5 ms (vsync cap). JS ≤ 2.1 ms. 70–126 draws.
  - DPR2 default gen: GPU 17.5–20 ms, JS 1.5–2.2 ms, 126 draws → ~50 fps.
  - CPU profile: 64% readPixels (GPU wait), no hot JS. 4b17a2e emitWindow and 59feea6 onBoostDeck are not visible.
  - DPR2 bisect: hiding MeshStandardMaterial saves ~0 ms; hiding ShaderMaterial (sky + post) takes 18 → 11 ms.
  - The shared dist has glideTimer, so there is no schema skew.
- The owner plays in Zen (Firefox). Headless Firefox fails here (sandbox, software GL). Firefox is not measured.
- Drivers are in the old session scratchpad (`perf/gpu.mjs`, `frame.mjs`, `top.mjs`). They may not survive the
  restart; the memory above describes how to rebuild them.
- Not mine, uncommitted: `tracks/groove-20260921.json` (deleted), `tracks/phrase-20260921.json` (untracked).

## Uncommitted

None of mine.

## Held files

None.

## Next

1. Wait for the owner's repro through the supervisor: browser, URL, DPR/window, slow from the start or after
   some distance, Chrome on the same URL, and a Zen `about:profiling` capture if possible.
2. With the repro: measure that exact route (a hosted /game room if that is where it happens), bisect, and send the cause + fix plan + claim.
3. Then resume #295 once the owner approves the Blink plan (S1 shared sim first).

## Open questions

- Perf: the owner's exact repro (above).
- #295: distance fixed or speed-scaled; lateral offset from the held strafe; back-hop vz; prediction deferred; share 0.1 taken from the bolt.

## Lessons → memory

- `.claude/memory/three-devtools-hook-gives-the-scene.md` (dfdbecf).
