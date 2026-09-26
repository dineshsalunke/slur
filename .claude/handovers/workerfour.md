Agent: workerfour · Lane: #289 portal pickup (BC4) · Updated: 2026-09-26, late night

## Goal

Build a portal pickup: two placed ends, tap = near, double tap = far, any racer can use it, 9 s lifetime.
The teleport runs in the shared `simulate()`, so prediction replays it (BC4). The owner approved all 8 proposals
(#289 comment).

## Done

- 21bb3fb — `combat/portal.ts` (pure): placement, clear-spot search, `hopThroughPortal`. 18 tests.
- 6dd1368 — slice 1: `SimWorld.portals`, `portalHops` on the ship, the hop inside `simulate()`, replay test.
- 664cc60 — slice 2: schema `Portal` + `RunState.portals`, `HeldPower.portal/portalB`, hop/fizzle messages,
  `run/portal-run.ts`, RunSim wiring. 10 tests.
- 7857886 — slice 3: prediction mirror, hop snaps `Prev`, remote interp holds across a hop, spectator snap,
  pickup ring body, `PORTAL_RATIO` 0.1.
- ff00915 — slice 4 part A: `scene/portal-field/` instanced rings.
- 3124971 — slice 4 part B: `<PortalField />` mounted after `<TugLine />`; hop → `pushHit` at from and to;
  fizzle → `pushMineShock` kind 'fizzle'; HUD labels 'Portal' / 'Portal B'; gem glyph (ring + ellipses, portalB
  adds a gold half); sfx `portalHop` (respawn.ogg ×1.6) and `portalFizzle` (death_derezz.ogg ×2.2), far gain
  0.35 when not mine.

## State

- At 3124971: typecheck 0, lint exit 0 (7 warnings, none in my files), shared 479/479, client 441/441,
  server 40/40 (measured).
- /test-level live at 3124971 (headless Playwright, closed): HUD shows PORTAL then PORTAL B with glyph; lone end
  dim in the rear-view mirror; armed pair end bright ahead; predicted hop at 1995 ms; hop spark at the nose.
- Camera passing the exit ring blooms the whole frame orange for < ~150 ms (mean R 80 → 32 by the next
  sample). Reads as a hop flash; left as is, flagged to the supervisor.
- Driver: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/09237488-4137-4c80-a874-628b95d47f69/scratchpad/partb.mjs`
  (+ `partb2.mjs` for the tint series). Run with `PW=$(ls -d ~/.npm/_npx/*/node_modules/playwright-core/index.mjs | head -1)`.

## Uncommitted

None of mine.

## Held files

None. Part B files released. S5 claim pending: docs/GDD.md (§5.3, §5.7 BC4 LIVE), docs/DECISIONS.md (ADR).

## Next

1. On the supervisor's clear: `git pull` (tug 387302c touched GDD §5.3 bag line + §5.7), then GDD §5.3 portal
   block, §5.7 BC4 → LIVE, ADR in DECISIONS.md. Quote before changing.
2. `gh issue close 289 -c "<what + SHAs>"`.

## Open questions

- Keep the exit-ring flash, or dim the exit end once hopped? (supervisor/owner)

## Lessons → memory

- none.
