Agent: workerthree · Lane: #344 perf on phones + low-end laptops · Updated: 2026-09-28 (seam after P2)

## Goal
The menu must be usable on an iPhone 12/15 and an OEM Windows laptop. Stable 60 fps on iPhone 15, and ≥30 fps on an integrated-GPU laptop in a race. The owner approved P1 (a–f) and P2 (quality tier in the race + menu picker).

## Done
- 5ecbc6c P1: quality tier module, non-blocking lobby join, lazy 3D landing, smaller bakes on low/medium.
- 286c8ef P2: the tier profile gains dprCap, msaa, post, skyMotion, rocks and rearView. A `QualityGate` leaf gates RockField, SceneEffects (world + landing; the fallback is `PlainRender` at priority 1) and RearViewPass. `renderDpr()` uses the manual Render.dpr if it is > 0, else min(device, tier cap). Render.dpr defaults to 0 (auto). Auto MSAA runs on high only. Sky uTime is frozen on low. `QualityStepDown` (drei PerformanceMonitor) runs in GameShell only. It steps an auto tier down one step per decline, in memory. The menu strip has an Auto/Low/Med/High picker.

## State
- Headless on :5173, /test-level?quality=X. Phone 390x844@3: canvas width is 390 px (low), 585 (medium), 780 (high). Low has 7 three scenes vs 36/46 and 96 meshes vs 107. No page errors.
- The low tier was a black canvas before PlainRender (found by workerone). After the fix, the 800x450 screenshots on low and high both show the scene.
- Step-down, hosted room, phone @3, auto, CPU throttle 25x: DPR 2 → 1.5 at 4 s → 1 at 8 s, then it stays at 1.
- Picker: Low saves `slur:quality=low` and removes the landing canvas at once. Auto clears the key.
- Headless frame times were vsync-bound (16.7 ms). This is not a perf reading. Devices [unmeasured].
- Client tests 627/627. Typecheck and lint pass.

## Uncommitted
none

## Held files
None. All P2 files are released with 286c8ef.

## Next
1. The owner deploys and tests on devices (`?quality=low|medium|high`, `?nocanvas`, the picker). The laptop reports its chrome://gpu GL_RENDERER line.
2. After the owner signs off: `gh issue close 344 -c "<5ecbc6c + 286c8ef>"`.
3. A separate item, not built here: race network lag India→blr1 (prediction/reconciliation). 4 failed wss reconnects were seen once on prod.

## Open questions
- skyMotion only freezes time. The sky shader still runs per pixel, so the GPU saving is small [inferred]. A cheaper still sky needs a branch in nebula-shaders. Is it worth it?
- compileAsync before the first landing frame (the env map is set in useFrame). Is a design needed?
- glb + meshopt conversion of the ship models: owner decision, through the supervisor.

## Lessons → memory
.claude/memory/removing-the-composer-blacks-the-canvas.md
