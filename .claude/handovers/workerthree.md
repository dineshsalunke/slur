Agent: workerthree · Lane: #349 architecture RFC §5 (render / frame schedule / quality) · Updated: 2026-09-28

## Goal
Write RFC §5 for #349 as a scratchpad draft and send it to workerone. workerone alone writes
docs/RFC-349-ARCHITECTURE.md. RFC only: no source edits.

## Done
- ea2552b #299: `tunedSimConfig` gains `seekerFlyY`. Closed.
- 1236573 #311: gap-deck blocks use `carveRun` widths. Closed.
- #344 (earlier): 5ecbc6c + 286c8ef. Open until the owner signs off on devices.
- #349 §5 draft written and sent to workerone + slur-supervisor (2026-09-28). Not in the repo.
  - Draft: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/0d3fc7eb-5258-41c5-9fdb-fa023637930f/scratchpad/rfc-349-s5.md`
  - Per-site table: same folder, `useframe-inventory.md` (265 lines). Scratchpad may vanish; workerone holds the message.

## §5 picks (as sent)
- R2: O1 (phase + before/after topo sort, tie-break by id) for systems · O5 phase-only for views · O8 one phase constants file as first stage. Rejected O7 `directed` 0.1.6 (pre-1.0; React hook registers on mount).
- Phases: input · simulate · sync (camera last) · react · view · prerender · render · overlay · cleanup.
  Event cleanup → `cleanup`. Input send → `simulate`, per fixed step after `predictor.record`.
- R3: P2, one render system; post effects register into slots beforeBloom/bloom/afterBloom/beforeToneMap.
- R4: Q2, quality is a service; module `quality` hook; no QualityGate remounts; step-down into the shared shell.
- Stages S13–S20 (continue §7 numbering). S9 and S12 need S15 (scheduler).

## State
- Priority-0 `useFrame` order = subscribe (layout-effect) time, not JSX order (R3F 9.7 `events-156d8d12.esm.js:1129,1229`). Verified this session.
- Camera writer `game/net-loop/net-loop.tsx:35`; mounts after `Ships` in `world-scene.tsx:34–35`.
- CPU, draw-call and bindFramebuffer numbers: see draft §5.1 (measured earlier 2026-09-28).
- GPU time per tier, production build, #345 key-light cost on low: [unmeasured].

## Uncommitted
none

## Held files
none

## Next
1. Answer workerone's questions on §5 when they arrive.
2. Resume #344 race profile (plan below) unless the supervisor reassigns.

## Paused: #344 race profile
- A hosted race on :5173/:2567. Host solo, GO, then a gap-aware bot. Fresh tab per run.
- Phone 390x844 at DPR 3, touch. CPU throttle 4× and 6×. `?quality=low|medium|high`.
- GPU: readPixels-synced median (perf-analysis skill §1). Bisect with the `__THREE_DEVTOOLS__` hook: sky, post, key light, blocks, rocks, rear view.
- CPU: CDP Profiler aggregation (scripts cpuprof.mjs/draws.mjs were in an older scratchpad; rewrite if gone; playwright-core + system Chrome `--use-angle=metal --enable-gpu`).
- Cost: a still sky on low, and ship .gltf → .glb + meshopt + KTX2 (15.2 MB br).

## Open questions
- Owner (§5.7): accept O1 for systems? May a tier change rebuild the sky cube and track textures mid-race, or mark them reload-only?
- docs/GDD.md:84 still says blocks are "1–3 lanes wide" (stale since fbd1165). Sent to the supervisor earlier.
- #344: still-sky branch, compileAsync, glb + meshopt (owner decisions).

## Lessons → memory
- `.claude/memory/useframe-order-is-subscribe-time.md`
