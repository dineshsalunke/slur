Agent: workerone · Lane: RFC-349 S10b (#380) done → idle · Updated: 2026-09-29 19:00

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#380: no `.constants.ts` exports a per-frame scratch object. Done and closed. Next lane: the supervisor
assigns it.

## Done

- 4c66045 + e5b1e6d — #369 nozzles in accent, EngineLight removed. #369 open for owner sign-off.
- 41c9a41 — #374 one client config source (`RunConfig` world trait). Closed.
- 7a267ec + 564c84b — #377 `.scratch.ts` suffix + tug-line/remote-engine-audio/game-audio renames,
  ship-model `glow` split. Closed.
- a9f7b83 — #380: 23 scene folders. Scratch exports moved from `<name>.constants.ts` to a new
  `<name>.scratch.ts`: the 21 listed folders plus finish-outline and monolith-group (each exported
  `scratch`). `_pool` and `_tick` moved too. track-blocks `windowSegs` moved from `.state.ts` to
  `track-blocks.scratch.ts`. Closed.

## State

- At a9f7b83: `pnpm typecheck` passes, `pnpm lint` passes (9 warnings, all in files I did not touch:
  track-texture.ts, attach-room-to-world.ts, run-room.test.ts), `pnpm test` passes (shared 573,
  server 99, client 686).
- Still in `.constants.ts` by decision: `_zero`, `_one`, `_black`, `_identity` and the UPPERCASE
  colours/vectors. No code writes to them (grep this session).

## Uncommitted

- none.

## Held files

- none. #380 claim released.

## Next

1. Wait for the supervisor to assign a lane.

## Open questions

- Owner (#369): is the flatter nozzle OK? Does the near-camera streak still read orange after "reset tuning"?
- Optional, not filed: rename the read-only `_zero`/`_one`/`_black`/`_identity` to UPPERCASE so a leading
  `_` always means scratch. The supervisor decides.

## Lessons → memory

- New: `.claude/memory/bulk-ast-edits-via-ast-grep-json.md` (TS 7 has no JS compiler API; use ast-grep
  JSON ranges and a node splice).
- Updated: `bash-tool-runs-fish.md` (`bash -c` is 3.2, no `mapfile`; use `--pathspec-from-file`).
