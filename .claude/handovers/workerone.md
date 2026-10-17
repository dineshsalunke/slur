Agent: workerone · Lane: RFC-349 F4c mine (#403) — sim half DONE, client half next · Updated: 2026-10-17

Older versions: `git log -p -- .claude/handovers/workerone.md` (approved M1–M8 text is in the previous version).

## Goal

#403: move mine into two feature folders. Sim half → `packages/shared/src/features/mine/` (done). Client half →
`apps/client/app/features/mine/` (M7–M8, next). Owner approved M1–M8 (2026-10-17).

## Done

- `2b8c9d53` sim half (M1–M6), pushed:
  - `run.settle` hook (RunHooks/OpenRun/bindRun/RunFeatures). `stepCombat( ctx, dt, { strike, settle } )` — required
    object `CombatPhases`, no default.
  - `sim/floor-under.ts` leaf; `step.ts` imports it; index exports it.
  - `features/mine/{mine.ts, mine-run.ts (layMine, settleMines, resolveMineEvent(ctx, e)), mine-schema.ts,
    mine-constants.ts, mine.feature.ts, mine.test.ts, mine-drop.test.ts}`.
  - `combat/mine-hit.ts` stays the neutral leaf (bolt uses it); index exports it directly.
  - `firePower( ctx, p, ownerId, slot, dir )` lost its id param; `run-sim.fire` does `this.nextProjectileId++`
    before it so ids stay bit-equal.
  - power-bag: mine removed from core list and cache key; mine is a feature power (`bagWeight: cfg.mineRatio`).
  - Server tests `room-mine-fizzle` (now via `openRunFeatures().use`) and `room-shield` (RunContext) updated.
  - Client `pickup-layout.utils.test.ts`: INTERIM — `featured` excludes `HeldPower.mine` because the mines bucket
    still exists. Remove that exclusion when the client half drops the bucket.

## State (measured)

- A/B vs HEAD dist (bench `<scratch>/f4c-ab.mjs`, scratch = previous session's, gone after clear): 6 seeds × 3600
  ticks, 5 racers: identical per-tick hashes; 800 bags identical. Outcomes: trigger 447, evicted 480, cleared 143,
  fizzle 90, expired 21, seeker+mine+shield ticks 2. Negative control (mine as `run.strike`) diverged on 6/6 seeds.
- Gates at `2b8c9d53`: typecheck clean; tests shared 585/0, server 99/0, client 726/0; lint 0 errors (8 warnings,
  file length, pre-existing). TDZ sweep: every shared dist module imports alone (0 fails); orphan
  `dist/combat/mine.*` deleted.

## Uncommitted

- none after this handover commit.

## Held files

- Client half claim (unchanged from the approved list): `apps/client/app/features/mine/**`,
  `features/client-features.ts`, `game/ecs/traits.ts`, `net/attach-room-to-world.ts`, `game/net-canvas.tsx`,
  `game/scene/{pickup-field.tsx, pickup-layout/*, pickup-instances/pickup-instances.test.ts,
  power-arc/glyph-atlas.ts, power-arc/power-arc.utils.test.ts, projectile-field/projectile-field.tsx,
  mine-shock-events.ts}`, the moved `game/scene/mine-*` files. Docs: `docs/RFC-349-ARCHITECTURE.md`,
  `conventions/features.md`.

## Next

1. Client half per M7–M8 (see previous handover version: `git show 67af3dc5:.claude/handovers/workerone.md`).
   Follow the seeker client move (`65784e33`) as the pattern. Drop the interim exclusion in
   `pickup-layout.utils.test.ts` along with the mines bucket.
2. Gates; /test-level draws headless (DPR 1, `?quality=high`, F4b read 76); two SDK clients on :2567 decode mines
   `x,y,z,ownerId,armed,ttl`, both see `mineBurst` and the victim stun. Kill any Chrome you start.
3. Commit + push. RFC §3.8 "F4c result" + §7 row; `conventions/features.md` `run.settle` slot rule (runs after
   every strike, before portals; for effects that must see all strikes land). Close #403 with SHAs + numbers.

## Open questions

- none.

## Lessons → memory

- `.claude/memory/ab-bench-needs-a-negative-control.md`.
