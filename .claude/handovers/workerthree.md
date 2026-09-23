Agent: workerthree · Lane: three power slots (#223), after the seeker look (#219) · Updated: 2026-09-23 ~22:30

## Goal

#223: three power slots, any mix, duplicates allowed. 1/2/3 select a slot, Q cycles, E fires, X drops.
A dropped power is gone. With a full rack the racer skips the pickup, and the pickup stays. The seeker
cap is at fire time: one seeker in flight per shooter. Built end to end. Visual and live checks remain.

## Done

- `eb4c381` shared + server: slots, fire and drop by slot, fire-time seeker cap, run-room tests.
- `c362fab` FIX: `heldPower` is a plain field. `@deprecated()` broke reflection decoding in hosted rooms
  (see Lessons). A new run-room test decodes the rack through the SDK. It fails with `@deprecated()`.
- `555862d` ART_MATERIALS item 14: 8.8u body, four rear fins.
- `1081809` + `9928cc1` DECISIONS ADR-017 amendment: slots, fire-time cap, wire.
- `738ebd3` client slice + GDD §5.3/§8: power-select store, PowerRack/PowerCell HUD, Held {slots},
  real three-slot local combat, audio edge, net-canvas sends {slot}.
- `454f544` memory `deprecated-breaks-reflection-decoding.md`.

## State

- Tests: server 14/14, shared 202/202, client 241/241. Client tsc is clean apart from workertwo's
  Break.*/Fracture.* keys. `pnpm lint`: canvas-isolation and comment ratchet pass. Biome warns that
  run-room.test.ts is over 300 lines (a warning only).
- Verified through the SDK: `$( p ).slots.onChange` fires once per index, and fires on initial items.
- NOT verified live: the hosted room in a browser (rack HUD, E/X, pickup sfx) and /test-level HUD look.
  [unmeasured]
- /test-level: ship class is now Shift+1..5 (option (a)). The owner's answer is pending through the
  supervisor.

## Uncommitted

none

## Held files

- #223 client: game/input/power-select(.test).ts, game/hud/power-{rack,cell}.tsx, game/net-power-rack.tsx,
  game/net-canvas.tsx, net/attach-room-to-world.ts, ecs/traits.ts, audio/bind-room-audio.ts,
  routes/test-level/{local-combat(.test).ts, local-ship.tsx, test-level-hud.tsx}, game/net-debug-hud.tsx,
  game/overlays/{overlays.tsx, overlays.test.tsx}, docs/GDD.md.
- Shared combat/*, schema, sim-config; server run-room(+test), room-combat.
- RELEASED: docs/ART_MATERIALS.md, docs/DECISIONS.md.

## Next

1. Live check in a hosted room (start solo): grab 2–3 pickups, look at the rack, press 1/2/3 and Q,
   fire with E, drop with X, fire a second seeker while one flies (it must be refused). Headless Chrome
   rules are in CLAUDE.local.md §7.
2. /test-level HUD still: the rack in the bottom right, with no overlap with FlightReadout.
3. Apply the owner's answer on the /test-level class keys.
4. Seeker leftovers: audio + LOCKED HUD, target dummy, two-player room check.

## Open questions

- Owner: /test-level class keys, (a) Shift+1..5 (built), (b) or (c).
- Owner, via the supervisor: correct the colyseus rule. DO NOT EDIT until the owner approves. Draft:
  - `.claude/rules/colyseus-state.md:15`. OLD: *"order — a mismatch silently corrupts decoding. Dead
    fields get `@deprecated()`."* NEW: *"order — a mismatch silently corrupts decoding. Keep a dead
    field as a plain `@type` field that nothing writes. Never `@deprecated()`: our client decodes by
    reflection, and a deprecated field moves every later field one index down (c362fab)."*
  - `conventions/colyseus.md:157`. OLD: *"Append only; mark dead fields `@deprecated()`."* NEW:
    *"Append only. Keep dead fields as plain unused `@type` fields. `@deprecated()` breaks
    reflection decoding in @colyseus/schema 4.0.30: the reflected class leaves the field out, so the
    client puts later fields one index too low (`field not defined at index N`, `definition
    mismatch`). Measured in #223, fixed in c362fab. The guard is the SDK decode test in
    `apps/server/src/rooms/run-room.test.ts`."*
- Owner: the look review of the 8.8u seeker stills.
- Trail segment seams (dark chevrons) are still there.

## Lessons → memory

`.claude/memory/deprecated-breaks-reflection-decoding.md` (454f544).
