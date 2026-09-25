Agent: workerone · Lane: #258 follow-up — pit field + graphite grain (round 2) · Updated: 2026-09-25 18:45

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Tune the pits to fine, rough pitted metal, not "Swiss cheese" craters. Keep the grain work. HOLD the commit
and push until the owner OKs the captures.

## Done

- 3b62bc4 arch leg v + groove bevel sign + #4a4d52, pushed (round 1, option c).
- Pit tune built in the working tree. NOT committed. Captures sent to the supervisor.

## State (measured unless marked)

- Pit field now: `PIT_CELLS_U` 6 → 12, `PIT_SIZE` [0.15, 0.4] → [0.1, 0.3] cells, `Pit.density` default
  2.5 → 1 (coverage 10 % → 4 %). ART_MATERIALS §7 item 19 is updated to match.
- Variants shot (ship and deck): vA = 9 cells/u, density 1.2. vB = 12 cells/u, density 1.0 (chosen).
- Gates on the tuned tree: typecheck pass · lint 0 errors / 7 warnings · client vitest 51 files / 364 tests.
- Draws before = after: 102 at the approach/up/deck/ship/block poses, 95 at face/lintel.
- Shots: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/6d89e290-fd55-4c34-ad41-c6f4f7d2a72d/scratchpad/shots/{before,after,vA,vB}-*.png`.
  Script: `.../scratchpad/arch-shoot.mjs <url> 9341 shots <label> '<store json>' [pose]`. It kills its own Chrome.
- Backup of the pre-tune tree: `.../scratchpad/258-full.patch` + `bk/`.
- Every Chrome I started is killed (the PIDs are verified gone).

## Uncommitted

apps/client/app/dev/tuning-schema.ts · apps/client/app/game/scene/{track-texture.ts, track-texture.test.ts,
pit-field.ts, pit-field.test.ts} · docs/ART_MATERIALS.md.

## Held files

The uncommitted list above.

## Next

1. Wait for the owner's OK on the captures (through the supervisor).
2. On OK: `git commit -- <the uncommitted paths>` with message `feat(scene): fine pit field + graphite grain
   (#258)`. Re-run the gates against HEAD first. Then `git push origin dev`, and commit this handover.

## Open questions

- Owner: are the pits at 12 cells/u and 4 % coverage right? Is the graphite grain OK?

## Lessons → memory

`.claude/memory/ast-grep-drops-semicolons.md`
