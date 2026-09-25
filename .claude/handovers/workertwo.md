Agent: workertwo · Lane: material regression investigation (supervisor-assigned, no edits) · Updated: 2026-09-25

## Goal

Find why the materials look wrong after the 3c44038 merge of origin/dev. Propose a fix. Build nothing.

## Done

- Before/after captures of /test-level at the spawn pose, frozen, DPR 1, headless, each worktree on
  its own origin (:5181 = 3c44038^1, :5182 = HEAD 16b7268). Files are in the session scratchpad:
  `before-base.png`, `after-base.png`, `after-lights-old.png`, `after-lights-finish-old.png`,
  `after-stone.png`.
- Earlier lane: c0a7a90 matchmaking fixture fix.

## State

- 3c44038 introduced no conflict: `git diff 277396f 3c44038 -- apps/client/app` is empty.
- The change is the #230 and #237 defaults, as merged on origin in 546130d and 74a7b89:
  `Sky.environment` 0.85→1.85, `Sky.keyLight` 8→4.45, `Sky.planetLight` 1.55→1.95,
  `Env.fillIntensity` 0.14→0.5, `Fill.intensity` 0.35→1, `Deck`/`Rail.envMapIntensity` 1→1.5,
  `METAL_ROUGHNESS` 0.25→0.4, `METAL_BASE_COLOR` #7c8590→#7d7a75 (c9fdb96, which also tints the ship
  hull), deck texture 4×16 plates with heavier wear, fog removed.
- 546130d's merge note says the #228 conflict was resolved by dropping #230's stone finish
  (STONE_* 0.15/0.75, Block.envMapIntensity 2.0). The #230 lights were dialled for stone blocks and
  monoliths. They now light metalness-1 blocks, monoliths, deck and ship.
- Setting the pre-merge light and finish values live on HEAD brings the frame close to the pre-merge
  frame. Remaining differences: the 4×16 plates, brown rocks, no fog.
- Stale localStorage cannot cause this (restore() drops entries whose `from` is not the new default).
  The owner's dev server was not inspected [unmeasured].

## Uncommitted

None.

## Held files

None.

## Next

1. Idle until the supervisor or owner picks a fix option.

## Open questions

- Owner: which fix? (A) restore the pre-#230 light and finish values; (B) put the stone finish back
  on blocks and monoliths, which partly reverses #228; (C) re-dial the lights live on /test-level
  for the one-metal world.

## Lessons → memory

none
