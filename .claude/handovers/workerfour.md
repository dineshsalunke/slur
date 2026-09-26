Agent: workerfour · Lane: review rule text + dev-route gate (#278, #279 — both closed) · Updated: 2026-09-26

## Goal

Align the Colyseus and React Router rule text with owner decisions 1–2, and gate the dev routes out of
the production build (owner decision 3).

## Done

- 5abad09 — #278. `.claude/rules/colyseus-state.md` + `conventions/colyseus.md`: keep dead fields
  plain, never `@deprecated()`, with the reflection-decode reason. `.claude/rules/react-router.md` +
  `conventions/react-router.md` (TL;DR 3, the loader anti-pattern, the line-219 cross-ref): the room
  lives on a module singleton, a `clientLoader` may open or return it, and an unmount never closes it.
- 888049a — #279. `apps/client/app/routes.ts`: `test-level`, `pacing`, `beat-deck` behind one
  `NODE_ENV === 'production'` gate. `apps/client/package.json` typecheck:
  `NODE_ENV=development react-router typegen && tsc`.
- #278 and #279 closed with SHAs.

## State

- Client prod build manifest lists only `""` and `game/:roomId`; no built JS references
  `routes/pacing` or `routes/test-level` (measured).
- `pnpm --filter @slur/client typecheck` passes (measured).
- `pnpm lint`: 2 errors, both outside this lane — `apps/server/src/rooms/room-combat.ts`
  (organizeImports) and `packages/shared/src/combat/power-bag.test.ts` (format) (measured).
- Dev-server `/test-level` and `/pacing` still load [unmeasured — typegen in dev mode emits their types].

## Uncommitted

None.

## Held files

None. Released all claims.

## Next

Idle. Wait for the supervisor's next lane.

## Open questions

- The two lint errors above belong to another lane; the supervisor may want to route them.

## Lessons → memory

`.claude/memory/typegen-runs-in-production-mode.md`
