Agent: workerfour · Lane: #289 portal pickup (BC4) · Updated: 2026-09-26, night (seam at ~155k)

## Goal

Build a portal pickup: two placed ends, tap = near, double tap = far, any racer can use it, 9 s lifetime.
The teleport runs in the shared `simulate()`, so prediction replays it (BC4). The owner approved all 8 proposals
(#289 comment).

## Done

- 21bb3fb — `combat/portal.ts` (pure): placement, clear-spot search, `hopThroughPortal`. 18 tests.
- 6dd1368 — slice 1: `SimWorld.portals`, `portalHops` on the ship, the hop inside `simulate()`, replay test.
- 664cc60 — slice 2: schema `Portal` + `RunState.portals`, `HeldPower.portal/portalB`, hop/fizzle messages,
  `run/portal-run.ts`, RunSim wiring. 10 tests.
- 7857886 — slice 3: `state.portals` mirrors into `blockWorld.portals`; a predicted or reconciled hop snaps
  `Prev`; remote interp holds across a hop (`Snapshot.hops`); spectator camera snaps on a >12u jump; `portals`
  pickup bucket + ring body (`scene/portal-pickups/`); `PORTAL_RATIO` 0 → 0.1.
- ff00915 — slice 4 part A: `scene/portal-field/` (instanced rings from `blockWorld.portals`; lone end dim at 0.7,
  armed end of a pair pulses up to 3; ring centre at floor y + portalR). 4 tests. NOT MOUNTED yet.

## State

- At 7857886: typecheck 0, lint 0 errors, shared 479/479, client 437/437, server 40/40 (measured).
- At ff00915: portal-field tests 4/4, biome clean, client tsc clean (measured). Full suite not rerun.
- /test-level live at 7857886 (headless Playwright, closed): predicted hop t=409 ms, server hop 459 ms,
  0 rollbacks, render z 71.1 → 124.1 in one frame; 6 of 55 pickups are portals.
  Driver: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/ee7bc8d2-a8c1-4b32-ab2e-fcff8f221114/scratchpad/portal-check.mjs`
  (run with `PW=$(ls -d ~/.npm/_npx/*/node_modules/playwright-core/index.mjs | head -1)`).
- Owner decision: the loop rule stays as built (GDD §10 open question 8, 7980f45).
- Tug S3 landed 86060aa (workertwo). Part B files are free and CLEARED by the supervisor.

## Uncommitted

None of mine.

## Held files

Part B is cleared (supervisor), not yet edited:
- apps/client/app/game/net-canvas.tsx
- apps/client/app/net/attach-room-to-world.ts
- apps/client/app/game/hud/power-cell/power-cell.constants.ts
- apps/client/app/game/hud/power-gem/gem-glyph.tsx (NEW since tug; replaces power-gem.tsx in the claim — tell
  the supervisor) + power-gem.constants.ts
- apps/client/app/audio/sfx-map.ts, apps/client/app/audio/bind-room-audio.ts

## Next

1. Tell the supervisor the claim swaps `power-gem.tsx` → `hud/power-gem/gem-glyph.tsx` (workertwo moved the
   glyphs there; add `case HeldPower.portal:` and `case HeldPower.portalB:`).
2. Part B:
   - net-canvas.tsx: mount `<PortalField />` after `<TugLine />` (which follows `<MineShock />`).
   - attach-room-to-world.ts: `PORTAL_HOP_MESSAGE` → `pushHit` at from and to; `PORTAL_FIZZLE_MESSAGE` →
     `pushMineShock( { x, y, z, kind: 'fizzle' } )`. Add both offs to the cleanup, next to offTug.
   - power-cell.constants.ts LABEL: portal 'Portal', portalB 'Portal B' (or 'Exit').
   - gem-glyph.tsx: ring glyph (circle stroke marigold + inner gold ring); portalB with a filled half.
   - sfx-map.ts: `portalHop`, `portalFizzle` reusing existing .ogg with rate/gain; bind-room-audio.ts: onMessage
     both, off in cleanup.
3. Full `pnpm typecheck && pnpm lint && pnpm test`, then /test-level live: rings visible (screenshot), hop spark.
   Commit by pathspec, message workertwo + supervisor.
4. Slice 5: GDD §5.3 + §5.7 BC4 LIVE, ADR, then `gh issue close 289 -c "<what + SHA>"`.

## Open questions

- none.

## Lessons → memory

- none.
