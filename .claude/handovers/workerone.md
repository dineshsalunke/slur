Agent: workerone · Lane: pacing R3 board (RFC §4; no issue, owner waived) · Updated: 2026-09-24

The RFC is `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/a42d7260-7d77-4e58-93e1-2b90e521bca9/scratchpad/rfc-pacing-branching.md` (§3, §4, §5, §8). The d520f36 version of this file holds the owner rulings Q1–Q5. The 66fefc0 version holds the R2 details. The 68f48bd version holds the trap-rule details (1e7160c).

## Goal

- R3: show the route graph on `/pacing`. Done.
- Held: the generator regenerate step (waits for #244).

## Owner rulings (2026-09-24)

- Trapped = the escape stop window is shorter than that ship's own length.
- The contract hull z-length = the Freighter's 6u.
- The hardest route keeps the Viterbi cost.
- Pickups become a reward axis in R4.
- The generator must REGENERATE a segment that has a trap.

## Done

- `2812078` R1 · `6e67f53` R2 · `1e7160c` trap rule + 6u hull.
- `85077ca` feat(pacing): R3 board. Client only. No shared edits.
  - The worker analyzes with `{ routes: true, arms: true }` (`analyze-client.ts` `BOARD_OPTIONS`). Pockets stay off.
  - Strip: `ViableFill` draws one polygon per route node per 64 rows (cyan ground, gold air), the dead-end regions (threat) and the bolt-conditional regions (dashed marigold). The hardest route is a dashed magenta line. `SelectedArmLine` draws the picked arm.
  - `ForkLane` (above the strip): real forks are marigold, forks with a dominated arm are threat, ground/air forks have a gold outline, dodges are dim ticks. The F1…Fn labels are HTML, placed by a `--at` custom property.
  - `CorridorLane` (below the strip): a step plot of `routes.corridors`.
  - Strafe: a per-second min–max band over easiest + hardest + every arm, plus the hardest line and `SelectedArmStrafe`. Lateral: the hardest per-bin step line.
  - `ForkTable` (below the board, sticky left): one row per arm (`ForkArmRow`, primitive props only). A click toggles the pick and scrolls to the fork.
  - Pick store: `route-selection.ts`, `useSyncExternalStore`, keyed by report identity, so a new seed drops a stale pick. Only the leaf overlays and the rows subscribe.
  - Readout: corridors at z, the fork label, the verdict and the hard-route x.

## State

- `pnpm -F @slur/client typecheck` passes. Biome is clean on `routes/pacing`. The comment ratchet is clean. `route-lines.test.ts` 5/5.
- Headless Chrome, 1600×1300, DPR 1, seed 20260921, on the shared `:5173` dev server:
  - The page loads in 1.24 s (the worker analysis included). There are 2483 polygons and 34 arm rows. No console errors.
  - Pick click → next frame: 13 ms.
  - Summary: forks 7 real / 17, 119 dodges. Lateral easy / hard 299 / 520u. Peak corridors 3 (the RFC's 4–5 was before the 6u hull).
- Stills: scratchpad `0f01f9f0-…/scratchpad/r3-{full,fork,table}.png`.
- R2 data seen on the board, not fixed: many arms have all-zero metrics, so a tie makes arm a both `easiest` and `hardest`. 10 of 17 forks are `dominated`. [measured on seed 20260921 only]

## Uncommitted

None in this lane.

## Held files

- `apps/client/app/routes/pacing/*` (R3). Release on request.
- `packages/shared/src/pacing/*` + tests and the pacing export lines in `packages/shared/src/index.ts`. Release on request.

## Next

1. **OWNER BUG (from slur-supervisor, not started).** Screenshot: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/8c16779d-5bdf-47ad-a4a3-007e9b801592/images/4.png`. The dashed magenta HARDEST route near F4 climbs from the bottom track edge to the top half almost vertically. It drops just as steeply at the left edge. That slope is impossible at max strafe.
   - Suspects: a splice between windowed/arm solves that skips the strafe clamp; soft barring (`barred`) letting the path jump; the drawing joining non-adjacent samples (the strip draws `arms.hardest.path.x` with stride 2).
   - Prove it first: max |dx| per 1u sample on the easiest and hardest routes over seeds 20260921/1/42/7/99991 must be ≤ the clamp (`maxColumnStep` × `PACING_DX`).
   - Fix it with a shared test that asserts the clamp on every emitted route (easiest, hardest, every arm path).
   - File a GitHub issue. Send the supervisor a claim for any file outside the held set.
2. Wait for the supervisor or owner to review the R3 stills.
2. HOLD: the generator regenerate step. Wait until workerthree lands #244 (`sim/track.ts` block merge). Then re-run the z 1200–1278 fixture. If the merge dissolves it, pin a hand-built fixture for the freighter and phantom windows.
3. Then design the regenerate step (`rosterPockets` → rebuild the trapped segments). Check the cost first (35–56 freighter traps per seed). Send an RFC to the supervisor before any build.
4. After #244 commits: re-measure the trapped-pocket counts on the five seeds (the 68f48bd version of this file has the table).
5. R4: pickups as a reward axis in `dominated`.

## Open questions

- **Owner:** 35–56 trapped pockets per class per seed is a lot for a regenerate loop. Should the rule regenerate per segment, or should the generator avoid the shape at its source?
- **Owner:** 10 of 17 forks on seed 20260921 have a dominated arm, and many arms tie at zero demand. Is a tie at zero demand a "dodge" rather than a fork? That would be a rule change in `route-graph.ts`.
- **Supervisor:** the board does not show quiet-time bands (quiet time does not add up per arm, RFC §5). It also does not show trapped pockets. Say if R3 needs either.

## Lessons → memory

none
