Agent: workertwo · Lane: RFC-349 S19 quality hooks (#391) — BUILT, committed locally, NOT pushed; step-down move waits on net-canvas.tsx · Updated: 2026-09-29 17:45

## Goal
S19 (#391): remove the `QualityGate` remount (rocks), add a `quality.sync` react-phase hook system, make surfaceRes/hdriRes reload-only with a picker note, and move QualityStepDown into NetCanvas.

## Done
- 393e7480 #391 (local, not pushed): `quality/quality-sync/` (registerQualityHook + syncQuality + QUALITY_SYNC_SYSTEM `quality.sync`/react, 3 tests); `quality/quality-latch/QualityLatch` replaces QualityGate — rocks mount once, hook sets `group.visible`; a latch loaded with its feature off mounts on first enable (useState arm, no reload needed for rocks). `quality.state.ts` freezes the load-time profile: `loadProfile()`, `reloadNeeded()` over `RELOAD_ONLY = [surfaceRes, hdriRes]`. track-texture `res()` and hdri read `loadProfile()`. Picker legend shows "Reload to apply" (role=status). QUALITY_SYNC_SYSTEM in net, landing and deck schedules. Deleted `quality-gate/` and the now-unused `use-quality-profile.ts`.
- 80b9e8ef #388 follow-up; 9b5f38f2 #388 S20. Earlier: a3ee47ad S17, 8681e05 S8, f3382cb S3, cf8f95e S2.

## State
- After (scratchpad `tier-remount.mjs`, swiftshader, /test-level, clean run with no peer edits during it): high 74 · low 49 · high again 74 draws; InstancedMesh 98 → 98, **0 new objects** (baseline 11).
- Load at low → switch to high: 49 → 74 draws, 87 → 98 instanced (latch arms on first enable, as designed).
- Draws read 67 or 74 at high between identical runs (noise, likely meteor timing) [inferred].
- Runs during workerone's packages/shared edits reload the page (79 "new" objects, or "execution context destroyed"). Discard any run where a source file changed.
- typecheck clean; biome clean on touched files; comment ratchet clean; vitest 105 files / 708 tests pass.
- Owner /test-level check not done yet [unmeasured]: tier switch mid-race → no hitch; reload note on the home picker.

## Uncommitted
none of mine.

## Held files
quality/*, game/scene/game-environment.tsx, game/scene/track-texture.ts, game/scene/hdri/hdri.state.ts, routes/home/quality-picker/*, game/game-shell.tsx, the 3 schedule constants — release all except game-shell.tsx once the step-down move lands.

## Next
1. Wait for the supervisor to hand over game/net-canvas.tsx (workerone F2). Then: in net-canvas.tsx add `import { QualityStepDown } from './quality-step-down/quality-step-down';` and render `<QualityStepDown />` inside `<WorldScene>` next to `{ children }` (line ~93); in game-shell.tsx drop the import and pass no children. Or the supervisor has workerone add that line.
2. Push dev (with supervisor OK), then `gh issue close 391 -c "<what shipped + SHAs>"`.
3. RFC row S19 text (sent to supervisor, which owns the RFC edit).

## Open questions
- Owner (from #373): incoming-bolt button on /test-level? phone tick/seeker overlap fix?

## Lessons → memory
- none this seam (peer-HMR reloads during measurement are already in shared-tree-footguns.md).
