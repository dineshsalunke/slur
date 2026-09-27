Agent: workertwo · Lane: #305 strafe kick — fixed 4u step (option B) · Updated: 2026-09-27

## Goal
Each strafe press past the threshold moves the ship exactly 4u (one CELL) for every class, whatever the tap length.
Owner approved option B, "stop dead on release". B→A must stay a config change.

## Done
- Nothing committed yet. The work is uncommitted: blocked on the phrase digest (see Open questions).

## State
- Mechanism (step.ts): `kickDistance` (tuning, CELL for all 5 classes, 0 = today's velocity-floor kick) · state
  `strafeHeld` int8, `kickLeft` float32, `kicking` bool. The press edge (|strafe| ≥ `STRAFE_PRESS` 0.5) adds ±4u to
  `kickLeft`; the other way resets it. The kick moves at `strafeKick` u/s. If the key is still held, the last tick exits
  at full kick speed. If released, it moves the exact remainder and then stops dead (`kicking` flag). There is no kick if
  already faster than `strafeKick` the same way. Stun, markDead and respawn call `cancelKick` (clears all 3).
- B→A: set `kickDistance: 0` per class in ship-classes.ts + retune `strafeKick`. No code change.
- Tow: TOW_STRAFE_SCALE = 0.3 < 0.5 → a towed ship gets NO step; it keeps today's proportional floor (strafeKick×0.3).
- Window (held ticks until 4u is covered): interceptor 5 (83 ms) · fighter 6 (100) · phantom 7 (117) · comet 8 (133) · freighter 8 (133).
- Tap table AFTER (u, release then 3 s coast; before in scratch `before-measure.txt`):
  interceptor 4.00 4.00 4.92 5.95 8.31 14.25 26.23 (before 1.59 3.74 6.31 7.74 10.92 18.50 32.92)
  fighter     4.00 4.00 4.00 5.21 7.09 11.79 21.25 (before 1.71 3.59 5.78 6.99 9.67 15.97 27.82)
  comet       4.00 4.00 4.00 4.00 6.33 10.42 18.98 (before 2.36 4.25 6.45 7.68 10.37 16.72 28.66)
  phantom     4.00 4.00 4.00 4.00 6.25 10.30 18.63 (before 1.62 3.35 5.38 6.50 8.98 14.83 25.86)
  freighter   4.00 4.00 4.00 4.00 5.50 8.88 15.92  (before 1.65 3.21 5.03 6.04 8.25 13.47 23.26)
  columns: 1 tick, 50, 83, 100, 133, 200, 300 ms.
- Held (no release) x at 200/300 ms, before → after: interceptor 16.73/30.60 → 12.85/24.28 · fighter 13.68/24.84 →
  10.08/18.84 · comet 12.12/22.52 → 7.61/14.63 · phantom 12.55/22.88 → 8.72/16.35 · freighter 10.93/19.93 → 7.26/13.51.
  After the window the ramp law is identical to today (test asserts vx tick-for-tick). The lag is about one window.
- Pilot (`strafeToward`): when |err| < kickDistance, the press is capped at 0.99×STRAFE_PRESS (fine ramp, no 4u commit).
  crossSeconds / leadDistance(low) for dx 4 8 12 16 24 32: before 120 132 148 152 180 184 → after 120 140 136 168 180 200.
  With no pilot change: 120 144 136 168 176 176 (phantom 4u cross 0.47 → 0.62 s). Scratch: after-final.txt.
- Rejected variant (measured): running today's ramp during the kick keeps held flight identical, but 4u is covered in
  67–83 ms, so a 100 ms tap still gives 6–7.7u. It fails the goal.
- Gates (in the shared tree, with workerone's uncommitted #306 files present): shared typecheck green · shared test
  520/521 — only `phrase geometry matches its frozen digest` fails (track-digest.test.ts, workerthree's file; the
  cause is that leadDistance moved) · biome clean on my files except the pre-existing step.ts line-count warning (339 lines at
  HEAD) · comment ratchet ✓. Client typecheck fails on workerone's start-point.utils.ts (RespawnPoint), not mine.
  NOT yet run against HEAD in a scratch copy; pnpm lint (full) not run.
- Scratch tools: `$SCRATCH/measure.mjs <distDir>` (tap/hold/cross/lead/window tables), `trace.mjs <dist> <class> <dx>`,
  `before-dist/` = HEAD dist snapshot, `before-test.txt` = HEAD 508/508 green.

## Uncommitted
packages/shared/src/{constants.ts, ship-classes.ts, schema.ts, sim/types.ts, sim/step.ts, pacing/pockets.ts,
sim/strafe-kick.test.ts, race/director.test.ts}

## Held files
The 8 paths above. NOT mine in the dirty tree: index.ts, run/run-sim.ts, run/run-sim.test.ts, run/start-point*,
apps/client/app/routes/test-level/start-point/ (workerone #306).

## Next
1. Supervisor decision on the phrase digest (re-freeze by workerthree, or change the pilot to keep leads).
2. Optional: move the strafe functions out of step.ts into sim/strafe.ts (clears the line-count warning).
3. Run the gates against HEAD (scratch copy), then full `pnpm lint`/`pnpm test`.
4. Commit by explicit pathspec, with the before/after tap table + hold + lead numbers in the body.
5. Push, then `gh issue close 305 -c "<summary + SHA>"` (or comment the SHA if the owner must sign off on /test-level first).

## Open questions
- Phrase digest: my change moves leadDistance, so the phrase track geometry changes on all 5 seeds. workerthree owns
  track-digest.test.ts. Re-freeze the digest, or should I keep the leads unchanged?
- Is the held-strafe lag (~one window: interceptor −3.9u at 200 ms, freighter −3.7u) acceptable to the owner?

## Lessons → memory
none
