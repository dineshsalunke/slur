Agent: workertwo · Lane: merge open PRs into dev (188, 225, 230, 237; no issue) · Updated: 2026-09-24

## Goal

Merge the open PRs into `dev` and resolve conflicts. Keep both sides' intent. PR 195 is out of scope.
DONE, pushed.

## Done

- #188 and #225 merged on GitHub (`42b1c69`, `f7fa82c`). #225 was marked ready first.
- #230 merged at `546130d`, #237 at `74a7b89`. Both were made in a detached worktree and pushed with
  `origin HEAD:dev` (`f7fa82c..74a7b89`). GitHub shows both MERGED.
- The owner, through the supervisor, confirmed the resolution rule. #228's deck material wins for blocks
  and monoliths. Every other scene change in #230 and #237 is kept.

## State

- Resolution: `sealed-block-material.ts` stays deleted. `STONE_*`, `Block.envMapIntensity` 2.0 and
  `Monolith.textureSpan` 8 are dropped. `METAL_ROUGHNESS` is 0.40 and `METAL_BASE_COLOR` is `#7d7a75`.
  #230's Env/Fill/Deck/Rail light values, the Rock values and no-fog are in. `SceneFog` is also gone
  from `routes/home/landing-scene.tsx`, which dev added after #230 was branched.
- `block-debris.tsx` has #237's rigid bodies, built on `floorSurface()` + `applyDeckFinish`, and the
  material rebuilds on `useRebuildToken`.
- `ART_MATERIALS.md` §7: item 16 = #228, item 17 = #230 (it carries a "superseded in part by item 16"
  note), item 18 = #237. The `ADD.md` refs point to 18.
- Gate at `74a7b89` in the worktree: typecheck clean. Tests: client 272, shared 228, server 15, 0 fail.
  Biome on the 27 touched app files: 0 errors. One warning (`track-texture.ts` line count) was already
  on dev. The comment ratchet passes.
- Stills (git-ignored): `.claude/frame-tap-refs/merge-before-spawn.png` (`f7fa82c`) and
  `merge-after-spawn.png` (`74a7b89`). They are `/test-level` spawn frames, headless, 1600×900, DPR 1.
  The after frame is warmer and lighter, with lit monolith faces.
- A block-break or meteor-strike frame on the merged build was not shot [unmeasured].
- The shared checkout was NOT synced to origin/dev. The supervisor owns that sync, a real merge.
- The worktree was removed. No scratch servers or Chrome are running. The `refs/remotes/pr/*` refs
  were deleted.

## Uncommitted

None.

## Held files

None. The PR-merge claims are released.

## Next

1. Wait for the supervisor's next lane.

## Open questions

1. None new. Older: R3 wear patches, the worktree for the `036645c` stills, and the 145 ms bake on the
   first race frame.

## Lessons → memory

`.claude/memory/merge-prs-in-a-detached-worktree.md`
