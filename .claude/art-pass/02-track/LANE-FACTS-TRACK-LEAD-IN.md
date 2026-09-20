# LANE FACTS — track lead-in (feat/track-lead-in)

Raw facts only. One line each, units + `file:line`. `[unmeasured]` is a valid entry.

## Base
- Worktree `/Users/apple/Projects/personal/slur-worktrees/track-lead-in`, branch `feat/track-lead-in`, base `2c3901c` == `origin/dev`.
- Ports 5202 (client) / 2602 (server); `apps/client/.env` holds `CLIENT_PORT=5202`, `VITE_SERVER_PORT=2602`.
- Stack start raced `packages/shared` first `tsc` build: server died `ERR_MODULE_NOT_FOUND @slur/shared/dist/index.js`. Restart after `dist` existed → client 200, server 200. Not a lane defect; cold-worktree ordering.

## Constants (verified this session)
- `SEG_LEN = 20` u — `packages/shared/src/sim/track.ts:130`
- `TRACK_SEGMENTS = 400`; `finishZ = length * SEG_LEN = 8000` u — `track.ts:131`, `track.ts:452`
- `START_SAFE = 6` segments forced flat + full-width — `track.ts:132`
- `HALF_WIDTH = 32` u (16 lanes) — `track.ts:133`
- `DEFAULT_TUNING.respawnSetback = 12` u — `packages/shared/src/constants.ts:102`
- `DEFAULT_TUNING.respawnVz = 20` u/s; `accel = 40` u/s²; `maxCruise = 55` u/s — `constants.ts:103`, `constants.ts:83`, `constants.ts:86`
- `CHASE` = `height 7.5`, `back 15`, `backStretch 3`, `lookAhead 9.5`, `lookAtLift 6`, `fov 70`, `fovStretch 15` — `apps/client/app/game/camera/chase.ts:9-18`

## Respawn near the start — ANSWERED
- `respawn()` sets `z = s.lastSafeZ - t.respawnSetback`, then falls back to `lastSafeZ` ONLY when `floorUnder` returns null — `packages/shared/src/sim/step.ts:151-158`
- `segIndexForZ(z) = Math.floor(z / SEG_LEN)` — unguarded, returns negative indices — `track.ts:438-440`
- `buildSegment`'s `if ( i < START_SAFE )` matches EVERY negative index → returns `kind:'plain'`, `floors: fullFloor(0)` — `track.ts:391`
- MEASURED against the real track (`makeProcgenTrack({seed:12345,length:400})`): `segmentAtZ(-40/-30/-19.5/-12/-0.001)` all return full-width floor `[{x0:-32,x1:32,y:0}]`, 0 blocks, indices -2/-1.
- ⇒ respawn near the start neither clamps NOR drops the ship into a void. It lands on solid, full-width, hazard-free floor at negative z. Deterministic and identical on both ends.
- ⇒ the sim's floor is UNBOUNDED backwards; the renderer's is not — `track-floor.tsx:133` loops `for ( let i = 0; i < last; i++ )`, so nothing is drawn at z < 0.
- ⇒ classification: NOT a death bug. A sim/render divergence — a ship respawning in the start zone stands on invisible floor over visible void.

## Sizing — computed, not eyeballed
- Frame-bottom ground intersection, distance BEHIND the ship, from the `CHASE` constants: speed 0 → **5.572 u**; 20 u/s → 7.488 u; 40 u/s → 9.326 u; 55 u/s (maxCruise) → 10.661 u.
- Launch transient (full throttle from rest at z=0, `accel 40`, 60 Hz): worst lead-in demand **5.731 u** at t=0.07 s — the ship outruns the camera's `backStretch` pull-back, so the at-rest figure governs.
- Respawn-at-spawn transient (`lastSafeZ = 0` → z = -12, `respawnVz = 20`): worst lead-in demand **19.488 u**.
- ⇒ framing alone needs ~6 u; the respawn case needs ~19.5 u. The owner's eyeball 10 u covers framing, NOT respawn.

## Blast radius (grepped, not assumed)
- No progress-% bar exists. Only readout `z / track.finishZ` — `apps/client/app/routes/art-lab/art-lab-readout.tsx:47`
- `finishZ` consumers: `step.ts:254` (finish latch), `track-floor.tsx:118` (render extent), `finish-gate.tsx:11` (arch placement).
- ⇒ keeping z=0 as spawn leaves `finishZ`, `TRACK_SEGMENTS` accounting and every recorded z unchanged.

## Gate results
- [unmeasured] full gate not yet run on this branch.

## Reachability of z < 0 — MEASURED
- `s.vz = Math.min( Math.max( s.vz, 0 ), t.maxCruise )` — vz clamped to [0, maxCruise]; reverse is impossible — `packages/shared/src/sim/step.ts:22`
- Full brake held 30 s from spawn: min z = 0, vz = 0. Coast+strafe+jump 30 s: min z = 0.
- `respawn()` is therefore the ONLY thing that decreases z — `step.ts:151-168`
- 300 seeds × 3 pilot styles, 180 s each: 69,512 deaths total. Min z ever occupied = **0.011 u**. Min respawn z = **108.639 u**. Never negative.
- Reason: no death is possible before z = `START_SAFE * SEG_LEN` = **120 u** (indices 0-5 are forced flat, full-width, blockless), and `lastSafeZ` tracks the last grounded z, so `lastSafeZ - respawnSetback` ≥ ~108.
- Forced-unreachable-state probe: `lastSafeZ = 0` + dead → respawn lands z = **-12**, y = 0, grounded. Confirms the negative-z floor is live in the sim; it is simply never entered from any reachable state.
- ⇒ z < 0 is UNREACHABLE under every measured input. The residual divergence past the lead-in is unreachable, not merely invisible.
- ⚠ The bound is DERIVED, not enforced: it holds only while `START_SAFE ≥ 1` AND `respawnSetback < START_SAFE * SEG_LEN` (12 < 120). Lowering `START_SAFE` to 0 or raising `respawnSetback` above 120 reopens negative z silently — no test currently fails.
- At spawn the ship's rear footprint (`z - halfL` = -1.26) already resolves to segment index -1 — `step.ts:110`. A 20 u (1 × SEG_LEN) lead-in covers it; bounding at exactly -20 is safe.

## Implementation
- `LEAD_SEGMENTS = 1` (20 u) — `packages/shared/src/sim/track.ts:133`
- `buildSegment` gains `if ( i < -LEAD_SEGMENTS ) return { ...base, kind: 'gap', floors: [] }` ABOVE the `i < START_SAFE` branch — `track.ts:393`
- `kind: 'gap'` reused rather than a new `SegmentKind`: `floors` doc already reads "gaps = x uncovered by any span", and both `KIND` maps (`net-debug-hud.tsx:10`, `art-lab-readout.tsx:15`) fall back `?? '?'` and only read FORWARD (`z + n*SEG_LEN`, n≥1), so neither ever sees the lead-in. Zero union churn.
- Render loops start at `-LEAD_SEGMENTS`: `track-floor.tsx:133` (+ its `prev` guard `i > -LEAD_SEGMENTS`), `track-boundary.tsx:68`. Rail therefore runs the apron.
- `track-blocks.tsx:59` left alone — it clamps `i0 = Math.max(0, …)` and the apron is blockless by construction, so lowering it would iterate empty segments for nothing.
- 3 tests added to `track.test.ts`: apron flat/full-width/hazard-free across 8 seeds; back edge floorless at `-LEAD_SEGMENTS*SEG_LEN - 1` and at -1000; `respawnSetback < START_SAFE * SEG_LEN` for DEFAULT_TUNING and every class tuning.

## Gate results (all green, this worktree)
- `pnpm typecheck` PASS · `pnpm lint` PASS (comment ratchet: 4 changed files, none gained comment lines)
- `pnpm --filter @slur/shared test` **78/78** (was 75; +3) · `pnpm -r test` server 4/4, client 69/69 · `pnpm build` PASS
- Comment ratchet initially FAILED `track.test.ts` 68→72 on a 4-line comment. Trimmed to 2 lines and deleted 2 comments that restated their own assert messages (`hole ${i} not followed by a pad`, `floor not flat`). Now 68→68.
- `pnpm format` does NOT fix `assist/source/organizeImports`; `npx biome check --write <files>` does — confirmed, it reformatted one multi-line `assert.ok` too.
- [unmeasured] no visual confirmation in a browser — the apron is verified at the segment-data level only. Human eye gate outstanding.
