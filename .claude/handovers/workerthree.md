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
- `8828f7a` — `game/scene/pickup-instances.tsx`: the shared pickup loop.
- `cc3debe` — step 4: `seeker-look.ts` canister, `seeker-pickups.tsx` (`SeekerPickups`,
  `splitPickupLayout`), both pickup fields split by `pickupPower`.
- `7fcabd4` — step 5: `attach-room-to-world.ts` mirrors `RunState.seekers` into ECS entities
  (`ProjInterp` + `NetSeeker{ownerId,targetId}` + `SeekerTrail`). `seeker-field.tsx` (`SeekerField`,
  mounted in `net-canvas.tsx`) samples with `sampleAt` (now exported from `projectile-field.tsx`) and feeds
  `seeker-bodies.tsx` (`SeekerBodies({collect})`, sink `(x,y,z,trail)`): the canister (3 instanced
  parts, `buildSeekerBody` exported from `seeker-pickups.tsx`) turned to the trail heading, a trail of
  instanced tube segments over a 12-point ring (`seeker-trail.ts`, spacing 2u), and embers (the bolt
  ember pool). 5 draws, MAX 16. Four ring tests.

## State

- Tests: client 204 pass. `pnpm typecheck` is clean. `pnpm lint`: 7 warnings, none in my files.
- Nothing seeker-side has been SEEN rendered `[unmeasured]` — neither the pickup canister nor the flying
  seeker. On `/test-level` (seed 20260921) the first seeker pickups are at z 790 (x −9.6) and z 850
  (x 8.0).
- The trail vanishes at once when the server removes a seeker; the impact reads only through the
  existing `'hit'` burst.
- The client does not register `SEEKER_HIT_MESSAGE`/`SEEKER_MISS_MESSAGE` handlers yet `[unmeasured]`
  whether the SDK warns.
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
  files, `dev/tuning-schema.ts`, `net/attach-room-to-world.ts`, `game/ecs/traits.ts`
- Released: `game/net-canvas.tsx` (one-line mount, done in `7fcabd4`; workertwo may need it).
- Not mine: `hit-spark.tsx` (ask first), `dev/*` except `tuning-schema.ts`, `routes/home/*`,
  `ui/button.tsx`, `ui/panel.tsx`, `lobby/room-list.tsx`, and all of `docs/art-direction/`.

## Next

1. **Step 6, HUD + audio.** `ThreatHud` LOCKED state when a `NetSeeker.targetId` is me, with a
   seeker-speed window. Chip label SEEKER. Register the seeker message handlers in
   `attach-room-to-world.ts`. Read `docs/AUDIO.md` + `audio/sfx-map.ts` first. Sounds: pickup, launch,
   lock pulse, an in-flight loop that grows as it closes, impact, dodge whoosh.
2. **Step 7, `/test-level`.** `local-combat.ts` runs `stepSeekers` against a stationary target dummy and
   uses a real `seekerGate`; render with `SeekerBodies` + a local `collect` owning its own
   `makeSeekerTrail()` rings. **The supervisor requires the pickup canister to be SEEN rendered before
   the lane closes.** The `Seeker.*` tunables go in `tuning-schema.ts`; the modes are 0/1 numbers
   mapped to strings. Headless Chrome (DPR 1, muted, killed after use): pickup canister, launch,
   mid-curve, impact, rear view.
3. **Step 8.** A two-player hosted room. Then the ART_SCALE_REFERENCE §7 seeker rows and the GDD §5 row.

## Open questions

- A bigger impact burst needs `hit-spark.tsx`. Ask the supervisor first; use the existing burst for now.
- The board draws the trail red-orange. The owner's marigold rule overrides it. A Claude-side departure
  note for Codex may be needed (`ART_MATERIALS.md` §7 shape); ask the supervisor whether the owner wants
  one.

## Lessons → memory

None.
