Agent: workerone · Lane: #216 respawn inside a block (done) + parked perf fixes and #213 leftovers · Updated: 2026-09-23

## Goal

#216: a gap-death respawn must never land inside a block. Done. Perf fixes and #213 stay parked on the owner.

## Done

- `5fe5bd8`: fix(sim) — `respawnPoint()` in `packages/shared/src/sim/respawn-point.ts`. Nearest block-clear x
  at the setback z; else step z back by `2 * halfL`; the start apron ends the search. Ignores `world.broken`.
- `78700d5`: ADR-016 in `docs/DECISIONS.md` (amends ADR-014's invuln clause).
- Earlier: `042db00` (memory), #213 work `7928739`, `afb2642`, `8b4d950`.

## State

- Full-density probe (6 seeds × gap edges × 2u lanes): 15/1068 inside a block before, 0/1068 after. x moves
  on exactly the 15; 0 z-steps in the probe.
- Brute-force test, 1,710 points on 3 seeds: 365 x-moves, 60 z-steps; every point clear, none farther than
  the nearest clear grid x.
- `pnpm -C packages/shared test` 202/202; shared typecheck green; biome + comment ratchet clean on my files.
- Repo-wide `pnpm typecheck` fails in `apps/client/app/game/scene/block-debris.tsx` (missing
  `DebrisPiece`/`fracturedDebrisPieces` export). Not my files. Repo `pnpm lint` has findings in other
  agents' client files.
- Departure from the approved plan: step-back is `2 * halfL`, not `CELL` (`.claude/rules/track-space.md`:
  the sim never reads CELL). Reported to the supervisor.
- Perf state (from the previous handover, still valid [unmeasured this session]): fill-bound at DPR 2;
  GPU contention explains the drop; rearview ~4 ms of 21.

## Uncommitted

None.

## Held files

None. `docs/DECISIONS.md` released to the supervisor (workertwo next).

## Next

1. Wait for the supervisor.
2. Parked perf fixes, pending the owner: DPR cap 1.5 or adaptive (`dev/render-scale.tsx` `TARGET_DPR = 2`);
   rearview at lower res or every other frame; `Environment frames={Infinity}` → 1.
3. Parked #213, pending the owner: ADR-014 as-built note (bounce 1.45 s vs death 1.50 s; no retune); file
   issues for graze randomness and the pocket trap (seed 1, z≈6019, gap 3.1u vs 2.52u hull).

## Open questions

- Owner: accept the `2 * halfL` step-back in place of `CELL`?
- Owner: which perf fixes, if any? Go-ahead on #213 note and issues?
- #213 leftovers not assigned: remote ships get no bounce spark; spark look pending; `explosions.tsx` death
  burst is off-palette.

## Lessons → memory

`.claude/memory/procgen-segmentat-is-uncached.md`
