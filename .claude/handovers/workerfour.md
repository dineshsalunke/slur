Agent: workerfour · Lane: #289 portal pickup (BC4) · Updated: 2026-09-26, night

## Goal

Build a portal pickup: two placed ends, tap = near, double tap = far, any racer can use it, 9 s lifetime.
The teleport runs in the shared `simulate()`, so prediction replays it (BC4). The owner approved all 8 proposals
(#289 comment).

## Done

- 21bb3fb — `combat/portal.ts` (pure): placement, clear-spot search, `hopThroughPortal`. 18 tests.
- 6dd1368 — slice 1: `SimWorld.portals`, `portalHops` on the ship, the hop inside `simulate()`, replay test.
- 664cc60 — slice 2: schema `Portal` + `RunState.portals`, `HeldPower.portal/portalB`, hop/fizzle messages,
  `run/portal-run.ts`, RunSim wiring. 10 tests.
- 7857886 — slice 3: `state.portals` mirrors into `blockWorld.portals` (attach-room-to-world); a predicted or
  reconciled hop snaps `Prev`; remote interp holds across a hop (`Snapshot.hops`); the spectator camera snaps on a
  >12u jump of the same target; `portals` pickup bucket + placeholder ring body (`scene/portal-pickups/`);
  `PORTAL_RATIO` 0 → 0.1.

## State

- At 7857886: typecheck 0, lint 0 errors (7 old warnings), shared 479/479, client 437/437, server 40/40 (measured).
- /test-level live (headless Playwright, closed): pair ends=2, both armed, client mirror size 1. Predicted hop at
  t=409 ms, server hop at 459 ms, 0 rollbacks. Render z 71.1 → 124.1 in one frame. 6 of 55 pickups are portals.
  Driver: `<scratchpad ee7bc8d2…>/portal-check.mjs`.
- Default bag: bolt 5 / seeker 3 / mine 4 / boost 3 / shield 3 / portal 2.
- Owner decision: the loop rule stays as built (GDD §10 open question 8, 7980f45). No cooldown.
- HUD: a held portal has no `LABEL` and falls back to the bolt glyph until S4.

## Uncommitted

None of mine.

## Held files

None. S3 files released; workertwo and the supervisor told at 7857886.

## Next

1. Slice 4: claim first. VFX for the two ends (placeholder marigold rings, arm state), hop/fizzle bursts on
   `PORTAL_HOP_MESSAGE`/`PORTAL_FIZZLE_MESSAGE`, HUD glyph + `LABEL` in `hud/power-cell/power-cell.constants.ts`,
   `hud/power-gem/power-gem.tsx` (portal + portalB), sfx in `audio/sfx-map.ts` + `audio/bind-room-audio.ts`.
2. Slice 5: GDD §5.3 + §5.7 BC4 LIVE, ADR, /test-level live check, `gh issue close 289 -c "<what + SHA>"`.

## Open questions

- none.

## Lessons → memory

- none.
