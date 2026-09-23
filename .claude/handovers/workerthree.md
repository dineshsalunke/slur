Agent: workerthree · Lane: homing seeker (#219) · Updated: 2026-09-23

## Goal

Build the homing seeker: the second held power. It is marigold, locks one visible racer ahead, is hard to
shake, and the owner allows two dodges: a jump, or a strafe at the last moment. Rule: ADR-017 in
`docs/DECISIONS.md`.

## Done

- `d0b2e61` — ADR-017 draft. Issue #219 filed (the RFC).
- `5771ee3` — step 2, the shared sim: `combat/seeker.ts` (`lockTarget`, `lineOfSight`, `aimSeeker`,
  `stepSeeker(s)`, `seekerShipsOf`, `inTerminalWindow`), `pickupPower`, `seekerGate`, the `Seeker` schema
  + `RunState.seekers`, the `SimConfig` seeker fields, `HeldPower.seeker = 2`, and
  `stunDurationForShip(id, cfg, seconds)`. ADR-017 holds the owner's answers: a no-lock fire is WASTED; a
  block in the dive destroys the seeker (and a fractured block with it); only `/test-level` is tunable.
- `dfae252` — step 3, the server: a held seeker locks and launches into `state.seekers`; `stepWorld` steps
  seekers; hit → seeker stun × (1 − armour) + `'hit'` + `SEEKER_HIT_MESSAGE`; miss →
  `SEEKER_MISS_MESSAGE`; blocked → `'hit'` with `victimId ''`; `seekerGate` into `stepPickups`; reset
  clears seekers. Two tests.
- `e656f18` — split: `rooms/room-combat.ts` holds `firePower` + `resolveSeekerEvent`. Same behaviour.
- `8828f7a` — `game/scene/pickup-instances.tsx`: the shared pickup loop. `BoltPickups` supplies only its
  body parts. A collected pickup is parked after its zero-scale write and costs nothing until it
  respawns (the supervisor's perf condition).
- `cc3debe` — step 4: `seeker-look.ts` (8-facet lathe canister 1.2u × 2.6u, nose +z, two accent seam
  bands, recessed `BOLT_HOT` rear core), `seeker-pickups.tsx` (`SeekerPickups`, `splitPickupLayout`), and
  both pickup fields split by `pickupPower`. Two tests.

## State

- Tests: shared 189, server 9, client 200 pass. `pnpm typecheck` is clean. Biome has no finding in my
  files; the 7 warnings left belong to other files.
- The canister has NOT been seen rendered `[unmeasured]`. On `/test-level` (seed 20260921) the first
  seeker pickups are at z 790 (x −9.6) and z 850 (x 8.0). A timed W-hold fly-by did not frame one. Check it
  in step 7 with a fixed view.
- The client does not register `SEEKER_HIT_MESSAGE`/`SEEKER_MISS_MESSAGE` handlers yet. The SDK may warn
  on each broadcast `[unmeasured]`.
- `/test-level` still uses `OPEN_SEEKER_GATE` and does not step seekers.
- Defaults: speed 120, ramp 0.3s, track-turn 240, turn 40, window 0.35s / 30u, cruise y 10, strike y 0.5,
  climb 60, dive 40u, hit band 1.2, half 1, TTL 6s, stun 2.0s, lock range 600, ratio 0.25, scope `'room'`.
- The owner wants it HARDER TO SHAKE. Every value must be in the dev panel (`dev/tuning-schema.ts`).

## Uncommitted

None. `docs/art-direction/ingredients/ingredients.png` and `docs/art-direction/monoliths/` are untracked
and not mine.

## Held files

Approved by the supervisor:

- shared: `combat/{seeker,constants,pickups,combat-step}.ts` + tests, `schema.ts`, `sim-config.ts`,
  `ship-classes.ts`, `index.ts`
- server: `rooms/run-room.ts`, `rooms/run-room.test.ts`, `rooms/room-combat.ts`
- client: `game/scene/{pickup-field,projectile-field,bolt-pickups,pickup-instances}.tsx`,
  `game/scene/seeker-*`, `game/overlays/{threat-hud,held-power-chip}.tsx` + tests, `audio/sfx-map.ts`,
  `routes/test-level/{local-combat.ts,local-pickup-field.tsx,local-power-slot.tsx}` + new test-level
  files, `dev/tuning-schema.ts`
- **Not yet claimed — claim before step 5:** `net/attach-room-to-world.ts`, `game/ecs/traits.ts`.
- Not mine: `hit-spark.tsx` (ask first), `dev/*` except `tuning-schema.ts`, `routes/home/*`,
  `ui/button.tsx`, `ui/panel.tsx`, `lobby/room-list.tsx`, and all of `docs/art-direction/`.

## Next

1. **Step 5, in flight.** Claim `net/attach-room-to-world.ts` + `game/ecs/traits.ts` first. Client
   interpolation for `RunState.seekers` (a new ECS trait shaped like `ProjInterp`). `SeekerBodies`: the
   canister (reuse `seeker-look.ts`) yawed to its heading, 3 draws. A curved trail from a 12-point ring per
   seeker (1 draw), and embers (1 draw). MAX 16.
2. **Step 6, HUD + audio.** `ThreatHud` LOCKED state when a seeker's `targetId` is me, with a
   seeker-speed window. Chip label SEEKER. Register the seeker message handlers. Read `docs/AUDIO.md` +
   `audio/sfx-map.ts` first. Sounds: pickup, launch, lock pulse, an in-flight loop that grows as it
   closes, impact, dodge whoosh.
3. **Step 7, `/test-level`.** `local-combat.ts` runs `stepSeekers` against a stationary target dummy and
   uses a real `seekerGate`. The `Seeker.*` tunables go in `tuning-schema.ts`; the modes are 0/1 numbers
   mapped to strings. Headless Chrome (DPR 1, muted, killed after use): pickup canister, launch,
   mid-curve, impact, rear view.
4. **Step 8.** A two-player hosted room. Then the ART_SCALE_REFERENCE §7 seeker rows and the GDD §5 row.

## Open questions

- A bigger impact burst needs `hit-spark.tsx`. Ask the supervisor first; use the existing burst for now.
- The board draws the trail red-orange. The owner's marigold rule overrides it. A Claude-side departure
  note for Codex may be needed (`ART_MATERIALS.md` §7 shape); ask the supervisor whether the owner wants
  one.

## Lessons → memory

None.
