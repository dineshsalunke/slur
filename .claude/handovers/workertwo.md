Agent: workertwo · Lane: mine pickup + forward/back fire (#261, child of #20) · Updated: 2026-09-25 18:05

Older versions hold the plan, #259 and #257 (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

Build the Mine, and make every power (bolt, seeker, mine) fire FORWARD (E) or BACK (F). Refs: `ingredients.png`
panels 4 and 9. `docs/art-direction/` is read-only.

## Done

- The supervisor cleared the addendum and all claims. F = back and mineDropAhead 8u are working defaults; the supervisor relays them to the owner.
- The whole lane is WRITTEN and green, but NOT committed (see Uncommitted). No SHA yet.

## State

- Shared: new `combat/fire-dir.ts` (`FireDir`, `fireDir(raw)` → -1 only for -1, `sweptZ`, `entryZ`). `ProjectileState.dir` and `SeekerState.dir` are required. `aimBolt/aimSeeker/lockTarget/aimMine` take a trailing `dir = 1`. The bolt, mine and seeker sweeps mirror on dir. A back seeker launches at vz 0 and ramps to −top. It does NOT use the trail (the target has not flown there yet); when blocked it holds x. Mine: forward = `z + halfL + mineDropAhead` (8); back = the ship's own z. `mineDropGap` was renamed to `mineDropAhead`.
- Schema: `Projectile.dir` and `Seeker.dir` are `int8`, default 1, APPENDED as the last field of each class.
- Server: `firePower(..., dir)`. `FireContext.broadcast` is required. run-room.ts: the fire handler passes `fireDir(msg?.dir)` and a broadcast. `stepWorld` passes mines + onMine to `stepBolts`, and calls `stepMines` after the seekers. `clearCombat` clears the mines.
- Client: `handlePowerKey` E → fire(slot, 1), F → fire(slot, -1). Gamepad B (button 1) → KeyF. Touch "Back" button. HUD hint `E Fire · F Back · Q Cycle · X Drop`. `NetProjectile` trait now holds `{ dir }`; the bolt streak rotates π and sheds embers +z when dir < 0.
- Client mine: `mine-look.ts` (+test), `mine-pickups.tsx`, `mine-bodies.tsx` (instanced body, core, spokes+ring decal; pulse via instanceColor), `mine-field.tsx` (koota `NetMine`), `mine-shock.tsx` + `mine-shock-events.ts` (`burstMine`: ring on every burst, spark on 'cleared'), `local-mine-field.tsx`. Pickups split 3-way. HUD 'Mine' label; the gem shows the SELECTED slot's glyph. /test-level lays, clears and expires mines.
- `mine-decal-material.ts` was dropped (not needed). No docs edited yet.
- Measured: shared 358/358. Server 24/24 in three runs. Client `tsc` is clean. Client `vitest app/game` 308/308.
- NOT run: `pnpm lint` (biome, comment ratio). NOT looked at in a browser [unmeasured].

## Uncommitted

All of it. Shared: combat/{fire-dir.ts, mine.ts, mine.test.ts, constants.ts, pickups.ts, projectiles.ts, combat-step.ts, combat-step.test.ts, combat.test.ts, seeker.ts, seeker.test.ts, seeker-pickups.test.ts}, sim/fracture.test.ts (one literal gets `dir: 1`, report it), schema.ts, sim-config.ts, index.ts, sim/step.ts. Server: rooms/{room-combat.ts, run-room.ts, mine-sync.test.ts}. Client app/: game/input/{power-select.ts, power-select.test.ts, gamepad.ts, gamepad.test.ts}, game/hud/{touch-pad.tsx, power-rack.tsx, power-cell.tsx, power-gem.tsx}, game/ecs/traits.ts, game/net-canvas.tsx, net/attach-room-to-world.ts, game/scene/{projectile-field.tsx, bolt-streaks.tsx, seeker-pickups.tsx, seeker-pickups.test.ts, pickup-field.tsx, mine-look.ts, mine-look.test.ts, mine-pickups.tsx, mine-bodies.tsx, mine-field.tsx, mine-shock.tsx, mine-shock-events.ts}, routes/test-level/{local-combat.ts, local-bolt-field.tsx, local-pickup-field.tsx, local-mine-field.tsx, test-level-canvas.tsx}.

## Held files

Everything in Uncommitted, plus docs GDD §5.3, ADD §5, ART_SCALE_REFERENCE §7 (+ the 64u → 96u width fix). NOT mine: run-room.test.ts and sim/groove/** (workerfour).

## Next

1. `pnpm lint` from the root, and fix what it finds.
2. Look at /test-level in headless Chrome (DPR 1, muted, kill it after): the pickup star, a laid mine (spokes, ring, pulse after 0.5 s), the burst ring, a back bolt streak, and the HUD gem. Tune the look numbers in mine-look.ts if needed.
3. Docs: GDD §5.3 (mine rules + forward/back), ADD §5 (mine pulse built), ART_SCALE_REFERENCE §7 (mine sizes) + width fix.
4. Gates (typecheck, test, lint). Commit by explicit pathspec, push, and comment the scope change on #261.

## Open questions

- The owner must confirm F = back and mineDropAhead 8u (the supervisor is relaying them).
- For workerthree / audio: `audio/bind-room-audio.ts` `checkThreat` assumes bolts fly +z (`dz = self.z - proj.z`). A back bolt from a ship ahead gets no threat cue. It should use `proj.dir`. I did not edit it.

## Lessons → memory

none
