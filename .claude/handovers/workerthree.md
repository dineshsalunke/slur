Agent: workerthree · Lane: scene folder grouping, RFC-349 S11 (#412) · Updated: 2026-10-20

## Goal
Group the world no feature owns under `game/scene/{post,track,sky,ships}/`, one commit per group. File moves
and import paths only. Order (supervisor): post → track → sky → ships.

## Done
- post: ff3f5162 — scene-effects/, boost-blur/, tone-mapping, canvas-gl → `game/scene/post/`.

## State
- Supervisor decisions: shader-patch → track/; canvas-gl → post/; asteroids + meteors → sky/; root leftovers
  stay at root, no 5th group.
- Verification agreed: typecheck, lint, 3 suites, build per commit; /test-level draws + landing/beat-deck
  load check at the end. No RunSim A/B (no shared/server file changes).
- post commit: shared 586/586, server 101/101, client 735/735, build ok.
- Ships waits for workerone (S4 holds ship-dead, ship-model, ship-shadow, explosion-field, exhaust-drive,
  power-arc). Sky waits for workertwo (dev/tuning-schema.ts).
- Track claim sent; conflict: ship-model.state.ts and ship-model.utils.ts (workerone) need one import line.

## Uncommitted
none

## Held files
none (track claim pending)

## Next
1. On track clear: `node <scratch>/s11/move.mjs <scratch>/s11/track.json` (dry), then `write`; biome check
   --write on touched files (list paths explicitly; zsh does not split `$F`); doc pointers; checks; commit.
2. Claim sky, then ships, the same way. Recompute importers each time (the script resolves live).
3. End: /test-level draws, landing + beat-deck load; close #412 with SHAs.
- Tools in scratchpad `s11/`: `move.mjs <map.json> [write]` (ast-grep JSON string ranges, resolves every
  relative and `~/` specifier, moves with fs), `importers.mjs`, `groups.mjs`.

## Open questions
none

## Lessons → memory
none
