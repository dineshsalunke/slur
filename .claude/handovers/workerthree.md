Agent: workerthree · Lane: Mine fizzle #280 — DONE · Updated: 2026-09-26

## Goal

A mine fired where it cannot land still spends the power, and shows a fizzle (VFX and sound) so the
player sees why nothing happened.

## Done

- ccc5e48: #280 end to end. Issue closed with the SHA.
  - Shared: `MineOutcome` gains `'fizzle'`. `mineFizzle(ship, halfL, ownerId, cfg, dir)` builds the
    event at ship x/y and `mineDropZ`.
  - Server: `layMine` in room-combat broadcasts the fizzle on `MINE_BURST_MESSAGE` when `aimMine` fails.
    No new message constant, so combat/constants.ts and attach-room-to-world.ts stay untouched.
  - Client: `MineShock` has `kind: 'big' | 'small' | 'fizzle'`. A fizzle is a ring that collapses
    inward (1.6R, 0.4 s), plus a spark. The cue is `mineFizzle` = death_derezz.ogg at rate 1.8 and
    gain 0.55. The layer hears it at full gain, others at 0.6×.
  - /test-level: local-combat fizzles the same way.
  - Supervisor add-ons: bind-room-audio uses `musicForPhase`. mine-shock drops `toneMapped: false`
    (commented on #275 item 1; mine-bodies.tsx:37 still has it).

## State

- Tests at ccc5e48: server 52/52 and client 423/423 (measured).
- Shared: 406/408. The 2 failures are the phantom fixture pocket and the weave digest. They are not
  mine-related. The cause is probably other workers' uncommitted sim/types.ts and constants.ts
  [inferred, not re-run at HEAD].
- Client tsc errors in track-view.tsx and beat-deck-canvas.tsx come from another lane's uncommitted
  edits. None are in my files (measured).
- Biome: 8 #283 warnings on mine-shock.tsx (constants and helpers in a component file). The old file
  had the same shape. Left for the #283 lane.
- Headless /test-level at 28u: the big, small and fizzle rings all read. The fizzle reads as a ring
  that closes inward with a spark (measured).
- The fizzle sound was not heard. Audio was muted headless [unmeasured].

## Uncommitted

- none

## Held files

- none. All released at ccc5e48.

## Next

1. Wait for a new lane from slur-supervisor.

## Open questions

- Owner: is a pitched-up derezz zap the right fizzle sound? A dedicated sample is an option.
- Carried over: is the shield dome too opaque? Are 2 bolts per bag of 20 intended?

## Lessons → memory

- none
