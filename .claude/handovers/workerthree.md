Agent: workerthree · Lane: homing seeker (#219) · Updated: 2026-09-23 (after 8b51a00)

## Goal

Build the homing seeker: the second held power. It is marigold, locks one visible racer ahead, is hard to
shake, and has two dodges (jump, or a late strafe). Rule: ADR-017 in `docs/DECISIONS.md`.

## Done

- Earlier: `d0b2e61` ADR-017 + #219 · `5771ee3` sim · `dfae252` server · `e656f18` room-combat split ·
  `8828f7a` pickup-instances · `cc3debe` canister · `7fcabd4` hosted render · `2ca4bc8` Held{power} ·
  `a2223ca` fly at 2.5u + breadcrumb path · `edea282` Seeker.flyY tunable.
- `ddc8285` — `Seeker` panel group in `dev/tuning-panel.tsx` (flyY slider). File released.
- `911e8ae` — look rebuild in `seeker-look.ts`: `SeekerForm` {half, halfLen, fins, faces}.
  `SEEKER_FLIGHT` = chamfered square 1.1u × 2.2u, hot core (`#FFE0A0`) on the NOSE, marigold rim + 2
  bands, dorsal + 2 side fins (top at 0.95u, inside `seekerHalf` 1u, tested). `SEEKER_PICKUP` =
  near-cube 1.5u × 1.4u, no fins, core on both end faces. `seeker-pickups.tsx` builds both.
- `eac9e96` — `docs/ART_MATERIALS.md` §7 item 14: the marigold departure, quoting board panels 8 + 9
  (`docs/art-direction/ingredients/ingredients.png`). File released.
- `8b51a00` — trail fix after the render check: the trail starts at the body's REAR (skips ring
  points still inside the body), width 0.5u, width and brightness fall with fade², brightness 1.8,
  hot-core mix `SEEKER_TRAIL_HEAT` 0.35 at the head.

## State

- Render check DONE on a private stack (client :5181, headless Chrome CDP :9341; both killed after).
  Stills in `.claude/frame-tap-refs/` (gitignored): `seeker-flight-close.png` (going-away body with
  fins + oncoming nose core), `seeker-flight-side.png` (side profile + taper), `seeker-pickup-face.png`,
  `seeker-pickup-side.png`.
- Before 8b51a00 (measured in stills): the 0.75u trail began at the body centre and hid the body and
  fins from behind; head was near-white. After: body, fins and bands read; trail is marigold.
- Known artifact: dark chevron seams where trail segments join (open hex cylinders, stepped width).
- Tests: client 227 pass, `tsc` clean, `pnpm lint` 7 old warnings.
- STALE DOC: `ART_MATERIALS.md` item 14 still says trail radius 0.75u and 2.5× the bolt head. Now it is
  0.5u (1.7×) with a fade² taper.
- Method (worth reusing): koota `universe.worlds` gives the page's world over CDP →
  `queryFirst(LocalPlayer, Sim)` for the ship; freeze (KeyP), then write seekers straight into
  `localCombat.seekers` and move them from an in-page rAF loop; SeekerBodies draws them while frozen.

## Uncommitted

None of mine.

## Held files

- shared: `combat/{seeker,seeker-trail,constants,pickups,combat-step}.ts` + tests, `schema.ts`,
  `sim-config.ts`, `ship-classes.ts`, `index.ts`
- server: `rooms/run-room.ts`, `rooms/run-room.test.ts`, `rooms/room-combat.ts`
- client: `game/scene/{pickup-field,projectile-field,bolt-pickups,pickup-instances}.tsx`,
  `game/scene/seeker-*`, `game/overlays/{threat-hud,held-power-chip}.tsx` + tests, `audio/sfx-map.ts`,
  `routes/test-level/{local-pickup-field,local-power-slot,local-seeker-field}.tsx`,
  `routes/test-level/local-combat.test.ts`, `dev/tuning-schema.ts`, `net/attach-room-to-world.ts`,
  `game/ecs/traits.ts`
- RELEASED: `dev/tuning-panel.tsx`, `docs/ART_MATERIALS.md`, `game/net-canvas.tsx`,
  `routes/test-level/test-level-canvas.tsx`, `routes/test-level/local-combat.ts`.

## Next

0. Ask the supervisor for `docs/ART_MATERIALS.md` again. Fix item 14's trail line: radius 0.5u at the
   head = 1.7× `BOLT_HEAD_RADIUS` (0.3u); width and brightness fall with the square of the fade; the
   trail leaves the body's rear. Own commit, release.
1. Owner look review of the four stills (supervisor relays). Possible follow-ups: the segment seams,
   trail length (12 points × 2u = 24u).
2. 3-slot plan for the supervisor (build nothing until the owner approves). OWNER REQUIREMENTS
   (supervisor, 2026-09-23): (1) any mix in 3 slots, duplicates allowed; target loadout 2 seekers + 1
   boost; (2) the player can DROP a slot's pickup to free it (*"I always want seeker and boost. If I pick
   up something else by accident, I drop it to open the slot."*). The plan must answer: controls for
   select/fire/drop (keep W/S, A/D, Space, E, M); a dropped pickup vanishes or stays on the track
   (server-authoritative; a drop is an INPUT, never a position, ADR-000); all 3 full → skip (pickup
   stays for others) or lose it; kind random on grab or visible before (if hidden, say the drop is what
   makes 2 seekers + 1 boost reachable); HUD for 3 slots + selected slot; does the room-wide one-seeker
   cap (grants a bolt) stand when a player can hold 2; schema/wire change + files to claim; file a
   GitHub issue. Send it to the supervisor.
3. Step 6 audio + LOCKED HUD, step 7 target dummy + tunables, step 8 two-player room + doc rows.

## Open questions

- Owner: when the gate is shut, keep "a seeker pickup grants a bolt", switch to `'shooter'` scope, or dim
  the canister? The slots design changes this.
- A bigger impact burst needs `hit-spark.tsx` (ask first).

## Lessons → memory

`.claude/memory/koota-universe-reaches-the-page-world.md`.
