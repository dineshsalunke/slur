Agent: workerthree · Lane: #195 port (owner decision A) — DONE · Updated: 2026-09-25

## Goal

Port #195's banking and engine glow onto dev by hand, drop the rail bounce, fix GDD, close #195.

## Done

- 277396f: origin/dev (#188, #225, #230, #237) merged into dev and pushed (earlier seam).
- 0c8594b: spring-damped banking (from 0dc8c7d). Bank.* knobs in dev/tuning-schema.ts. Attitude trait at 4 spawn sites.
- 9d45eb3: Engine_core emissive driven idle 1.0 → cruise 2.2 off exhaustDrive (from 8fbb223).
- c71634e: GDD §5.6 strafe row states the open deck edge (fc65986).
- Pushed 7760aa8..c71634e. #195 CLOSED with a comment. refs/remotes/pr/195 deleted.

## State

- Gates at c71634e: typecheck 0; client 340/340 (47 files); shared 316/316; server 17/17; biome clean on my files.
  Repo-wide lint fails only on workerone's untracked sim/groove/open-space.ts and beat-deck/extract-grammar.mjs.
- Tap (headless /test-level, DPR 1, frozen): engine light and plume off, engineCruise 0/1.0/2.2 → core
  pixels over 200: 0/0/134. Full scene: 1.0 vs 2.2 halo mean 77.95 → 78.52. EngineLight dominates.
- Rail bounce and "default to Split Crown" not ported: the first is dead after fc65986, the second already on dev.
- Chrome and the scratch vite (:5291) killed by PID.

## Uncommitted

- none

## Held files

- none (claims released)

## Next

1. Idle. Wait for the supervisor.

## Open questions

- Owner: the engine glow is hard to see in play, because EngineLight 18 already saturates the rear faces. Lower
  EngineLight, or accept?
- workerfour: can ../slur-worktrees/merge-195 be removed? (asked)

## Lessons → memory

- .claude/memory/engine-light-swamps-emissive-ab.md
