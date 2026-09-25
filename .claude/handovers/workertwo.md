Agent: workertwo · Lane: mine inside a block fizzles (#263 follow-up, child of #261) · Updated: 2026-09-25

Older versions hold #263, #261, #259 and #257 (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

The owner said: "yes, mines inside a block should fizzle like a gap." A mine whose drop point is inside a standing
block is spent and not laid, the same as a mine dropped over a gap.

## Done

- `5e2ccab`: #263, the far forward drop, the self-hit and the back drop behind the tail.
- This commit (#263 follow-up): `aimMine` takes `broken: ReadonlySet<number>` after `track`, in the same position
  as `lockTarget`. It returns false when the drop point is inside a block that is not in `broken`. The test is the
  sim's `overlapsBlock` with a zero hull: `x0<x<x1`, `z0<z<z1`, `y<y1`, `y+stepTol>=y0`. Callers: the server
  (`room-combat.ts`, `ctx.broken`) and `/test-level` (`local-combat.ts`, `blockWorld.broken`). New tests in
  `mine-drop.test.ts`: a drop inside a sealed block fizzles, forward and back. A drop onto a broken fractured
  block lands. A drop onto a standing fractured block fizzles.

## State

- In-block rate after the fix, 30 groove seeds, every 5 classes, 3,451,420 drops per direction [measured, scratch
  `fizzle2.mjs`]: forward 0 (was 1.1%), back 0 (was 0.6%).
- Fizzle rate now [measured]: forward 1.63% (was 0.5–0.6% gap + 1.1% in-block), back 0.83% (was 0.2% + 0.6%).
- Gates: typecheck clean. shared 379/379, server 25/25, client 365/365. Lint 0 errors, 7 line-count warnings
  (none new; the block tests went to `mine-drop.test.ts` to keep `mine.test.ts` under 300 lines).

## Uncommitted

None.

## Held files

None. Released on this commit.

## Next

1. Supervisor: relay the numbers to the owner.

## Open questions

- Still open from #261: F = back key; the `checkThreat` audio cue ignores `proj.dir` (workerthree).

## Lessons → memory

none
