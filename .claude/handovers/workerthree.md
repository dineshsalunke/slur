Agent: workerthree · Lane: homing seeker (#219) · Updated: 2026-09-23

## Goal

Build the homing seeker: the second held power. It is marigold, locks one visible racer ahead, is hard to
shake, and the owner allows two dodges: a jump, or a strafe at the last moment. Rule: ADR-017 in
`docs/DECISIONS.md`.

## Done

- `d0b2e61` — ADR-017 draft. Issue #219 filed (the RFC).
- `5771ee3` — step 2, the shared sim:
  - `combat/seeker.ts`: `lockTarget` + `lineOfSight`, `aimSeeker`, `stepSeeker`/`stepSeekers`,
    `seekerShipsOf`, `inTerminalWindow`.
  - `pickups.ts`: `pickupPower` (id hash → bolt or seeker).
  - `combat-step.ts`: `seekerGate` + `stepPickups(..., gate)`.
  - `Seeker` schema + `RunState.seekers`, the `SimConfig` seeker fields, `HeldPower.seeker = 2`, and
    `stunDurationForShip(id, cfg, seconds)`.
  - ADR-017 now holds the owner's answers: a no-lock fire is WASTED; a block in the dive destroys the
    seeker (and a fractured block with it); only `/test-level` is tunable, and hosted rooms stay on
    `DEFAULT_SIM_CONFIG`.

## State

- Shared: 189 tests pass. `pnpm typecheck` is clean for all three packages. Biome is clean apart from
  two old line-limit warnings in `sim/step.test.ts` and `sim/track.test.ts`.
- The server and the client do not use the seeker yet. `stepPickups` defaults to `OPEN_SEEKER_GATE`, so
  a seeker pickup already grants `HeldPower.seeker` on the server and on `/test-level`. **Firing it
  today does nothing**: `run-room.ts` fires `aimBolt` on any held power, so a held seeker fires a bolt
  (`canFire` is true). Step 3 fixes this.
- The outcomes are `hit`, `miss`, `blocked` (reported through `onEvent`), and `lost`/`expired` (removed
  silently). `SEEKER_HIT_MESSAGE` and `SEEKER_MISS_MESSAGE` are exported and not used yet.
- Defaults: speed 120, ramp 0.3s, track-turn 240, turn 40, window time 0.35s / distance 30u, cruise y 10,
  strike y 0.5, climb 60, dive 40u, hit band 1.2, half 1, TTL 6s, stun 2.0s, lock range 600,
  ratio 0.25, scope `'room'`.
- The owner wants it HARDER TO SHAKE. Every value must be in the dev panel (`dev/tuning-schema.ts`, which
  the supervisor approved for this lane).

## Uncommitted

None. `docs/art-direction/ingredients/ingredients.png` is the owner's untracked board. It is not mine.

## Held files

Approved by the supervisor, all free when approved:

- shared: `combat/{seeker,constants,pickups,combat-step}.ts` + tests, `schema.ts`, `sim-config.ts`,
  `ship-classes.ts`, `index.ts`
- server: `rooms/run-room.ts`, `rooms/run-room.test.ts`
- client: `game/scene/{pickup-field,projectile-field}.tsx`, new `game/scene/seeker-*`,
  `game/overlays/{threat-hud,held-power-chip}.tsx` + tests, `audio/sfx-map.ts`,
  `routes/test-level/{local-combat.ts,local-pickup-field.tsx,local-power-slot.tsx}` + new test-level
  files, `dev/tuning-schema.ts`, `net/attach-room-to-world.ts` + `game/ecs/traits.ts` (seeker
  interpolation; **not yet claimed — claim before step 5**)
- Not mine: `hit-spark.tsx` (ask first), `dev/*` except `tuning-schema.ts`, `routes/home/*`,
  `ui/button.tsx`, `ui/panel.tsx`, `lobby/room-list.tsx`, and all of `docs/art-direction/`.

## Next

1. **Step 3, server** (`run-room.ts` + test):
   - In `USE_POWERUP_MESSAGE`, branch on `p.heldPower`. For a seeker:
     `lockTarget(p, sessionId, seekerShipsOf(players.entries()), track, blocks.broken, config)`, then
     `aimSeeker` into `new Seeker()`, then `state.seekers.set(id, s)`.
   - In `stepWorld`, call `stepSeekers(state.seekers, ships, track, blocks.broken, dt, onEvent, config)`.
     On `hit`, stun with `stunDurationForShip(v.shipId, config, config.seekerStunS)` and broadcast
     `'hit'` (spark) + `SEEKER_HIT_MESSAGE`. On `miss`, broadcast `SEEKER_MISS_MESSAGE`. On `blocked`,
     broadcast `'hit'` with `victimId ''`, then call `mirrorBreaks()`.
   - Pass `seekerGate(state.players.entries(), ownersOf(state.seekers), config)` to `stepPickups`.
     Clear `state.seekers` on reset.
   - Tests: firing a held seeker sets `targetId`; a hit applies the seeker stun.
2. **Step 4, client pickup.** Split the pickup layout by `pickupPower(id)`: `BoltPickups` gets the bolts,
   and a new `SeekerPickups` (canister, M6 shell, `accent()` seam glyph, `BOLT_HOT` rear core) reuses
   `pickupPose`, the pool material and the hover/bob. 4 draws.
3. **Step 5, in flight.** Client interpolation for `RunState.seekers` (new ECS trait, the same shape as
   `ProjInterp`). `SeekerBodies`: canister yawed to its heading, 3 draws. Curved trail from a
   12-point ring per seeker (1 draw), and embers (1 draw). MAX 16.
4. **Step 6, HUD + audio.** `ThreatHud` LOCKED state when a seeker's `targetId` is me, with a
   seeker-speed window. Chip label SEEKER. Read `docs/AUDIO.md` + `audio/sfx-map.ts` first. Sounds:
   pickup, launch, lock pulse, an in-flight loop that grows as it closes, impact, dodge whoosh.
5. **Step 7, `/test-level`.** `local-combat.ts` runs `stepSeekers` against a stationary target dummy.
   The `Seeker.*` tunables go in `tuning-schema.ts`; the modes are 0/1 numbers mapped to strings. Check
   in headless Chrome (DPR 1, muted, killed after use): launch, mid-curve, impact, rear view.
6. **Step 8.** A two-player hosted room. Then the ART_SCALE_REFERENCE §7 seeker rows and the GDD §5 row.

## Open questions

- A bigger impact burst needs `hit-spark.tsx`. Ask the supervisor first; use the existing burst for now.
- The board draws the trail red-orange. The owner's marigold rule overrides it. A Claude-side departure
  note for Codex may be needed (`ART_MATERIALS.md` §7 shape); ask the supervisor whether the owner wants
  one.
