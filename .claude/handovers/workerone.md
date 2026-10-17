Agent: workerone · Lane: RFC-349 F4d boost (#404) — sim half DONE, client half next · Updated: 2026-10-17

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Build the approved F4d plan (latest comment on #404: B1–B8, owner chose B2 option A). Then F4e shield (#405),
F4f portal (#406), each with a plan to the supervisor first.

## Done

- F4d part 1, sim half: `843882ee` (pushed). New `packages/shared/src/features/boost/` (constants, status
  hooks, run.use `fireBoost`, feature, moved test). Registry appends boost after tug (RFC §3.4 rule 1), so
  `boostTimer` sits at index 38. `tickStatus` now only decays stun; `clearStatus` is gone (empty).
  New server test `apps/server/src/rooms/room-boost.test.ts` (two-client decode; was not on the claim list —
  tell the supervisor).

## State (measured)

- A/B, scratch `f4d-ab.mjs` + `head.json` in this session's scratchpad
  (`/private/tmp/claude-501/-Users-apple-Projects-personal-slur/cc75d6b3-075d-4f8d-a6f1-df8544ca31ac/scratchpad/`):
  6 seeds × 3600 ticks × 5 racers, players hashed by sorted field name, ids, broadcasts: bit-equal; 800 bags
  equal. Coverage: boost fired 1342, boosting ticks 80428, gliding 3153, boost+stun 10011, boost+tug 8114.
- Negative control (no `ctx.nextId()` in `fireBoost`): diverges on all 6 seeds, first at ticks 7–29.
- Shared tests 585/585. Server 100/100 (one earlier full run showed 1 fail I did not capture; rerun clean —
  possible flake [unmeasured cause]). Client typecheck clean. Lint clean (7 old warnings).
- Room server steps a player only on its inputs: `tick()` alone does not decay `boostTimer` in a room test.

## Uncommitted

- none.

## Held files

- Client claim from the plan: new `apps/client/app/features/boost/**`; edit `features/client-features.ts`,
  `game/scene/{world-scene.tsx, pickup-field.tsx, pickup-layout/*, pickup-instances test,
  power-arc/glyph-atlas.ts}`; delete moved files. Docs: RFC §3.8/§7, `conventions/features.md`.

## Next

1. Client half (B7): move `game/scene/boost-look.ts`(+test), `boost-streak-material.ts`, `boost-streaks/`,
   boost pickups, glyph into `apps/client/app/features/boost/`; `boost.client.ts` with views.scene =
   BoostStreaks, views.pickups, hud.glyph; `splitPickupLayout` drops the boosts bucket. Follow
   `apps/client/app/features/mine/` as the pattern. Boost-blur + camera surplus stay central (B8).
2. Draws on /test-level and beat-deck before/after (BoostStreaks now mounts only in NetCanvas). Take the
   "before" counts first, at `843882ee` (client unchanged there).
3. Client tests + lint, commit, push.
4. Docs: RFC §3.8 result table row for boost + §7, `conventions/features.md`. Count central files naming
   boost (baseline 36 non-test, 51 with tests).
5. Close #404 with SHAs.

## Open questions

- none.

## Lessons → memory

- none new (room-test input stepping is noted above; small and lane-local).
