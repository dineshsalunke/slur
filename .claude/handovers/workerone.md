Agent: workerone · Lane: RFC-349 F4c mine (#403) — APPROVED, not started · Updated: 2026-10-17

Older versions: `git log -p -- .claude/handovers/workerone.md` (F4b history there).

## Goal

#403: move mine into two feature folders (F2/F4a/F4b pattern): sim half → `packages/shared/src/features/mine/`,
client half → `apps/client/app/features/mine/`. Owner approved M1–M8 as recommended (2026-10-17). Keep the
`stepCombat` order bit-equal: mines step after every `run.strike`, and the mine target list is built after strike.

## Done

- Plan sent to slur-supervisor; owner approved M1–M8 (2026-10-17).
- Comment on #403: "Owner approved M1–M8 as recommended (2026-10-17)."
- No code edits yet.

## Approved decisions (M1–M8, as sent)

M1. Import-cycle fix. `combat/mine.ts` imports `floorUnder` from `sim/step.ts`. `step.ts` imports
`features/sim-hooks`, which imports the registry. Moving mine into the registry as-is closes a TDZ cycle. → Move
`floorUnder` unchanged into a new leaf, `sim/floor-under.ts`. `step.ts` imports it from there. Bit-equal.

M2. Hook point (the order rule). Feature ids sort bolt < mine < seeker, so under `run.strike` mine would step
BETWEEN bolt and seeker. A mine could then pop a shield before a seeker hits, and broadcast order changes. That is
not bit-equal. `run.tick` is also wrong: it runs after portals and pickups. → Add a new fixed hook `run.settle`.
`stepCombat` calls it right after `strike( dt )` and before `stepPortals`, in id order, exactly where `stepMines` runs
today. Mine builds `targetShipsOf( state.players.entries() )` inside the hook. Not chosen: before/after topo sort for
run hooks (RFC O1), and renaming the id to sort later (a hack). Plumbing: `RunHooks.settle?`, `OpenRun.settle?`,
`bindRun`, `RunFeatures.settle`, and `stepCombat` takes a second callback (or a `{ strike, settle }` object). Then
`run-sim.ts` passes `( step ) => this.features.settle( this.featureCtx, step )`.

M3. Bolt hits mines. `features/bolt/bolt.ts` imports `mineShotFront` and `mineEvent` from `combat/mine-hit.ts`.
`bolt-run.ts` passes `state.mines` + `ctx.resolveMine`. → Keep `combat/mine-hit.ts` as a neutral leaf, like
target-lock in S1: `MineState`, `MineEvent`, `MineOutcome`, `mineEvent`, `mineShotFront`. Bolt stays unchanged.

M4. Schema. The `Mine` class (`schema.ts:18`) moves to `features/mine/mine-schema.ts`. `RunState.mines`
(`schema.ts:101`) stays where it is, so the wire is unchanged. `run-sim.ts` `clearCombat` keeps
`state.mines.clear()`, because `run.reset( run )` has no ctx.

M5. Run code and resolver. `layMine` (`run/combat.ts`), `stepMines`, `evictOldest`, `aimMine`, `mineFizzle`,
`mineDropZ` and `mineTriggers` (`combat/mine.ts`) move to `features/mine/`. `resolveMineEvent` moves too and uses
`ctx.shieldAbsorbs`. `run/combat.ts` stops naming mine. `RunContext.resolveMine` stays as the engine service bolt
uses; `run-sim.ts` wires it from the mine contract. `MINE_*` constants (`combat/constants.ts:38-51`) and
`MINE_BURST_MESSAGE` move to `features/mine/mine-constants.ts`. `sim-config.ts` imports them (D2).
`HeldPower.mine` stays (D3). `index.ts` swaps `export * from './combat/mine.js'` for the mine contract exports, plus
the mine-hit leaf.

M6. Fire and bag, bit-equal.
- Mine fires through `run.use`. `use` calls `ctx.nextId()` FIRST and every time, fizzle included. Today `fire()`
  evaluates `String( this.nextProjectileId++ )` before `firePower`, so the id counter stays the same.
- `use` always returns true, so a fizzle still spends the charge, as today.
- The spend now happens after the lay, not before. The lay reads only x/y/z/vz/shipId, never the slots. Prove this by
  the A/B hash.
- Power: `power: { kind: HeldPower.mine, bagWeight: ( cfg ) => cfg.mineRatio }`. Remove `[ HeldPower.mine,
  cfg.mineRatio ]` from the core list in `combat/power-bag.ts` (`bagCounts`, ~line 38) and `cfg.mineRatio` from the
  `powerBag` cache key. The deal is unchanged by S2's kind-order sort; only the cache-key string reorders.
- `messages: [ MINE_BURST_MESSAGE ]`.

M7. Client: mine-only pieces move to `apps/client/app/features/mine/`:
- `game/scene/mine-look.ts` (+test), `mine-body-material.ts`, `mine-throw.ts` (+test), `mine-shots.ts`,
  `mine-field.tsx` (into a `mine-field/` folder), `mine-bodies/`, `mine-pickups/`.
- The mine glyph: from `CORE_GLYPHS[ HeldPower.mine ]` in `game/scene/power-arc/glyph-atlas.ts` to `mine-glyph.ts`.
- `NetMine` (`game/ecs/traits.ts:51`) moves to `mine.traits.ts`.
- `burstMine` (from `game/scene/mine-shock-events.ts`) becomes mine's `net` handler for `MINE_BURST_MESSAGE`. Take it
  out of the bridge's `room.onMessage`. `bind-room-audio`'s own listener stays.
- `mine.client.ts`: `views.scene` = MineField, `views.pickups` = MinePickups (filters its own anchors by
  `pickupPower( a.id ) === HeldPower.mine`, as seeker-pickups does), `hud.glyph`, `net`. Add it to
  `features/client-features.ts`.
- `splitPickupLayout` (`game/scene/pickup-layout/pickup-layout.utils.ts`) drops the `mines` bucket.
  `pickup-field.tsx` drops `<MinePickups>`. `net-canvas.tsx` drops `<MineField />`.
- The shock queue (`mine-shock-events.ts`: `pushMineShock`, `drainMineShocks`, `burstPortalHop`) and the
  `<MineShock/>` view STAY central: portal hop, portal fizzle and `local-hop.ts` push to them. Rename later, at the
  portal stage.

M8. Client parts that stay central, as D7:
- The bridge (`net/attach-room-to-world.ts`) keeps the `mines` onAdd/onRemove listener (S7 removes it later). It
  imports `launchMine` + `NetMine` from the mine folder.
- `game/scene/projectile-field/projectile-field.tsx` keeps calling `collectMineShots` (the mine throw draws through
  the shared bolt streak; a separate instance would add a draw call).
- Audio (`audio/bind-room-audio.ts`, `audio/sfx-map.ts`) and the test-level grant stay (D7/D3).

## Claim list (supervisor: clear, all held by workerone)

- Shared new: `packages/shared/src/features/mine/{mine.feature.ts, mine-run.ts, mine.ts, mine-schema.ts,
  mine-constants.ts, mine.test.ts, mine-drop.test.ts}`, `packages/shared/src/sim/floor-under.ts`.
- Shared edit: `features/{registry.ts, registry.test.ts, define-sim-feature.ts, run-features.ts}`,
  `run/{combat.ts, run-sim.ts}`, `schema.ts`, `sim-config.ts`, `sim/step.ts`,
  `combat/{constants.ts, power-bag.ts, power-bag.test.ts, combat-step.test.ts, seeker-pickups.test.ts}`, `index.ts`.
- Shared delete (moved): `combat/{mine.ts, mine.test.ts, mine-drop.test.ts}`.
- Server: `apps/server/src/rooms/{mine-sync.test.ts, room-mine-fizzle.test.ts}`, only if an import breaks.
- Client new: `apps/client/app/features/mine/**`.
- Client edit: `features/client-features.ts`, `game/ecs/traits.ts`, `net/attach-room-to-world.ts`,
  `game/net-canvas.tsx`, `game/scene/{pickup-field.tsx, pickup-layout/*, pickup-instances/pickup-instances.test.ts,
  power-arc/glyph-atlas.ts, power-arc/power-arc.utils.test.ts, projectile-field/projectile-field.tsx,
  mine-shock-events.ts}`.
- Client delete (moved): `game/scene/{mine-look*, mine-body-material.ts, mine-throw*, mine-shots.ts,
  mine-field.tsx, mine-bodies/, mine-pickups/}`.
- Docs: `docs/RFC-349-ARCHITECTURE.md` (§3.8 "F4c result" + §7 row), `conventions/features.md` (`run.settle` slot
  rule + table row), this handover.

## State (measured this session)

- Central files naming mine (`rg -l -i mine packages/shared/src apps/server/src apps/client/app`, minus
  `remote-engine-audio` and `your-finish`, which use "mine" as a plain word): 36 non-test (shared 12, client 24),
  54 with tests. After: about 21 [unmeasured estimate].
- `rg -i mine apps/client/app/dev` is empty: there are no mine dials in the tuning panel.
- Conventions cards loaded; no doc yet for @colyseus/schema, r3f, koota, three, vitest (known gap).

## Uncommitted

- none.

## Held files

- Everything in the claim list (not yet touched).

## Next

1. **Baseline first, before any edit.** `cd packages/shared && tsc -b --force` (a HEAD dist), then
   `cp -R packages/shared/dist <scratch>/head-dist` and symlink `<scratch>/node_modules` →
   `packages/shared/node_modules` so `@colyseus/schema` resolves.
2. Write the A/B bench `<scratch>/f4c-ab.mjs <distDir>`, modelled on `packages/shared/src/run/run-sim.test.ts`:
   - Setup: `new RunSim( procgenDescriptor( seed ), { broadcast, onMeta } )`, 4 joins, `start( hostId )`.
   - Bots: throttle on, seeded strafe and jump. Every N ticks set `p.slots[ 0 ]` to a seeded pick of
     bolt / seeker / mine / shield and call `sim.usePower( id, { slot: 0, dir } )`.
   - Run 6 seeds × 3600 ticks.
   - Hash per tick: the mines map (sorted ids, all fields), seekers, projectiles, ship sim fields, the broadcast log
     in order, and `sim.nextProjectileId`.
   - The mix must cover: a bolt clearing a mine in the same tick; a seeker + mine on the same shielded ship in one
     tick; eviction at `mineMaxPerOwner`; a fizzle (no floor, and inside a block); expiry.
   - Print the outcome counts.
   - Also: 800 power bags (`powerBag( salt, i, cfg )` over 5 configs) to equal HEAD.
3. Sim half (M1–M6). Run the bench against the new dist: every hash must equal HEAD. Run
   `pnpm typecheck && pnpm test && pnpm lint`, and check that each shared dist module imports alone (TDZ sweep; skip
   orphan files). Commit by pathspec, push.
4. Client half (M7–M8). Green gates, then commit and push.
   - /test-level draws: headless, DPR 1, `?quality=high`; F4b read 76.
   - Two SDK clients on :2567 (the owner's stack): decode mines `x,y,z,ownerId,armed,ttl`, `mineBurst` seen by
     both, and the victim's stun read by both.
   - Kill any Chrome you start.
5. RFC §3.8 "F4c result" + §7 row, `conventions/features.md` `run.settle` rule. Close #403 with SHAs + numbers.
   Update this handover, message slur-supervisor.

## Open questions

- none. If a decision has to change mid-build, stop and tell the supervisor first.

## Lessons → memory

- `run-hooks-run-in-feature-id-order.md`: a new feature's `run.strike` lands by id sort and can reorder the tick.
