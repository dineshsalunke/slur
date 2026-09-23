Agent: workerthree · Lane: three power slots (#223), after the seeker look (#219) · Updated: 2026-09-23 ~21:00

## Goal

Build #223: three power slots (any mix, duplicates allowed). Keys: 1/2/3 select, Q cycles, E fires, X drops.
A dropped power vanishes. With 3 full slots the racer skips the pickup and it stays. A grab fills the lowest empty slot.
The seeker cap is now at FIRE time: one in flight per shooter. A seeker canister always grants a seeker.
Only bolt + seeker for now (boost stays under #20). The owner APPROVED all of it (supervisor, 2026-09-23).

## Done

- `e2096cd` ART_MATERIALS item 14, trail line (0.5u, 1.7×).
- `fcebd5d` seeker body 4× (8.8u, halfLen 4.4), four fins (top/bottom/left/right, rear, 2.4u root), nose
  anchored at sim z + seekerHalf (`SeekerForm.nose`, `seekerTail()`), TRAIL_POINTS 12→16, fade restarts
  at the first visible point. VISUAL ONLY: SEEKER_HALF=1 and all sim code unchanged.
- Stills (gitignored `.claude/frame-tap-refs/`): `seeker-flight-side.png`, `seeker-flight-quarter.png`,
  `seeker-flight-close.png`. The pickup stills were not re-taken (geometry unchanged). Relayed to the owner.
- Issue #223 filed.

## State

- UNCOMMITTED #223 work (tree is mid-migration):
  - shared DONE: `combat/constants.ts` (POWER_SLOTS=3, DROP_POWERUP_MESSAGE, PowerSlotMessage; SeekerScope
    removed), `sim-config.ts` (seekerScope removed), `combat/combat-step.ts` (Gunner.slots; emptySlots,
    isSlot, powerIn, canFire(g, slot), seekerReady, spendPower, dropPower, firstEmptySlot, grantPower;
    stepPickups has no gate), `schema.ts` (`@deprecated()` heldPower kept + `slots` ArraySchema<uint8>
    APPENDED), tests. Shared: tsc clean, 202 pass.
  - server source DONE: `run-room.ts` (USE_POWERUP {slot}, DROP_POWERUP {slot}, clearCombat empties slots,
    no gate), `room-combat.ts` (firePower(..., slot) returns false if own seeker is in flight; nothing is spent).
    Server tsc clean. **`run-room.test.ts` NOT updated**: it still sets `heldPower` and sends USE_POWERUP
    with no slot, so it will fail.
  - client STOPGAP: `routes/test-level/local-combat.ts` bridges the old Held{power} as slot 0 (slots 1–2
    stuffed with bolt so grabs never land there). Only there so /test-level does not crash on `g.slots`.
- The hosted client still sends USE_POWERUP with no payload → the server ignores it → **E does nothing in a
  hosted room until the client slice lands.** HeldPowerChip listens to the deprecated heldPower (always 0).
- Client tsc: clean except workertwo's Break.*/Fracture.* keys (not mine).
- Verified: @colyseus/schema 4.0.30 ArraySchema proxy supports `arr[i] = v`; `deprecated()` is exported.

## Uncommitted

packages/shared/src/{schema.ts, sim-config.ts, combat/constants.ts, combat/combat-step.ts,
combat/combat-step.test.ts, combat/seeker-pickups.test.ts} · apps/server/src/rooms/{run-room.ts,
room-combat.ts} · apps/client/app/routes/test-level/local-combat.ts

## Held files

- All previous holds (shared combat/*, schema, sim-config, index; server run-room(+test), room-combat; client
  seeker-*, pickup/projectile fields, threat-hud, held-power-chip, sfx-map, test-level local-*,
  attach-room-to-world, ecs/traits).
- #223 claims CLEARED: game/net-canvas.tsx, game/overlays/overlays.tsx, audio/bind-room-audio.ts,
  routes/test-level/{local-combat.ts, local-ship.tsx}, game/input/ (new store), docs/GDD.md.
- RELEASED TO ME by the supervisor: docs/ART_MATERIALS.md and docs/DECISIONS.md.
- RELEASED: dev/tuning-schema.ts (workertwo has it).

## Next

1. Update `apps/server/src/rooms/run-room.test.ts`: set `shooter.slots[0] = …` and send `{ slot: 0 }`.
   Add tests: drop empties a slot; a 2nd seeker is refused while own seeker flies (slot kept); a full rack
   skips. Run `pnpm test` (server). Then commit shared + server + the stopgap in ONE commit (it must land
   together).
2. Client slice: a `game/input/power-select.ts` module store (selected slot; 1/2/3/Q keys; auto-advance to
   the next full slot) using the useSyncExternalStore pattern in `dev/rear-view-toggle.ts`; net-canvas sends
   `{slot}` on E and DROP on X; replace HeldPowerChip with a 3-cell strip (one component per cell, each
   listens to its own slot via `$(p).slots.onChange`); bind-room-audio pickup sfx on any slot filling;
   Held trait → {slots} and a real 3-slot local-combat (remove the stopgap) + local-power-slot +
   local-combat.test.
3. Docs: ART_MATERIALS item 14 → 8.8u long and four fins (leave items 13 and 15 alone; commit alone).
   GDD §5.3 "single held slot (no stacking)" + the controls table. DECISIONS ADR-017 amendment (fire-time
   seeker cap, slots). Commit each file alone, then release both docs.
4. Then the seeker leftovers: audio + LOCKED HUD, target dummy, two-player room check.

## Open questions

- Owner: look review of the 8.8u stills (supervisor relayed).
- Trail segment seams (dark chevrons) are still there.

## Lessons → memory

none (the ?t= HMR-orphan import lesson is already in `cdp-import-of-tuning-hits-an-hmr-orphan.md`).
