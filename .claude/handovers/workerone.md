Agent: workerone · Lane: RFC-349 F4b seeker (#397) — PLAN sent, waiting for owner approval · Updated: 2026-09-30

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#397: move seeker into two feature folders, following the F4a bolt pattern (85365ecc). Measure per RFC §3.8.

## Done

- F4a bolt: 85365ecc (#395 closed).
- F4b plan sent to slur-supervisor on 2026-09-30: claim list, 27 central files, decisions S1–S6.

## State (measured this session)

- 27 non-test central files name seeker (11 shared, 16 client). 10 more move into the folders.
- Strike order is feature id order (`sortFeatures`), so bolt runs before seeker, the same as today.
- The target list for mines has x/y/z/vz/dead/finished. A seeker hit changes only stun and shield, so the
  mine list can be built after strike.
- Power bag: HeldPower kind order (seeker 2, mine 3, boost 4, shield 5, portal 6, tug 8) equals today's draw order.

## Uncommitted

- none of mine. workertwo's meteor-* files and `dev/tuning-schema.ts` are in the tree.

## Held files

- none until the owner approves. The claim list is in the plan message.

## Next

1. Wait for owner approval of S1–S6 (relayed by slur-supervisor).
2. Build the shared half:
   - `combat/target-lock.ts` leaf (S1).
   - `features/seeker/*`.
   - Power bag in kind order (S2).
   - stepCombat builds the mine target list after strike.
3. Build the client half:
   - The views, glyph and pickups slots.
   - The hud.overlay slot, if S6b is approved.
   - The neutral pickup-layout file.
4. Measure (the §3.8 set, same as F4a). Commit, push, then `gh issue close 397` with the SHA.

## Open questions

- S1–S6 in the plan message to slur-supervisor (2026-09-30).

## Lessons → memory

- none
