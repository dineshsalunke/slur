Agent: workertwo · Lane: /pacing lag (#245) · Updated: 2026-09-24

## Goal

Fix the `/pacing` lag the owner reported: content is blank for a moment after scrolling, then it paints.
Also move `analyzeDescriptor` off the main thread.

## Done

- `20caf85` perf(pacing): analyze in a Web Worker; chunk polylines; report via context (#245).
  - `analyze-worker.ts` + `analyze-client.ts`: a module-singleton Worker with id-keyed replies.
    The clientLoader awaits `analyzeSeed( seed )`.
  - `board-scale.ts`: `samplePoints` / `lineChunks` / `areaChunks` (64-point chunks) replace
    `linePoints`. `polyline-chunks.tsx` renders them.
  - `pacing-report-context.ts`: `PacingReportContext` + `usePacingReport()`. The route provides the
    report. The leaves read it, and `PacingBoard` takes only `seed`.
- Memories: `react-dev-tracks-walk-typed-array-props.md`, `svg-polyline-raster-per-tile.md`.

## State

- Cause of the raster cost: the 19 long polylines. Removing them cut `DisplayItemList::Raster` from
  326 to 35 ms. Removing the 1318 rects did not change it.
- Software raster, 2560x1440 DPR 2, pps 240, fling + jumps: RasterTask 409 → 172 ms. Max tile
  11.3 → 6.2 ms. 1 frame with a missing tile before and after (the 30k-px jump).
- GPU raster (ANGLE Metal, M1 Pro): 0 frames with missing tiles before and after. Owner's blank-then-paint
  is still NOT reproduced headless. The cause on the owner's machine is [unmeasured]. Suspect GPU contention
  from other game tabs [inferred].
- Initial load: 0 long tasks (was one 120 ms). Board shows in 434–540 ms.
- Seed change in dev: was one 5.8 s long task (React 19.2 dev props logging over `report`). Now 0 long
  tasks, 482 ms end to end.
- Client vitest 279/279. tsc, biome, ls-lint, comment ratchet, canvas isolation: clean.
- Scratch scripts: session scratchpad `raster.mjs` (trace + missing tiles), `probe*.mjs`. Chrome on 9452 is killed.

## Uncommitted

None.

## Held files

None. `apps/client/app/routes/pacing/*` is released for workerone's R3 board.

## Next

1. Owner retests `/pacing` in their own Chrome. If it still blanks: which zoom, and was a game tab or
   headless agent Chrome running at the time?
2. If it still reproduces, take a DevTools Performance trace in the owner's browser (Rendering →
   "Layer borders" shows checkerboarding).

## Open questions

1. Does the owner still see the blank after `20caf85`? Which browser?

## Lessons → memory

`.claude/memory/react-dev-tracks-walk-typed-array-props.md`, `.claude/memory/svg-polyline-raster-per-tile.md`
