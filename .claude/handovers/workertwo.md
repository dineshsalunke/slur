Agent: workertwo · Lane: mine pickup + forward/back fire (#261, child of #20) · Updated: 2026-09-25

Older versions hold the plan, #259 and #257 (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

Build the Mine (pickup, dropped mine, trigger, bolt-clear, HUD). SCOPE CHANGE from the owner: every power
(bolt, seeker, mine) fires FORWARD (E) or BACK (a new key). Refs: `ingredients.png` panels 4 and 9,
`cruise-lighting.png` HUD. `docs/art-direction/` is read-only.

## Done

- Plan approved by the owner. Issue #261 filed.
- Owner answers: stun 1.5 s + `vz × mineSpeedCut` 0.6; a bolt clears a mine (armed or arming, the owner's own too, nearest hit wins); the same look for every player's mines; numbers: ratio 0.20, arm 0.5 s, trigger +3u, jump clears at 2u, ttl 20 s, 3 per owner.
- The supervisor cleared the full claim list, and gave me the ART_SCALE_REFERENCE 64u → 96u width fix (width numbers only).
- The mine core is written but NOT committed (see Uncommitted).

## State

- Shared: `combat/mine.ts` holds `aimMine` (floor under the drop point via the now-exported `floorUnder`, fizzles over a gap), `evictOldest` (the smallest ttl goes), `stepMines` (arming, trigger box, expiry; one victim, the lowest id), and `mineBoltFront`. `resolveBolt` picks the nearest of ship / mine / block and returns `mine`. `stepBolts(…, cfg, mines = new Map(), onMine)` takes new optional trailing args. Mine constants + 11 SimConfig fields. `HeldPower.mine = 3`. `pickupPower` is 3-way: [0, seekerRatio) seeker, then mineRatio of mine, then bolt.
- Schema: `Mine` {x, y, z, ownerId, armed} + a plain `ttl` (not synced). `RunState.mines` appended after `seekers`.
- Server: `room-combat.ts` `firePower` routes mine → `layMine`. New `resolveMineEvent`: a trigger stuns (armour-scaled `mineStunS`), cuts vz and broadcasts 'hit'; every outcome broadcasts `MINE_BURST_MESSAGE` (trigger / cleared / evicted / expired). `FireContext.broadcast` is optional until run-room passes it.
- Measured: shared `pnpm test` 347/347 (15 new mine tests). Shared and server `tsc -b` are green.
- `apps/server/src/rooms/mine-sync.test.ts` is written, typechecks, and has NOT been run. It needs the run-room wiring and will fail without it.
- Client: nothing written yet.

## Uncommitted

Held back on purpose. With no run-room wiring, a pushed build would lay inert mines that never arm, never clear on restart, and fail mine-sync.test.
- packages/shared/src/combat/{mine.ts, mine.test.ts, constants.ts, pickups.ts, projectiles.ts, combat-step.ts, combat-step.test.ts, seeker-pickups.test.ts}
- packages/shared/src/{schema.ts, sim-config.ts, index.ts, sim/step.ts}
- apps/server/src/rooms/{room-combat.ts, mine-sync.test.ts}

## Held files

Everything above, plus the approved client/docs list: net/attach-room-to-world.ts · game/ecs/traits.ts · game/net-canvas.tsx · game/scene/{mine-look.ts, mine-look.test.ts, mine-pickups.tsx, mine-bodies.tsx, mine-field.tsx, mine-decal-material.ts, mine-shock.tsx, mine-shock-events.ts, seeker-pickups.tsx, seeker-pickups.test.ts, pickup-field.tsx} · game/hud/{power-cell.tsx, power-gem.tsx} · routes/test-level/{local-combat.ts, local-pickup-field.tsx, local-mine-field.tsx, test-level-canvas.tsx} · docs GDD §5.3, ADD §5, ART_SCALE_REFERENCE §7 (+ width fix). run-room.ts is LATER, after workerfour commits.

## Next

1. SCOPE CHANGE addendum, due to the supervisor BEFORE any back-fire code:
   - The back key: read the input code (`game/input/`, grep for KeyE/KeyQ/KeyX) and pick one. R looks free [unverified]. Report the pick.
   - The message: `{ slot, dir }`, where a missing dir means forward.
   - Mine: BACK drops at the ship's position (floor under the ship). FORWARD drops `mineDropAhead` 8u ahead. This replaces the current `halfL + mineDropGap` behind rule, so `aimMine` gets a dir and the tests change.
   - Bolt BACK: −z from the tail. Needs a direction on ProjectileState and stepProjectiles/boltBlockHit/boltHits sweeping −z.
   - Seeker BACK: launches rearward and locks the nearest ship BEHIND, mirroring `lockTarget`. Pin the rule and tests.
   - The revised claim list (projectiles.ts, seeker.ts, input files, HUD hint in power-rack.tsx).
2. Continue the mine core client side: pickups (3-way split), deployed MineBodies + decal, burst shock, HUD label + gem glyph, test-level wiring.
3. When workerfour commits run-room.ts: in `stepWorld` add `stepMines(this.state.mines, seekerShipsOf(...), dt, e => resolveMineEvent(...), this.config)`; pass `this.state.mines` and an onMine → resolveMineEvent to `stepBolts`; add `broadcast` to the FireContext in the usePowerUp handler; `this.state.mines.clear()` in `clearCombat`. Then run mine-sync.test.
4. Gates (typecheck, test, lint), commit by explicit pathspec, push.

## Open questions

- The back key (pending my check, then the owner).
- `mineDropAhead` 8u, to confirm with the owner.

## Lessons → memory

none
