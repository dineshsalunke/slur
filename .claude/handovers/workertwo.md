Agent: workertwo · Lane: mine pickup (#20, mine-only child issue to file on approval) · Updated: 2026-09-25

Older versions hold #259 and #257 (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

Build the Mine: a pickup, a deployed mine on the deck, the trigger, and the HUD entry. Refs: `ingredients.png`
panel 4 and 9, `cruise-lighting.png` HUD. PLAN ONLY. The owner approves before any edit.

## Done

- Survey of Bolt and Seeker, end to end. No code written.

## State

- Wire: `HeldPower = { none: 0, bolt: 1, seeker: 2 }` in `combat/constants.ts`. `slots` is `uint8[3]`, so `mine: 3` needs no schema change on `PlayerState`.
- `RunState` ends with `@type( { map: Seeker } ) seekers`. A new `mines` map must go after it (append only; memory deprecated-breaks-reflection-decoding).
- `pickupPower( id )` is a hash of the id: below `seekerRatio` (0.25) it is a seeker, else a bolt.
- Server: `room-combat.ts` `firePower` routes seeker vs bolt. `run-room.ts` `stepWorld` calls `stepBolts`, `stepSeekers`, `stepPickups`. `clearCombat` clears the maps.
- Client: `PickupInstances` draws a pickup as instanced parts (shell, glyph, core) plus a pool plane. `SeekerField` reads koota `NetSeeker` entities that `attach-room-to-world.ts` spawns from the map.
- HUD: `power-cell.tsx` `LABEL` maps power to text. `power-gem.tsx` is one static bolt-diamond SVG.
- `ART_SCALE_REFERENCE.md` has no pickup or mine sizes. The bolt pickup is 1.4u × 2.6u (`combat-look.ts` HALF_W 0.7, HALF_H 1.3).
- `ART_MATERIALS.md:463-464`: pickup shells M1 graphite with inset core; deployed mine M1 + M7, "must stay visible on the track".

## Uncommitted

None.

## Held files

None. Claims go to the supervisor with the plan.

## Next

1. Wait for the owner's approval of the plan (sent to slur-supervisor).
2. On approval: file the child issue, send the claim list, then build shared → server → client → HUD → docs.

## Open questions

In the plan message to slur-supervisor.

## Lessons → memory

none
