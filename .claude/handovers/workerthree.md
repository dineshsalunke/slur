Agent: workerthree · Lane: #349 architecture RFC, §5 render / frame schedule / quality tiers · Updated: 2026-09-28 (seam at ~155k)

## Goal
Write RFC §5 for #349 as a scratchpad draft and send the path to workerone. workerone alone writes docs/RFC-349-ARCHITECTURE.md and merges §5 into it. RFC only: no source edits.

## Done
- ea2552b #299: `tunedSimConfig` gains `seekerFlyY`. Closed.
- 1236573 #311: gap-deck blocks use `carveRun` widths. Closed.
- #344 (earlier): 5ecbc6c + 286c8ef. It stays open until the owner signs off on devices.
- #349: outline agreed with workerone. Measurements below. The §5 draft is NOT started.

## #349 §5 brief (workerone, latest)
- The central proposal is now FEATURE MODULES (Bevy-plugin shape). Each feature folder exports traits, systems (each with a declared phase + before/after), views, net messages and dials. The engine wires them.
- R2 must answer: "a system declares {phase, before?, after?}; the engine topo-sorts at boot; one useFrame per phase runs the sorted list". My phases (input → net/predict → sim-sync → visual systems → pre-render → render → after-render) become the `phase` enum.
- Weigh ≥5 ordering options. workerone listed: O1 phase + before/after topo sort (stable tie-break by id) · O2 numeric priority · O3 registry/import order (the owner rejects it: order must be declared) · O4 one central schedule list · O5 phase-only, no order inside a phase · O6 order derived from declared trait reads/writes. I own the pick.
- R3/R4: say where render and quality tiers sit relative to feature views. Can a module register a post effect? A quality-tier hook?
- Classify each of the 46 useFrame sites as "a system" or "a view animating itself".
- Sections: R1 map · R2 schedule · R3 pipeline, who owns gl.render · R4 quality tiers as a system · R5 perf hooks · R6 problems (unranked, each with a cost) + ≥5 options + stages with files. ASD-STE100 style, file:line citations, anything unmeasured marked [unmeasured].

## State (measured 2026-09-28, headless Chrome, /test-level, 1280x720, DPR 1, Vite dev build)
- 46 `useFrame` sites in apps/client/app (non-test). 39 use the default priority 0. The explicit ones: nebula-sky.tsx:11 −1 · exhaust-field.tsx:40, boost-streaks.tsx:33, engine-light.tsx:15 0.25 (`AFTER_RENDER_SYNC`, defined 3 times in 3 `.constants.ts` files) · rear-view-pass.tsx:27 0.5 (`PASS_PRIORITY`; Hud `HUD_PRIORITY` 2) · plain-render.tsx:5 1 · dev/frame-tap.tsx:9 0.
- The render owner is the EffectComposer (@react-three/postprocessing, priority 1) when `post` is on, else `PlainRender` (priority 1, `gl.render`). `RearViewPass` renders the whole scene again into an FBO at 0.5. nebula-baker.ts:165 hooks `background.onBeforeRender`.
- 7 `addEffect`/`addAfterEffect` users: loopback-room.ts:108, gamepad.ts:87, flight-readout.tsx:23, idle-warning.tsx:12, race-deadline.tsx:12, threat-hud.tsx:13, dev/frame-meter.ts:17/21.
- CPU (CDP Profiler, driving, rAF callback time): high 1× median 1.60 ms (three 1.05, app 0.08, shared sim 0.07, koota ~0.05). low 6× 5.70 ms (three 2.98, app 0.55, sim 0.17, koota 0.26). high 6× 10.10 ms (three 6.54, app 0.61, sim 0.23, koota 0.33). App useFrame code is small. three's per-object work (renderBufferDirect, setProgram, projectObject) dominates.
- Draw calls/frame: low 47 · medium 125 · high 125. bindFramebuffer/frame: 0 · 26 · 36. The rear view and the post passes cause most of the gap between low and medium [inferred; not bisected].
- GPU time per tier [unmeasured]. #345 key-light cost on low [unmeasured]. The production build [unmeasured].
- Quality: quality/quality.constants.ts `PROFILES` (landing3d, surfaceRes, noiseSize, skyFace, dprCap, msaa, post, skyMotion, rocks, rearView). `QualityGate` (quality/quality-gate/quality-gate.tsx) gates by feature flag. It is used in world-scene.tsx, rear-view.tsx, game-environment.tsx and landing-scene.tsx. `QualityStepDown` = drei PerformanceMonitor → `stepDownQuality`.
- Scripts in this session's scratchpad (they may be gone after /clear): cpuprof.mjs (Q, CPU env) and draws.mjs. Both use playwright-core from ~/.npm/_npx/9833c18b2d85bc59 with system Chrome `--use-angle=metal --enable-gpu`.

## Uncommitted
none

## Held files
None. The §5 draft goes to a scratchpad file, not the repo.

## Next
1. Re-run the useFrame inventory (the subagent result was lost at the clear). For each site record: file:line, priority, parent route, reads, writes, gating, per-frame work and allocations, and system vs view.
2. Write the §5 draft in the scratchpad. The R2 pick is likely O1 (phase + before/after topo sort, stable tie-break) [not yet weighed]. Weigh O1–O6 plus at least one more (for example, koota-scheduled systems in one useFrame).
3. Send the path to workerone, and cc slur-supervisor.
4. Later: resume the #344 race profile (plan below).

## Paused: #344 race profile
- A hosted race on :5173/:2567. Host solo, GO, then a gap-aware bot. Use a fresh tab per run.
- Phone 390x844 at DPR 3, touch. CPU throttle 4× and 6×. `?quality=low|medium|high`.
- GPU: a readPixels-synced median (perf-analysis skill §1). Bisect with the `__THREE_DEVTOOLS__` hook: sky, post, key light, blocks, rocks, rear view.
- CPU: the same Profiler aggregation as above.
- Cost two proposals: a still sky on low, and the ship .gltf → .glb + meshopt + KTX2 (15.2 MB br).

## Open questions
- docs/GDD.md:84 still says blocks are "1–3 lanes wide" (stale since fbd1165). Sent to the supervisor.
- #344: a still-sky branch, compileAsync, glb + meshopt (owner decisions).

## Lessons → memory
none
