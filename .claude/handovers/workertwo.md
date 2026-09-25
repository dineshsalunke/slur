Agent: workertwo · Lane: mine follow-up — far forward drop, self-hit, tail back drop (#263, child of #261) · Updated: 2026-09-25

Older versions hold #261, #259 and #257 (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

The owner said: "mines should be dropped quite far so the player can avoid it himself." Make the forward drop far
enough to dodge, let the layer's own armed mine hit the layer, and put the back mine behind the tail.

## Done

- `71b64c4`: #261, the mine and forward/back fire.
- This commit (#263): `MINE_DROP_AHEAD` 8u → `MINE_LEAD_S` 0.8 s. The forward mine goes at z = nose + R + vz×0.8.
  New `mineDropZ` in `combat/mine.ts`. `MINE_BACK_GAP` 1u: the back mine goes at z − halfL − R − 1.
  `mineTriggers` no longer excludes the owner. `/test-level` passes vz. GDD §5.3 and ART_SCALE §7a are updated.
  New `combat/mine-drop.test.ts`: drop placement, a stopped layer survives, a rival ahead is hit first, and the
  per-class idle, strafe and jump pilots.

## State

- Sim, flat floor, at top speed [measured]. With the old 8u drop, every class passed the mine before it armed.
  The new forward drop, nose to mine: interceptor 70u, phantom 75u, fighter 80u, comet 93u, freighter 102u
  [computed from maxCruise × 0.8 + 3].
- Dodge test, 0.5 s reaction [measured, `mine-drop.test.ts`]: every class is hit if it holds its line. Every
  class clears the mine with the kick-aware `strafeToward` strafe, and every class clears it with a jump.
  The freighter strafe has the least slack: 0.783 s of the 0.8 s.
- Fizzle rate, 30 groove seeds [measured, scratch `fizzle.mjs`]: uniform open-deck points, every 8u in z and every
  4u in x. Forward new 0.5–0.6% (old 8u: 0.3%). Back new 0.2% (old: 0%). `floorUnder` ignores blocks, so a
  mine can land inside a block without fizzling: forward new 1.1% (old 0.7%), back new 0.6%.
- Gates: typecheck clean. shared 377/377, server 25/25, client 364/364. Lint 0 errors, 7 line-count warnings
  (none new).

## Uncommitted

None.

## Held files

None. Released on this commit.

## Next

1. Supervisor: relay the numbers to the owner.
2. If wanted: stop a mine landing inside a block (1.1% of forward drops). A fizzle or a skip is the owner's call.

## Open questions

- A mine that lands inside a block sits hidden and nobody can reach it. Should it fizzle like a gap?
- Still open from #261: F = back key; the `checkThreat` audio cue ignores `proj.dir` (workerthree).

## Lessons → memory

`.claude/memory/tuningforship-takes-a-ship-id.md`
