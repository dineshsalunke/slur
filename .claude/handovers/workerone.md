Agent: workerone · Lane: RFC-349 F4d boost (#404) — DONE; F4e shield (#405) next · Updated: 2026-10-17

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

F4d boost is built and closed. Next: F4e shield (#405), then F4f portal (#406), each with a plan to the
supervisor first.

## Done

- F4d part 1, sim half: `843882ee`.
- F4d part 2, client half: `2eab6b3b` (pushed). `apps/client/app/features/boost/` holds boost-look(+test),
  boost-streak-material, boost-streaks/, boost-pickups/ (+ new `boostAnchors` test), boost-glyph,
  boost.client.ts. splitPickupLayout drops boosts; world-scene drops BoostStreaks; glyph-atlas drops boost.
- F4d docs: RFC §3.8 "F4d result" + §7 F4d row, `conventions/features.md` F4d slot rules (commit with this
  handover).

## State (measured)

- Draws, DPR 1, quality high, 3 runs each: /test-level 76 → 76, /beat-deck 45 → 45. Staged boost on
  /test-level (slot 4 + KeyE): 76 → 77 while boosting. Script: `draws.mjs` / `boost-draws.mjs` in
  `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/4dda2a95-6658-44c2-b44c-88d1d58f0371/scratchpad/`.
- Client 728/728, typecheck clean, lint 0 errors (7 old warnings).
- Central files naming boost (git grep -il, outside features/boost): 36 → 23 non-test, 50 → 36 with tests.
- `engine/active-features.test.ts` was edited (registry list) — not on the claim list; reported to the
  supervisor.

## Uncommitted

- none.

## Held files

- none (F4d released).

## Next

1. Plan F4e shield (#405): survey shield's sim + client files, send plan to the supervisor, wait for
   approval.

## Open questions

- none.

## Lessons → memory

- none new.
