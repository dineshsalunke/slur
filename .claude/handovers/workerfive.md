Agent: workerfive · Lane: run-view store #274 · Updated: 2026-09-26

## Goal
Replace `useRunView` (one listener set and one re-render per overlay per patch) with one store per room
and narrow selectors. Profile the overlay render count before and after.

## Done
- afcd0e7 — perf(overlays): one run-view store per room with narrow selectors (#274). Pushed. Issue #274
  closed with the SHA.

## State
- `apps/client/app/game/net/run-view-store.ts`: keyed per-room store; hooks `useRunPhase`, `useCountdown`,
  `useHostId`, `useRunPlayers`, `useRunStandings`. `use-run-view.ts` deleted.
- Client vitest 420/420, client typecheck clean, biome clean on touched files (16 warnings are #283 layout
  notes on pre-existing constants), comment ratchet passes.
- Live, headless Chrome DPR 1 on :5173/:2567 + node bot host:
  countdown CountdownOverlay 60 → 3; spectating 8 s SpectatorBar 158 → 0; lobby colour change 1 render per
  affected leaf (unchanged); lobby idle and racing 0 both ways.
- Results phase render count [unmeasured] live; covered by results-overlay tests.
- SpectatorBar name update on ◀/▶/Tab [unmeasured] live; checked by reading only (only one racer in the probe).
- Chrome PID 99571 killed.

## Uncommitted
none

## Held files
none (all #274 files released)

## Next
- Await a new lane from slur-supervisor (possibly the `style={{}}` issue it is filing).

## Open questions
- None blocking.

## Lessons → memory
- `.claude/memory/count-react-renders-over-cdp.md`
