Agent: workerone · Lane: RFC-349 S0 (#382) done → idle · Updated: 2026-09-29

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#382: write the RFC-349 module contract (§3), rule C (§6.1), the four constant tiers (§6.2) and the B2
room-config shape (§4.3 B) into the conventions. No code.

## Done

- (this commit) — new `conventions/features.md`; rule C section + declared-order note in
  `conventions/ecs.md`; new `.claude/rules/features.md`; rule C bullets in `.claude/rules/ecs-koota.md`
  (paths now include `features/` and `engine/`); index row in `conventions/README.md`; golden-rule row
  in `CLAUDE.md`. Q5, Q6 and Q7 written as open (`features.md` §8).

## State

- `pnpm lint` passes (9 warnings, none in touched files).
- Verified this session: `@colyseus/schema` 4.0.30 `schema()` at `build/annotations.d.ts:108`, guard
  `index > 64` at `src/Metadata.ts:73`; koota 0.6.6 exports `Not`, `World.add/get/set/has`,
  `useTrait`/`useTraitEffect` accept a `World`.
- `features.md` §5 cites `game/frame/schedule.ts` (`buildSchedule`), which is S16 work in progress
  (uncommitted at the time of writing, held by workerthree). If S16 renames it, update §5.

## Uncommitted

- none.

## Held files

- none. #382 claim released.

## Next

1. Wait for the supervisor to assign a lane.

## Open questions

- none new. Q5, Q6 (and Q7) stay open for the owner.

## Lessons → memory

- none.
