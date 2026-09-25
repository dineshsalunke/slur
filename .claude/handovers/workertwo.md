Agent: workertwo · Lane: track width 64u → 96u (#257) · Updated: 2026-09-25

Older versions hold the 80u trial and the material-regression lane (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

Widen the track to 24 lanes (owner: "lets not have odd numbers… lets do 24 lanes"). HALF_WIDTH 48, 96u deck.

## Done

- 07b4d2d — one width source. `FlightTuning.halfWidth` removed; `step.ts` and `respawn-point.ts` read `HALF_WIDTH`. (Was fef094f on the deleted `feat/width-80`.)
- fe40718 — `HALF_WIDTH = 48`, `LANES = 24`. Weave contract re-pinned. Fixtures width-relative. Pocket fixture moved. GDD §0 line 81 reads 96u.
- Both pushed to origin/dev. Branch `feat/width-80` deleted (local only, never pushed). Worktree was removed by the supervisor.

## State

- Gates at 48: shared 331/331, server 17/17, client 349/349 (48 files). `pnpm typecheck` green. `pnpm lint` green (8 warnings, none in my files).
- Main-checkout shared dist built at 48 (`dist HALF_WIDTH 48 LANES 24`).
- Weave contract: FZ_ROWS 63, WEAVE_PERIOD_ROWS 98, digests 3647193385 / 2095466698 / 372694567. Slope and curvature caps unchanged.
- Pocket fixture: seed 20260921 z 2446–2460 x 9–11. Freighter window 2.2, phantom 3.2. Phantom leaves left (fromX 10 → toX 3), stop window 2459.8–2463.0.
- Respawn clamp test anchor was a hand-typed 40; now `HALF_WIDTH + 8`.
- Groove 30 seeds × 5 classes: 64 → 150/150, 0 deaths, 41 bumps, edge<4u 0–0.9%. 96 → 150/150, 0 deaths, 13 bumps, edge 0.0%. Widest run 61.2 → 91.8u. 60 blocks per seed at both.
- Weave: blocks/km 60.4 → 96.6. Closed u²/m 83 → 155. Open floor 83.7 → 79.9%. Pilot finishes 31/150 → 0/150 (pilot not valid on weave; relative only). Trapped pockets per seed roughly double (interceptor 22–31 → 40–57; freighter 34–47 → 60–82).
- Camera [inferred, pinhole maths]: rails enter frame 11.7u ahead of a centred ship at 64, 24.6u at 96.
- Client [not mine]: 96 / TEX_SPAN_X 16 = 6 whole deck tiles. Finish gate 24 columns.
- Pilot + scans: this session's scratchpad (`fly2.mjs`, `scan.mjs`, `sq.mjs`, `wpk.mjs`).

## Uncommitted

None.

## Held files

None. Claims released.

## Next

1. Owner flies 96 on :5173 (`/test-level` for groove, hosted room for weave).
2. Owner decides weave density at 96 (see Open questions).

## Open questions

- Owner: weave amplitude and block count scale with LANES, so weave at 96 has 60% more blocks per km and about twice the trapped pockets. Keep, or hold weave to a fixed block density per metre?

## Lessons → memory

none (covered by `.claude/memory/fixtures-must-be-width-relative.md` and `test-your-lane-against-head.md`)
