Agent: workerone · Lane: RFC-349 F4b seeker (#397) — part 1 (sim half) pushed, part 2 (client half) next · Updated: 2026-10-01

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#397: move seeker into two feature folders (F4a pattern, 85365ecc). The owner approved S1–S6 on 2026-10-01.

## Done

- **Part 1, sim half: f80acb55.** S1–S5 are built; the commit message lists them.
  - `combat/target-lock.ts` leaf: TargetShip, targetShipsOf, lineOfSight, lockTarget(range, margin).
  - `features/seeker/{seeker, seeker-run, seeker-schema, seeker-constants, seeker-trail, seeker.feature}.ts`.
  - Bag order by HeldPower kind. Registry `[ bolt, seeker, tug ]`.
  - Client `seeker-pickups.test.ts` leaves seeker out of the featured count until part 2.

## State (measured this session)

- RunSim A/B, HEAD vs part 1 (6 seeds × 4 racers × 3600 ticks, seeker-heavy mix): all 6 hashes are equal.
  The hash covers seeker x,y,z,vz,ttl,committed,targetId,dir and every broadcast. Both runs saw 296 seekerHit and 3 seekerMiss.
- 800 bags equal HEAD.
- Tests: shared 585/585, server 99/99, client 725/725. Typecheck clean. Lint 0 errors.
- Bench `fixedStep` µs: noise only; seed 1 read 58.1 against 57.9.
- Baseline dist (pre-F4b) and benches are in scratch: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/fe5e34ec-d7f7-460d-b5ec-d4775712c19e/scratchpad/`.
  Files: `old/` (pre-F4b dist), `run-bench.mjs`, `bag-ab.mjs`, `d1-bolt.mjs` (adapt for the seeker decode check), `f4-frame.mjs` (draw count).
- Incident: I edited the importers after the moves. The shared watcher emitted between edits and broke /test-level
  for the owner for a few minutes. Fixed by finishing the moves, then `tsc -b --force`.

## Uncommitted

- none.

## Held files (claim cleared by the supervisor; part 2 still to write)

- New: `apps/client/app/features/seeker/*`. It holds:
  - `seeker.client.ts`, `seeker-glyph.ts`, `seeker-look.ts`, `seeker-trail.ts` (+ test).
  - The folders `seeker-field/`, `seeker-bodies/`, `seeker-pickups/` (+ test), `seeker-warning/`.
- New: `apps/client/app/game/scene/pickup-layout/`, holding `splitPickupLayout` and the `PickupLayouts` type (S6d).
- Edit: `features/client-features.ts`, `engine/define-client-feature.ts` (hud.overlay slot), `net-hud.tsx`,
  `net-canvas.tsx`, `scene/pickup-field.tsx`, `power-arc/glyph-atlas.ts`, `ecs/traits.ts`, `net/attach-room-to-world.ts`.
- Tests: `pickup-instances.test.ts`, `power-arc.utils.test.ts`, `engine/active-features.test.ts`, `seeker-pickups.test.ts`.
- Docs: RFC-349 §3.8 "F4b result" + the §7 row, and `conventions/features.md`.

## Next

1. Part 2, the client half. **Leaf-first, because the owner's live HMR sees every half-applied edit**:
   1. Create every new file first.
   2. Then switch the importers.
   3. Delete the old files last.
   The pieces:
   - SeekerField goes to `views.scene`, SeekerPickups to `views.pickups`, and the glyph to `hud.glyph` (out of glyph-atlas).
   - Add a `hud.overlay` slot that net-hud.tsx renders, and put SeekerWarning in it. Check how net-hud passes `room`
     (SeekerWarning takes `{ room }`).
   - `splitPickupLayout` moves to `pickup-layout/` and drops seekers, as bolt did. Then revert the seeker filter in
     `seeker-pickups.test.ts` (that test moves with the feature).
   - traits.ts imports makeSeekerTrail from the feature folder.
   - Unchanged (as D7): attach-room-to-world (path only), bind-room-audio, sfx-map, tuning (D2), grants (D3).
2. Measure:
   - /test-level draw count (`f4-frame.mjs`; it was 74).
   - A 2-SDK-client seeker decode + seekerHit/Miss check (adapt `d1-bolt.mjs`).
   - Each shared dist module imports alone (no TDZ).
   - Count the central files that name seeker. The plan expected 27 → about 18.
3. Docs, commit, push. Then `gh issue close 397` with both SHAs and the numbers.

## Open questions

- none.

## Lessons → memory

- `.claude/memory/live-hmr-sees-half-applied-edits.md` already covers this; the incident repeated it, and I note it above.
