Agent: workerone · Lane: track pacing, step 1 — pacing board dev route (no issue; owner waived) · Updated: 2026-09-24 02:20

## Goal

Build a `/pacing` board that shows a seeded track and its measured demand on one time axis, so the owner can see and design pacing. Step 2 (later) is a phrase and rule model that the generator composes, plus a jump contract.

## Done

- `5e774de` — shared analyzer `packages/shared/src/pacing/`:
  - `grid.ts`: sample grid, 1u in z; column step derived from the contract so one step equals 65u/s.
  - `reference-path.ts`: Viterbi planner; contract hull 2u; cost is |dx|, plus reversal and jump penalties.
  - `demand.ts`: moves, quiet spans, 1s bins, strafe rate.
  - `jump-window.ts`: gap classes and takeoff windows, measured by the real `simulate()` on a block-free copy of the track.
  - `intent.ts`: intensity, SECTIONS spans, `bandAt` bands.
  - `analyze.ts`: `analyzeDescriptor()`.
  - Exported from `index.ts`.
- `5211671` — client route `/pacing?seed=N`: `apps/client/app/routes/pacing/*` (19 files) plus one line in `routes.ts`.
  - SVG panels: time ruler, intensity, top-down strip, clearance, strafe rate, lateral travel, quiet time, gap windows.
  - Zoom and scrub write CSS variables through refs.
  - A fixed readout shows the values under the pointer.
  - Same commit: gaps classified as slot / rolls; the double pilot fixed; takeoff scan widened to 96u.

## State

- Shared tests 223/223 pass. Client typecheck exits 0. Biome is clean on my paths. ls-lint, canvas-isolation and the comment ratchet pass.
- Full `pnpm lint` fails on other lanes' untracked `.claude/skills/impeccable/*.js`, not on my files.
- Analysis takes 90–150 ms per seed (measured on seeds 20260921, 1, 42).
- Seed 20260921:
  - 56 strafe moves, 26 reversals, 12 path jumps.
  - Gaps: 23 in all, 7 forced, 9 lengthwise slots.
  - Quiet share 93%. Longest quiet 16.2s (the intro). 19 rests of 2s or more.
  - Time at the strafe cap 0.1%. Narrowest floor run 8.0u.
- Air distance (DEFAULT_JUMP, 55u/s): single 28.4u, double 63.2u.
- Takeoff window on a forced 16u gap: single 0.46s, double 1.09s. A 20u gap: 0.39s / 1.02s. Compare the 0.45s reaction window.
- No stuck samples on seeds 20260921, 1, 42, 7, 99991. The path threads every one of them.
- The planner breaks ties by moving as early as it can, so quiet spans sit before obstacles. It ignores strafe acceleration and ship length, which makes its demand a lower bound.
- Stills (scratchpad):
  - `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/506b305a-47bc-47c7-ae96-b52206356d8f/scratchpad/pacing-full.png`: 3700px, the whole track.
  - `…/pacing-zoom.png` and `…/pacing-1.png`: 1600px, default zoom. `pacing-1.png` is from before the gap fixes.
- Headless Chrome is killed. I started no dev server; I used the running one on :5173.

## Uncommitted

None of mine. The memory file and this handover are committed with this seam.

## Held files

`packages/shared/src/pacing/**` · `apps/client/app/routes/pacing/**` · `apps/client/app/routes.ts` (one line) · `packages/shared/src/index.ts` (six export lines).

## Next

1. The owner reviews the stills and the route. Collect feedback on the metric definitions:
   - Quiet time as "time between inputs".
   - The earliest-move tie-break.
2. Candidate additions, owner's call:
   - Bot playback heat over 30 seeds (bounce, stun, death).
   - A per-seed CSV export.
   - Section-level summary rows.
3. Step 2 design (owner approved the direction):
   - A phrase and rule model (slalom-N, chicane, gap-with-choice, breather, pickup run, finale). Phrases carry labels, and the board reads them.
   - A jump contract in TRACK_CONTRACT for gap length and reach. The board then drops "from DEFAULT_JUMP".

## Open questions

- Is 93% quiet share and a 16s intro coast the "no weaving" the owner felt? The board suggests yes. [inferred]
- The double-jump window (about 1.1s on a forced gap) is more than twice the reaction window. Is that the "too easy" source? Should the jump contract cap it? [inferred]
- The 9 lengthwise slots per seed need no jump. Keep them as a strafe hazard, or retire them in step 2?

## Lessons → memory

`.claude/memory/a-sweep-that-hits-its-bound-fakes-a-reading.md`
