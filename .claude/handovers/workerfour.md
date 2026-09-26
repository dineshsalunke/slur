Agent: workerfour · Lane: #289 portal pickup (BC4) · Updated: 2026-09-26, late night

## Goal

Build a portal pickup: two placed ends, tap = near, double tap = far, any racer can use it, 9 s lifetime.
The teleport runs in the shared `simulate()`, so prediction replays it (BC4). The owner approved all 8 proposals
(#289 comment).

## Done

- 21bb3fb — `combat/portal.ts` (pure): placement, clear-spot search, `hopThroughPortal`. 18 tests.
- 6dd1368 — slice 1: `SimWorld.portals`, `portalHops` on the ship, the hop inside `simulate()`, replay test.
- 664cc60 — slice 2: schema `Portal` + `RunState.portals` (appended); `HeldPower.portal=6`, `portalB=7`;
  `PORTAL_HOP_MESSAGE`/`PORTAL_FIZZLE_MESSAGE` (+ message types); `SEEKER_RATIO` 0.2 → 0.15; `portalRatio` in
  `PortalConfig` (default `PORTAL_RATIO = 0`); bag row + cache key; new `run/portal-run.ts` (placePortal,
  isDoubleTap, throwPortalFar, stepPortals, portalHopped); `firePower` returns `PortalEnd | null`; RunSim holds
  `portalTaps`, passes `state.portals` to simulate, broadcasts hops, clears portals in `clearCombat`/`leave`.
  `run/portal-run.test.ts` has 10 tests.

## State

- At 664cc60: typecheck 0, lint 0 (7 old file-length warnings, none mine), shared 472/472, client 437/437,
  server 38/38 (measured).
- Supervisor decision: `portalRatio` ships at 0. The default bag is bolt 7 / seeker 3 / mine 4 / boost 3 / shield 3.
  At 0.1 it is 5/3/4/3/3/2 (tested).
- The pair lifetime restarts when end B lands. A lone end lives 9 s from end A.
- Double tap = same slot + same dir, `intent.seq − tap.seq` in 0..15. It works on end A and on end B.
- The client neither mirrors nor draws portals yet. With ratio 0, the game is unchanged.

## Uncommitted

None of mine.

## Held files

None. All S2 files are released. workertwo and the supervisor were told at 664cc60.

## Next

1. Slice 3, client net. First claim with the supervisor: portal-state mirror into `blockWorld.portals`
   (prediction world), and a snap on a `portalHops` change (Prev, Interp, camera). Add a `portals` bucket to
   `scene/seeker-pickups/seeker-pickups.tsx` + `.utils.ts` + `scene/seeker-pickups.test.ts` + `scene/pickup-field.tsx`
   (the supervisor cleared these once; re-claim). Then set `PORTAL_RATIO = 0.1` and update the default-bag test.
2. Slice 4: VFX (placeholder marigold rings), HUD glyph + `LABEL` in `hud/power-cell/power-cell.constants.ts`,
   `power-gem.tsx`, sfx for hop/fizzle.
3. Slice 5: GDD §5.3 + §5.7 BC4 LIVE, ADR, /test-level live check, `gh issue close 289` with the SHA.

## Open questions

- A far end ahead can loop a chaser. A per-ship hop cooldown is the fix if play shows it is too harsh (with the owner).

## Lessons → memory

- none. (The fish `$F` no-split trap is already in `bash-tool-runs-fish.md`.)
