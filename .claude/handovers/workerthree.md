Agent: workerthree · Lane: Shield pickup #270 — DONE · Updated: 2026-09-26

## Goal

Shield power: a 5 s window that absorbs one bolt, mine or seeker hit, with a hex dome and a pop. The
server is authoritative.

## Done

- c9e78a3: shield.ts helpers, Shield trait, shield-look, ShieldDome, ShieldPickups.
- 26badb9: wired end to end. The pieces:
  - Constants: SHIELD_S 5, SHIELD_POP_MESSAGE, SHIELD_RATIO 0.15, and `shieldS` in SimConfig.
  - Schema: `@type('boolean') shielded` is appended after boostTimer. `shieldTimer` is a plain field.
  - Server: room-combat `shieldAbsorbs` (mine trigger, seeker hit), the bolt strike in run-room,
    `stepShield` per player (dead → drop), and clearCombat drops every shield.
  - Client: Shield on both spawns, `listen('shielded')`, and shieldPop → popAt + sparks + sound.
  - Also: ShieldDome in ShipView, the HUD ring gem, and the /test-level local shield. The test-level
    boost now plays its sound.
  - Tests: room-shield.test.ts; the bag and combat-step tests were updated.
- Issue #270 closed with the SHA.

## State

- Gates at 26badb9: typecheck clean. Tests: shared 403/0, server 41/0, client 415/415. The comment
  ratchet, canvas isolation and ls-lint pass.
- `biome check .` fails only on packages/shared/src/sim/track-digest.test.ts. That file is from 888a682
  (workerfour, #276), not mine.
- Default bag: 2 bolts, 6 seekers, 6 mines, 3 boosts, 3 shields (measured).
- /test-level headless: E raises the dome, and it lapses after 5 s (measured, screenshots in the
  scratchpad). The dome reads fairly opaque and hides most of the ship.
- The HUD shield gem has not been looked at [unmeasured]. Neither has a pop in a two-client room
  [unmeasured].

## Uncommitted

- none

## Held files

- none. All released to the supervisor at 26badb9.

## Next

1. Wait for a new lane from slur-supervisor.

## Open questions

- Owner: is the dome too opaque? The alpha is 1 in `shieldAlpha` in `scene/shield-look.ts`.
- Owner: with shield at 0.15, bolts are down to 2 per bag of 20. Is that intended?

## Lessons → memory

- .claude/memory/ast-grep-drops-semicolons.md (appended: a block rewrite flattens formatting)
