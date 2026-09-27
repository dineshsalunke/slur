Agent: workerone · Lane: #325 portal gate as a full 6u ring (plan sent, awaiting owner) · Updated: 2026-09-27

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#325: replace the #320 arch with a full circular ring, 6u clear, raised, LOOK from
`docs/art-direction/ingredients/portal/concept-board.png` (read-only). Plan first; no edits until the owner approves.

## Done

- #318: 4b17a2e, fc85cd7. #320: b760826. #322: 7696144. All closed.
- #323: e499eee, then follow-up bc96f51. Only the empty-slot frame is square; the bolt is a diamond again. Closed, SHA commented.

## State

- #325 plan sent to slur-supervisor. Three placements: P1 centre y 3 (recommended), P2 ring on the deck (rejected), P3 centre 1.5.
- Opening width for P1: 2.8u at y 0.35, 4.9u at y 1.25, 5.7u at y 2 (computed).
- Recommended: the catch becomes a circle in `packages/shared/src/combat/portal.ts:207`. Alternative: keep the box.
- Hop cue depends only on `GATE_MID` in `mine-shock/mine-shock.constants.ts` (lift 2 → 3).
- `ringGeometry` + `dashedSleeveGeometry` from #303 are still in `game/scene/portal-ring.ts`.

## Uncommitted

None of mine. Owner data in `tracks/` is not mine.

## Held files

- `game/scene/power-arc/glyph-atlas.ts` (#323 follow-up is committed, so it can be released).

## Next

1. Wait for the owner's placement and catch decision via slur-supervisor.
2. Then claim the files listed in the plan, build, screenshot on /test-level (leva Pickups grants a portal), commit, and close #325.

## Open questions

- #325: P1? Should the catch be a circle or stay a box?
- From #320: is the exit-frame bloom too strong?
- #315, #308, `unionRects` order: still open from an earlier lane.

## Lessons → memory

none.
