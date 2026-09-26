Agent: workerfour · Lane: #289 portal pickup (BC4) · Updated: 2026-09-26, night

## Goal

Build a portal pickup: two placed ends, tap = near, double tap = far, any racer can use it, 9 s lifetime.
The teleport runs in the shared `simulate()`, so prediction replays it (BC4). The owner approved all 8 proposals
(#289 comment).

## Done

- 21bb3fb — `combat/portal.ts` (pure): `portalTargetZ`, `placePortalEnd` (clear-spot search: MIN_CLEAR-wide box,
  block/gap/deck-edge, steps back toward the ship, finish clamp, null = fizzle), `hopThroughPortal` (two-way
  plane crossing, velocity kept, `portalHops` += 1 wrapping at 255, lastSafe = the exit end). `portal.test.ts` has 18 tests.
- 6dd1368 — slice 1 wiring. `SimWorld.portals: Map<string, PortalState>`; `SimShip`/`PlayerState.portalHops` (uint8,
  appended after tug's fields, in SIM_SHIP_KEYS, not a float key); `simulate()` calls the hop after collisions when
  `world.portals.size > 0`; `SimConfig extends PortalConfig` (spreads `DEFAULT_PORTAL_CONFIG`); index exports
  portal.js; `sim/portal-hop.test.ts` (3 tests through simulate, including replay equality).

## State

- At 6dd1368: typecheck clean; shared 462/462, server 38/38, client 437/437; Biome clean except the pre-existing
  step.ts file-length warning (337 lines, now +2) (measured).
- Portal config lives in `DEFAULT_PORTAL_CONFIG` in combat/portal.ts: R 3, H 5, nearLead 0.4 s, far 1 s × hull
  maxCruise, backGap 1, arm 0.3 s, ttl 9, doubleTap 15 ticks, clearW 7, clearHalfL 6, exitGap 0.5, finishGap 20, zStep 1.
- There is no MIN_CLEAR constant in code; portalClearW = MAX_SHIP_WIDTH + 3.
- Nothing places portals yet. The server and the client never fill `world.portals`, so the game is unchanged.

## Uncommitted

None of mine.

## Held files

None. Slice 1 files are released. Supervisor order: my S2 goes FIRST on the shared fire/bag files, and workertwo's S2 queues
behind me. **Tell workertwo directly when my S2 commits.**

## Next

1. Claim S2 with the supervisor: schema.ts (Portal class + RunState.portals), combat/constants.ts (HeldPower portal=6,
   portalB=7, PORTAL_HOP_MESSAGE, PORTAL_FIZZLE?), run/combat.ts (firePower dispatch + a stepPortals call),
   combat/power-bag.ts + sim-config ratio (owner: 2/20, Bolt 6→5, Seeker 4→3), run/run-sim.ts (double-tap
   pending before `canFire`; set `world.blocks.portals` from state; clearCombat clears), new run/portal-run.ts
   (place/move/arm/ttl/lone-end expiry takes the portalB slot; 1 pair per owner), run-sim.test.ts.
   - Double tap: in `RunSim.fire`, if pending {slot, dir, seq} matches and `intent.seq − pending.seq ≤ 15`,
     move that end to far (reset its arm) and spend nothing. Otherwise the normal fire.
   - A seeker misses when its target's portalHops changes (seeker.ts; check the tug S2 overlap).
   - Hop broadcast: compare portalHops before/after stepRacer, then broadcast {from, to, victimId}.
2. Slice 3, client net: portal-state.ts mirrors into blockWorld.portals; snap on a portalHops change (Prev, Interp, camera).
3. Slice 4: VFX (placeholder marigold rings), HUD glyph, sfx. Slice 5: GDD §5.3 + §5.7 BC4 LIVE, ADR, /test-level
   live check, `gh issue close 289` with the SHA.

## Open questions

- A far end ahead can loop a chaser: each forward pass throws them back until they strafe round or the TTL ends.
  Sent to the supervisor as a note; a per-ship hop cooldown is the fix if play shows it is too harsh.

## Lessons → memory

- `.claude/memory/shared-tests-need-in-package-outdir.md`
