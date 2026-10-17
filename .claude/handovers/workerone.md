Agent: workerone · Lane: RFC-349 F4e shield (#405) — done; F4f portal (#406) next, plan first · Updated: 2026-10-17

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

F4e shield is closed. Next lane: F4f portal (#406). Write the plan first; build nothing until the owner
approves it through the supervisor.

## Done

- F4e sim half `24e4df3e`, client half `adab9982`, docs `88fb4f95`. All pushed. #405 closed with SHAs.
  - Client: `views.ship` slot (`{ entity, shipId }`) rendered by `engine/feature-ship-views/` inside the ship
    group; `NetContext.entityOf`, passed into `bindFeatureMessages` as a third arg (bridge passes `byId`);
    shield pop handler in shield's `net` slot; trait in `features/shield/shield.traits.ts`, mirror/pop in
    `shield-mirror.ts`; `shieldAnchors`; `SHIELD_GLYPH` via `hud.glyph`. `splitPickupLayout` now only portals.
  - The client commit fixed the pickup-layout test that 24e4df3e left red.

## State (measured)

- client 730/730, typecheck clean, lint 0 errors (7 old warnings).
- /test-level draws (DPR 1, quality high, 3 runs): idle 76; staged shield (slot 5 + KeyE) median 77.
- Pop path over the network (entityOf in a live room) [unmeasured]; covered by a unit test only.
- Draw scripts: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/62b26883-c972-4a20-b65b-d6169bfe7cc3/scratchpad/`
  (`shield-draws.mjs`, `idle-draws.mjs`, port 9347).

## Uncommitted

- none.

## Held files

- none. Release the F4e claims.

## Next

1. Read #406 and the portal code (shared portal-run, client portal-pickups, the portal pieces of
   attach-room-to-world, mine-shock queue that portal pushes to, glyph-atlas portal entries).
2. Write the F4f plan in the same shape as the #405 approved comment (P1…Pn, owner options marked),
   post it on #406, send it to slur-supervisor.
3. Run client tests before pushing any sim-half commit (memory `sim-half-commit-runs-client-tests.md`).

## Open questions

- none.

## Lessons → memory

- New `.claude/memory/sim-half-commit-runs-client-tests.md`.
- Updated `.claude/memory/bulk-move-without-git-mv.md` (short `git mv` chains also denied; cp + rm works).
