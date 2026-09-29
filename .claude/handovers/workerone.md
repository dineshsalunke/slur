Agent: workerone · Lane: RFC-349 S10 (#377) done → idle, #380 later · Updated: 2026-09-29 17:30

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#377: scratch-only module objects live in `<name>.scratch.ts`. Done and closed. Next lane: supervisor assigns.

## Done

- 4c66045 + e5b1e6d — #369 nozzles in accent, EngineLight removed. #369 open for owner sign-off.
- 41c9a41 — #374 one client config source (`RunConfig` world trait). Closed.
- 7a267ec — #377: renamed tug-line and remote-engine-audio `.state.ts` → `.scratch.ts`. Split ship-model
  `glow` into `ship-model.scratch.ts`; `hullTexSpan` uniform stays in `.state.ts`. Added `.scratch.ts` to
  `.ls-lint.yml`, CLAUDE.md NN-9, `.claude/rules/component-files.md`, `conventions/r3f.md` and the grit message.
- 564c84b — #377: renamed game-audio `.state.ts` → `.scratch.ts` after #375 landed. Pushed. #377 closed.

## State

- ls-lint passes. Biome and the comment ratchet pass on the touched files.
- Client typecheck at 564c84b: the only errors are `FRAME_PHASE` in workerthree's uncommitted S15 `.tsx`
  files (power-arc, ship-model, ship-shadow, track-blocks, tug-line). None in my files.
- The other 15 `.state.ts` files hold state that outlives a frame. Checked each one this session.

## Uncommitted

- none.

## Held files

- none. #377 claim released.

## Next

1. #380 (phase B): 21 `.constants.ts` files export scratch objects (`export const _o = …`), plus the
   `track-blocks.state.ts` `windowSegs` split. Start only when S15 #379 and S3 #376 release their files.
   Send the supervisor a separate claim first.
2. Otherwise wait for the supervisor to assign a lane.

## Open questions

- Owner (#369): is the flatter nozzle OK? Does the near-camera streak still read orange after "reset tuning"?

## Lessons → memory

- none new this seam. The only lesson was that `git commit -- <path>` skips a new untracked file.
  Memory `shared-tree-footguns` already records it.
