Agent: workerone · Lane: RFC-349 F4c mine (#403) — client half COMMITTED, live burst check + docs next · Updated: 2026-10-17

Older versions: `git log -p -- .claude/handovers/workerone.md`. Approved M1–M8 text: `git show 67af3dc5:.claude/handovers/workerone.md`.

## Goal

#403: move mine into two feature folders. Sim half (done, `2b8c9d53`) and client half (done, `90446c94`).
Left: live check, docs, push, close.

## Done

- `2b8c9d53` sim half (M1–M6), pushed.
- `90446c94` client half (M7–M8), NOT pushed yet:
  - `features/mine/{mine.client.ts, mine.traits.ts (NetMine), mine-burst.ts (burstMine), mine-glyph.ts,
    mine-look*, mine-throw*, mine-shots.ts, mine-body-material.ts, mine-field/, mine-bodies/, mine-pickups/}`.
  - `mine-pickups.utils.ts` gained `mineAnchors` (+ test); `MinePickups` takes no props.
  - `client-features.ts` lists mineClient. `active-features.test.ts` expects bolt, mine, seeker, tug.
  - Bridge: mineBurst listener removed (feature `net` handler owns it); mines onAdd/onRemove stay.
  - `mine-shock-events.ts` keeps queue + `nearestPortalEnd` + `burstPortalHop` only.
  - `splitPickupLayout` lost the mines bucket; interim exclusion in its test removed.

## State (measured)

- /test-level draws: 76 at HEAD before edits, 76 after (DPR 1, `?quality=high`, 3 runs each). Mine dropped from
  CLIENT_FEATURES in the tab (CDP Fetch rewrite): 72 → mine's slot views own 4.
- Gates at `90446c94`: typecheck clean; client 727/727; lint exit 0 (7 warnings, pre-existing file length).
  Shared/server tests not re-run (no shared/server edit in this commit).
- Dev stack: started by me with `pnpm dev` (owner OK via supervisor). LEAVE IT RUNNING. No Chrome left open.
- Two-SDK-client decode: covered by server test `apps/server/src/rooms/mine-sync.test.ts` (two
  `@colyseus/testing` clients decode x, z, ownerId, armed; burst + victim stun) — passed at `2b8c9d53`.
  A live :2567 run is [unmeasured]: the server has no grant, so a bot must fly to a mine pickup.

## Uncommitted

- none after this handover commit.

## Held files

- Same claim as before (client mine files above, `docs/RFC-349-ARCHITECTURE.md`, `conventions/features.md`).

## Next

1. Live burst check on /test-level (headless, DPR 1, mute): get the loopback room (memory
   `place-the-ship-over-cdp`), `room.sim.state.players.get(room.sessionId).slots[0] = 3`, KeyE, wait `mineArmS`,
   place own ship on the mine (self-trigger), confirm `room.state.mines` decoded and a draw spike from
   `<MineShock/>`. Negative control: same with mine dropped (scratch `draws.mjs` DROP=1 trick) → no shock draws.
   Kill Chrome after.
2. Docs: RFC §3.8 "F4c result" + §7 row; `conventions/features.md` `run.settle` slot rule (runs after every
   strike, before portals; for effects that must see all strikes land) + `net` slot used by mine.
3. Push `dev`; close #403 with SHAs `2b8c9d53`, `90446c94`, docs SHA + numbers above.

## Open questions

- none.

## Lessons → memory

- `.claude/memory/preview-a-constant-by-route-rewrite.md` (new section: drop a feature over raw CDP Fetch).
