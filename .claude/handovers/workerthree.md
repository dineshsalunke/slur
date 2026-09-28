Agent: workerthree · Lane: #299 Seeker.flyY dial + #311 gap-deck widths · Updated: 2026-09-28 21:45

## Goal
Two small bugs. #299: the /test-level Seeker.flyY dial must change the sim. #311: gap-deck blocks must get continuous widths, not 4/8/12u.

## Done
- ea2552b #299: `tunedSimConfig` gains a `seekerFlyY` getter. Closed.
- 1236573 #311: `gapBlockCandidate` carves the deck with `carveRun` and keeps one chunk. `BLOCK_MAX_LANES` removed. New width test. Weave digest rows updated. Closed.
- #344 (earlier lane): 5ecbc6c + 286c8ef. It stays open until the owner signs off on devices.

## State
- #299: headless /test-level, dial default / 5.5 / 1 → seeker.y 2.5 / 5.5 / 1 at spawn.
- #311 widths, 12 weave seeds: before 297 blocks, 3 widths. After 286 blocks, 283 distinct widths, 4–20u. Min corridor 8.00u both.
- Avoid pilot, 10 seeds × 5 classes: 17 deaths before, 18 after. 1 death at a gap-block segment in both cases, and it is the same one.
- Shared tests 573/573. Typecheck and lint pass on the touched files.
- The :2567 server restarted at 21:28:18, 1 s after the dist write. Hosted rooms have the new gap blocks.

## Uncommitted
none

## Held files
None.

## Next
1. NOW: #349 architecture RFC, render section only. workerone approved outline R1–R6 (R1 map · R2 frame schedule · R3 render pipeline · R4 quality tiers · R5 perf plug-in · R6 problems + ≥5 options + staged migration). Split: workerone owns the data model; I own the tick order, and I name the koota visual systems by phase only. Only workerone writes docs/RFC-349-ARCHITECTURE.md. I draft in my scratchpad and send the path. Plain Markdown, ASD-STE100, file:line numbers. R6 lists problems unranked; workerone ranks across sections.
2. The owner checks #299 and #311 on /test-level.
3. #344: after the owner signs off on devices, `gh issue close 344 -c "5ecbc6c + 286c8ef"`.

## Paused: #344 race profile (supervisor, 2026-09-28; paused for #349)
Plan, not started. No numbers yet.
- Target: a hosted race on the owner's :5173/:2567. Host solo, GO, then a gap-aware bot (memory drive-a-hosted-room-over-cdp). Use a fresh tab per run (leave-guard).
- Emulation: phone 390x844 at DPR 3, touch, CDP `Emulation.setCPUThrottlingRate` 4 and 6, and `?quality=low|medium|high`.
- GPU: a readPixels-synced median (skill §1). Warm-up load first, best of two. Bisect by hiding subsystems through the `__THREE_DEVTOOLS__` init-script hook (no StoreExpose edit). Toggles: sky, post (composer vs PlainRender), key light (#345, 8c94537), blocks, rocks, rear view.
- CPU: a CDP `Profiler` sample over 3 s of racing. Aggregate self-time by source file to rank the useFrame callbacks, block streaming, net interpolation and the koota queries.
- Draw calls: the WebGL wrapper (memory count-draw-calls-without-repo-edits), during the race.
- Proposals to cost: a still sky (a nebula-shaders branch or a baked cube on low), and the ship models .gltf → .glb + meshopt + KTX2 (15.2 MB br today; the owner decides).

## Open questions
- `docs/GDD.md:84` still says blocks are *"1–3 lanes wide"*. That has been stale since fbd1165, and gap blocks now match the walls. It is not my file. Who updates it?
- #344 questions from the last seam are still open: a still sky branch, compileAsync, glb + meshopt.

## Lessons → memory
none
