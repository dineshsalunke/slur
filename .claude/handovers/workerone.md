Agent: workerone · Lane: #318 blocks missing in corridor until close · Updated: 2026-09-27 14:05

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#318: a block in the phrase corridor is not drawn until the ship gets close; the ship still hits it.
**Owner approved fix A + B. Claim CLEAR.** Build A, push, close #318 with the SHA. B may be its own commit on #318.

## Done

- c5436bb #315 (mirror only on track), closed. 6f484e1 handover.
- #318 diagnosis. No source edits yet.

## State — diagnosis (measured this session unless marked)

1. Default /test-level is `gen=groove`: an open deck with no walled corridor (screenshots at z 300–6500). The owner's corridor is `phrase` (a stepped wedge into x[-10,10] at z≈2080).
2. Generated phrase renders completely. I compared the instance buffer with the track data at 8 z points: 0 missing, worst window 134. A pixel A/B on corridor block 7170 (hidden via `blockWorld.broken`) shows it drawn from dz 350 to 60.
3. The editor path: `editorSource()` (`track-editor/editor-tracks.ts`) decompiles the generated track as id `phrase-20260921`. `openEditor` runs `normalizeLevel`. Save goes to `/test-level?level=<id>&v=…` (`track-editor.state.ts:333`). The saved level looks identical to the generated one.
4. In node: `decompileTrack(phrase)` gives 596 blocks, worst window 134. `normalizeLevel` of that gives 226 rects, which resolve to **3007** sim blocks, worst window **889**. 1092 windows (5u steps) exceed `BLOCK_LIMIT` 320.
5. The owner's file (live, before it was deleted at 13:17): at z 2000, 509 expected and 320 drawn; at z 14000, the first dropped block was 110u ahead. Walls came in 4u columns: x[10,12],[12,16],[16,20],[20,24] at z 2360–2380.
6. Mechanism: `put()` in `track-instancing.ts` silently skips once `i >= limit`. Emit runs near→far from `sim.z - BACK` (240), so the cut lands close ahead and slides back as the ship moves. The sim keeps every block, so collision still works.
7. Ruled out: `blockWorld.broken` (only fractured blocks enter it; phrase is all sealed; cleared on room swap), gen tunables (none exist), and a second block renderer (none exists).
- Owner answered that it was the "normal generated track". The editor-save path is inferred as what they flew; the supervisor relayed the evidence.

## Uncommitted

None. `tracks/` is owner data; `tracks/groove-20260921.json` shows as deleted, and that was not me.

## Held files (claim CLEAR)

- A: `apps/client/app/game/scene/track-blocks/{track-blocks.tsx, track-blocks.utils.ts, track-blocks.constants.ts}` + new `track-blocks.utils.test.ts`
- B: `apps/client/app/routes/test-level/track-editor/editor-shapes.utils.ts` + its test
- this handover

## Next

1. **A (render):**
   - Add a pure `blockCapacity(track)` in `track-blocks.utils.ts`. It scans the windows `[z-BACK, z+AHEAD]` over every segment and returns the worst sealed and fractured counts. Use it in TrackBlocks as `useMemo([track])`: sealed = max(`BLOCK_LIMIT` 320, worst), fractured = max(`FRACTURED_LIMIT` 160, worst).
   - Size the `instancedMesh` args and the attribute arrays (`attrs`, `fracturedAttributes`) from it.
   - `emitSealed`/`emitFractured` take the limit from `Emit` instead of the constants.
   - Emit ahead-first: segments from `floor(sim.z/SEG_LEN)` to `i1`, then from `i0` to that index − 1, so any overflow drops blocks behind the ship.
   - Memoise `segmentAt` in the scan (see memory `procgen-segmentat-is-uncached`).
   - Test: the capacity is ≥ the worst window for a dense authored level.
   - Verify headless on :5173 with an authored dense level: register it with `registerAuthoredLevel` over CDP, or have the owner re-save phrase from the editor. Do NOT write to `tracks/` myself. Then commit, push, and `gh issue close 318 -c "<SHA>"`.
2. **B (editor):**
   - Fix `unionRects` in `editor-shapes.utils.ts`. It uses one global edge grid, and its greedy x-run-then-z-stack slices long walls at every foreign edge.
   - Test: `normalizeLevel(decompileTrack(resolveTrack(phrase)))` resolves to ≤ 596 blocks.
   - Commit on #318.
3. Mechanism weighing for A: put it in the commit body (5 options were sent to the supervisor: raise the constant / ahead-first / per-track capacity / merge at parse / grow at runtime).

Node repro (scratchpad may be gone): import `packages/shared/dist/index.js`. Resolve phrase `{kind:'procgen', seed:20260921, tier:0, length:phraseSegments(20260921), blockDensity:0.6, gapChance:1, gen:'phrase'}`, run `decompileTrack`, copy `editor-shapes.utils.ts` to a scratch `.ts` and import `normalizeLevel` (node 24 strips the types), run `registerAuthoredLevel`, then `resolveTrack({kind:'authored', levelId})`. Count blocks per window `[z-240, z+900]`.

## Open questions

- Should the mirror show in the finished phase? (#315, today it hides.)
- Should a no-op editor edit push an undo step? (#308.)

## Lessons → memory

`.claude/memory/block-render-cap-drops-silently.md`
