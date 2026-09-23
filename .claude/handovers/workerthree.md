Agent: workerthree · Lane: homing seeker (#219) → 3-slot plan (#223) · Updated: 2026-09-23 (after e2096cd)

## Goal

Build the homing seeker: the second held power (ADR-017, `docs/DECISIONS.md`). Next: three power slots
(#223), waiting for owner approval.

## Done

- Earlier: `d0b2e61` ADR-017 + #219 · `5771ee3` sim · `dfae252` server · `e656f18` room-combat split ·
  `8828f7a` pickup-instances · `cc3debe` canister · `7fcabd4` hosted render · `2ca4bc8` Held{power} ·
  `a2223ca` fly at 2.5u + breadcrumb path · `edea282` Seeker.flyY tunable · `ddc8285` tuning panel group ·
  `911e8ae` look rebuild (`seeker-look.ts`) · `eac9e96` ART_MATERIALS §7 item 14 · `8b51a00` trail fix.
- `e2096cd` — `docs/ART_MATERIALS.md` item 14 corrected: trail 0.5u = 1.7× `BOLT_HEAD_RADIUS`, starts at
  the body rear, width + brightness fall with fade². File released.
- Issue #223 filed: three power slots.

## State

- Render stills in `.claude/frame-tap-refs/` (gitignored): `seeker-flight-close.png`,
  `seeker-flight-side.png`, `seeker-pickup-face.png`, `seeker-pickup-side.png`. Owner has them.
- Known artifact: dark chevron seams where trail segments join.
- Tests: client 227 pass, `tsc` clean, `pnpm lint` 7 old warnings (at 8b51a00).
- Boost does NOT exist in code (`rg -i boost` in shared/server: none). GDD §5.3 lists it; issue #20.
- Pickup kind is ALREADY visible before the grab: `seeker-pickups.tsx:28` splits by `pickupPower(a.id)`.
  The one lie: a shut room gate turns a seeker canister into a bolt (`combat-step.ts:107`).
- `USE_POWERUP` is a discrete room message, not a sequence-numbered input (`net-canvas.tsx:46`).
- Free keys (checked): R = dev rear-view, P = dev freeze, M = mute. 1/2/3, Q, X are unbound.

## Uncommitted

None.

## Held files

- shared: `combat/{seeker,seeker-trail,constants,pickups,combat-step}.ts` + tests, `schema.ts`,
  `sim-config.ts`, `ship-classes.ts`, `index.ts`
- server: `rooms/run-room.ts`, `rooms/run-room.test.ts`, `rooms/room-combat.ts`
- client: `game/scene/{pickup-field,projectile-field,bolt-pickups,pickup-instances}.tsx`,
  `game/scene/seeker-*`, `game/overlays/{threat-hud,held-power-chip}.tsx` + tests, `audio/sfx-map.ts`,
  `routes/test-level/{local-pickup-field,local-power-slot,local-seeker-field}.tsx`,
  `routes/test-level/local-combat.test.ts`, `dev/tuning-schema.ts`, `net/attach-room-to-world.ts`,
  `game/ecs/traits.ts`
- RELEASED: `docs/ART_MATERIALS.md`, `dev/tuning-panel.tsx`, `game/net-canvas.tsx`,
  `routes/test-level/test-level-canvas.tsx`, `routes/test-level/local-combat.ts`.

## Next

1. Wait for the owner's answer on the 3-slot plan (sent to the supervisor; text in #223).
2. On approval: claim the extra files (`net-canvas.tsx`, `overlays.tsx`, `local-combat.ts`,
   `local-ship.tsx`, `bind-room-audio.ts`, `docs/GDD.md`; `docs/DECISIONS.md` only via the supervisor).
   Slices: shared → server → client → docs.
3. Seeker leftovers: step 6 audio + LOCKED HUD, step 7 target dummy, step 8 two-player room + doc rows.

## Open questions

- Owner: the 3-slot plan choices (see #223).
- Owner: the seeker look (four stills). Trail seams, trail length 24u.
- A bigger impact burst needs `hit-spark.tsx` (ask first).

## Lessons → memory

none
