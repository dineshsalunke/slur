Agent: workerone · Lane: ECS state, RFC-349 S4 (#407) → S5 (#408) → S7 (#409) → S9 (#410) · Updated: 2026-10-20

## Goal

S4: Dead, Stunned, Shielded, Spectating tags; ECS readers switch to them. Plan approved by slur-supervisor
2026-10-20 (posted on #407). Then S5, S7, S9 in order, each plan-first.

## Done

- c1 `af6f6037`: tags Dead/Stunned/Spectating in `game/ecs/traits.ts`; `game/ecs/status-tags.ts`
  (mirrorStatus, mirrorShipStatus, mirrorSpectating, mirrorLocalStatus, isLocalSpectating). Local tags
  sync after simulate() (netFlightSystem, deckFlightSystem), after predictor.reconcile, after copyShip at
  onAdd. Remote tags set in pushRemote.
- c2 `8241fd08`: Spectating replaces `localRole.spectating` (deleted) in net-loop.utils, net-systems,
  deck-ship.
- c3 `f2766d96`: Dead/Stunned readers: ship-dead.ts deleted (ship-model, ship-shadow, explosion-field
  use `has( Dead )`), exhaust-drive, boost-surplus, boost-streaks, power-arc.state,
  remote-engine-audio, both stun blinks. Snapshot lost dead/stunned.

## State

- All pushed. At c3: client 736/736, shared 623/623, server 101/101, client typecheck and biome clean.
- localRole staleness delta: schema `onAdd` defaults `immediate = true`
  (`@colyseus/schema` 4.0.30 `build/index.mjs:5252`), so the local ship spawns synchronously inside
  attachRoomToWorld. The only window is NetCanvas mount → attach effect (≤ 1 frame, no local entity).
  [unmeasured in a live rejoin]
- Dev stack: not started by me.

## Uncommitted

- c4 Shielded, written but NOT verified (session killed 2026-10-20 by the owner before suites ran):
  `shield.traits.ts` (Shield = `{ since, popAt }`, new `Shielded` tag), `shield-mirror.ts` (mirrorShield
  adds/removes Shielded, popShield removes it), `shield-dome.tsx` (reads `entity.has( Shielded )`). Check
  nothing else reads `Shield.on` (`rg "\.on\b" features/shield`), then run all 3 suites and commit.
- Old session id (for `claude --resume`): 829fea21-d655-4c68-a3d0-306587156147.

## Held files

All files in the approved S4 claim. Still to touch: `features/shield/shield.traits.ts`,
`shield-mirror.ts`, `shield-dome/shield-dome.tsx`. The game/scene ship files (ship-model, ship-shadow,
explosion-field, exhaust-drive, power-arc) are released to workerthree once S4 closes.

## Next

1. c4 Shielded: tag in `features/shield/shield.traits.ts`; Shield trait keeps `since`/`popAt`, drops `on`;
   mirrorShield adds/removes; popShield removes; ShieldDome reads `entity.has( Shielded )`. All 3 suites,
   commit, push.
2. Reader-parity harness in scratch (vitest, not committed): HEAD copies of the readers (git show) vs new,
   local predicted + remote snapshot feeds through death/stun/respawn/spectate, 6 seeds × 3600 ticks,
   expect 0 diffs; negative control = tag synced one tick late, must diverge.
3. Ask supervisor before `pnpm dev`; /test-level draw count (expect 74) + death/stun visual check over CDP
   (headless rules in CLAUDE.local.md §7). Kill Chrome after.
4. Close #407 with SHAs, listing the deferred room.state readers: flight-recorder, bind-room-audio,
   threat-hud, seeker-warning, finish-watch, idle-warning, roster, spectator-bar, run-view-store,
   standings-store. Carry them into #408. Tell supervisor S4 landed (releases the game/scene ship files).
5. S5 (#408): read the issue, map, send plan.

## Open questions

None.

## Lessons → memory

`.claude/memory/shared-tree-footguns.md`: concurrent shared test runs collide on `test-dist`.
