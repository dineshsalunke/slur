Agent: workerthree · Lane: #268 rear-view mirror (reopened) · Updated: 2026-09-26

## Goal

Keep the old feathered mirror edge, make the panel opaque, and remove the bezel and lip that 1199218 added.

## Done

- 09cb486 (pushed): `rear-view-surface.ts` restores `edgeMask` and `uFeatherX/Y`, and sets the edge mask as alpha under NormalBlending. The bezel, lip, `uSize` and `srgbTriple` are gone. `rear-view-pass.tsx` sets the feather uniforms from `num()`. `tuning-schema.ts` re-adds `RearView.featherX` 0.22 and `featherY` 0.18.
- Commented the SHA and the measurements on #268. It is left OPEN for the owner's look test.
- #169 was stopped before any write (the owner says it is already done).

## State

- Headless /test-level at DPR 1, 1600×900, `RearView.gain` = 0 (measured):
  - Solid region 675–925 × 43–133: max 0. The same pixels with the mirror hidden: max 240, mean 33.9.
  - Rim band x 578–600: mean 33.1 against 39.3 with no mirror.
- Client typecheck, Biome and the comment ratchet are clean.
- My Chrome (PID 78650, :9463) is killed.

## Uncommitted

None.

## Held files

None. The #268 claim is released.

## Next

1. Wait for the owner's look test on #268. Adjust the feather dials if asked.
2. Take the next lane from the supervisor.

## Open questions

None.

## Lessons → memory

none. The gain-0 opacity probe is in the #268 comment.
