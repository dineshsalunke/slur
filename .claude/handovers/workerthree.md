Agent: workerthree · Lane: three power slots (#223), after the seeker look (#219) · Updated: 2026-09-23 ~21:40

## Goal

#223: three power slots, any mix, duplicates allowed. 1/2/3 select a slot, Q cycles, E fires, X drops.
A dropped power is gone. With a full rack the racer skips the pickup, and the pickup stays. The seeker
cap is at fire time: one seeker in flight per shooter. Built end to end and checked live.

## Done

- `eb4c381` shared + server: slots, fire and drop by slot, fire-time seeker cap, run-room tests.
- `c362fab` FIX: `heldPower` is a plain field (`@deprecated()` broke reflection decoding).
- `555862d` ART_MATERIALS item 14: 8.8u body, four rear fins.
- `1081809` + `9928cc1` DECISIONS ADR-017 amendment: slots, fire-time cap, wire.
- `738ebd3` client slice + GDD §5.3/§8: power-select store, PowerRack/PowerCell HUD, three-slot local
  combat, audio edge, net-canvas sends {slot}.
- `454f544` memory `deprecated-breaks-reflection-decoding.md`.
- `78ff858` live checks (no code change), memory `drive-a-hosted-room-over-cdp.md`.
- `3bc2605` seeker pickup is a bar 4.2u long (was 1.4u), owner request. ART_MATERIALS item 14 updated.
  Still: scratchpad `seeker-pickup-bar.png` + `crop-seeker-pickup-bar.png`.

## State

- Live, hosted room on a private stack (:5185/:2585), headless DPR 1, muted, all killed after:
  - Rack filled 000→100→110→111 from pickups 12, 18, 21.
  - Digit2 moved the underline to slot 2. Q moved it to slot 3.
  - E fired slot 3 (111→110, one bolt in state). Selection settled to slot 1. X dropped slot 1 (→010).
  - Full-rack skip: in grab range of pickup 81 with rack 111. Rack unchanged, `pickupTaken[81]` false.
  - Seeker cap: rack 220. E → 020, one seeker (ttl 19.7). E again → refused, still 020 and one seeker.
    After the first seeker ended, E fired the second (→000).
  - A refused E while wedged on a block is the stun rule (`stunTimer` 0.083), not #223.
- /test-level still: rack bottom right, FlightReadout bottom left, no overlap (staged rack [1,2,0]).
- NOT checked: the pickup sfx (tab muted). [unmeasured]
- Observations, not fixed:
  - `net-canvas.tsx` still sends SET_CLASS on digits 1–5, and `net-debug-hud.tsx` says "keys 1-5 to
    swap". In the lobby, 1–3 both swap class and pick a slot. The server ignores class changes after
    the lobby, so a race is safe. Same clash as the /test-level question.
  - The dev tuning panel in a hosted room covers rack cells 2–3 until Backquote hides it (dev only).
  - No HUD or sound cue when a fire is refused (seeker cap or stun).
- Stills (scratchpad `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/5c6d06d0-78ec-4c1c-83d8-901b72db2774/scratchpad/`):
  `rack-full-111.png`, `crop-rack-sel2.png`, `crop-rack-q-to3.png`, `crop-after-fire.png`,
  `crop-after-drop.png`, `seeker-refused.png`, `test-level-hud.png`.

## Uncommitted

none

## Held files

- #223 client: game/input/power-select(.test).ts, game/hud/power-{rack,cell}.tsx, game/net-power-rack.tsx,
  game/net-canvas.tsx, net/attach-room-to-world.ts, ecs/traits.ts, audio/bind-room-audio.ts,
  routes/test-level/{local-combat(.test).ts, local-ship.tsx, test-level-hud.tsx}, game/net-debug-hud.tsx,
  game/overlays/{overlays.tsx, overlays.test.tsx}, docs/GDD.md.
- Shared combat/*, schema, sim-config; server run-room(+test), room-combat.

## Next

0. NEW OWNER TASK from the supervisor (not started, nothing claimed yet): remove the one-seeker-in-flight
   cap so a racer can fire seekers back to back. Owner: *"i would like to fire seeker's back to back if
   required."* It reverses the DECISIONS #223 amendment bullet *"The cap moves to fire time. Each shooter
   can have one seeker in flight."*
   - Code: `seekerReady()` at `packages/shared/src/combat/combat-step.ts:40`, its test at
     `combat-step.test.ts:162`. Find every caller: server `room-combat.ts` `firePower`, client
     prediction, `/test-level` local-combat, and any "fire refused" HUD path. Delete the gate. Add no
     new gate.
   - Report (measure, do not assume): (1) the client renders at most `MAX_SEEKERS = 16`
     (`seeker-look.ts`; `seeker-bodies.tsx` drops extras). Size it and the trail segments against room
     max × POWER_SLOTS, or say why not. (2) Do two seekers fired back to back at one target overlap
     at SEEKER_SPAWN_AHEAD, or collide with each other or with each other's trails? (3) Is any audio or VFX
     keyed per owner, on the assumption of one seeker each?
   - Process: file a GitHub issue first. Send the supervisor the claim list before the first write.
     Add a DECISIONS amendment that quotes the bullet it replaces. Run shared, server and client tests,
     typecheck and lint. Live check: 2–3 seekers back to back in /test-level, and in a hosted room if
     possible (see memory `drive-a-hosted-room-over-cdp.md`; the reverse-through-a-pickup trick gives
     duplicates). Commit by pathspec. Report the SHAs to the supervisor.
1. Apply the owner's answer on the class keys. It now covers both /test-level and the hosted-room dev
   swap in `net-canvas.tsx`.
2. If wanted: a refused-fire cue (owner or supervisor call).
3. Seeker leftovers: audio + LOCKED HUD, target dummy, two-player room check.

## Open questions

- Owner: class keys, (a) Shift+1..5 (built on /test-level), (b) or (c). Should the hosted room's dev
  class swap move the same way?
- Owner, via the supervisor: the colyseus rule wording (draft in the previous handover, `36dd249`).
  DO NOT EDIT until the owner approves.
- Owner: a cue for a refused fire?
- Owner: the look review of the 8.8u seeker stills. Trail segment seams (dark chevrons) remain.

## Lessons → memory

`.claude/memory/drive-a-hosted-room-over-cdp.md` (this seam).
