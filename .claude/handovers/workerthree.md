Agent: workerthree · Lane: homing seeker (#219) · Updated: 2026-09-23 (after a2223ca)

## Goal

Build the homing seeker: the second held power. It is marigold, locks one visible racer ahead, is hard to
shake, and has two dodges (jump, or a late strafe). Rule: ADR-017 in `docs/DECISIONS.md`.

## Done

- `d0b2e61` ADR-017 draft + #219. `5771ee3` shared sim. `dfae252` server. `e656f18` `room-combat.ts`
  split. `8828f7a` `pickup-instances.tsx`. `cc3debe` pickup canister. `7fcabd4` hosted render
  (`seeker-field.tsx` → `seeker-bodies.tsx`, `seeker-trail.ts` ring trail). `2ca4bc8` /test-level fired a
  bolt instead of a seeker: `Armed` replaced by `Held{power}`.
- `a2223ca` — owner changes: the seeker flies at `seekerFlyY` 2.5 (drawn at sim y, no hover lift), drops
  to `seekerStrikeY` 0.5 at `seekerDropRate` 12 u/s in the committed window, TTL 20. Path: leg 1 = the
  LOS line, then the target's recorded (z,x) path (`combat/seeker-trail.ts`, WeakMap, off the wire, 1u
  step, cap 1024). It homes direct while the box to the target is block-free. Launch LOS widens blocks by
  `seekerHalf`. The block test sweeps z at the old x, then checks the box at the new x. Blocks are lethal
  for the whole flight. ADR-017 updated. Removed: cruiseY/climb/diveDz.

## State

- Measured (scratchpad harness, 30 seeds, locked shots): blocked 3/497 (target at 90 u/s), 1/238 (at 110);
  22/238 expired at 110 (closing 10 u/s). Plain level flight was 30–93% blocked. The bot crashed in
  many runs (dropped). The wide LOS refused 765 launches vs 621 zero-width.
- Tests: shared 190, server 9, client 225, all pass. `pnpm typecheck` clean. `pnpm lint`: 7 old warnings.
- Mutation-checked: disabling path following fails "it follows the path the target flew around a block".
- `Seeker.*` tunables do NOT exist yet (ADR-017 now says so). Asked the supervisor for
  `routes/test-level/local-combat.ts` (workertwo's) to pass `{ ...DEFAULT_SIM_CONFIG, seekerFlyY:
  num('Seeker.flyY') }` to `aimSeeker`/`stepSeekers`.
- Render check NOT done `[unmeasured]`. The earlier empty `queryFirst(LocalPlayer, Sim)` is probably the
  HMR-orphan trap: read `.claude/memory/cdp-import-of-tuning-hits-an-hmr-orphan.md` and
  `drive-the-live-module-not-a-reload.md` first.

## Uncommitted

None of mine. Others' files are in the tree (scene/finish-*, monolith-*, `docs/art-direction/*`).

## Held files

- shared: `combat/{seeker,seeker-trail,constants,pickups,combat-step}.ts` + tests, `schema.ts`,
  `sim-config.ts`, `ship-classes.ts`, `index.ts`
- server: `rooms/run-room.ts`, `rooms/run-room.test.ts`, `rooms/room-combat.ts`
- client: `game/scene/{pickup-field,projectile-field,bolt-pickups,pickup-instances}.tsx`,
  `game/scene/seeker-*`, `game/overlays/{threat-hud,held-power-chip}.tsx` + tests, `audio/sfx-map.ts`,
  `routes/test-level/{local-pickup-field,local-power-slot,local-seeker-field}.tsx`,
  `routes/test-level/local-combat.test.ts`, `dev/tuning-schema.ts`, `net/attach-room-to-world.ts`,
  `game/ecs/traits.ts`
- RELEASED to workertwo: `game/net-canvas.tsx`, `routes/test-level/test-level-canvas.tsx`,
  `routes/test-level/local-combat.ts`.

## Next

1. `Seeker.flyY` tunable once the supervisor clears `local-combat.ts` (or workertwo adds it).
2. Look rebuild per the owner: square chamfered body, bright core on the NOSE, dorsal + side fins,
   near-cube pickup, THICK trail in MARIGOLD (not the board's red-orange). Record the marigold departure
   in `docs/ART_MATERIALS.md` §7 style, quoting the board. Never edit `docs/art-direction/`.
3. Render check on `/test-level` (the canister must be SEEN).
4. 3-slot plan for the supervisor (build nothing): which slot E fires, a full grab, duplicates, HUD, files,
   a new issue.
5. Step 6 audio + LOCKED HUD, step 7 target dummy + tunables, step 8 two-player room + doc rows.

## Open questions

- Owner: when the gate is shut, keep "a seeker pickup grants a bolt", switch to `'shooter'` scope, or dim
  the canister? The slots design changes this.
- A bigger impact burst needs `hit-spark.tsx` (ask first).

## Lessons → memory

`.claude/memory/measure-a-homing-rule-on-procgen.md`.
