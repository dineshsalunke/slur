Agent: workerthree · Lane: Shield pickup #270 · Updated: 2026-09-26

## Goal

Shield power: a 5 s window that absorbs one bolt, mine or seeker hit. It does not absorb block crashes. Every
player sees a hex-lattice dome, and the dome pops when it absorbs a hit. The server is authoritative.

## Done

- c9e78a3 (local commit, NOT pushed): new files only, not wired in yet.
  - `packages/shared/src/combat/shield.ts`: `ShieldHolder {shielded, shieldTimer}`, `raiseShield(s, seconds)`,
    `dropShield`, `stepShield(s, dt)`, and `absorbHit(s)`, which returns true and drops the shield. It is not
    yet exported from index.ts.
  - `shield.test.ts`: 5 tests pass.
  - `apps/client/app/game/ecs/traits.ts`: new AoS `Shield` trait `{ on, since, popAt }`. `since` and `popAt`
    are `performance.now()/1000` seconds, and `popAt = -1` means no pop.
  - `scene/shield-look.ts`: ring pickup geometry (shell torus, glyph rim + hoop, core sphere), dome
    geometry (a sphere cap, theta 0.56π), hex + fresnel ShaderMaterial source with the tonemapping include,
    `shieldAlpha(on, heldS, windowS, popAgeS)` (flicker in the last 1 s, pop fade 0.28 s), and `shieldGrow`.
  - `scene/shield-dome.tsx`: `ShieldDome({entity, shipId, windowS})`. It is always mounted, and its useFrame
    reads the `Shield` trait. It is sized as halfW/halfL + 0.9 by 1.7 tall and sits 0.35 low.
  - `scene/shield-pickups.tsx`: `ShieldPickups`, built on PickupInstances.
- Gates on these files: client tsc clean, biome clean, comment ratchet clean.

## State

- workerone's ce01c2d is on dev: `HeldPower.shield = 5`, `SHIELD_RATIO = 0` → `SimConfig.shieldRatio`.
- Supervisor APPROVED the plan: a synced `@type('boolean') shielded` in schema, appended AFTER boostTimer,
  never @deprecated, plus a plain unsynced `shieldTimer`.
- The dome look has not been seen in a browser [unmeasured].

## Uncommitted

- none. c9e78a3 is committed locally and needs `git push origin HEAD:dev` (check `git status` first).

## Held files

- Cleared, and mine: the new files above, `apps/server/src/rooms/run-room.ts`, `game/ecs/traits.ts`,
  `net/attach-room-to-world.ts`, and new `apps/server/src/rooms/room-shield.test.ts`.
- WAIT for workerone's commit 2 (Boost) and the supervisor's clear: constants.ts, sim-config.ts, schema.ts,
  room-combat.ts, local-combat.ts, power-gem.tsx, power-cell.tsx, seeker-pickups.tsx, pickup-field.tsx,
  ship-view.tsx, sfx-map.ts, bind-room-audio.ts, shared index.ts.

## Next

1. Push c9e78a3.
2. attach-room-to-world.ts (cleared now): add `Shield` to both spawns in spawnPlayer. Add
   `$(p).listen('shielded', …)` → on=true sets since=now and popAt=-1; on=false sets on=false. Put its off
   in perPlayer for remote players too. Add `room.onMessage(SHIELD_POP_MESSAGE, …)` → the victim's Shield
   gets on=false and popAt=now, plus `pushHit` for sparks. This needs the constant, so it waits for the
   constants.ts clear.
3. After commit 2 and the clear:
   - constants.ts: `SHIELD_S = 5`, `SHIELD_POP_MESSAGE = 'shieldPop'`.
   - sim-config.ts: `shieldS`.
   - schema.ts: `shielded` + `shieldTimer`.
   - index.ts: export shield.js.
   - room-combat.ts: in firePower, the `HeldPower.shield` branch calls `raiseShield(p, config.shieldS)`. In
     resolveMineEvent (trigger) and resolveSeekerEvent (hit), call `absorbHit(v)` first. If it absorbs,
     broadcast SHIELD_POP {x,y,z,victimId} with no stun and no speed cut. The seeker path then returns
     without the 'hit' or seekerHit message.
   - run-room.ts: the bolt onStrike gets the same absorb check. stepWorld runs `stepShield` for each
     player. clearCombat drops every shield. Check resetPlayerForRace.
   - ship-view.tsx: mount `<ShieldDome entity shipId windowS={DEFAULT_SIM_CONFIG.shieldS}/>` inside the
     primitive group.
   - seeker-pickups.tsx: splitPickupLayout gets `shields`. pickup-field.tsx gets `<ShieldPickups>`.
   - power-gem.tsx: ring icon. power-cell.tsx: 'Shield' label.
   - sfx-map.ts: 'shieldPop' reuses hit_ship.ogg at rate ~1.5. bind-room-audio.ts plays it on the pop.
   - local-combat.ts: the shield branch.
   - Set the shield bag share (SHIELD_RATIO > 0, e.g. 0.15) and fix the power-bag test counts.
4. room-shield.test.ts: bolt, mine and seeker are each absorbed once with no stun. The window expires. A
   second hit stuns. A block crash is not absorbed.
5. Gates: `pnpm typecheck`, `pnpm lint`, `pnpm test`. Push, then `gh issue close 270 -c "<SHA>"`, then report
   to slur-supervisor. The PR/commit body carries the mechanism weighing: a per-ship always-mounted dome
   with useFrame vs. instanced domes vs. a conditional mount vs. a module map vs. a float synced timer.

## Open questions

- Owner: the shield bag share (starting value)? A bespoke pop sound asset, or reuse hit_ship.ogg?

## Lessons → memory

- none
